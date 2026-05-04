import { useState } from 'react'
import { db } from '../lib/firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'
import { COLLECTIONS, EVENT_TYPES, LEAD_ALERT_STATUS } from '../lib/schema'

const OWNER_PHONE = '3059095773'

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

function buildOwnerSms({ firstName, lastName, phone, email, address, serviceType, knifeCount, notes }) {
  return `New MKG registration: ${firstName} ${lastName}\nPhone: ${phone}\nEmail: ${email || 'n/a'}\nAddress: ${address || 'n/a'}\nService: ${serviceType}\nKnives: ${knifeCount || 'n/a'}\nNotes: ${notes || 'n/a'}`
}

export default function CustomerCapture() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    serviceType: 'first_knife_free',
    knifeCount: '',
    preferredTiming: '',
    notes: '',
  })
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
      const dupQ = query(collection(db, COLLECTIONS.CUSTOMERS), where('phone', '==', form.phone))
      const dupSnap = await getDocs(dupQ)
      if (!dupSnap.empty) {
        setError('This phone number is already registered. Text SHARP to (305) 909-5773 if you need help scheduling.')
        setLoading(false)
        return
      }

      const referralCode = generateReferralCode()
      const customerDoc = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
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
        leadSource: 'public_register',
        serviceType: form.serviceType,
        knifeCount: form.knifeCount,
        preferredTiming: form.preferredTiming,
        notes: form.notes,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        marketingConsent: true,
        freeSharpeningRedeemed: false,
        referredBy: null,
      })

      const ownerSmsBody = buildOwnerSms(form)
      await addDoc(collection(db, COLLECTIONS.LEAD_ALERTS), {
        customerId: customerDoc.id,
        status: LEAD_ALERT_STATUS.NEW,
        alertType: 'new_registration',
        ownerPhone: OWNER_PHONE,
        ownerSmsBody,
        customerName: `${form.firstName} ${form.lastName}`,
        customerPhone: form.phone,
        serviceType: form.serviceType,
        knifeCount: form.knifeCount,
        preferredTiming: form.preferredTiming,
        createdAt: serverTimestamp(),
      })

      await addDoc(collection(db, COLLECTIONS.CUSTOMER_EVENTS), {
        eventType: EVENT_TYPES.CUSTOMER_CREATED,
        customerId: customerDoc.id,
        metadata: {
          source: 'public_register',
          serviceType: form.serviceType,
          knifeCount: form.knifeCount,
          preferredTiming: form.preferredTiming,
        },
        createdAt: serverTimestamp(),
      })

      setSuccess({ referralCode, firstName: form.firstName, ownerSmsBody })
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again or text SHARP to (305) 909-5773.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const referralUrl = `https://miamiknifeguy.com/r/${success.referralCode}`
    const ownerSmsHref = `sms:${OWNER_PHONE}?&body=${encodeURIComponent(success.ownerSmsBody)}`
    const customerScheduleHref = `sms:${OWNER_PHONE}?&body=${encodeURIComponent(`Hi Miami Knife Guy, I just registered for my first knife free. My referral code is ${success.referralCode}. I'd like to schedule sharpening.`)}`
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome, {success.firstName}!</h2>
          <p className="text-gray-400 mb-4">Your info was sent into the Miami Knife Guy Growth Engine.</p>
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl p-4 mb-4">
            <p className="text-orange-400 font-bold mb-1">Next step: schedule your first knife free.</p>
            <p className="text-gray-300 text-sm">Tap below to text us and lock in pickup, delivery, or drop-off details.</p>
          </div>
          <a href={customerScheduleHref} className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg mb-3">Text to Schedule</a>
          <a href={ownerSmsHref} className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg mb-6">Notify MKG by Text</a>
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-1">Your Referral Code</p>
            <p className="text-orange-500 text-3xl font-bold tracking-widest">{success.referralCode}</p>
          </div>
          <div className="flex justify-center mb-4"><QRCodeSVG value={referralUrl} size={160} bgColor="#111827" fgColor="#f97316" /></div>
          <p className="text-gray-500 text-xs break-all">{referralUrl}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-500 mb-2">Start Here</h1>
          <p className="text-gray-300 font-semibold">Register for your first knife free</p>
          <p className="text-gray-500 text-sm mt-1">We’ll use this to contact you and schedule sharpening.</p>
        </div>
        {error && <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-gray-400 text-sm mb-1">First Name *</label><input name="firstName" value={form.firstName} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Jane" /></div>
            <div><label className="block text-gray-400 text-sm mb-1">Last Name *</label><input name="lastName" value={form.lastName} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Doe" /></div>
          </div>
          <div><label className="block text-gray-400 text-sm mb-1">Phone *</label><input name="phone" value={form.phone} onChange={handleChange} type="tel" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="(305) 555-0100" /></div>
          <div><label className="block text-gray-400 text-sm mb-1">Email</label><input name="email" value={form.email} onChange={handleChange} type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="jane@example.com" /></div>
          <div><label className="block text-gray-400 text-sm mb-1">Address / Area</label><input name="address" value={form.address} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Aventura, Brickell, Hollywood, etc." /></div>
          <div><label className="block text-gray-400 text-sm mb-1">What do you need sharpened?</label><select name="serviceType" value={form.serviceType} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"><option value="first_knife_free">First knife free</option><option value="home_knives">Home knives</option><option value="restaurant_commercial">Restaurant / commercial account</option><option value="vip_membership">VIP sharpening club</option><option value="workshop_interest">Workshop interest</option></select></div>
          <div><label className="block text-gray-400 text-sm mb-1">Estimated number of knives</label><input name="knifeCount" value={form.knifeCount} onChange={handleChange} type="number" min="1" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="1" /></div>
          <div><label className="block text-gray-400 text-sm mb-1">Preferred timing</label><input name="preferredTiming" value={form.preferredTiming} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500" placeholder="Today, this weekend, after 6pm, etc." /></div>
          <div><label className="block text-gray-400 text-sm mb-1">Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 min-h-20" placeholder="Tell us anything helpful: pickup, drop-off, restaurant, knife condition, etc." /></div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white font-bold py-3 rounded-lg transition-colors">{loading ? 'Registering...' : 'Register & Schedule First Knife Free'}</button>
          <p className="text-gray-500 text-xs text-center">By registering, you agree that Miami Knife Guy may contact you about sharpening, scheduling, rewards, and related offers.</p>
        </form>
      </div>
    </div>
  )
}
