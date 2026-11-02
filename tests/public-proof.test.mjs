import test from 'node:test'
import assert from 'node:assert/strict'
import { publicCase, approvedPublicCase } from '../src/lib/publicCase.mjs'
import { createPublicProofHandler } from '../api/public-proof.js'
const example = { title: 'Knife repair', slug: 'knife-repair', knifeType: 'Chef knife', problem: 'Chipped edge', workPerformed: 'Profile corrected', result: 'Edge restored', location: 'Aventura' }
const published = { ...example, publicationStatus: 'published', publicationConsent: true }
function response() {
  return { headers: {}, statusCode: 200, setHeader(k,v) { this.headers[k]=v }, status(code) { this.statusCode=code; return this }, json(body) { this.body=body; return this } }
}
test('public projection excludes private identifiers, notes, and embedded contact records', () => {
  const output = publicCase({ ...example, customerId: 'secret-id', serviceRecordId: 'invoice-id', customer: { phone: '555-0100' }, privateNotes: 'Private' })
  assert.equal(output.title, example.title)
  assert(!JSON.stringify(output).includes('secret-id'))
  assert(!JSON.stringify(output).includes('555-0100'))
  assert.equal(output.privateNotes, undefined)
})
test('drafts, missing consent and incomplete or unsafe cases cannot enter the public feed', () => {
  assert.equal(approvedPublicCase({ ...published, publicationStatus: 'draft' }), null)
  assert.equal(approvedPublicCase({ ...published, publicationConsent: false }), null)
  assert.equal(approvedPublicCase({ ...published, result: '' }), null)
  for (const beforeImage of ['javascript:alert(1)', 'http://example.com/a.jpg', 'https://user:secret@example.com/a.jpg', 'https://example.com/a.jpg?token=private']) assert.throws(() => publicCase({ ...example, beforeImage }))
  assert.throws(() => publicCase({ ...example, slug: '../private' }))
  assert.throws(() => publicCase({ ...example, serviceDate: '2026-02-30' }))
})
test('GET reads only the publication collection and returns valid, permitted projections', async () => {
  let collectionName
  const database = async () => ({ collection(name) { collectionName=name; return { limit: () => ({ get: async () => ({ docs: [published, { ...published, publicationConsent: false }].map(record => ({ data: () => ({ ...record, customerId: 'secret' }) })) }) }) } } })
  const res = response()
  await createPublicProofHandler(database)({ method: 'GET' }, res)
  assert.equal(collectionName, 'publishedProof')
  assert.equal(res.body.cases.length, 1)
  assert.equal(res.body.cases[0].customerId, undefined)
  assert.equal(res.headers['Cache-Control'], 'no-store')
})
test('unavailable database fails closed and writes are rejected without accessing it', async () => {
  const handler = createPublicProofHandler(async () => { throw new Error('unavailable') })
  const res = response(); await handler({ method: 'GET' }, res)
  assert.equal(res.statusCode, 503); assert.equal(res.body.cases, undefined)
  const write = response(); await handler({ method: 'POST' }, write)
  assert.equal(write.statusCode, 405)
})
