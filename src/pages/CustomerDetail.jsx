import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { COLLECTIONS } from '../lib/schema'
import { contactDisplayName, customerDisplayName } from '../lib/serviceMath'

const TABS = ['Overview', 'Services', 'Invoices', 'Referrals', 'Rewards']

const STATUS_COLORS = {
  unpaid: 'bg-red-500/20 text-red-300 border-red-500/30',
  partial: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-300 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  issued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  redeemed: 'bg-green-500/20 text-green-400 border-green-500/30',
}

function currency(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

function dateLabel(value) {
  if (!value) return '-'
  const date = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
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
  const [services, setServices] = useState([])
  const [invoices, setInvoices] = useState([])
  const [referrals, setReferrals] = useState([])
  const [rewardLedger, setRewardLedger] = useState([])

  useEffect(() => {
    async function loadCustomer() {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() }
          setCustomer(data)
          setEditForm({
            businessName: data.businessName || '',
            contactName: data.contactName || contactDisplayName(data),
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            preferredPricing: data.preferredPricing || '',
            reviewStatus: data.reviewStatus || 'not_requested',
            referralSource: data.referralSource || data.leadSource || '',
            nextFollowUpDate: data.nextFollowUpDate || '',
            notes: data.notes || '',
          })
        }
      } finally {
        setLoading(false)
      }
    }
    loadCustomer()
  }, [id])

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.SERVICE_RECORDS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(service => service.customerId === id)))
  }, [id])

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.INVOICES), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(invoice => invoice.customerId === id)))
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'referrals'), where('referringCustomerId', '==', id), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [id])

  useEffect(() => {
    const q = query(collection(db, 'rewardLedger'), where('customerId', '==', id), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => setRewardLedger(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [id])

  const stats = useMemo(() => {
    return {
      visits: services.length,
      lifetimeValue: services.reduce((sum, service) => sum + Number(service.total || 0), 0),
      unpaid: invoices.filter(invoice => !['paid', 'void'].includes(invoice.paymentStatus || invoice.status)).reduce((sum, invoice) => sum + Number(invoice.balanceDue || 0), 0),
      lastService: services[0],
    }
  }, [services, invoices])

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, id), {
        ...editForm,
        lastActivity: serverTimestamp(),
      })
      setCustomer(prev => ({ ...prev, ...editForm }))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6"><div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" /></div>
  }

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-zinc-400">Customer not found.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 text-orange-500 hover:underline">Back to Customers</button>
      </div>
    )
  }

  const referralUrl = `https://miamiknifeguy.com/r/${customer.referralCode || ''}`
  const reviewUrl = customer.referralCode ? `/review?code=${customer.referralCode}` : '/review'

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <button onClick={() => navigate('/customers')} className="text-zinc-400 hover:text-white flex items-center gap-1 text-sm">Back to Customers</button>

      <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{customerDisplayName(customer)}</h1>
            <p className="text-zinc-400">{contactDisplayName(customer) || 'No contact'} {customer.phone ? `| ${customer.phone}` : ''}</p>
            <p className="text-zinc-500 text-sm">{customer.address || customer.email || 'No location saved'}</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button onClick={() => navigate(`/field?customer=${id}`)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm">New Service</button>
            <a href={reviewUrl} className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2 text-sm text-center">Review Link</a>
            {customer.phone && <a href={`sms:${customer.phone}`} className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-4 py-2 text-sm text-center">Text</a>}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Stat label="Service Visits" value={stats.visits} />
          <Stat label="Lifetime Value" value={currency(stats.lifetimeValue)} />
          <Stat label="Balance Due" value={currency(stats.unpaid)} tone={stats.unpaid > 0 ? 'text-yellow-300' : 'text-green-300'} />
          <Stat label="Next Follow-Up" value={customer.nextFollowUpDate || '-'} />
        </div>
      </section>

      <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-w-24 flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Customer Record</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white text-sm rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['Business / Restaurant', 'businessName'],
              ['Contact Name', 'contactName'],
              ['Phone', 'phone'],
              ['Email', 'email'],
              ['Address / Location', 'address'],
              ['Preferred Pricing', 'preferredPricing'],
              ['Review Status', 'reviewStatus'],
              ['Referral Source', 'referralSource'],
              ['Next Follow-Up', 'nextFollowUpDate'],
            ].map(([label, field]) => (
              <div key={field}>
                <p className="text-zinc-400 text-sm mb-1">{label}</p>
                {editing ? (
                  <input value={editForm[field] || ''} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))} className="field" />
                ) : (
                  <p className="text-white">{customer[field] || '-'}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <p className="text-zinc-400 text-sm mb-1">Notes</p>
            {editing ? (
              <textarea value={editForm.notes || ''} onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))} className="field min-h-24" />
            ) : (
              <p className="text-white whitespace-pre-wrap">{customer.notes || '-'}</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'Services' && <ServiceList services={services} navigate={navigate} customerId={id} />}
      {activeTab === 'Invoices' && <InvoiceList invoices={invoices} />}
      {activeTab === 'Referrals' && <SimpleList title={`Referrals (${referrals.length})`} items={referrals} empty="No referrals yet." />}
      {activeTab === 'Rewards' && (
        <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <QRCodeSVG value={referralUrl} size={128} bgColor="#18181b" fgColor="#f97316" />
              <p className="text-zinc-500 text-xs mt-2 break-all">{referralUrl}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-zinc-400">Code:</span> <span className="text-orange-400 font-bold">{customer.referralCode || '-'}</span></p>
              <p><span className="text-zinc-400">Rewards:</span> <span className="text-white">${customer.rewardsBalance || 0}</span></p>
              <p><span className="text-zinc-400">Completed referrals:</span> <span className="text-white">{customer.completedReferrals || 0}</span></p>
            </div>
          </div>
          <SimpleList title={`Reward History (${rewardLedger.length})`} items={rewardLedger} empty="No reward activity yet." />
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'text-orange-400' }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className={`text-lg font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function ServiceList({ services, navigate, customerId }) {
  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Service History</h2>
        <button onClick={() => navigate(`/field?customer=${customerId}`)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 py-2 text-sm">New Service</button>
      </div>
      {services.length === 0 ? <p className="text-zinc-500 text-sm">No services yet.</p> : services.map(service => (
        <div key={service.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-white font-medium">{dateLabel(service.serviceDate)} | {service.lineItems?.length || 0} line items</p>
              <p className="text-zinc-500 text-sm">{service.serviceNotes || service.repairs || 'No service notes'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={service.paymentStatus || 'unpaid'} />
              <Badge value={service.reviewStatus || 'not_requested'} />
              <span className="text-orange-400 font-bold">{currency(service.total)}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => navigate(`/field?customer=${customerId}`)} className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs">Create New</button>
          </div>
        </div>
      ))}
    </section>
  )
}

function InvoiceList({ invoices }) {
  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
      <h2 className="text-lg font-semibold text-white">Invoices</h2>
      {invoices.length === 0 ? <p className="text-zinc-500 text-sm">No invoices yet.</p> : invoices.map(invoice => (
        <div key={invoice.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-white font-medium">{invoice.invoiceNumber || invoice.id}</p>
            <p className="text-zinc-500 text-sm">{dateLabel(invoice.createdAt)} | Balance {currency(invoice.balanceDue)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge value={invoice.paymentStatus || invoice.status || 'draft'} />
            <span className="text-orange-400 font-bold">{currency(invoice.total)}</span>
          </div>
        </div>
      ))}
    </section>
  )
}

function SimpleList({ title, items, empty }) {
  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {items.length === 0 ? <p className="text-zinc-500 text-sm">{empty}</p> : items.map(item => (
        <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex justify-between gap-3">
          <div>
            <p className="text-white font-medium">{item.type || item.status || item.id}</p>
            <p className="text-zinc-500 text-sm">{dateLabel(item.createdAt)}</p>
          </div>
          <Badge value={item.status || 'pending'} />
        </div>
      ))}
    </section>
  )
}

function Badge({ value }) {
  const key = String(value || '').toLowerCase()
  return <span className={`px-2 py-1 rounded-full text-xs border capitalize ${STATUS_COLORS[key] || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>{String(value || '').replace(/_/g, ' ')}</span>
}
