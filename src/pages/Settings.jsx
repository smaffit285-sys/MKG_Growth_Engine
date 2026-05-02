import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '../lib/firebase'

function Card({ title, children }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
      <h2 className="text-orange-400 font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function Settings() {
  const { currentUser } = useAuth()

  // Password change state
  const [currentPass, setCurrentPass]   = useState('')
  const [newPass, setNewPass]           = useState('')
  const [confirmPass, setConfirmPass]   = useState('')
  const [passMsg, setPassMsg]           = useState(null)
  const [passLoading, setPassLoading]   = useState(false)

  // Owner phone
  const [ownerPhone, setOwnerPhone]     = useState('')
  const [phoneMsg, setPhoneMsg]         = useState(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  // Email notifications toggle
  const [emailNotify, setEmailNotify]   = useState(true)
  const [notifyMsg, setNotifyMsg]       = useState(null)

  // Twilio number from env
  const twilioNumber = import.meta.env.VITE_TWILIO_NUMBER || '(not set)'

  // Load settings from Firestore
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'settings', 'global'))
      if (snap.exists()) {
        const data = snap.data()
        setOwnerPhone(data.ownerPhone || '')
        setEmailNotify(data.emailNotifications !== false)
      }
    }
    load()
  }, [])

  // ── Change password ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPassMsg(null)
    if (newPass !== confirmPass) { setPassMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    if (newPass.length < 8)      { setPassMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return }
    setPassLoading(true)
    try {
      const cred = EmailAuthProvider.credential(currentUser.email, currentPass)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPass)
      setPassMsg({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message })
    } finally {
      setPassLoading(false)
    }
  }

  // ── Save owner phone ────────────────────────────────────────────────────────
  const handleSavePhone = async (e) => {
    e.preventDefault()
    setPhoneMsg(null)
    setPhoneLoading(true)
    try {
      await setDoc(doc(db, 'settings', 'global'), { ownerPhone }, { merge: true })
      setPhoneMsg({ type: 'success', text: 'Phone saved!' })
    } catch (err) {
      setPhoneMsg({ type: 'error', text: err.message })
    } finally {
      setPhoneLoading(false)
    }
  }

  // ── Toggle email notifications ──────────────────────────────────────────────
  const handleToggleNotify = async (val) => {
    setEmailNotify(val)
    setNotifyMsg(null)
    try {
      await setDoc(doc(db, 'settings', 'global'), { emailNotifications: val }, { merge: true })
      setNotifyMsg({ type: 'success', text: `Email notifications ${val ? 'enabled' : 'disabled'}.` })
    } catch (err) {
      setNotifyMsg({ type: 'error', text: err.message })
    }
  }

  const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 text-sm'
  const btnClass   = 'px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50'

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-orange-400 tracking-tight">Settings</h1>

      {/* Change Password */}
      <Card title="Change Admin Password">
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Current Password</label>
            <input
              type="password"
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
              placeholder="Current password"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password (min 8 chars)"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Confirm New Password</label>
            <input
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="Confirm new password"
              className={inputClass}
              required
            />
          </div>
          {passMsg && (
            <p className={`text-sm ${passMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {passMsg.text}
            </p>
          )}
          <button type="submit" disabled={passLoading} className={btnClass}>
            {passLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </Card>

      {/* Twilio Number (read-only) */}
      <Card title="Twilio SMS Number">
        <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
          <span className="text-2xl">📱</span>
          <div>
            <p className="text-zinc-400 text-xs mb-0.5">Active Twilio Number</p>
            <p className="text-white font-mono font-semibold">{twilioNumber}</p>
          </div>
          <span className="ml-auto text-xs bg-zinc-700 text-zinc-400 px-2 py-1 rounded-full">read-only</span>
        </div>
        <p className="text-zinc-500 text-xs mt-2">
          To change this number, update <code className="text-orange-400">VITE_TWILIO_NUMBER</code> in your environment variables.
        </p>
      </Card>

      {/* Owner Phone */}
      <Card title="Owner Phone Number">
        <form onSubmit={handleSavePhone} className="space-y-3">
          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Phone Number for Alerts</label>
            <input
              type="tel"
              value={ownerPhone}
              onChange={e => setOwnerPhone(e.target.value)}
              placeholder="+1 (305) 555-0000"
              className={inputClass}
            />
          </div>
          {phoneMsg && (
            <p className={`text-sm ${phoneMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {phoneMsg.text}
            </p>
          )}
          <button type="submit" disabled={phoneLoading} className={btnClass}>
            {phoneLoading ? 'Saving…' : 'Save Phone'}
          </button>
        </form>
      </Card>

      {/* Email Notifications */}
      <Card title="Email Notifications">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Notify me on new submissions</p>
            <p className="text-zinc-500 text-xs">Receive email alerts for new reviews, UGC, and referrals</p>
          </div>
          <button
            onClick={() => handleToggleNotify(!emailNotify)}
            className={`w-12 h-6 rounded-full transition-colors ${emailNotify ? 'bg-orange-500' : 'bg-zinc-700'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailNotify ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {notifyMsg && (
          <p className={`text-sm mt-2 ${notifyMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {notifyMsg.text}
          </p>
        )}
      </Card>
    </div>
  )
}
