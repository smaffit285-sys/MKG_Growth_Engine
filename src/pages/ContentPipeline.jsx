import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS, CONTENT_CHANNELS, CONTENT_STAGES } from '../lib/schema'

export default function ContentPipeline() {
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

  return <div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-orange-400">Content Pipeline</h1><form onSubmit={addItem} className="flex gap-2 flex-col md:flex-row"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Content idea" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white" /><select value={channel} onChange={e => setChannel(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white">{Object.values(CONTENT_CHANNELS).map(c => <option key={c}>{c}</option>)}</select><button className="bg-orange-500 rounded-xl px-4 py-2 text-white">Add</button></form><div className="space-y-2">{items.map(item => <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between"><span>{item.title}</span><span className="text-zinc-400">{item.channel} | {item.stage}</span></div>)}</div></div>
}
