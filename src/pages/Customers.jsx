import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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

  const TIER_COLORS = {
    standard: 'bg-gray-700 text-gray-300',
    silver: 'bg-gray-400 text-gray-900',
    gold: 'bg-yellow-500 text-yellow-900',
    platinum: 'bg-purple-500 text-purple-100',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <span className="text-gray-400 text-sm">{customers.length} total</span>
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or phone..."
        className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mb-6 focus:outline-none focus:border-orange-500"
      />
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Name</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Phone</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Email</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Tier</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Balance</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/customer/${c.id}`)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer"
                >
                  <td className="px-4 py-3 text-white font-medium">{c.firstName} {c.lastName}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{c.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${TIER_COLORS[c.membershipTier] || TIER_COLORS.standard}`}>
                      {c.membershipTier || 'standard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-orange-400 font-semibold">${c.rewardsBalance || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">No customers found</p>
          )}
        </div>
      )}
    </div>
  )
}
