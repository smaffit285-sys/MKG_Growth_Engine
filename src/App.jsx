import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Referrals from './pages/Referrals'
import Rewards from './pages/Rewards'
import UGC from './pages/UGC'
import Reviews from './pages/Reviews'
import ReferralLanding from './pages/ReferralLanding'
import FreeSharpening from './pages/FreeSharpening'

function RootRedirect() {
  const { currentUser } = useAuth()
  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
}

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
      <Route path="/customer/:id" element={<ProtectedLayout><CustomerDetail /></ProtectedLayout>} />
      <Route path="/referrals" element={<ProtectedLayout><Referrals /></ProtectedLayout>} />
      <Route path="/rewards" element={<ProtectedLayout><Rewards /></ProtectedLayout>} />
      <Route path="/ugc" element={<ProtectedLayout><UGC /></ProtectedLayout>} />
      <Route path="/reviews" element={<ProtectedLayout><Reviews /></ProtectedLayout>} />
      <Route path="/r/:referralCode" element={<ReferralLanding />} />
      <Route path="/free-sharpening" element={<FreeSharpening />} />
    </Routes>
  )
}
