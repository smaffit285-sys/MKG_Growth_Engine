import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function ReferralLanding() {
  const { referralCode } = useParams()
  const [referrer, setReferrer] = useState(null)
  const [loadingReferrer, setLoadingReferrer] = useState(true)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    async function lookupReferrer() {
      try {
        const q = query(collection(db, 'customers'), where('referralCode', '==', referralCode))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const doc = snap.docs[0]
          setReferrer({ id: doc.id, ...doc.data() })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingReferrer(false)
      }
    }
    if (referralCode) lookupReferrer()
    else setLoadingReferrer(false)
  }, [referralCode])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.phone) {
      setError('First name, last name, and phone are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const dupQ = query(collection(db, 'customers'), where('phone', '==', form.phone))
      const dupSnap = await getDocs(dupQ)
      if (!dupSnap.empty) {
        setError('This phone number is already a member!')
        setSubmitting(false)
        return
      }
      const newCode = generateReferralCode()
      const customerRef = await addDoc(collection(db, 'customers'), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        referralCode: newCode,
        rewardsBalance: 0,
        totalReferrals: 0,
        completedReferrals: 0,
        membershipTier: 'standard',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        marketingConsent: true,
        freeSharpeningRedeemed: false,
        referredBy: referralCode || null,
      })
      let referralDocId = null
      if (referrer) {
        const referralRef = await addDoc(collection(db, 'referrals'), {
          referringCustomerId: referrer.id,
          referredCustomerId: customerRef.id,
          referralCode: referralCode,
          status: 'pending',
          referralSource: 'qr',
          activationDate: null,
          completedServiceDate: null,
          referralRewardIssued: false,
          freeSharpeningIssued: true,
          fraudFlag: false,
          createdAt: serverTimestamp(),
        })
        referralDocId = referralRef.id
        await addDoc(collection(db, 'rewardLedger'), {
          customerId: referrer.id,
          type: 'referral_pending',
          amount: 5,
          status: 'pending',
          source: 'referral',
          relatedReferralId: referralDocId,
          createdAt: serverTimestamp(),
        })
      }
      setSuccess({ referralCode: newCode, firstName: form.firstName })
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingReferrer) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500" />
      </div>
    )
  }

  if (success) {
    const referralUrl = `https://miamiknifeguy.com/r/${success.referralCode}`
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, {success.firstName}!</h2>
          <p className="text-gray-400 mb-6">You are now part of the Miami Knife Guy family. Share your code to earn rewards!</p>
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-1">Your Referral Code</p>
            <p className="text-orange-500 text-3xl font-bold tracking-widest">{success.referralCode}</p>
          </div>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={referralUrl} size={160} bgColor="#111827" fgColor="#f97316" />
          </div>
          <p className="text-gray-500 text-xs break-all">{referralUrl}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Miami Knife Guy</h1>
          {referrer ? (
            <p className="text-white text-lg">
              <span className="text-orange-400 font-semibold">{referrer.firstName}</span> sent you a free knife sharpening!
            </p>
          ) : (
            <p className="text-white text-lg">Join our rewards program</p>
          )}
          <p className="text-gray-400 text-sm mt-1">Sign up below to claim your spot</p>
        </div>
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">First Name *</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Last Name *</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Phone *</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="(305) 555-0100"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="123 Main St, Miami FL"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {submitting ? 'Registering...' : 'Claim My Free Sharpening'}
          </button>
        </form>
      </div>
    </div>
  )
}
