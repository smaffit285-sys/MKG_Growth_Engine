import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="public-shell">
      <div className="public-card max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="brand-mark">MKG</div>
          <div><p className="page-eyebrow">Private operations</p><p className="text-white font-semibold">Miami Knife Guy</p></div>
        </div>
        <h1 className="font-['Barlow_Condensed'] text-5xl uppercase tracking-wide leading-none text-white mb-3">Welcome back.</h1>
        <p className="text-slate-400 text-sm mb-8">Your customer, service, reputation, and growth command center.</p>
        {error && (
          <div role="alert" className="bg-red-950/50 border border-red-400/40 text-red-200 rounded-xl px-4 py-3 mb-5 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="field"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-50"
          >
            {loading ? <><LockKeyhole size={18} /> Signing in…</> : <>Open Growth Engine <ArrowRight size={18} /></>}
          </button>
        </form>
        <div className="mt-7 pt-5 border-t border-sky-200/10 flex gap-2 text-slate-500 text-xs">
          <ShieldCheck size={16} className="text-cyan-300 shrink-0" />
          <p>Authorized MKG staff only. Customer information stays behind your secure sign-in.</p>
        </div>
      </div>
    </div>
  )
}
