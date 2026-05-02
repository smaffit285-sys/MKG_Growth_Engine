import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import {
  collection, query, orderBy, limit, onSnapshot, where, Timestamp
} from 'firebase/firestore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayLabel(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, loading }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
      {loading ? (
        <>
          <Skeleton className="h-4 w-28 mb-3" />
          <Skeleton className="h-8 w-16" />
        </>
      ) : (
        <>
          <p className="text-zinc-400 text-sm mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </>
      )}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [customers, setCustomers]     = useState([])
  const [referrals, setReferrals]     = useState([])
  const [reviews, setReviews]         = useState([])
  const [ugc, setUgc]                 = useState([])
  const [rewardLedger, setRewardLedger] = useState([])
  const [loading, setLoading]         = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let resolved = 0
    const done = () => { resolved++; if (resolved === 5) setLoading(false) }

    const u1 = onSnapshot(query(collection(db, 'customers'), orderBy('createdAt', 'desc')), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done()
    })
    const u2 = onSnapshot(query(collection(db, 'referrals'), orderBy('createdAt', 'desc'), limit(100)), snap => {
      setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done()
    })
    const u3 = onSnapshot(query(collection(db, 'reviewSubmissions'), orderBy('createdAt', 'desc'), limit(50)), snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done()
    })
    const u4 = onSnapshot(query(collection(db, 'ugcSubmissions'), orderBy('createdAt', 'desc'), limit(50)), snap => {
      setUgc(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done()
    })
    const u5 = onSnapshot(query(collection(db, 'rewardLedger'), orderBy('createdAt', 'desc'), limit(200)), snap => {
      setRewardLedger(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      done()
    })
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [])

  // ── Computed values ─────────────────────────────────────────────────────────
  const now = new Date()
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoSec = Timestamp.fromDate(weekAgo).seconds

  const totalCustomers   = customers.length
  const newThisWeek      = customers.filter(c => c.createdAt?.seconds >= weekAgoSec).length
  const activeReferrals  = referrals.filter(r => r.status === 'pending').length
  const pendingRewards   = rewardLedger.filter(r => r.status === 'pending').reduce((s, r) => s + (r.amount || 0), 0)
  const reviewsPending   = reviews.filter(r => !r.approved && !r.rejected).length
  const ugcPending       = ugc.filter(u => !u.approved && !u.rejected).length

  // Bar chart: new customers per day for last 14 days
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    d.setHours(0, 0, 0, 0)
    const nextD = new Date(d); nextD.setDate(nextD.getDate() + 1)
    const count = customers.filter(c => {
      const ts = c.createdAt?.seconds
      return ts >= Timestamp.fromDate(d).seconds && ts < Timestamp.fromDate(nextD).seconds
    }).length
    return { day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }
  })

  // Top 5 ambassadors
  const ambassadors = [...customers]
    .filter(c => (c.completedReferrals || 0) > 0 || (c.referralCode))
    .sort((a, b) => (b.completedReferrals || 0) - (a.completedReferrals || 0))
    .slice(0, 5)

  // Activity feed: last 10 events
  const activityItems = [
    ...referrals.slice(0, 10).map(r => ({
      ts: r.createdAt?.seconds || 0,
      icon: '🔗',
      text: `New referral from ${r.referrerName || 'unknown'}`,
      badge: 'referral',
      badgeColor: 'bg-blue-500/20 text-blue-400'
    })),
    ...reviews.slice(0, 10).map(r => ({
      ts: r.createdAt?.seconds || 0,
      icon: '⭐',
      text: `Review from ${r.name || 'customer'} — ${r.rating || '?'}/5`,
      badge: r.approved ? 'approved' : r.rejected ? 'rejected' : 'pending',
      badgeColor: r.approved ? 'bg-green-500/20 text-green-400' : r.rejected ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
    })),
    ...ugc.slice(0, 10).map(u => ({
      ts: u.createdAt?.seconds || 0,
      icon: '📸',
      text: `UGC submitted by ${u.name || 'customer'}`,
      badge: u.approved ? 'approved' : u.rejected ? 'rejected' : 'pending',
      badgeColor: u.approved ? 'bg-green-500/20 text-green-400' : u.rejected ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
    }))
  ].sort((a, b) => b.ts - a.ts).slice(0, 10)

  const stats = [
    { label: 'Total Customers',   value: totalCustomers,          color: 'text-orange-400' },
    { label: 'New This Week',      value: newThisWeek,            color: 'text-green-400'  },
    { label: 'Active Referrals',   value: activeReferrals,        color: 'text-blue-400'   },
    { label: 'Pending Rewards',    value: `$${pendingRewards}`, color: 'text-yellow-400' },
    { label: 'Reviews Pending',    value: reviewsPending,         color: 'text-purple-400' },
    { label: 'UGC Pending',        value: ugcPending,             color: 'text-pink-400'   },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-orange-400 tracking-tight">
        Miami Knife Guy — Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} loading={loading} />
        ))}
      </div>

      {/* Chart + Ambassadors row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h2 className="text-orange-400 font-semibold mb-4">New Customers — Last 14 Days</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  interval={3}
                />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                  labelStyle={{ color: '#f97316' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="New Customers" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 Ambassadors */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h2 className="text-orange-400 font-semibold mb-4">Top 5 Ambassadors</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : ambassadors.length === 0 ? (
            <p className="text-zinc-500 text-sm">No referral data yet. Share referral codes to get started!</p>
          ) : (
            <div className="space-y-2">
              {ambassadors.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/customer/${c.id}`)}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold text-sm w-5">#{i + 1}</span>
                    <span className="text-white text-sm font-medium">{c.firstName} {c.lastName}</span>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">{c.completedReferrals || 0} refs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
        <h2 className="text-orange-400 font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : activityItems.length === 0 ? (
          <p className="text-zinc-500 text-sm">No activity yet. Customer activity will appear here.</p>
        ) : (
          <div className="space-y-2">
            {activityItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-zinc-300 text-sm">{item.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    {item.ts ? new Date(item.ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
