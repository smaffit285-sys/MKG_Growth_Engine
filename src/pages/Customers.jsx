import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

function SkeletonRow() {
    return (
          <tr className="border-b border-gray-800">
            {[...Array(6)].map((_, i) => (
                    <td key={i} className="px-4 py-3">
                              <div className="h-4 bg-gray-800 rounded animate-pulse" />
                    </td>td>
                  ))}
          </tr>tr>
        )
}

export default function Customers() {
    const [customers, setCustomers] = useState([])
        const [loading, setLoading] = useState(true)
            const [search, setSearch] = useState('')
                const navigate = useNavigate()
                  
                    useEffect(() => {
                          const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
                                const unsub = onSnapshot(q,
                                                               (snap) => { setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
                                                               (err) => { console.error(err); setLoading(false) }
                                                             )
                                      return () => unsub()
                    }, [])
                      
                        const filtered = customers.filter(c => {
                              const s = search.toLowerCase()
                                    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) || (c.phone || '').includes(s)
                        })
                          
                            return (
                                  <div>
                                        <div className="flex items-center justify-between mb-6">
                                                <h1 className="text-2xl font-bold text-white">Customers</h1>h1>
                                                <span className="text-gray-400 text-sm">{customers.length} total</span>span>
                                        </div>div>
                                        <div className="mb-4">
                                                <input type="text" placeholder="Search by name or phone..."
                                                            value={search} onChange={(e) => setSearch(e.target.value)}
                                                            className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
                                        </div>div>
                                        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                                                <div className="overflow-x-auto">
                                                          <table className="w-full text-sm">
                                                                      <thead>
                                                                                    <tr className="border-b border-gray-800 text-gray-400">
                                                                                                    <th className="px-4 py-3 text-left">Name</th>th>
                                                                                                    <th className="px-4 py-3 text-left">Phone</th>th>
                                                                                                    <th className="px-4 py-3 text-left">Email</th>th>
                                                                                                    <th className="px-4 py-3 text-left">Tier</th>th>
                                                                                                    <th className="px-4 py-3 text-left">Rewards</th>th>
                                                                                                    <th className="px-4 py-3 text-left">Joined</th>th>
                                                                                    </tr>tr>
                                                                      </thead>thead>
                                                                      <tbody>
                                                                        {loading ? (
                                                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                                                  ) : filtered.length === 0 ? (
                                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                      {search ? 'No results' : 'No customers yet'}
                                                    </td>td></tr>tr>
                                                  ) : filtered.map(c => (
                                                    <tr key={c.id} onClick={() => navigate(`/customer/${c.id}`)}
                                                                        className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer">
                                                                      <td className="px-4 py-3 text-white font-medium">{c.firstName} {c.lastName}</td>td>
                                                                      <td className="px-4 py-3 text-gray-300">{c.phone}</td>td>
                                                                      <td className="px-4 py-3 text-gray-300">{c.email || '-'}</td>td>
                                                                      <td className="px-4 py-3 text-gray-400 capitalize">{c.membershipTier || 'standard'}</td>td>
                                                                      <td className="px-4 py-3 text-orange-400">${(c.rewardsBalance || 0).toFixed(2)}</td>td>
                                                                      <td className="px-4 py-3 text-gray-400">
                                                                        {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : '-'}
                                                                      </td>td>
                                                    </tr>tr>
                                                  ))}
                                                                      </tbody>tbody>
                                                          </table>table>
                                                </div>div>
                                        </div>div>
                                  </div>div>
                                )
                              }</tr>
