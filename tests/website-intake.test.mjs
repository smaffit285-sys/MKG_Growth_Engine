import test from 'node:test'
import assert from 'node:assert/strict'
import { formatLeadEmail, normalizePhone, sanitize } from '../api/website-intake.js'

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
