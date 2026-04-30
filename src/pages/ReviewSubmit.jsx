import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

const PLATFORMS = [
  { name: 'Google', icon: '🔍', color: 'bg-blue-600 hover:bg-blue-700', url: 'https://search.google.com/local/writereview' },
  { name: 'Yelp', icon: '⭐', color: 'bg-red-600 hover:bg-red-700', url: 'https://www.yelp.com/writeareview' },
  { name: 'Facebook', icon: '👍', color: 'bg-blue-800 hover:bg-blue-900', url: 'https://www.facebook.com' },
  { name: 'Nextdoor', icon: '🏘️', color: 'bg-green-600 hover:bg-green-700', url: 'https://nextdoor.com' },
]

export default function ReviewSubmit() {
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('code')
  const [customer, setCustomer] = useState(null)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [reviewUrl, setReviewUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function lookupCustomer() {
      if (!referralCode) { setLoadingCustomer(false); return }
      try {
        const q = query(collection(db, 'customers'), where('referralCode', '==', referralCode))
        const snap = await getDocs(q)
        if (!snap.empty) {
          setCustomer({ id: snap.docs[0].id, ...snap.docs[0].data() })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingCustomer(false)
      }
    }
    lookupCustomer()
  }, [referralCode])

  const handlePlatformClick = (platform) => {
    window.open(platform.url, '_blank')
    setSelectedPlatform(platform.name)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reviewUrl.trim()) { setError('Please paste your review link.'); return }
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'reviewSubmissions'), {
        customerId: customer?.id || null,
        referralCode: referralCode || null,
        platform: selectedPlatform,
        submissionUrl: reviewUrl.trim(),
        status: 'pending',
        rewardIssued: false,
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-gray-400">Submitted for review — credit issued once approved (1-3 business days)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-500 mb-1">Share Your Experience</h1>
          <h2 className="text-xl font-semibold text-white mb-2">Earn $10 Credit</h2>
          <p className="text-gray-400 text-sm">Leave an honest review on any platform below</p>
          {customer && (
            <p className="text-orange-400 text-sm mt-2">Hi, {customer.firstName}! 👋</p>
          )}
        </div>
        {!selectedPlatform ? (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center mb-4">Choose a platform to get started:</p>
            {PLATFORMS.map(p => (
              <button
                key={p.name}
                onClick={() => handlePlatformClick(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white font-medium transition-colors ${p.color}`}
              >
                <span className="text-xl">{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="bg-gray-800 rounded-xl p-4 mb-6 text-center">
              <p className="text-gray-400 text-sm">Platform selected:</p>
              <p className="text-white font-semibold">{selectedPlatform}</p>
              <p className="text-gray-500 text-xs mt-1">A new tab should have opened. After sharing your experience, come back and paste your review link below.</p>
            </div>
            {error && (
              <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Review URL (paste your review link)</label>
                <input
                  type="url"
                  value={reviewUrl}
                  onChange={e => { setReviewUrl(e.target.value); setError('') }}
                  placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                className="w-full text-gray-400 hover:text-white text-sm py-2"
              >
                Choose a different platform
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
