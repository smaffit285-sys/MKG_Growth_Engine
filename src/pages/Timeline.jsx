import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { COLLECTIONS } from '../lib/schema'

export default function Timeline() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.CUSTOMER_EVENTS), orderBy('createdAt', 'desc'), limit(200))
    return onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-400">Timeline</h1>
        <p className="text-zinc-400 text-sm mt-1">Unified operational event history across customers, B2B accounts, memberships, training, and growth.</p>
      </div>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between gap-4">
            <div>
              <p className="text-orange-400 font-medium text-sm">{event.eventType}</p>
              <p className="text-zinc-300 text-sm mt-1 break-all">{JSON.stringify(event.metadata || {})}</p>
            </div>
            <div className="text-xs text-zinc-500 shrink-0">
              {event.createdAt?.seconds ? new Date(event.createdAt.seconds * 1000).toLocaleString() : 'Pending'}
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-zinc-500">No events yet.</div>}
      </div>
    </div>
  )
}
