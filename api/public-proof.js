import { getAuth } from 'firebase-admin/auth'
import { FieldValue } from 'firebase-admin/firestore'
import { database } from './website-intake.js'
import { approvedPublicCase, publicCase } from '../src/lib/publicCase.mjs'

export function createPublicProofHandler(getDatabase = database, verifyToken = token => getAuth().verifyIdToken(token)) {
  return async function handler(req, res) {
    res.setHeader('X-Robots-Tag', 'noindex')
    res.setHeader('Cache-Control', 'no-store')
    if (!['GET', 'POST', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })
    const token = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '')
    if (req.method !== 'GET' && !token) return res.status(401).json({ error: 'Sign in to manage publication.' })
    try {
      const db = await getDatabase()
      if (req.method === 'GET') {
        const snapshot = await db.collection('publishedProof').limit(100).get()
        const cases = snapshot.docs.map(doc => approvedPublicCase(doc.data())).filter(Boolean)
        return res.status(200).json({ version: 1, cases })
      }
      let identity
      try { identity = await verifyToken(token) }
      catch { return res.status(401).json({ error: 'Sign in again before publishing.' }) }
      const staff = await db.collection('staffUsers').doc(identity.uid).get()
      if (!staff.exists || !['owner', 'admin'].includes(staff.data().role)) return res.status(403).json({ error: 'An explicit owner or admin staff role is required to publish.' })
      if (Number(req.headers?.['content-length'] || 0) > 30_000) return res.status(413).json({ error: 'Request is too large.' })
      let body, data
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        if (!/^[a-zA-Z0-9_-]{1,160}$/.test(body?.draftId || '')) throw new Error('Choose a saved draft.')
        if (req.method === 'POST') {
          if (body.publicationConsent !== true) throw new Error('Confirm facts and publication permission first.')
          data = publicCase(body.caseStudy)
        }
      } catch (error) { return res.status(400).json({ error: error.message || 'Invalid case study.' }) }
      const draftRef = db.collection('proofAssets').doc(body.draftId)
      await db.runTransaction(async transaction => {
        const draft = await transaction.get(draftRef)
        if (!draft.exists) throw new Error('Save the draft before publishing.')
        // Publication ownership lives separately from staff-editable drafts.
        const ownerRef = db.collection('proofPublicationOwners').doc(body.draftId)
        const owner = await transaction.get(ownerRef)
        const previousSlug = owner.exists ? owner.data().slug : ''
        const publicRef = data ? db.collection('publishedProof').doc(data.slug) : null
        const existing = publicRef ? await transaction.get(publicRef) : null
        if (existing?.exists && previousSlug !== data.slug) throw new Error('That URL is already published. Choose another slug.')
        if (previousSlug && previousSlug !== data?.slug) transaction.delete(db.collection('publishedProof').doc(previousSlug))
        if (data) {
          transaction.set(publicRef, { ...data, publicationStatus: 'published', publicationConsent: true })
          transaction.set(ownerRef, { slug: data.slug, approvedBy: identity.uid, approvedAt: FieldValue.serverTimestamp() })
          transaction.update(draftRef, { ...data, publishedSlug: data.slug, publicationStatus: 'published', permissionConfirmedBy: identity.uid, publishedAt: FieldValue.serverTimestamp() })
        } else {
          transaction.delete(ownerRef)
          transaction.update(draftRef, { publishedSlug: '', publicationStatus: 'draft', updatedAt: FieldValue.serverTimestamp() })
        }
      })
      return res.status(200).json({ saved: true, published: Boolean(data), slug: data?.slug || '' })
    } catch (error) {
      console.error('Proof publication unavailable', error.message)
      return res.status(503).json({ error: 'Publication is temporarily unavailable. Check the saved draft and try again.' })
    }
  }
}
export default createPublicProofHandler()
