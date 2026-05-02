import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { COLLECTIONS } from '../lib/schema'

export default function TrainingDashboard() {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.TRAINING_SESSIONS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [])

  const avgScore = useMemo(() => sessions.length ? Math.round(sessions.reduce((a, b) => a + Number(b.score || 0), 0) / sessions.length) : 0, [sessions])

  return <div className="p-6 space-y-6"><h1 className="text-2xl font-bold text-orange-400">Training Dashboard</h1><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"><p className="text-zinc-400 text-sm">Average Score</p><p className="text-3xl font-bold text-orange-400">{avgScore}</p></div><div className="space-y-2">{sessions.map(session => <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex justify-between"><span>{session.trainingType} | {session.outcome}</span><span>{session.score}</span></div>)}</div></div>
}
