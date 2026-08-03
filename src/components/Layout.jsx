import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  Building2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  FileText,
  Gauge,
  Images,
  LogOut,
  Menu,
  MessageSquareText,
  ReceiptText,
  Scissors,
  Settings,
  Sparkles,
  Star,
  Trophy,
  UserRoundPlus,
  UsersRound,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV_GROUPS = [
  {
    label: 'Work',
    items: [
      { path: '/dashboard', label: 'Today', icon: Gauge },
      { path: '/field', label: 'New service', icon: Scissors, primary: true },
      { path: '/customers', label: 'Customers', icon: UsersRound },
      { path: '/invoices', label: 'Invoices', icon: ReceiptText },
      { path: '/commercial', label: 'Commercial', icon: Building2 },
    ],
  },
  {
    label: 'Grow',
    items: [
      { path: '/referrals', label: 'Referrals', icon: UserRoundPlus },
      { path: '/reviews', label: 'Reviews', icon: MessageSquareText },
      { path: '/ugc', label: 'Customer posts', icon: Images },
      { path: '/rewards', label: 'Rewards', icon: Star },
    ],
  },
  {
    label: 'Improve',
    collapsible: true,
    items: [
      { path: '/timeline', label: 'Activity', icon: Clock3 },
      { path: '/sessions', label: 'Quality sessions', icon: Sparkles },
      { path: '/content', label: 'Content', icon: FileText },
      { path: '/proof', label: 'Proof vault', icon: Trophy },
      { path: '/training', label: 'Training', icon: BookOpenCheck },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const PAGE_NAMES = Object.fromEntries(NAV_GROUPS.flatMap(group => group.items.map(item => [item.path, item.label])))

function NavItem({ item, active, onNavigate }) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`nav-item ${active ? 'nav-item-active' : ''} ${item.primary ? 'nav-item-primary' : ''}`}
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [improveOpen, setImproveOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  const pageName = PAGE_NAMES[location.pathname] || (location.pathname.startsWith('/customer/') ? 'Customer' : 'Growth Engine')

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Menu size={24} />
        </button>
        <div>
          <p className="mobile-brand">MKG</p>
          <p className="mobile-page">{pageName}</p>
        </div>
        <Link to="/field" className="mobile-new-service" aria-label="Start a new service"><Scissors size={20} /></Link>
      </header>

      {mobileOpen && <button className="nav-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">MKG</div>
          <div>
            <p className="brand-name">Miami Knife Guy</p>
            <p className="brand-product">Growth Engine</p>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={22} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {NAV_GROUPS.map(group => {
            const hasActiveItem = group.items.some(item => location.pathname === item.path)
            const visible = !group.collapsible || improveOpen || hasActiveItem
            return (
              <section key={group.label} className="nav-group">
                {group.collapsible ? (
                  <button className="nav-group-toggle" onClick={() => setImproveOpen(value => !value)} aria-expanded={visible}>
                    <span>{group.label}</span><ChevronDown size={16} className={visible ? 'rotate-180' : ''} />
                  </button>
                ) : <p className="nav-group-label">{group.label}</p>}
                {visible && <div className="nav-list">{group.items.map(item => (
                  <NavItem key={item.path} item={item} active={location.pathname === item.path} onNavigate={() => setMobileOpen(false)} />
                ))}</div>}
              </section>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <CircleUserRound size={20} aria-hidden="true" />
            <div><span>Signed in</span><small>{currentUser?.email || 'MKG operator'}</small></div>
          </div>
          <button onClick={handleLogout} className="logout-button"><LogOut size={18} /><span>Sign out</span></button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  )
}
