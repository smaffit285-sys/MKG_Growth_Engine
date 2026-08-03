import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { contactDisplayName, customerDisplayName } from '../lib/serviceMath'
import PageHeader from '../components/PageHeader'
import { Scissors, UsersRound } from 'lucide-react'

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800 rounded-xl ${className}`} />
}

const TIER_COLORS = {
  standard: 'bg-zinc-700 text-zinc-300',
  silver: 'bg-zinc-400 text-zinc-900',
  gold: 'bg-yellow-500 text-yellow-900',
  platinum: 'bg-blue-400 text-blue-900',
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const filtered = customers.filter(customer => {
    const haystack = [
      customerDisplayName(customer),
      contactDisplayName(customer),
      customer.phone,
      customer.email,
      customer.address,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div className="mx-auto max-w-[1500px] p-4 md:p-7 lg:p-9 space-y-6">
      <PageHeader eyebrow="People" title="Customers" description={loading ? 'Loading customer records…' : `${customers.length} customer records. Search once, then take the next action.`} actions={<button onClick={() => navigate('/field')} className="btn-primary"><Scissors size={18} /> Start a service</button>} />

      <div className="surface-card p-4">
        <label htmlFor="customer-search" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300"><UsersRound size={18} className="text-cyan-300" /> Find a customer</label>
        <input
          id="customer-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by restaurant, contact, phone, email, or location..."
          className="field"
        />
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-zinc-300 font-medium">{search ? 'No customers match your search.' : 'No customers yet.'}</p>
            <p className="text-zinc-500 text-sm mt-1">{search ? 'Try a different name, phone number, or restaurant.' : 'Customers will appear here after they register or are added in the field.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Phone</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Follow-Up</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Review</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Tier</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Rewards</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Referrals</th>
                  <th className="text-left px-5 py-3 text-zinc-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer, i) => (
                  <tr
                    key={customer.id}
                    onClick={() => navigate(`/customer/${customer.id}`)}
                    className={`border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}
                  >
                    <td className="px-5 py-3.5 text-white font-medium">
                      <div>{customerDisplayName(customer)}</div>
                      <div className="text-xs text-zinc-500 font-normal">{contactDisplayName(customer) || customer.email || customer.address || 'No contact notes'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{customer.phone || '-'}</td>
                    <td className="px-5 py-3.5 text-cyan-300">{customer.nextFollowUpDate || '-'}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{(customer.reviewStatus || 'not_requested').replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[customer.tier] || TIER_COLORS.standard}`}>
                        {customer.tier || customer.membershipTier || 'standard'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-yellow-400 font-semibold">${customer.rewardsBalance || 0}</td>
                    <td className="px-5 py-3.5 text-green-400">{customer.completedReferrals || 0}</td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {customer.createdAt?.toDate
                        ? customer.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
