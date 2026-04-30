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
    const allQ = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(allQ, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAll(docs)
      setRecent(docs.slice(0, 5))
      setLoading(false)
    })
    return unsub
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySeconds = Timestamp.fromDate(today).seconds
  const addedToday = all.filter(c => c.createdAt?.seconds >= todaySeconds).length
  const totalRewards = all.reduce((sum, c) => sum + (c.rewardsBalance || 0), 0)

  const stats = [
    { label: 'Total Customers', value: all.length, color: 'text-orange-400' },
    { label: 'Added Today', value: addedToday, color: 'text-green-400' },
    { label: 'Rewards Outstanding', value: '$' + totalRewards, color: 'text-yellow-400' },
    { label: 'Recent (5)', value: recent.length, color: 'text-blue-400' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Customers</h2>
        {recent.length === 0 ? (
          <p className="text-gray-500">No customers yet</p>
        ) : (
          <div className="space-y-3">
            {recent.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/customer/${c.id}`)}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
              >
                <div>
                  <p className="text-white font-medium">{c.firstName} {c.lastName}</p>
                  <p className="text-gray-400 text-sm">{c.phone}</p>
                </div>
                <p className="text-orange-400 font-semibold">${c.rewardsBalance || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
