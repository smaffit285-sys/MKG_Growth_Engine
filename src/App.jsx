import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import CommercialAccounts from './pages/CommercialAccounts'
import Timeline from './pages/Timeline'
import SharpeningSessions from './pages/SharpeningSessions'
import ContentPipeline from './pages/ContentPipeline'
import ProofVault from './pages/ProofVault'
import TrainingDashboard from './pages/TrainingDashboard'
import Invoices from './pages/Invoices'
import Referrals from './pages/Referrals'
import Rewards from './pages/Rewards'
import UGC from './pages/UGC'
import Reviews from './pages/Reviews'
import ReferralLanding from './pages/ReferralLanding'
import FreeSharpening from './pages/FreeSharpening'
import CustomerCapture from './pages/CustomerCapture'
import ReviewSubmit from './pages/ReviewSubmit'
import UGCSubmit from './pages/UGCSubmit'
import Settings from './pages/Settings'

function RootRedirect() {
  const { currentUser } = useAuth()
  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
}

function ProtectedLayout({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
      <Route path="/customer/:id" element={<ProtectedLayout><CustomerDetail /></ProtectedLayout>} />
      <Route path="/commercial" element={<ProtectedLayout><CommercialAccounts /></ProtectedLayout>} />
      <Route path="/timeline" element={<ProtectedLayout><Timeline /></ProtectedLayout>} />
      <Route path="/sessions" element={<ProtectedLayout><SharpeningSessions /></ProtectedLayout>} />
      <Route path="/content" element={<ProtectedLayout><ContentPipeline /></ProtectedLayout>} />
      <Route path="/proof" element={<ProtectedLayout><ProofVault /></ProtectedLayout>} />
      <Route path="/training" element={<ProtectedLayout><TrainingDashboard /></ProtectedLayout>} />
      <Route path="/invoices" element={<ProtectedLayout><Invoices /></ProtectedLayout>} />
      <Route path="/referrals" element={<ProtectedLayout><Referrals /></ProtectedLayout>} />
      <Route path="/rewards" element={<ProtectedLayout><Rewards /></ProtectedLayout>} />
      <Route path="/ugc" element={<ProtectedLayout><UGC /></ProtectedLayout>} />
      <Route path="/reviews" element={<ProtectedLayout><Reviews /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/r/:referralCode" element={<ReferralLanding />} />
      <Route path="/register" element={<CustomerCapture />} />
      <Route path="/review" element={<ReviewSubmit />} />
      <Route path="/ugc-submit" element={<UGCSubmit />} />
      <Route path="/free-sharpening" element={<FreeSharpening />} />
    </Routes>
  )
}
