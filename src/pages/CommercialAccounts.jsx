import { useEffect, useMemo, useState } from 'react'
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ACCOUNT_STATUS, ACCOUNT_TYPES, COLLECTIONS, EVENT_TYPES, TRUST_STAGES } from '../lib/schema'
import { logCustomerEvent } from '../lib/events'
import { useAuth } from '../contexts/AuthContext'

const emptyForm = {
  businessName: '',
  accountType: ACCOUNT_TYPES.RESTAURANT,
  decisionMaker: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  pickupDeliveryEligible: true,
  serviceFrequency: 'monthly',
  knivesEstimated: '',
  monthlyValue: '',
  accountStatus: ACCOUNT_STATUS.PROSPECT,
  trustStage: TRUST_STAGES.COLD,
  source: '',
  notes: '',
}

export default function CommercialAccounts() {
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.COMMERCIAL_ACCOUNTS), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [])

  const stats = useMemo(() => {
    const active = accounts.filter(a => a.accountStatus === ACCOUNT_STATUS.ACTIVE).length
    const pipelineValue = accounts
      .filter(a => ![ACCOUNT_STATUS.LOST, ACCOUNT_STATUS.PAUSED].includes(a.accountStatus))
      .reduce((sum, a) => sum + Number(a.monthlyValue || 0), 0)
    const proposals = accounts.filter(a => a.trustStage === TRUST_STAGES.PROPOSAL_SENT).length
    return { active, pipelineValue, proposals, total: accounts.length }
  }, [accounts])

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.businessName.trim()) return

    setSaving(true)
    try {
      const payload = {
        ...form,
        knivesEstimated: Number(form.knivesEstimated || 0),
        monthlyValue: Number(form.monthlyValue || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.COMMERCIAL_ACCOUNTS), payload)
      await logCustomerEvent({
        eventType: EVENT_TYPES.COMMERCIAL_ACCOUNT_CREATED,
        commercialAccountId: docRef.id,
        actorUserId: currentUser?.uid || null,
        metadata: {
          businessName: form.businessName,
          accountType: form.accountType,
          accountStatus: form.accountStatus,
          trustStage: form.trustStage,
        },
      })
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-400">Commercial Accounts</h1>
        <p className="text-zinc-400 text-sm mt-1">B2B pipeline for Sharp After Dark, chef partners, hospitality, and recurring accounts.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Accounts" value={stats.total} />
        <Stat label="Active Accounts" value={stats.active} />
        <Stat label="Pipeline / Month" value={`$${stats.pipelineValue}`} />
        <Stat label="Proposals Sent" value={stats.proposals} />
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-orange-400 font-semibold">Add Commercial Prospect</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="Business Name" value={form.businessName} onChange={v => updateField('businessName', v)} required />
          <Input label="Decision Maker" value={form.decisionMaker} onChange={v => updateField('decisionMaker', v)} />
          <Input label="Contact Name" value={form.contactName} onChange={v => updateField('contactName', v)} />
          <Input label="Phone" value={form.phone} onChange={v => updateField('phone', v)} />
          <Input label="Email" value={form.email} onChange={v => updateField('email', v)} />
          <Input label="Address" value={form.address} onChange={v => updateField('address', v)} />
          <Select label="Account Type" value={form.accountType} onChange={v => updateField('accountType', v)} options={ACCOUNT_TYPES} />
          <Select label="Status" value={form.accountStatus} onChange={v => updateField('accountStatus', v)} options={ACCOUNT_STATUS} />
          <Select label="Trust Stage" value={form.trustStage} onChange={v => updateField('trustStage', v)} options={TRUST_STAGES} />
          <Input label="Service Frequency" value={form.serviceFrequency} onChange={v => updateField('serviceFrequency', v)} />
          <Input label="Estimated Knives" type="number" value={form.knivesEstimated} onChange={v => updateField('knivesEstimated', v)} />
          <Input label="Monthly Value" type="number" value={form.monthlyValue} onChange={v => updateField('monthlyValue', v)} />
        </div>
        <Input label="Lead Source" value={form.source} onChange={v => updateField('source', v)} />
        <label className="block">
          <span className="text-xs text-zinc-400">Notes</span>
          <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} className="mt-1 w-full min-h-24 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
        </label>
        <button disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl px-4 py-2 text-sm font-medium">
          {saving ? 'Saving...' : 'Save Account'}
        </button>
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-orange-400 font-semibold">Pipeline</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-zinc-400 bg-zinc-950/60">
              <tr>
                <th className="text-left p-3">Business</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Trust Stage</th>
                <th className="text-left p-3">Monthly Value</th>
                <th className="text-left p-3">Contact</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id} className="border-t border-zinc-800 text-zinc-300">
                  <td className="p-3 font-medium text-white">{account.businessName}</td>
                  <td className="p-3">{account.accountType}</td>
                  <td className="p-3">{account.accountStatus}</td>
                  <td className="p-3">{account.trustStage}</td>
                  <td className="p-3">${account.monthlyValue || 0}</td>
                  <td className="p-3">{account.phone || account.email || '—'}</td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-zinc-500">No commercial accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <p className="text-zinc-400 text-xs">{label}</p>
      <p className="text-2xl font-bold text-orange-400 mt-1">{value}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400">{label}</span>
      <input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-400">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
        {Object.values(options).map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
