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

export default function Reviews() {
  const [submissions, setSubmissions] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'reviewSubmissions'), orderBy('createdAt', 'desc'))
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

  const handleApprove = async (sub) => {
    if (processing[sub.id]) return
    setProcessing(p => ({ ...p, [sub.id]: true }))
    try {
      await updateDoc(doc(db, 'reviewSubmissions', sub.id), {
        status: 'approved',
        rewardIssued: true,
      })
      if (sub.customerId) {
        const custDoc = await getDoc(doc(db, 'customers', sub.customerId))
        if (custDoc.exists()) {
          const current = custDoc.data().rewardsBalance || 0
          await updateDoc(doc(db, 'customers', sub.customerId), {
            rewardsBalance: current + 10,
          })
        }
        await addDoc(collection(db, 'rewardLedger'), {
          customerId: sub.customerId,
          type: 'review_approved',
          amount: 10,
          status: 'issued',
          source: 'review',
          relatedReviewId: sub.id,
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
    if (processing[sub.id]) return
    setProcessing(p => ({ ...p, [sub.id]: true }))
    try {
      await updateDoc(doc(db, 'reviewSubmissions', sub.id), { status: 'rejected' })
    } catch (e) {
      console.error(e)
    } finally {
      setProcessing(p => ({ ...p, [sub.id]: false }))
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Review Submissions</h1>
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No review submissions yet</div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Customer</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Platform</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Review URL</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Date</th>
                <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr key={sub.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white text-sm">{getName(sub.customerId)}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm capitalize">{sub.platform}</td>
                  <td className="px-4 py-3 text-sm">
                    {sub.submissionUrl ? (
                      <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-xs block">
                        {sub.submissionUrl.length > 40 ? sub.submissionUrl.slice(0, 40) + '...' : sub.submissionUrl}
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[sub.status] || STATUS_COLORS.pending}`}>
                      {sub.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {sub.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(sub)}
                          disabled={processing[sub.id]}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white text-xs rounded-lg"
                        >
                          {processing[sub.id] ? '...' : 'Approve (+$10)'}
                        </button>
                        <button
                          onClick={() => handleReject(sub)}
                          disabled={processing[sub.id]}
                          className="px-3 py-1 bg-red-700 hover:bg-red-800 disabled:bg-red-900 text-white text-xs rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
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
