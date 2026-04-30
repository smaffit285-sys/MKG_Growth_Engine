import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
    const { currentUser, loading } = useAuth()

  if (loading) {
        return (
                <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>div>
                </div>div>
              )
  }
  
    if (!currentUser) {
          return <Navigate to="/login" replace />
    }
  
    return children
}</div>
