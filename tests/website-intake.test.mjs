import process from 'node:process'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createWebsiteIntakeHandler, formatLeadEmail, normalizePhone, sanitize, sendLeadNotification } from '../api/website-intake.js'

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
      return globalThis.Response.json({ id: 'test-email' })
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
        ? globalThis.Response.json({ message: 'Primary rejected' }, { status: 400 })
        : globalThis.Response.json({ id: 'backup-email' })
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

function mockResponse() {
  return { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}
function mockDatabase() {
  const rows = new Map(); let sequence = 0;
  const database = {
    collection(name) {
      const collection = {
        doc(id = `generated-${++sequence}`) {
          const path = `${name}/${id}`;
          return { id, path, async get() { return { exists: rows.has(path), data: () => rows.get(path) } }, async set(value, options) { rows.set(path, options?.merge ? { ...rows.get(path), ...value } : value) } };
        },
        where() { return { limit: () => ({ get: async () => ({ empty: true, docs: [] }) }) } },
      }; return collection;
    },
    async runTransaction(callback) {
      const writes = [];
      await callback({
        get: ref => ref.get(),
        set: (ref, value) => writes.push([ref.path, value]),
        create: (ref, value) => writes.push([ref.path, value]),
      });
      for (const [path, value] of writes) rows.set(path, value);
    },
  }; return { database, rows };
}
test('website feedback reaches the admin review queue exactly once with attribution and no reward writes', async () => {
  const { database, rows } = mockDatabase(); let notifications = 0;
  const handler = createWebsiteIntakeHandler({ getDatabase: async () => database, verifyToken: async () => {}, notify: async () => { notifications++; return { sent: true }; } });
  const body = { eventId: 'review:integration-test', eventType: 'review_submission', source: 'public_review', contact: { name: 'Test Customer' }, details: { platform: 'private', feedback: 'Actual feedback', discoverySource: 'ChatGPT' }, attribution: { utm_source: 'chatgpt' }, page: { landingPath: '/' } };
  const req = { method: 'POST', headers: { authorization: 'Bearer test' }, body };
  const res = mockResponse(); await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(rows.get('reviewSubmissions/review:integration-test').feedback, 'Actual feedback');
  assert.equal(rows.get('customerEvents/review:integration-test').attribution.utm_source, 'chatgpt');
  assert(![...rows.keys()].some(key => key.startsWith('rewardLedger/')));
  assert(![...rows.values()].some(value => Object.hasOwn(value, 'rewardsBalance')));
  const repeat = mockResponse(); await handler(req, repeat);
  assert.equal(repeat.body.duplicate, true); assert.equal(notifications, 1);
});
test('untrusted website intake is rejected before any database read', async () => {
  let read = false;
  const handler = createWebsiteIntakeHandler({ verifyToken: async () => { throw new Error('unauthorized') }, getDatabase: async () => { read = true } });
  const res = mockResponse(); await handler({ method: 'POST', headers: {} }, res);
  assert.equal(res.statusCode, 401); assert.equal(read, false);
});
