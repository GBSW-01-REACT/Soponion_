import { createContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { ensureProfile } from '../services/profiles'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined }

    const load = async (nextSession) => {
      setSession(nextSession)
      setProfileError(null)

      if (!nextSession?.user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await ensureProfile(nextSession.user)
      setProfile(data || null)
      setProfileError(error || null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { load(nextSession) })
    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => {
    if (!session?.user) return { data: null, error: null }
    const result = await ensureProfile(session.user)
    setProfile(result.data || null)
    setProfileError(result.error || null)
    return result
  }

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    profileError,
    loading,
    signOut: () => supabase?.auth.signOut(),
    refreshProfile,
  }), [session, profile, profileError, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
