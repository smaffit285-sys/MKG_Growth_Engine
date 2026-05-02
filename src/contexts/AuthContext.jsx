import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
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
    return signInWithEmailAndPassword(auth, email, password)
  }

  function signOut() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00f5d4] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
