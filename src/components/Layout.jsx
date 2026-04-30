import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/referrals', label: 'Referrals', icon: '🔗' },
  { path: '/rewards', label: 'Rewards', icon: '⭐' },
  { path: '/ugc', label: 'UGC', icon: '📸' },
  { path: '/reviews', label: 'Reviews', icon: '💬' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <nav className="w-56 bg-gray-900 flex flex-col py-6 px-3 border-r border-gray-800">
        <div className="mb-8 px-3">
          <h1 className="text-orange-500 font-bold text-lg leading-tight">Miami Knife Guy</h1>
          <p className="text-gray-500 text-xs mt-1">CRM Dashboard</p>
        </div>
        <div className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </nav>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
