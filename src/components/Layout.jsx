import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/referrals', label: 'Referrals', icon: '🔗' },
  { path: '/rewards', label: 'Rewards', icon: '⭐' },
  { path: '/ugc', label: 'UGC', icon: '📸' },
  { path: '/reviews', label: 'Reviews', icon: '💬' },
  ]

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

  const handleLogout = async () => {
        await logout()
        navigate('/login')
  }

  return (
        <div className="min-h-screen bg-gray-950 text-white flex">
          {/* Sidebar */}
              <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10">
                      <div className="p-6 border-b border-gray-800">
                                <h1 className="text-xl font-bold text-orange-500">🔪 MKG CRM</h1>h1>
                                <p className="text-xs text-gray-500 mt-1">Miami Knife Guy</p>p>
                      </div>div>
                      <nav className="flex-1 p-4 space-y-1">
                        {navItems.map(item => (
                      <Link
                                      key={item.path}
                                      to={item.path}
                                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                                        location.pathname === item.path
                                                          ? 'bg-orange-500 text-white'
                                                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                      }`}
                                    >
                                    <span>{item.icon}</span>span>
                        {item.label}
                      </Link>Link>
                    ))}
                      </nav>nav>
                      <div className="p-4 border-t border-gray-800">
                                <p className="text-xs text-gray-500 truncate mb-2">{currentUser?.email}</p>p>
                                <button
                                              onClick={handleLogout}
                                              className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-left"
                                            >
                                            Sign Out
                                </button>button>
                      </div>div>
              </aside>aside>
          {/* Main content */}
              <main className="flex-1 ml-64 p-8">
                {children}
              </main>main>
        </div>div>
      )
}</div>
