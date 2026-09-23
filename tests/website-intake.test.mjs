import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, sanitize } from '../api/website-intake.js'

test('normalizes US phone numbers for CRM matching', () => {
  assert.equal(normalizePhone('+1 (305) 555-0100'), '3055550100')
  assert.equal(normalizePhone('305.555.0100'), '3055550100')
})

test('sanitizes nested website intake data and control characters', () => {
  const clean = sanitize({ name: ' Test\u0000 Customer ', details: { notes: 'Sharp\u0007 please' } })
  assert.deepEqual(clean, { name: 'Test Customer', details: { notes: 'Sharp please' } })
})
