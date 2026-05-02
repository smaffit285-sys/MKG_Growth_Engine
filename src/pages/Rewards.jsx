import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
}

function StatusBadge({ status }) {
  const colors = {
    pending:  'bg-yellow-500/20 text-yellow-400',
    issued:   'bg-blue-500/20 text-blue-400',
    redeemed: 'bg-green-500/20 text-green-400',
    expired:  'bg-zinc-700 text-zinc-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || colors.pending}`}>
      {status || 'pending'}
    </span>
  )
}

export default function Rewards() {
  const [ledger, setLedger]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'rewardLedger'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const totalPending  = ledger.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount || 0), 0)
  const totalRedeemed = ledger.filter(e => e.status === 'redeemed').reduce((s, e) => s + (e.amount || 0), 0)
  const totalIssued   = ledger.reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-orange-400 tracking-tight">Reward Ledger</h1>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-zinc-400 text-sm mb-1">Total Issued</p>
            <p className="text-2xl font-bold text-orange-400">${totalIssued}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-zinc-400 text-sm mb-1">Pending Redemption</p>
            <p className="text-2xl font-bold text-yellow-400">${totalPending}</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
            <p className="text-zinc-400 text-sm mb-1">Redeemed</p>
            <p className="text-2xl font-bold text-green-400">${totalRedeemed}</p>
          </div>
        </div>
      )}

      {/* Ledger table */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : ledger.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-zinc-300 font-medium">No reward entries yet.</p>
            <p className="text-zinc-500 text-sm mt-1">Rewards are issued automatically when customers earn them.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Customer</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Type</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e, i) => (
                <tr key={e.id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                  <td className="px-5 py-3.5 text-white font-medium">{e.customerName || e.customerId || '—'}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{e.type || 'reward'}</td>
                  <td className="px-5 py-3.5 text-yellow-400 font-semibold">${e.amount || 0}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {e.createdAt?.toDate
                      ? e.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
