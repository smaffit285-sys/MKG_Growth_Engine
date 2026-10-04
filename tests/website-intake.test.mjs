import test from 'node:test'
import assert from 'node:assert/strict'
import { formatLeadEmail, normalizePhone, sanitize, sendLeadNotification } from '../api/website-intake.js'

test('normalizes US phone numbers for CRM matching', () => {
  assert.equal(normalizePhone('+1 (305) 555-0100'), '3055550100')
  assert.equal(normalizePhone('305.555.0100'), '3055550100')
})

test('sanitizes nested website intake data and control characters', () => {
  const clean = sanitize({ name: ' Test\u0000 Customer ', details: { notes: 'Sharp\u0007 please' } })
  assert.deepEqual(clean, { name: 'Test Customer', details: { notes: 'Sharp please' } })
})

test('formats a complete plain-text lead notification', () => {
  const email = formatLeadEmail({
    eventId: 'form:test-1', eventType: 'form_submission', source: 'public_book_home', serviceType: 'home_knives',
    contact: { name: 'Test Customer', email: 'test@example.com' },
    details: { knifeCount: 4, notes: 'Two chef knives' },
    page: { path: '/book/home/' },
  }, 'customer-123')
  assert.match(email, /CRM customer ID: customer-123/)
  assert.match(email, /email: test@example.com/)
  assert.match(email, /knifeCount: 4/)
  assert.match(email, /path: \/book\/home\//)
})

test('routes service alerts to the primary with a Gmail copy and uses backups only after rejection', async () => {
  const keys = ['RESEND_API_KEY', 'LEAD_NOTIFICATION_TO', 'LEAD_NOTIFICATION_BACKUP_TO', 'LEAD_NOTIFICATION_SERVICE_COPY_TO']
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  const originalFetch = globalThis.fetch
  const calls = []
  try {
    process.env.RESEND_API_KEY = 're_test'
    process.env.LEAD_NOTIFICATION_TO = 'smaffit@miamiknifeguy.com'
    process.env.LEAD_NOTIFICATION_BACKUP_TO = 'smaffit285@gmail.com,miamiknifeguy@gmail.com'
    process.env.LEAD_NOTIFICATION_SERVICE_COPY_TO = 'smaffit285@gmail.com'
    globalThis.fetch = async (_url, options) => {
      calls.push(JSON.parse(options.body))
      return Response.json({ id: 'test-email' })
    }
    const service = await sendLeadNotification({ eventType: 'form_submission', serviceType: 'restaurant', contact: { name: 'Test Chef' } }, 'customer-test')
    assert.equal(service.sent, true)
    assert.equal(service.fallback, false)
    assert.equal(calls.length, 1)
    assert.deepEqual(calls[0].to, ['smaffit@miamiknifeguy.com'])
    assert.deepEqual(calls[0].bcc, ['smaffit285@gmail.com'])

    calls.length = 0
    let attempt = 0
    globalThis.fetch = async (_url, options) => {
      calls.push(JSON.parse(options.body))
      return ++attempt === 1
        ? Response.json({ message: 'Primary rejected' }, { status: 400 })
        : Response.json({ id: 'backup-email' })
    }
    const other = await sendLeadNotification({ eventType: 'review_submission', contact: { name: 'Test Reviewer' } }, 'customer-test')
    assert.equal(other.sent, true)
    assert.equal(other.fallback, true)
    assert.match(other.primaryError, /Primary rejected/)
    assert.deepEqual(calls[0].to, ['smaffit@miamiknifeguy.com'])
    assert.equal(calls[0].bcc, undefined)
    assert.deepEqual(calls[1].to, ['smaffit285@gmail.com', 'miamiknifeguy@gmail.com'])
    assert.equal(calls[1].bcc, undefined)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})
