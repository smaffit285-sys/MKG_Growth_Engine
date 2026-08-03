import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore'
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Clock3,
  Images,
  MessageSquareText,
  ReceiptText,
  Scissors,
  Sparkles,
  UserRoundPlus,
  UsersRound,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { db } from '../lib/firebase'
import { ACCOUNT_STATUS, COLLECTIONS, CONTENT_STAGES, INVOICE_STATUS, PAYMENT_STATUS, REVIEW_STATUS, TRUST_STAGES } from '../lib/schema'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded-xl ${className}`} />
}

function MetricCard({ icon: Icon, label, value, note, tone = 'cyan', loading, onClick }) {
  return (
    <button onClick={onClick} className="surface-card group min-h-40 p-5 text-left transition-transform hover:-translate-y-0.5">
      {loading ? <><Skeleton className="h-10 w-10 mb-5" /><Skeleton className="h-8 w-24 mb-2" /><Skeleton className="h-4 w-32" /></> : <>
        <div className={`metric-icon metric-icon-${tone}`}><Icon size={22} strokeWidth={1.8} /></div>
        <p className="mt-5 text-3xl font-bold tracking-tight text-white">{value}</p>
        <p className="mt-1 text-sm font-semibold text-slate-200">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{note}</p>
      </>}
    </button>
  )
}

function ActionRow({ icon: Icon, label, detail, value, route, navigate, urgent = false }) {
  return (
    <button onClick={() => navigate(route)} className={`action-row ${urgent && Number(value) > 0 ? 'action-row-urgent' : ''}`}>
      <span className="action-row-icon"><Icon size={20} /></span>
      <span className="min-w-0 flex-1"><strong>{label}</strong><small>{detail}</small></span>
      <span className="action-row-value">{value}</span>
      <ArrowRight size={17} className="text-slate-600" />
    </button>
  )
}

function MiniBars({ data }) {
  const peak = Math.max(1, ...data.map(item => item.count))
  return (
    <div className="mini-chart" aria-label="New customers over the last fourteen days">
      {data.map((item, index) => (
        <div key={item.day} className="mini-chart-column" title={`${item.day}: ${item.count}`}>
          <span className="mini-chart-value">{item.count || ''}</span>
          <span className="mini-chart-bar" style={{ height: `${Math.max(8, (item.count / peak) * 100)}%` }} />
          {(index === 0 || index === data.length - 1 || index === 6) && <small>{item.day}</small>}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState({ customers: [], referrals: [], reviews: [], ugc: [], commercial: [], invoices: [], services: [], sessions: [], content: [], proof: [], training: [], events: [] })
  const [loading, setLoading] = useState(true)
  const [dataWarning, setDataWarning] = useState('')

  useEffect(() => {
    const collections = [
      ['customers', COLLECTIONS.CUSTOMERS, 500],
      ['referrals', 'referrals', 100],
      ['reviews', 'reviewSubmissions', 100],
      ['ugc', 'ugcSubmissions', 100],
      ['commercial', COLLECTIONS.COMMERCIAL_ACCOUNTS, 100],
      ['invoices', COLLECTIONS.INVOICES, 100],
      ['services', COLLECTIONS.SERVICE_RECORDS, 100],
      ['sessions', COLLECTIONS.SHARPENING_SESSIONS, 100],
      ['content', COLLECTIONS.CONTENT_PIPELINE, 100],
      ['proof', COLLECTIONS.PROOF_ASSETS, 100],
      ['training', COLLECTIONS.TRAINING_SESSIONS, 100],
      ['events', COLLECTIONS.CUSTOMER_EVENTS, 50],
    ]
    let resolved = 0
    let failures = 0
    const finishOne = () => {
      resolved += 1
      if (resolved >= collections.length) {
        setLoading(false)
        if (failures) setDataWarning(`${failures} dashboard source${failures === 1 ? '' : 's'} could not be loaded. The available totals are shown.`)
      }
    }
    const unsubs = collections.map(([key, name, cap]) => {
      const source = query(collection(db, name), orderBy('createdAt', 'desc'), limit(cap))
      return onSnapshot(source, snapshot => {
        setData(previous => ({ ...previous, [key]: snapshot.docs.map(document => ({ id: document.id, ...document.data() })) }))
        finishOne()
      }, error => {
        console.error(`Dashboard listener failed for ${name}`, error)
        failures += 1
        finishOne()
      })
    })
    return () => unsubs.forEach(unsubscribe => unsubscribe())
  }, [])

  const metrics = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoSeconds = Timestamp.fromDate(weekAgo).seconds
    const today = new Date().toISOString().slice(0, 10)
    const outstanding = data.invoices.filter(invoice => ![INVOICE_STATUS.PAID, INVOICE_STATUS.VOID].includes(invoice.status) && invoice.paymentStatus !== PAYMENT_STATUS.PAID)
    return {
      customers: data.customers.length,
      newThisWeek: data.customers.filter(customer => customer.createdAt?.seconds >= weekAgoSeconds).length,
      services: data.services.length,
      outstandingValue: outstanding.reduce((sum, invoice) => sum + Number(invoice.balanceDue || invoice.total || 0), 0),
      unpaidInvoices: outstanding.length,
      activeCommercial: data.commercial.filter(account => account.accountStatus === ACCOUNT_STATUS.ACTIVE).length,
      pipelineValue: data.commercial.filter(account => ![ACCOUNT_STATUS.LOST, ACCOUNT_STATUS.PAUSED].includes(account.accountStatus)).reduce((sum, account) => sum + Number(account.monthlyValue || 0), 0),
      proposals: data.commercial.filter(account => account.trustStage === TRUST_STAGES.PROPOSAL_SENT).length,
      reviewFollowUps: data.services.filter(service => [REVIEW_STATUS.FOLLOW_UP_NEEDED, REVIEW_STATUS.NOT_REQUESTED].includes(service.reviewStatus)).length,
      dueFollowUps: data.customers.filter(customer => customer.nextFollowUpDate && customer.nextFollowUpDate <= today).length,
      reviewsPending: data.reviews.filter(review => (review.status || 'pending') === 'pending').length,
      ugcPending: data.ugc.filter(post => (post.status || 'pending') === 'pending').length,
      contentIdeas: data.content.filter(content => content.stage !== CONTENT_STAGES.PUBLISHED).length,
    }
  }, [data])

  const chartData = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - index))
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const count = data.customers.filter(customer => customer.createdAt?.seconds >= Timestamp.fromDate(date).seconds && customer.createdAt?.seconds < Timestamp.fromDate(nextDate).seconds).length
    return { day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }
  }), [data.customers])

  const activity = useMemo(() => [
    ...data.events.slice(0, 8).map(event => ({ timestamp: event.createdAt?.seconds || 0, text: String(event.eventType || 'Activity').replaceAll('_', ' '), type: 'event' })),
    ...data.reviews.slice(0, 4).map(review => ({ timestamp: review.createdAt?.seconds || 0, text: `Review submitted by ${review.name || 'a customer'}`, type: 'review' })),
    ...data.ugc.slice(0, 4).map(post => ({ timestamp: post.createdAt?.seconds || 0, text: `Customer post from ${post.name || post.platform || 'social media'}`, type: 'post' })),
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8), [data.events, data.reviews, data.ugc])

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dashboard-page mx-auto max-w-[1500px] space-y-6 p-4 md:p-7 lg:p-9">
      <PageHeader
        eyebrow="Today at MKG"
        title={`${greeting}.`}
        description="Start with the next customer-facing action. Everything else can wait."
        actions={<>
          <button onClick={() => navigate('/field')} className="btn-primary"><Scissors size={18} /> Start a service</button>
          <button onClick={() => navigate('/customers')} className="btn-secondary"><UsersRound size={18} /> Find a customer</button>
        </>}
      />

      {dataWarning && <div role="status" className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{dataWarning}</div>}

      <section aria-labelledby="scoreboard-title">
        <div className="section-heading"><div><p className="page-eyebrow">At a glance</p><h2 id="scoreboard-title">The numbers that matter now</h2></div></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={UsersRound} label="Customers" value={metrics.customers} note={`${metrics.newThisWeek} added this week`} loading={loading} onClick={() => navigate('/customers')} />
          <MetricCard icon={Scissors} label="Recent services" value={metrics.services} note="Latest 100 field records" tone="pink" loading={loading} onClick={() => navigate('/field')} />
          <MetricCard icon={CircleDollarSign} label="Still to collect" value={money.format(metrics.outstandingValue)} note={`${metrics.unpaidInvoices} unpaid invoice${metrics.unpaidInvoices === 1 ? '' : 's'}`} tone="warm" loading={loading} onClick={() => navigate('/invoices')} />
          <MetricCard icon={Building2} label="Commercial accounts" value={metrics.activeCommercial} note={`${money.format(metrics.pipelineValue)}/month pipeline`} tone="violet" loading={loading} onClick={() => navigate('/commercial')} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
        <section className="surface-card p-5 md:p-6" aria-labelledby="priority-title">
          <div className="section-heading"><div><p className="page-eyebrow">Next actions</p><h2 id="priority-title">What needs attention</h2></div><Clock3 size={22} className="text-cyan-300" /></div>
          <div className="mt-4 grid gap-2">
            <ActionRow icon={ReceiptText} label="Collect unpaid invoices" detail="Open balances ready for follow-up" value={metrics.unpaidInvoices} route="/invoices" navigate={navigate} urgent />
            <ActionRow icon={MessageSquareText} label="Ask for reviews" detail="Completed services without a review request" value={metrics.reviewFollowUps} route="/field" navigate={navigate} urgent />
            <ActionRow icon={UsersRound} label="Follow up with customers" detail="Follow-up date is today or earlier" value={metrics.dueFollowUps} route="/customers" navigate={navigate} urgent />
            <ActionRow icon={Building2} label="Commercial proposals" detail="Proposals waiting on the next move" value={metrics.proposals} route="/commercial" navigate={navigate} />
            <ActionRow icon={Sparkles} label="Approve customer proof" detail="Reviews and social posts awaiting approval" value={metrics.reviewsPending + metrics.ugcPending} route="/reviews" navigate={navigate} />
          </div>
        </section>

        <section className="surface-card p-5 md:p-6" aria-labelledby="growth-title">
          <div className="section-heading"><div><p className="page-eyebrow">Acquisition</p><h2 id="growth-title">New customers</h2></div><UserRoundPlus size={22} className="text-pink-300" /></div>
          {loading ? <Skeleton className="mt-5 h-48 w-full" /> : <MiniBars data={chartData} />}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
        <section className="surface-card p-5 md:p-6" aria-labelledby="activity-title">
          <div className="section-heading"><div><p className="page-eyebrow">Live pulse</p><h2 id="activity-title">Recent activity</h2></div></div>
          <div className="mt-4 divide-y divide-sky-100/10">
            {activity.length === 0 ? <p className="py-8 text-sm text-slate-500">Activity will appear here as customers move through the system.</p> : activity.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="flex items-center gap-3 py-3.5">
                <span className="activity-dot" />
                <span className="flex-1 text-sm capitalize text-slate-300">{item.text}</span>
                <time className="text-xs text-slate-600">{item.timestamp ? new Date(item.timestamp * 1000).toLocaleDateString() : 'Today'}</time>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5 md:p-6" aria-labelledby="growth-tools-title">
          <div className="section-heading"><div><p className="page-eyebrow">Keep growing</p><h2 id="growth-tools-title">Growth tools</h2></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="quick-tool" onClick={() => navigate('/referrals')}><UserRoundPlus size={21} /><span>Referrals</span></button>
            <button className="quick-tool" onClick={() => navigate('/reviews')}><MessageSquareText size={21} /><span>Reviews</span><small>{metrics.reviewsPending} pending</small></button>
            <button className="quick-tool" onClick={() => navigate('/ugc')}><Images size={21} /><span>Customer posts</span><small>{metrics.ugcPending} pending</small></button>
            <button className="quick-tool" onClick={() => navigate('/content')}><Sparkles size={21} /><span>Content</span><small>{metrics.contentIdeas} ideas</small></button>
          </div>
        </section>
      </div>
    </div>
  )
}
