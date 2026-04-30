import { useState, useEffect, useRef } from 'react'
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'Threads', 'X (Twitter)']

export default function UGCSubmit() {
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('code')
  const [customer, setCustomer] = useState(null)
  const [loadingCustomer, setLoadingCustomer] = useState(true)
  const [form, setForm] = useState({ platform: '', postUrl: '' })
  const [screenshot, setScreenshot] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.platform || !form.postUrl.trim()) {
      setError('Please select a platform and paste your post URL.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      let screenshotUrl = ''
      if (screenshot) {
        const storage = getStorage()
        const storageRef = ref(storage, `ugc-screenshots/${Date.now()}-${screenshot.name}`)
        const snap = await uploadBytes(storageRef, screenshot)
        screenshotUrl = await getDownloadURL(snap.ref)
      }
      await addDoc(collection(db, 'ugcSubmissions'), {
        customerId: customer?.id || null,
        referralCode: referralCode || null,
        platform: form.platform,
        postUrl: form.postUrl.trim(),
        screenshotUrl,
        status: 'pending',
        rewardStatus: 'pending',
        adminNotes: '',
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
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Submission Received!</h2>
          <p className="text-gray-400">We will review your post and award your reward within 1-3 business days.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-500 mb-1">Share MKG on Social</h1>
          <h2 className="text-lg font-semibold text-white mb-2">Earn Rewards</h2>
          {customer && (
            <p className="text-orange-400 text-sm">Hi, {customer.firstName}! 👋</p>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-gray-300 text-sm font-medium mb-2">How to earn:</p>
          <p className="text-gray-400 text-sm">Tag <span className="text-orange-400 font-semibold">@MiamiKnifeGuy</span> on any post about us on:</p>
          <p className="text-gray-400 text-sm mt-1">TikTok, Instagram, Facebook, Threads, or X</p>
        </div>
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Platform *</label>
            <select
              value={form.platform}
              onChange={e => { setForm(f => ({ ...f, platform: e.target.value })); setError('') }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Select platform...</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Post URL *</label>
            <input
              type="url"
              value={form.postUrl}
              onChange={e => { setForm(f => ({ ...f, postUrl: e.target.value })); setError('') }}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Screenshot (optional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={e => setScreenshot(e.target.files[0] || null)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:text-sm cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Post for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
