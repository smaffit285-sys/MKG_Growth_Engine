import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'

export default function Dashboard() {
    const [all, setAll] = useState([])
    const [recent, setRecent] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

  useEffect(() => {
        const unsub = onSnapshot(collection(db, 'customers'), (snap) => {
                setAll(snap.docs.map(d => ({ id: d.id, ...d.data() })))
                setLoading(false)
        }, (err) => { console.error(err); setLoading(false) })
        return () => unsub()
  }, [])

  useEffect(() => {
        const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'), limit(5))
        const unsub = onSnapshot(q, (snap) => setRecent(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
        return () => unsub()
  }, [])

  const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySeconds = Timestamp.fromDate(today).seconds
    const addedToday = all.filter(c => c.createdAt && c.createdAt.seconds >= todaySeconds).length
    const totalRewards = all.reduce((s, c) => s + (c.rewardsBalance || 0), 0)

  return (
        <div>
              <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                <p className="text-sm text-gray-400">Total Customers</p>p>
                                <p className="text-3xl font-bold text-white">{loading ? '...' : all.length}</p>p>
                      </div>div>
                      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                <p className="text-sm text-gray-400">Added Today</p>p>
                                <p className="text-3xl font-bold text-white">{loading ? '...' : addedToday}</p>p>
                      </div>div>
                      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                <p className="text-sm text-gray-400">Rewards Outstanding</p>p>
                                <p className="text-3xl font-bold text-white">{loading ? '...' : `$${totalRewards.toFixed(2)}`}</p>p>
                      </div>div>
              </div>div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                      <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Recent Customers</h2>h2>
                                <button onClick={() => navigate('/customers')} className="text-sm text-orange-500 hover:underline">View all</button>button>
                      </div>div>
                {loading ? (
                    <p className="text-gray-400">Loading...</p>p>
                  ) : recent.length === 0 ? (
                    <p className="text-gray-500 text-sm">No customers yet.</p>p>
                  ) : (
                    <div className="space-y-2">
                      {recent.map(c => (
                                    <div key={c.id} onClick={() => navigate(`/customer/${c.id}`)}
                                                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                                                    <div>
                                                                      <p className="text-white font-medium">{c.firstName} {c.lastName}</p>p>
                                                                      <p className="text-gray-400 text-xs">{c.phone}</p>p>
                                                    </div>div>
                                                    <p className="text-orange-400 text-sm">${(c.rewardsBalance || 0).toFixed(2)}</p>p>
                                    </div>div>
                                  ))}
                    </div>div>
                      )}
              </div>div>
        </div>div>
      )
}</div>
