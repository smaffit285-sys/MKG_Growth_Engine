import { useState } from 'react'
import { db } from '../lib/firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'

function generateReferralCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
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
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
                const q = query(collection(db, 'customers'), where('phone', '==', form.phone))
                const existing = await getDocs(q)
                if (!existing.empty) {
                          setError('This phone number is already registered.')
                          setLoading(false)
                          return
                }
                const referralCode = generateReferralCode()
                const docRef = await addDoc(collection(db, 'customers'), {
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
                setSuccess({ referralCode, name: form.firstName })
        } catch (err) {
                setError('Something went wrong. Please try again.')
                console.error(err)
        } finally {
                setLoading(false)
        }
  }

  if (success) {
        const referralUrl = `https://miamiknifeguy.com/r/${success.referralCode}`
        return (
                <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                        <div className="w-full max-w-md text-center">
                                  <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                                              <div className="text-5xl mb-4">🎉</div>div>
                                              <h2 className="text-2xl font-bold text-white mb-2">Welcome, {success.name}!</h2>h2>
                                              <p className="text-gray-400 mb-6">You are now registered with Miami Knife Guy rewards.</p>p>
                                              <div className="bg-gray-800 rounded-xl p-4 mb-6">
                                                            <p className="text-sm text-gray-400 mb-1">Your Referral Code</p>p>
                                                            <p className="text-3xl font-bold text-orange-500 tracking-widest">{success.referralCode}</p>p>
                                              </div>div>
                                              <div className="flex justify-center mb-4">
                                                            <QRCodeSVG value={referralUrl} size={160} bgColor="#111827" fgColor="#f97316" />
                                              </div>div>
                                              <p className="text-xs text-gray-500">Share your code to earn rewards when friends get their knives sharpened!</p>p>
                                  </div>div>
                        </div>div>
                </div>div>
              )
  }
  
    return (
          <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                                  <h1 className="text-3xl font-bold text-orange-500">Miami Knife Guy</h1>h1>
                                  <p className="text-gray-400 mt-2">Join our rewards program</p>p>
                        </div>div>
                        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                          {error && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                          {error}
                        </div>div>
                                  )}
                                  <form onSubmit={handleSubmit} className="space-y-4">
                                              <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                            <label className="block text-sm text-gray-400 mb-1">First Name *</label>label>
                                                                            <input name="firstName" value={form.firstName} onChange={handleChange} required
                                                                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500" />
                                                            </div>div>
                                                            <div>
                                                                            <label className="block text-sm text-gray-400 mb-1">Last Name *</label>label>
                                                                            <input name="lastName" value={form.lastName} onChange={handleChange} required
                                                                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500" />
                                                            </div>div>
                                              </div>div>
                                              <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Phone Number *</label>label>
                                                            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                                                                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                                                                              placeholder="(305) 555-0100" />
                                              </div>div>
                                              <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Email</label>label>
                                                            <input name="email" type="email" value={form.email} onChange={handleChange}
                                                                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500" />
                                              </div>div>
                                              <div>
                                                            <label className="block text-sm text-gray-400 mb-1">Address</label>label>
                                                            <input name="address" value={form.address} onChange={handleChange}
                                                                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-orange-500" />
                                              </div>div>
                                              <button type="submit" disabled={loading}
                                                              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2">
                                                {loading ? 'Registering...' : 'Join Rewards Program'}
                                              </button>button>
                                  </form>form>
                        </div>div>
                </div>div>
          </div>div>
        )
}</div>
