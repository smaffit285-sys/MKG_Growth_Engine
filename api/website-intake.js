import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getVercelOidcToken, verifyVercelOidcToken } from '@vercel/oidc'
import { writeFile } from 'node:fs/promises'

const EVENT_TYPES = new Set(['form_submission', 'booking_request', 'chat_turn', 'review_submission', 'referral_request'])

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(0, 20)
}

function cleanString(value, max = 4000) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
}

function readable(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

export function formatLeadEmail(body, customerId) {
  const contact = body.contact || {}
  const details = body.details || {}
  const sections = [
    ['Event', {
      'Type': body.eventType,
      'Source': body.source,
      'Service': body.serviceType,
      'CRM customer ID': customerId,
      'Event ID': body.eventId,
    }],
    ['Contact', contact],
    ['Request details', details],
    ['Attribution', body.attribution || {}],
    ['Page', body.page || {}],
  ]
  return sections.flatMap(([heading, values]) => {
    const lines = Object.entries(values).flatMap(([key, value]) => {
      const rendered = readable(value)
      return rendered ? [`${key}: ${rendered}`] : []
    })
    return lines.length ? [heading, ...lines, ''] : []
  }).join('\n').trim()
}

async function sendLeadNotification(body, customerId) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || body.eventType === 'chat_turn') return { configured: Boolean(apiKey), sent: false }
  const recipients = (process.env.LEAD_NOTIFICATION_TO || 'miamiknifeguy@gmail.com,smaffit@miamiknifeguy.com')
    .split(',').map(value => value.trim()).filter(Boolean)
  const from = process.env.LEAD_NOTIFICATION_FROM || 'MKG Website <bookings@miamiknifeguy.com>'
  const contactName = cleanString(body.contact?.name || body.contact?.business || 'Website visitor', 100)
  const subject = `[MKG Website] ${cleanString(body.eventType, 80).replaceAll('_', ' ')} — ${contactName}`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      text: formatLeadEmail(body, customerId),
      ...(body.contact?.email ? { reply_to: cleanString(body.contact.email, 320) } : {}),
    }),
  })
  if (!response.ok) throw new Error(`Lead notification email returned ${response.status}`)
  return { configured: true, sent: true }
}

export function sanitize(value, depth = 0) {
  if (depth > 5) return undefined
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return cleanString(value)
  if (Array.isArray(value)) return value.slice(0, 30).map(item => sanitize(item, depth + 1)).filter(item => item !== undefined)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).slice(0, 80).flatMap(([key, item]) => {
      const cleaned = sanitize(item, depth + 1)
      return cleaned === undefined ? [] : [[cleanString(key, 100), cleaned]]
    }))
  }
  return undefined
}

async function database() {
  const projectId = process.env.GCP_PROJECT_ID
  const projectNumber = process.env.GCP_PROJECT_NUMBER
  const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL
  const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
  const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
  if (!projectId || !projectNumber || !serviceAccountEmail || !poolId || !providerId) {
    throw new Error('Google Cloud workload identity is not configured')
  }

  // Firebase Admin's Firestore adapter requires Application Default Credentials.
  // Materialize only Vercel's short-lived OIDC assertion in the function's
  // ephemeral /tmp directory; no service-account key is created or stored.
  const tokenPath = '/tmp/mkg-vercel-oidc-token'
  const configPath = '/tmp/mkg-google-wif.json'
  const subjectToken = await getVercelOidcToken()
  const externalAccountConfig = {
    type: 'external_account',
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    credential_source: { file: tokenPath },
  }
  await Promise.all([
    writeFile(tokenPath, subjectToken, { encoding: 'utf8', mode: 0o600 }),
    writeFile(configPath, JSON.stringify(externalAccountConfig), { encoding: 'utf8', mode: 0o600 }),
  ])
  process.env.GOOGLE_APPLICATION_CREDENTIALS = configPath

  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId })
  return getFirestore()
}

async function findCustomer(db, phone, email, sessionId) {
  if (phone) {
    const byPhone = await db.collection('customers').where('normalizedPhone', '==', phone).limit(1).get()
    if (!byPhone.empty) return byPhone.docs[0].ref
    const legacyPhone = await db.collection('customers').where('phone', '==', phone).limit(1).get()
    if (!legacyPhone.empty) return legacyPhone.docs[0].ref
  }
  if (email) {
    const byEmail = await db.collection('customers').where('normalizedEmail', '==', email).limit(1).get()
    if (!byEmail.empty) return byEmail.docs[0].ref
    const legacyEmail = await db.collection('customers').where('email', '==', email).limit(1).get()
    if (!legacyEmail.empty) return legacyEmail.docs[0].ref
  }
  if (sessionId) {
    const bySession = await db.collection('customers').where('websiteSessionIds', 'array-contains', sessionId).limit(1).get()
    if (!bySession.empty) return bySession.docs[0].ref
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  try {
    await verifyVercelOidcToken(supplied, {
      issuer: 'https://oidc.vercel.com/smaffit285-sys-projects',
      audience: 'https://vercel.com/smaffit285-sys-projects',
      ownerId: 'team_EszcbP2rHpd7bmOXMxepvWAC',
      projectId: 'prj_a8w26HeULu4jubzLet2M4o7aKkyv',
      environment: ['preview', 'production'],
    })
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const rawLength = Number(req.headers['content-length'] || 0)
    if (rawLength > 100_000) return res.status(413).json({ error: 'Payload too large' })
    const body = sanitize(typeof req.body === 'string' ? JSON.parse(req.body) : req.body)
    if (!body?.eventId || !/^[a-zA-Z0-9._:-]{8,160}$/.test(body.eventId)) return res.status(400).json({ error: 'Invalid event ID' })
    if (!EVENT_TYPES.has(body.eventType)) return res.status(400).json({ error: 'Invalid event type' })
    if (!body.source || cleanString(body.source, 120) !== body.source) return res.status(400).json({ error: 'Invalid source' })

    const db = await database()
    const eventRef = db.collection('customerEvents').doc(body.eventId)
    if ((await eventRef.get()).exists) return res.status(200).json({ saved: true, duplicate: true })

    const contact = body.contact || {}
    const rawPhone = contact.phone || contact.customerPhone || ''
    const phone = normalizePhone(rawPhone)
    const email = cleanString(contact.email, 320).toLowerCase()
    const fullName = cleanString(contact.name, 160)
    const [firstName = '', ...lastParts] = fullName.split(/\s+/).filter(Boolean)
    let customerRef = await findCustomer(db, phone, email, body.sessionId)
    const isNewCustomer = !customerRef
    if (!customerRef) customerRef = db.collection('customers').doc()

    const customerData = {
      ...(firstName ? { firstName } : {}),
      ...(lastParts.length ? { lastName: lastParts.join(' ') } : {}),
      ...(fullName ? { name: fullName } : {}),
      ...(fullName ? { contactName: fullName } : {}),
      ...(phone ? { phone, normalizedPhone: phone } : {}),
      ...(email ? { email, normalizedEmail: email } : {}),
      ...(contact.business ? { business: cleanString(contact.business, 200), businessName: cleanString(contact.business, 200) } : {}),
      ...(contact.location ? { location: cleanString(contact.location, 240) } : {}),
      ...(contact.address ? { address: cleanString(contact.address, 300) } : {}),
      ...(body.sessionId ? { websiteSessionIds: FieldValue.arrayUnion(body.sessionId) } : {}),
      leadSource: body.source,
      latestServiceType: cleanString(body.serviceType || '', 120),
      latestWebsiteEvent: body.eventId,
      lastContactAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    const isChat = body.eventType === 'chat_turn'
    const alertRef = db.collection('leadAlerts').doc(`${body.eventId}:alert`)

    await db.runTransaction(async transaction => {
      const existingEvent = await transaction.get(eventRef)
      if (existingEvent.exists) return
      transaction.set(customerRef, {
        ...customerData,
        ...(isNewCustomer ? { createdAt: FieldValue.serverTimestamp(), status: 'prospect' } : {}),
      }, { merge: true })
      transaction.create(eventRef, {
        eventType: body.eventType,
        source: body.source,
        serviceType: body.serviceType || '',
        sessionId: body.sessionId || '',
        customerId: customerRef.id,
        contact,
        details: body.details || {},
        attribution: body.attribution || {},
        page: body.page || {},
        createdAt: FieldValue.serverTimestamp(),
      })
      if (!isChat) transaction.create(alertRef, {
        alertType: 'website_lead', status: 'new', customerId: customerRef.id,
        eventId: body.eventId, eventType: body.eventType, source: body.source,
        serviceType: body.serviceType || '', createdAt: FieldValue.serverTimestamp(),
      })
    })

    try {
      await sendLeadNotification(body, customerRef.id)
    } catch (error) {
      // CRM capture is the source of truth. A temporary email outage must not
      // discard a lead that was already saved successfully.
      console.error('Lead notification email error', error)
    }

    return res.status(200).json({ saved: true, duplicate: false, customerId: customerRef.id })
  } catch (error) {
    console.error('Website intake error', error)
    return res.status(500).json({ error: 'Website intake failed' })
  }
}
