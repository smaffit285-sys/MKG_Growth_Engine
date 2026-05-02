import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  activated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  flagged: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function Referrals() {
  const [referrals, setReferrals] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    // TODO: implement pagination for scale
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'), limit(50))
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setReferrals(docs)
      setLoading(false)
      const ids = new Set()
      docs.forEach(r => {
        ids.add(r.referringCustomerId)
        ids.add(r.referredCustomerId)
      })
      const custMap = { ...customers }
      await Promise.all(Array.from(ids).map(async id => {
        if (id && !custMap[id]) {
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

  // ISSUE 1 FIX: Only update referral status — reward write moved to Cloud Function onReferralComplete
  const handleComplete = async (referral) => {
    if (processing[referral.id]) return
    setProcessing(p => ({ ...p, [referral.id]: true }))
    try {
      await updateDoc(doc(db, 'referrals', referral.id), {
        status: 'completed',
        completedServiceDate: serverTimestamp(),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [referral.id]: false }))
    }
  }

  const handleFlagFraud = async (referral) => {
    if (processing[referral.id]) return
    setProcessing(p => ({ ...p, [referral.id]: true }))
    try {
      await updateDoc(doc(db, 'referrals', referral.id), {
        fraudFlag: true,
        status: 'flagged',
      })
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [referral.id]: false }))
    }
  }

  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.status === filter)

  const tabs = ['all', 'pending', 'completed', 'flagged']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-neon-cyan mb-6">Referrals</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === t
                ? 'bg-neon-pink text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No referrals found</div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Referring Customer</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Referred Customer</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Date</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((referral) => (
                <tr key={referral.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-white text-sm">{getName(referral.referringCustomerId)}</td>
                  <td className="px-4 py-3 text-white text-sm">{getName(referral.referredCustomerId)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[referral.status] || STATUS_COLORS.pending}`}>
                      {referral.status || 'pending'}
                    </span>
                    {referral.fraudFlag && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">Fraud</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {referral.createdAt?.toDate ? referral.createdAt.toDate().toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {referral.status === 'pending' && (
                        <button
                          onClick={() => handleComplete(referral)}
                          disabled={processing[referral.id]}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white text-xs rounded-lg transition-colors"
                        >
                          {processing[referral.id] ? '...' : 'Mark Completed'}
                        </button>
                      )}
                      {!referral.fraudFlag && referral.status !== 'flagged' && (
                        <button
                          onClick={() => handleFlagFraud(referral)}
                          disabled={processing[referral.id]}
                          className="px-3 py-1 bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white text-xs rounded-lg transition-colors"
                        >
                          Flag Fraud
                        </button>
                      )}
                    </div>
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
