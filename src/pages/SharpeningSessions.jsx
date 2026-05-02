import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { logSharpeningSession } from '../lib/events'
import { db } from '../lib/firebase'
import { COLLECTIONS } from '../lib/schema'
import { useAuth } from '../contexts/AuthContext'

export default function SharpeningSessions() {
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({ bladeType: '', steelType: '', edgeCondition: '', sharpeningAngle: '', durationSeconds: '', qualityScore: '', filmed: true })
  const { currentUser } = useAuth()

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.SHARPENING_SESSIONS), orderBy('createdAt', 'desc'), limit(100))
    return onSnapshot(q, snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  async function submit(e) {
    e.preventDefault()
    await logSharpeningSession({
      staffUserId: currentUser?.uid || null,
      bladeType: form.bladeType,
      steelType: form.steelType,
      edgeCondition: form.edgeCondition,
      sharpeningAngle: Number(form.sharpeningAngle || 0),
      durationSeconds: Number(form.durationSeconds || 0),
      qualityScore: Number(form.qualityScore || 0),
      filmed: form.filmed,
    })
    setForm({ bladeType: '', steelType: '', edgeCondition: '', sharpeningAngle: '', durationSeconds: '', qualityScore: '', filmed: true })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-400">Sharpening Sessions</h1>
        <p className="text-zinc-400 text-sm mt-1">Operational dataset intake for quality, speed, technician development, and system maturity.</p>
      </div>
      <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input placeholder="Blade Type" value={form.bladeType} onChange={e => setForm({ ...form, bladeType: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <input placeholder="Steel Type" value={form.steelType} onChange={e => setForm({ ...form, steelType: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <input placeholder="Edge Condition" value={form.edgeCondition} onChange={e => setForm({ ...form, edgeCondition: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <input placeholder="Angle" type="number" value={form.sharpeningAngle} onChange={e => setForm({ ...form, sharpeningAngle: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <input placeholder="Duration Seconds" type="number" value={form.durationSeconds} onChange={e => setForm({ ...form, durationSeconds: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <input placeholder="Quality Score" type="number" value={form.qualityScore} onChange={e => setForm({ ...form, qualityScore: e.target.value })} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white" />
        <button className="bg-orange-500 rounded-xl px-4 py-2 text-white font-medium col-span-2">Log Session</button>
      </form>
      <div className="space-y-2">
        {sessions.map(session => (
          <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 flex justify-between">
            <span>{session.bladeType} | {session.steelType} | Q{session.qualityScore}</span>
            <span>{session.durationSeconds}s</span>
          </div>
        ))}
      </div>
    </div>
  )
}
