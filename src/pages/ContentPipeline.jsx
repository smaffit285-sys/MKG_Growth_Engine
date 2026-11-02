import { addDoc, collection, doc, updateDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS, CONTENT_CHANNELS, CONTENT_STAGES } from '../lib/schema'

export default function ContentPipeline() {
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [channel, setChannel] = useState(CONTENT_CHANNELS.YOUTUBE)

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.CONTENT_PIPELINE), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  async function addItem(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addDoc(collection(db, COLLECTIONS.CONTENT_PIPELINE), { title, channel, stage: CONTENT_STAGES.IDEA, createdAt: serverTimestamp() })
    setTitle('')
  }

  return <div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-orange-400">Content Pipeline</h1><p className="text-zinc-300">Track content here. Use <a className="text-cyan-300 underline" href="/proof">Proof Vault</a> to prepare and approve case studies for the public website.</p>{error && <p role="alert" className="text-red-300">{error}</p>}<form onSubmit={addItem} className="flex gap-2 flex-col md:flex-row"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Content idea" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" /><select value={channel} onChange={e => setChannel(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white">{Object.values(CONTENT_CHANNELS).map(c => <option key={c}>{c}</option>)}</select><button className="bg-orange-500 rounded-xl px-4 py-2 text-white">Add</button></form><div className="space-y-2">{items.map(item => <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between"><span>{item.title}</span><label className="text-zinc-300">{item.channel} <span className="sr-only">Content stage for {item.title}</span><select aria-label={`Stage for ${item.title}`} className="field ml-2" value={item.stage} onChange={async event => { try { await updateDoc(doc(db, COLLECTIONS.CONTENT_PIPELINE, item.id), { stage: event.target.value }) } catch { setError('Could not update this content stage.') } }}>{Object.values(CONTENT_STAGES).map(stage => <option key={stage} value={stage}>{stage}</option>)}</select></label></div>)}</div></div>
}
