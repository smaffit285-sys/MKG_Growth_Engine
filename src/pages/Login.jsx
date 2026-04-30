import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

  const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
                await login(email, password)
                navigate('/dashboard')
        } catch (err) {
                setError('Invalid email or password')
        } finally {
                setLoading(false)
        }
  }

  return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                      <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-orange-500">MKG CRM</h1>h1>
                                <p className="text-gray-400 mt-2">Miami Knife Guy - Staff Portal</p>p>
                      </div>div>
                      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                                <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>h2>
                        {error && (
                      <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                      </div>div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                          <label className="block text-sm text-gray-400 mb-1">Email</label>label>
                                                          <input
                                                                            type="email"
                                                                            value={email}
                                                                            onChange={(e) => setEmail(e.target.value)}
                                                                            required
                                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                                                                            placeholder="admin@miamiknifeguy.com"
                                                                          />
                                            </div>div>
                                            <div>
                                                          <label className="block text-sm text-gray-400 mb-1">Password</label>label>
                                                          <input
                                                                            type="password"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            required
                                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                                                                          />
                                            </div>div>
                                            <button
                                                            type="submit"
                                                            disabled={loading}
                                                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
                                                          >
                                              {loading ? 'Signing in...' : 'Sign In'}
                                            </button>button>
                                </form>form>
                      </div>div>
              </div>div>
        </div>div>
      )
}</div>
