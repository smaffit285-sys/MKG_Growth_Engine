import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'

const TABS = ['Overview', 'Referrals', 'Rewards', 'Appointments']

const TIER_COLORS = {
  standard: 'bg-gray-700 text-gray-300',
  silver: 'bg-gray-400 text-gray-900',
  gold: 'bg-yellow-500 text-yellow-900',
  platinum: 'bg-purple-500 text-purple-100',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  activated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  flagged: 'bg-red-500/20 text-red-400 border-red-500/30',
  issued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  redeemed: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [referrals, setReferrals] = useState([])
  const [referredCustomers, setReferredCustomers] = useState({})
  const [rewardLedger, setRewardLedger] = useState([])

  useEffect(() => {
    async function loadCustomer() {
      try {
        const snap = await getDoc(doc(db, 'customers', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setCustomer(data)
          setEditForm({ firstName: data.firstName, lastName: data.lastName, email: data.email, address: data.address })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadCustomer()
  }, [id])

  useEffect(() => {
    const refQ = query(
      collection(db, 'referrals'),
      where('referringCustomerId', '==', id),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(refQ, async (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setReferrals(docs)
      const custMap = {}
      await Promise.all(docs.map(async r => {
        if (r.referredCustomerId) {
          const d = await getDoc(doc(db, 'customers', r.referredCustomerId))
          if (d.exists()) custMap[r.referredCustomerId] = d.data()
        }
      }))
      setReferredCustomers(custMap)
    })
    return unsub
  }, [id])

  useEffect(() => {
    const ledgerQ = query(
      collection(db, 'rewardLedger'),
      where('customerId', '==', id),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(ledgerQ, (snap) => {
      setRewardLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'customers', id), {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        address: editForm.address,
        lastActivity: serverTimestamp(),
      })
      setCustomer(c => ({ ...c, ...editForm }))
      setEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-48" />
          <div className="h-48 bg-gray-800 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Customer not found.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-orange-500 hover:underline">Back to Customers</button>
      </div>
    )
  }

  const referralUrl = `https://miamiknifeguy.com/r/${customer.referralCode}`

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/customers')} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 text-sm">
        Back to Customers
      </button>
      <div className="bg-gray-900 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{customer.firstName} {customer.lastName}</h1>
            <p className="text-gray-400">{customer.phone}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${TIER_COLORS[customer.membershipTier] || TIER_COLORS.standard}`}>
              {customer.membershipTier}
            </span>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Rewards Balance</p>
            <p className="text-orange-500 text-3xl font-bold">${customer.rewardsBalance || 0}</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div>
            <QRCodeSVG value={referralUrl} size={120} bgColor="#111827" fgColor="#f97316" />
            <p className="text-gray-500 text-xs mt-1 break-all max-w-xs">{referralUrl}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-400">Code:</span> <span className="text-orange-400 font-bold">{customer.referralCode}</span></p>
            <p><span className="text-gray-400">Total Referrals:</span> <span className="text-white">{customer.totalReferrals || 0}</span></p>
            <p><span className="text-gray-400">Completed:</span> <span className="text-white">{customer.completedReferrals || 0}</span></p>
            <p><span className="text-gray-400">Member Since:</span> <span className="text-white">{customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString() : '—'}</span></p>
          </div>
        </div>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'Overview' && (
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Customer Info</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white text-sm rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['First Name', 'firstName'],
              ['Last Name', 'lastName'],
              ['Email', 'email'],
              ['Address', 'address'],
            ].map(([label, field]) => (
              <div key={field}>
                <p className="text-gray-400 text-sm mb-1">{label}</p>
                {editing ? (
                  <input
                    value={editForm[field] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                ) : (
                  <p className="text-white">{customer[field] || '—'}</p>
                )}
              </div>
            ))}
            <div>
              <p className="text-gray-400 text-sm mb-1">Phone</p>
              <p className="text-white">{customer.phone}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Free Sharpening Redeemed</p>
              <p className="text-white">{customer.freeSharpeningRedeemed ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'Referrals' && (
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Referrals ({referrals.length})</h2>
          {referrals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No referrals yet</p>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => {
                const ref = referredCustomers[r.referredCustomerId]
                return (
                  <div key={r.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{ref ? ref.firstName + ' ' + ref.lastName : 'Unknown'}</p>
                      <p className="text-gray-400 text-sm">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : '—'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                      {r.status || 'pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {activeTab === 'Rewards' && (
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Reward History ({rewardLedger.length})</h2>
          {rewardLedger.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reward activity yet</p>
          ) : (
            <div className="space-y-3">
              {rewardLedger.map(entry => (
                <div key={entry.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium capitalize">{entry.type?.replace(/_/g, ' ')}</p>
                    <p className="text-gray-400 text-sm">{entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold">${entry.amount || 0}</span>
                    <span className={`px-2 py-1 rounded-full text-xs border ${STATUS_COLORS[entry.status] || STATUS_COLORS.pending}`}>
                      {entry.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'Appointments' && (
        <div className="bg-gray-900 rounded-2xl p-6 text-center py-16">
          <p className="text-gray-400 text-lg">Appointments</p>
          <p className="text-gray-600 text-sm mt-2">Coming in Phase 4</p>
        </div>
      )}
    </div>
  )
}
