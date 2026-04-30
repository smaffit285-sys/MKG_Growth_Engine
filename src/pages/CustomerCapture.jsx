import { useState } from 'react'
import { db } from '../lib/firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function CustomerCapture() {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

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
    setLoading(true)
    setError('')
    try {
      const dupQ = query(collection(db, 'customers'), where('phone', '==', form.phone))
      const dupSnap = await getDocs(dupQ)
      if (!dupSnap.empty) {
        setError('This phone number is already registered!')
        setLoading(false)
        return
      }
      const referralCode = generateReferralCode()
      await addDoc(collection(db, 'customers'), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        referralCode,
        rewardsBalance: 0,
        totalReferrals: 0,
        completedReferrals: 0,
        membershipTier: 'standard',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        marketingConsent: true,
        freeSharpeningRedeemed: false,
        referredBy: null,
      })
      setSuccess({ referralCode, firstName: form.firstName })
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const referralUrl = `https://miamiknifeguy.com/r/${success.referralCode}`
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, {success.firstName}!</h2>
          <p className="text-gray-400 mb-6">You are now part of the Miami Knife Guy family.</p>
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
          <p className="text-gray-400">Join our rewards program</p>
        </div>
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Jane" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Phone *</label>
            <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="(305) 555-0100" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="123 Main St, Miami FL" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-bold py-3 rounded-lg transition-colors">
            {loading ? 'Registering...' : 'Join MKG Rewards'}
          </button>
        </form>
      </div>
    </div>
  )
}
