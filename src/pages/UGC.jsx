import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function UGC() {
  const [submissions, setSubmissions] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState({})
  const [modal, setModal] = useState(null)
  const [rewardAmount, setRewardAmount] = useState('15')
  const [rejectNotes, setRejectNotes] = useState({})
  const [showReject, setShowReject] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'ugcSubmissions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setSubmissions(docs)
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

  const handleApprove = async (sub, amount) => {
    const amt = parseInt(amount) || 0
    setProcessing(p => ({ ...p, [sub.id]: true }))
    setModal(null)
    try {
      await updateDoc(doc(db, 'ugcSubmissions', sub.id), {
        status: 'approved',
        rewardStatus: 'issued',
      })
      if (sub.customerId && amt > 0) {
        const custDoc = await getDoc(doc(db, 'customers', sub.customerId))
        if (custDoc.exists()) {
          await updateDoc(doc(db, 'customers', sub.customerId), {
            rewardsBalance: (custDoc.data().rewardsBalance || 0) + amt,
          })
        }
        await addDoc(collection(db, 'rewardLedger'), {
          customerId: sub.customerId,
          type: 'ugc_approved',
          amount: amt,
          status: 'issued',
          source: 'ugc',
          relatedUgcId: sub.id,
          createdAt: serverTimestamp(),
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [sub.id]: false }))
    }
  }

  const handleReject = async (sub) => {
    setProcessing(p => ({ ...p, [sub.id]: true }))
    try {
      await updateDoc(doc(db, 'ugcSubmissions', sub.id), {
        status: 'rejected',
        rewardStatus: 'rejected',
        adminNotes: rejectNotes[sub.id] || '',
      })
      setShowReject(r => ({ ...r, [sub.id]: false }))
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [sub.id]: false }))
    }
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)
  const filters = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">UGC Submissions</h1>
      <div className="flex gap-2 mb-6">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {f}
          </button>
        ))}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">Award Reward</h3>
            <p className="text-gray-400 text-sm mb-4">Enter reward amount for {getName(modal.customerId)}</p>
            <input
              type="number"
              value={rewardAmount}
              onChange={e => setRewardAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-orange-500"
              placeholder="15"
            />
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
              <button onClick={() => handleApprove(modal, rewardAmount)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Approve + Award ${rewardAmount}</button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No UGC submissions found</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sub => (
            <div key={sub.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-medium">{getName(sub.customerId)}</p>
                    <span className="text-gray-400 text-sm capitalize">{sub.platform}</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[sub.status] || STATUS_COLORS.pending}`}>
                      {sub.status || 'pending'}
                    </span>
                  </div>
                  {sub.postUrl && (
                    <a href={sub.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm block mb-1">
                      {sub.postUrl.length > 60 ? sub.postUrl.slice(0, 60) + '...' : sub.postUrl}
                    </a>
                  )}
                  {sub.screenshotUrl && (
                    <a href={sub.screenshotUrl} target="_blank" rel="noopener noreferrer">
                      <img src={sub.screenshotUrl} alt="screenshot" className="w-20 h-20 object-cover rounded-lg mt-2" />
                    </a>
                  )}
                  {sub.adminNotes && (
                    <p className="text-gray-500 text-xs mt-1">Notes: {sub.adminNotes}</p>
                  )}
                </div>
                <p className="text-gray-500 text-xs ml-4">
                  {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : '—'}
                </p>
              </div>
              {sub.status === 'pending' && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setModal(sub); setRewardAmount('15') }}
                    disabled={processing[sub.id]}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
                  >
                    Approve + Award
                  </button>
                  <button
                    onClick={() => setShowReject(r => ({ ...r, [sub.id]: !r[sub.id] }))}
                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs rounded-lg"
                  >
                    Reject
                  </button>
                  {showReject[sub.id] && (
                    <div className="w-full mt-2 flex gap-2">
                      <input
                        value={rejectNotes[sub.id] || ''}
                        onChange={e => setRejectNotes(n => ({ ...n, [sub.id]: e.target.value }))}
                        placeholder="Optional notes..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => handleReject(sub)}
                        disabled={processing[sub.id]}
                        className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs rounded-lg"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
