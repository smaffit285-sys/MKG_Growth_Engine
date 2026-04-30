import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  issued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  redeemed: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function Rewards() {
  const [ledger, setLedger] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'rewardLedger'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLedger(docs)
      setLoading(false)
      const ids = new Set(docs.map(d => d.customerId).filter(Boolean))
      const custMap = { ...customers }
      await Promise.all(Array.from(ids).map(async id => {
        if (!custMap[id]) {
          const d = await getDoc(doc(db, 'customers', id))
          if (d.exists()) custMap[id] = d.data()
        }
      }))
      setCustomers({ ...custMap })
    })
    return unsub
  }, [])

  const getName = (id) => {
    const c = customers[id]
    return c ? c.firstName + ' ' + c.lastName : id || 'Unknown'
  }

  const handleRedeem = async (entry) => {
    if (processing[entry.id]) return
    setProcessing(p => ({ ...p, [entry.id]: true }))
    try {
      await updateDoc(doc(db, 'rewardLedger', entry.id), {
        status: 'redeemed',
        redeemedAt: serverTimestamp(),
      })
      if (entry.customerId && entry.amount) {
        const custDoc = await getDoc(doc(db, 'customers', entry.customerId))
        if (custDoc.exists()) {
          const current = custDoc.data().rewardsBalance || 0
          await updateDoc(doc(db, 'customers', entry.customerId), {
            rewardsBalance: Math.max(0, current - entry.amount),
          })
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [entry.id]: false }))
    }
  }

  const filtered = filter === 'all' ? ledger : ledger.filter(e => e.status === filter)

  const totalIssued = ledger.filter(e => e.status === 'issued').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalPending = ledger.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalRedeemed = ledger.filter(e => e.status === 'redeemed').reduce((sum, e) => sum + (e.amount || 0), 0)

  const filters = ['all', 'pending', 'issued', 'redeemed']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Rewards Ledger</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Total Issued</p>
          <p className="text-blue-400 text-2xl font-bold">${totalIssued}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Total Pending</p>
          <p className="text-yellow-400 text-2xl font-bold">${totalPending}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Total Redeemed</p>
          <p className="text-green-400 text-2xl font-bold">${totalRedeemed}</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No entries found</div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Customer</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Type</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Amount</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Date</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white text-sm">{getName(entry.customerId)}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm capitalize">{entry.type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-orange-400 text-sm font-semibold">${entry.amount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[entry.status] || STATUS_COLORS.pending}`}>
                      {entry.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {entry.status === 'issued' && (
                      <button
                        onClick={() => handleRedeem(entry)}
                        disabled={processing[entry.id]}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white text-xs rounded-lg transition-colors"
                      >
                        {processing[entry.id] ? '...' : 'Mark Redeemed'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
