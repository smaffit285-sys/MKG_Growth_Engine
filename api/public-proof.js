import { database } from './website-intake.js'
import { approvedPublicCase } from '../src/lib/publicCase.mjs'

export function createPublicProofHandler(getDatabase = database) {
return async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const db = await getDatabase()
    const snapshot = await db.collection('publishedProof').limit(100).get()
    const cases = snapshot.docs.map(doc => approvedPublicCase(doc.data())).filter(Boolean)
    return res.status(200).json({ version: 1, cases })
  } catch (error) {
    console.error('Public proof unavailable', error.message)
    return res.status(503).json({ error: 'Published work is temporarily unavailable' })
  }
}

}
export default createPublicProofHandler()
