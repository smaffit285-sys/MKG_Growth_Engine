import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ServiceDesk = lazy(() => import('./pages/ServiceDesk'))
const Customers = lazy(() => import('./pages/Customers'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const CommercialAccounts = lazy(() => import('./pages/CommercialAccounts'))
const Timeline = lazy(() => import('./pages/Timeline'))
const SharpeningSessions = lazy(() => import('./pages/SharpeningSessions'))
const ContentPipeline = lazy(() => import('./pages/ContentPipeline'))
const ProofVault = lazy(() => import('./pages/ProofVault'))
const TrainingDashboard = lazy(() => import('./pages/TrainingDashboard'))
const Invoices = lazy(() => import('./pages/Invoices'))
const Referrals = lazy(() => import('./pages/Referrals'))
const Rewards = lazy(() => import('./pages/Rewards'))
const UGC = lazy(() => import('./pages/UGC'))
const Reviews = lazy(() => import('./pages/Reviews'))
const ReferralLanding = lazy(() => import('./pages/ReferralLanding'))
const FreeSharpening = lazy(() => import('./pages/FreeSharpening'))
const CustomerCapture = lazy(() => import('./pages/CustomerCapture'))
const ReviewSubmit = lazy(() => import('./pages/ReviewSubmit'))
const UGCSubmit = lazy(() => import('./pages/UGCSubmit'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoading() {
  return <div className="min-h-screen grid place-items-center bg-[#05070d]"><div className="h-11 w-11 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" aria-label="Loading page" /></div>
}

function RootRedirect() {
  const { currentUser } = useAuth()
  return <Navigate to={currentUser ? '/dashboard' : '/login'} replace />
}

function ProtectedLayout({ children }) {
  return <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}><Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/field" element={<ProtectedLayout><ServiceDesk /></ProtectedLayout>} />
      <Route path="/services/new" element={<ProtectedLayout><ServiceDesk /></ProtectedLayout>} />
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
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  )
}
