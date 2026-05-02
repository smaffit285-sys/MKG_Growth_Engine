import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
}

const TIER_COLORS = {
  standard: 'bg-zinc-700 text-zinc-300',
  silver:   'bg-zinc-400 text-zinc-900',
  gold:     'bg-yellow-500 text-yellow-900',
  platinum: 'bg-blue-400 text-blue-900',
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = customers.filter(c =>
    (c.firstName + ' ' + c.lastName).toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-400 tracking-tight">Customers</h1>
        <span className="text-zinc-500 text-sm">{loading ? '…' : `${customers.length} total`}</span>
      </div>

      {/* Search */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-zinc-300 font-medium">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              {search ? 'Try a different name or phone number.' : 'Customers will appear here after they register.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Phone</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Tier</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Rewards</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Referrals</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customer/${c.id}`)}
                  className={`border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}
                >
                  <td className="px-5 py-3.5 text-white font-medium">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{c.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[c.tier] || TIER_COLORS.standard}`}>
                      {c.tier || 'standard'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-yellow-400 font-semibold">${c.rewardsBalance || 0}</td>
                  <td className="px-5 py-3.5 text-green-400">{c.completedReferrals || 0}</td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
