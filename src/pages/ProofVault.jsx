import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS, PROOF_TYPES } from '../lib/schema'

export default function ProofVault() {
  const [assets, setAssets] = useState([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState(PROOF_TYPES.TESTIMONIAL)

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.PROOF_ASSETS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  async function addAsset(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addDoc(collection(db, COLLECTIONS.PROOF_ASSETS), { title, type, createdAt: serverTimestamp() })
    setTitle('')
  }

  return <div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-orange-400">Proof Vault</h1><form onSubmit={addAsset} className="flex gap-2 flex-col md:flex-row"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Proof asset title" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" /><select value={type} onChange={e => setType(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white">{Object.values(PROOF_TYPES).map(t => <option key={t}>{t}</option>)}</select><button className="bg-orange-500 rounded-xl px-4 py-2 text-white">Add</button></form><div className="space-y-2">{assets.map(asset => <div key={asset.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between"><span>{asset.title}</span><span className="text-zinc-400">{asset.type}</span></div>)}</div></div>
}
