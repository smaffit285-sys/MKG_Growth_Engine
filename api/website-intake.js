import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { ExternalAccountClient } from 'google-auth-library'
import { getVercelOidcToken, verifyVercelOidcToken } from '@vercel/oidc'

const EVENT_TYPES = new Set(['form_submission', 'booking_request', 'chat_turn', 'review_submission', 'referral_request'])

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(0, 20)
}

function cleanString(value, max = 4000) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max)
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

function database() {
  if (!getApps().length) {
    const projectId = process.env.GCP_PROJECT_ID
    const projectNumber = process.env.GCP_PROJECT_NUMBER
    const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL
    const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
    const providerId = process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID
    if (!projectId || !projectNumber || !serviceAccountEmail || !poolId || !providerId) {
      throw new Error('Google Cloud workload identity is not configured')
    }

    const authClient = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
      subject_token_supplier: { getSubjectToken: getVercelOidcToken },
    })
    if (!authClient) throw new Error('Unable to initialize Google Cloud workload identity')

    const credential = {
      async getAccessToken() {
        const { token } = await authClient.getAccessToken()
        if (!token) throw new Error('Google Cloud did not return an access token')
        const expiry = authClient.credentials?.expiry_date
        return {
          access_token: token,
          expires_in: expiry ? Math.max(1, Math.floor((expiry - Date.now()) / 1000)) : 3600,
        }
      },
    }
    initializeApp({ credential, projectId })
  }
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

    const db = database()
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

    return res.status(200).json({ saved: true, duplicate: false, customerId: customerRef.id })
  } catch (error) {
    console.error('Website intake error', error)
    return res.status(500).json({ error: 'Website intake failed' })
  }
}
