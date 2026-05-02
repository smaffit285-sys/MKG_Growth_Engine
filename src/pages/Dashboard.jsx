import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../lib/firebase'
import { ACCOUNT_STATUS, COLLECTIONS, CONTENT_STAGES, INVOICE_STATUS, TRUST_STAGES } from '../lib/schema'

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
}

function StatCard({ label, value, sublabel, color = 'text-orange-400', loading, onClick }) {
  return (
    <button onClick={onClick} className="text-left bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-orange-500/50 transition-colors">
      {loading ? <><Skeleton className="h-4 w-28 mb-3" /><Skeleton className="h-8 w-16" /></> : <><p className="text-zinc-400 text-sm mb-1">{label}</p><p className={`text-3xl font-bold ${color}`}>{value}</p>{sublabel && <p className="text-zinc-500 text-xs mt-1">{sublabel}</p>}</>}
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({ customers: [], referrals: [], reviews: [], ugc: [], rewards: [], commercial: [], invoices: [], sessions: [], content: [], proof: [], training: [], events: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const collections = [
      ['customers', 'customers', null], ['referrals', 'referrals', 100], ['reviews', 'reviewSubmissions', 100], ['ugc', 'ugcSubmissions', 100], ['rewards', 'rewardLedger', 200],
      ['commercial', COLLECTIONS.COMMERCIAL_ACCOUNTS, 100], ['invoices', COLLECTIONS.INVOICES, 100], ['sessions', COLLECTIONS.SHARPENING_SESSIONS, 100], ['content', COLLECTIONS.CONTENT_PIPELINE, 100], ['proof', COLLECTIONS.PROOF_ASSETS, 100], ['training', COLLECTIONS.TRAINING_SESSIONS, 100], ['events', COLLECTIONS.CUSTOMER_EVENTS, 50],
    ]
    let resolved = 0
    const unsubs = collections.map(([key, name, cap]) => {
      const q = cap ? query(collection(db, name), orderBy('createdAt', 'desc'), limit(cap)) : query(collection(db, name), orderBy('createdAt', 'desc'))
      return onSnapshot(q, snap => {
        setData(prev => ({ ...prev, [key]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
        resolved += 1
        if (resolved >= collections.length) setLoading(false)
      }, err => {
        console.error(`Dashboard listener failed for ${name}`, err)
        resolved += 1
        if (resolved >= collections.length) setLoading(false)
      })
    })
    return () => unsubs.forEach(u => u())
  }, [])

  const metrics = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoSec = Timestamp.fromDate(weekAgo).seconds
    const activeCommercial = data.commercial.filter(a => a.accountStatus === ACCOUNT_STATUS.ACTIVE).length
    const pipelineValue = data.commercial.filter(a => ![ACCOUNT_STATUS.LOST, ACCOUNT_STATUS.PAUSED].includes(a.accountStatus)).reduce((s, a) => s + Number(a.monthlyValue || 0), 0)
    const proposals = data.commercial.filter(a => a.trustStage === TRUST_STAGES.PROPOSAL_SENT).length
    const invoiceDrafts = data.invoices.filter(i => i.status === INVOICE_STATUS.DRAFT).length
    const invoiceOutstanding = data.invoices.filter(i => ![INVOICE_STATUS.PAID, INVOICE_STATUS.VOID].includes(i.status)).reduce((s, i) => s + Number(i.total || 0), 0)
    const avgQuality = data.sessions.length ? Math.round(data.sessions.reduce((s, x) => s + Number(x.qualityScore || 0), 0) / data.sessions.length) : 0
    const avgTraining = data.training.length ? Math.round(data.training.reduce((s, x) => s + Number(x.score || 0), 0) / data.training.length) : 0
    return {
      totalCustomers: data.customers.length,
      newThisWeek: data.customers.filter(c => c.createdAt?.seconds >= weekAgoSec).length,
      activeCommercial,
      pipelineValue,
      proposals,
      invoiceOutstanding,
      invoiceDrafts,
      sessions: data.sessions.length,
      avgQuality,
      avgTraining,
      contentIdeas: data.content.filter(c => c.stage !== CONTENT_STAGES.PUBLISHED).length,
      proofAssets: data.proof.length,
      reviewsPending: data.reviews.filter(r => !r.approved && !r.rejected).length,
      ugcPending: data.ugc.filter(u => !u.approved && !u.rejected).length,
    }
  }, [data])

  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i)); d.setHours(0, 0, 0, 0)
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1)
    const count = data.customers.filter(c => c.createdAt?.seconds >= Timestamp.fromDate(d).seconds && c.createdAt?.seconds < Timestamp.fromDate(nextD).seconds).length
    return { day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }
  })

  const activityItems = [...data.events.slice(0, 10).map(e => ({ ts: e.createdAt?.seconds || 0, icon: '🕒', text: e.eventType, badge: 'event' })), ...data.reviews.slice(0, 5).map(r => ({ ts: r.createdAt?.seconds || 0, icon: '⭐', text: `Review from ${r.name || 'customer'}`, badge: 'review' })), ...data.ugc.slice(0, 5).map(u => ({ ts: u.createdAt?.seconds || 0, icon: '📸', text: `UGC from ${u.name || 'customer'}`, badge: 'ugc' }))].sort((a, b) => b.ts - a.ts).slice(0, 12)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-orange-400 tracking-tight">Miami Knife Guy — Command Dashboard</h1><p className="text-zinc-400 text-sm mt-1">B2B pipeline, field operations, authority, training, revenue, and proof.</p></div>
        <button onClick={() => navigate('/invoices')} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-sm font-medium">Create Invoice</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard label="Customers" value={metrics.totalCustomers} sublabel={`${metrics.newThisWeek} new this week`} loading={loading} onClick={() => navigate('/customers')} />
        <StatCard label="Active B2B" value={metrics.activeCommercial} sublabel={`$${metrics.pipelineValue}/mo pipeline`} color="text-green-400" loading={loading} onClick={() => navigate('/commercial')} />
        <StatCard label="Proposals" value={metrics.proposals} sublabel="Commercial trust stage" color="text-blue-400" loading={loading} onClick={() => navigate('/commercial')} />
        <StatCard label="Outstanding" value={`$${metrics.invoiceOutstanding}`} sublabel={`${metrics.invoiceDrafts} drafts`} color="text-yellow-400" loading={loading} onClick={() => navigate('/invoices')} />
        <StatCard label="Quality Avg" value={metrics.avgQuality} sublabel={`${metrics.sessions} sessions`} color="text-purple-400" loading={loading} onClick={() => navigate('/sessions')} />
        <StatCard label="Training Avg" value={metrics.avgTraining} sublabel="Technician system" color="text-pink-400" loading={loading} onClick={() => navigate('/training')} />
        <StatCard label="Content Queue" value={metrics.contentIdeas} sublabel="Unpublished assets" loading={loading} onClick={() => navigate('/content')} />
        <StatCard label="Proof Assets" value={metrics.proofAssets} sublabel="Trust vault" color="text-green-400" loading={loading} onClick={() => navigate('/proof')} />
        <StatCard label="Reviews Pending" value={metrics.reviewsPending} color="text-purple-400" loading={loading} onClick={() => navigate('/reviews')} />
        <StatCard label="UGC Pending" value={metrics.ugcPending} color="text-pink-400" loading={loading} onClick={() => navigate('/ugc')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 p-5"><h2 className="text-orange-400 font-semibold mb-4">New Customers — Last 14 Days</h2>{loading ? <Skeleton className="h-48 w-full" /> : <ResponsiveContainer width="100%" height={220}><BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" /><XAxis dataKey="day" tick={{ fill: '#a1a1aa', fontSize: 11 }} interval={3} /><YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#f97316' }} /><Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</div>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5"><h2 className="text-orange-400 font-semibold mb-4">Priority Actions</h2><div className="space-y-2"><Action label="Follow up commercial proposals" value={metrics.proposals} route="/commercial" navigate={navigate} /><Action label="Send or finalize draft invoices" value={metrics.invoiceDrafts} route="/invoices" navigate={navigate} /><Action label="Moderate reviews" value={metrics.reviewsPending} route="/reviews" navigate={navigate} /><Action label="Moderate UGC" value={metrics.ugcPending} route="/ugc" navigate={navigate} /></div></div>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5"><h2 className="text-orange-400 font-semibold mb-4">Recent Activity</h2>{activityItems.length === 0 ? <p className="text-zinc-500 text-sm">No activity yet.</p> : <div className="space-y-2">{activityItems.map((item, i) => <div key={i} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"><div className="flex items-center gap-3"><span>{item.icon}</span><span className="text-zinc-300 text-sm">{item.text}</span></div><span className="text-xs text-zinc-500">{item.ts ? new Date(item.ts * 1000).toLocaleDateString() : '—'}</span></div>)}</div>}</div>
    </div>
  )
}

function Action({ label, value, route, navigate }) {
  return <button onClick={() => navigate(route)} className="w-full flex items-center justify-between p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm"><span className="text-zinc-300">{label}</span><span className="text-orange-400 font-bold">{value}</span></button>
}
