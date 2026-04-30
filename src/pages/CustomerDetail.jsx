import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { QRCodeSVG } from 'qrcode.react'

const TABS = ['Overview', 'Referrals', 'Rewards', 'Appointments']

export default function CustomerDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('Overview')
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [saving, setSaving] = useState(false)

  useEffect(() => {
        getDoc(doc(db, 'customers', id)).then(snap => {
                if (snap.exists()) {
                          const d = snap.data()
                          setCustomer({ id: snap.id, ...d })
                          setEditForm({ firstName: d.firstName, lastName: d.lastName, email: d.email || '', address: d.address || '' })
                }
                setLoading(false)
        }).catch(err => { console.error(err); setLoading(false) })
  }, [id])

  const handleSave = async () => {
        setSaving(true)
        try {
                await updateDoc(doc(db, 'customers', id), { ...editForm, lastActivity: serverTimestamp() })
                setCustomer(prev => ({ ...prev, ...editForm }))
                setEditing(false)
        } catch (err) { console.error(err) }
        setSaving(false)
  }

  if (loading) return (
        <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
        </div>div>
      )
      if (!customer) return (
            <div className="text-center py-20">
                  <p className="text-gray-400">Customer not found.</p>p>
                  <button onClick={() => navigate('/customers')} className="mt-4 text-orange-500 hover:underline">Back</button>button>
            </div>div>
          )
        
          const referralUrl = `https://miamiknifeguy.com/r/${customer.referralCode}`
            
              return (
                    <div>
                          <div className="flex items-center gap-4 mb-6">
                                  <button onClick={() => navigate('/customers')} className="text-gray-400 hover:text-white">Back</button>button>
                                  <h1 className="text-2xl font-bold text-white">{customer.firstName} {customer.lastName}</h1>h1>
                                  <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 capitalize">{customer.membershipTier}</span>span>
                          </div>div>
                          <div className="flex gap-1 mb-6 border-b border-gray-800">
                            {TABS.map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                              className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}>
                                  {tab}
                                </button>button>
                              ))}
                          </div>div>
                      {activeTab === 'Overview' && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                                  <h2 className="text-lg font-semibold text-white">Customer Info</h2>h2>
                                                      {!editing ? (
                                                <button onClick={() => setEditing(true)} className="text-sm text-orange-500 hover:underline">Edit</button>button>
                                              ) : (
                                                <div className="flex gap-2">
                                                                  <button onClick={() => setEditing(false)} className="text-sm text-gray-400">Cancel</button>button>
                                                                  <button onClick={handleSave} disabled={saving} className="text-sm text-orange-500">
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                  </button>button>
                                                </div>div>
                                                                  )}
                                                    </div>div>
                                          {editing ? (
                                              <div className="space-y-3">
                                                {[['firstName','First Name'],['lastName','Last Name'],['email','Email'],['address','Address']].map(([k,l]) => (
                                                                  <div key={k}>
                                                                                      <label className="text-xs text-gray-400 block mb-1">{l}</label>label>
                                                                                      <input value={editForm[k] || ''} onChange={e => setEditForm(p => ({...p,[k]:e.target.value}))}
                                                                                                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm" />
                                                                  </div>div>
                                                                ))}
                                              </div>div>
                                            ) : (
                                              <dl className="space-y-3 text-sm">
                                                              <div><dt className="text-gray-400">Phone</dt>dt><dd className="text-white">{customer.phone}</dd>dd></div>div>
                                                              <div><dt className="text-gray-400">Email</dt>dt><dd className="text-white">{customer.email || '-'}</dd>dd></div>div>
                                                              <div><dt className="text-gray-400">Address</dt>dt><dd className="text-white">{customer.address || '-'}</dd>dd></div>div>
                                                              <div><dt className="text-gray-400">Member Since</dt>dt>
                                                                                <dd className="text-white">{customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString() : '-'}</dd>dd>
                                                              </div>div>
                                                              <div><dt className="text-gray-400">Tier</dt>dt><dd className="text-white capitalize">{customer.membershipTier}</dd>dd></div>div>
                                                              <div><dt className="text-gray-400">Referrals</dt>dt><dd className="text-white">{customer.completedReferrals || 0} completed</dd>dd></div>div>
                                              </dl>dl>
                                                    )}
                                        </div>div>
                                        <div className="space-y-4">
                                                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                                                  <h2 className="text-lg font-semibold text-white mb-2">Rewards Balance</h2>h2>
                                                                  <p className="text-4xl font-bold text-orange-500">${(customer.rewardsBalance || 0).toFixed(2)}</p>p>
                                                    </div>div>
                                                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                                                  <h2 className="text-lg font-semibold text-white mb-4">Referral QR Code</h2>h2>
                                                                  <div className="flex justify-center mb-3">
                                                                                  <QRCodeSVG value={referralUrl} size={140} bgColor="#111827" fgColor="#f97316" />
                                                                  </div>div>
                                                                  <p className="text-center text-sm text-gray-400">Code: <span className="text-orange-500 font-bold">{customer.referralCode}</span>span></p>p>
                                                                  <p className="text-center text-xs text-gray-500 mt-1 break-all">{referralUrl}</p>p>
                                                    </div>div>
                                        </div>div>
                              </div>div>
                          )}
                      {activeTab !== 'Overview' && (
                              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                                        <p className="text-gray-400">{activeTab} — Coming in Phase 3</p>p>
                              </div>div>
                          )}
                    </div>div>
                  )
}</div>
