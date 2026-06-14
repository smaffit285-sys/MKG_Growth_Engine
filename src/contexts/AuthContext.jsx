import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigReady } from '../lib/firebase'
import { ROLES, hasPermission } from '../lib/roles'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(ROLES.READONLY)
  const [loading, setLoading] = useState(true)

  function signIn(email, password) {
    if (!auth) return Promise.reject(new Error('Firebase is not configured.'))
    return signInWithEmailAndPassword(auth, email, password)
  }

  function signOut() {
    if (!auth) return Promise.resolve()
    return firebaseSignOut(auth)
  }

  async function loadUserRole(user) {
    try {
      const staffRef = doc(db, 'staffUsers', user.uid)
      const snap = await getDoc(staffRef)

      if (snap.exists()) {
        setUserRole(snap.data()?.role || ROLES.READONLY)
      } else {
        setUserRole(ROLES.OWNER)
      }
    } catch (error) {
      console.error('Failed to load user role:', error)
      setUserRole(ROLES.READONLY)
    }
  }

  useEffect(() => {
    if (!firebaseConfigReady || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        await loadUserRole(user)
      } else {
        setUserRole(ROLES.READONLY)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    loading,
    signIn,
    signOut,
    login: signIn,
    logout: signOut,
    hasPermission: (permission) => hasPermission(userRole, permission),
  }

  if (!firebaseConfigReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg">
          <h1 className="text-xl font-bold text-orange-400 mb-2">Firebase setup needed</h1>
          <p className="text-zinc-300 text-sm mb-4">The local app cannot start because Firebase environment variables are missing. Copy <code className="text-orange-300">.env.example</code> to <code className="text-orange-300">.env</code> and fill in the <code className="text-orange-300">VITE_FIREBASE_*</code> values from your Firebase project settings.</p>
          <p className="text-zinc-500 text-xs">After saving the .env file, restart the Vite dev server and refresh this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00f5d4] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
