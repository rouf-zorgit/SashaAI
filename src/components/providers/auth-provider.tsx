"use client"

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth-store'
import { getProfile, createProfileIfNotExists } from '@/lib/db/profiles'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setProfile, setSession, setLoading } = useAuthStore()

    useEffect(() => {
        const supabase = createClient()

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    let profile = await getProfile(supabase, session.user.id)

                    // Bootstrap profile if missing
                    if (!profile) {
                        const fullName = session.user.user_metadata?.full_name
                        profile = await createProfileIfNotExists(supabase, session.user.id, session.user.email!, fullName)
                    }

                    setProfile(profile)
                } else {
                    setProfile(null)
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                const profile = await getProfile(supabase, session.user.id)
                setProfile(profile)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, setProfile, setSession, setLoading])

    return <>{children}</>
}
