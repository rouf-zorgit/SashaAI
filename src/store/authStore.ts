import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';
import { getProfile, createProfileIfNotExists } from '../lib/db/profiles';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;

    initAuth: () => Promise<void>;
    signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    session: null,
    loading: true,

    initAuth: async () => {
        set({ loading: true });
        try {
            // Get initial session
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user ?? null;

            if (user && user.email) {
                // Fetch profile
                let profile = await getProfile(user.id);

                // If missing, create it (bootstrap)
                if (!profile) {
                    const fullName = user.user_metadata?.full_name;
                    profile = await createProfileIfNotExists(user.id, user.email, fullName);
                }
                set({ session, user, profile, loading: false });
            } else {
                set({ session, user, profile: null, loading: false });
            }

            // Listen for changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                const currentUser = session?.user ?? null;
                // const currentProfile = get().profile;

                // If user changed (e.g. login/logout)
                if (currentUser?.id !== get().user?.id) {
                    if (currentUser && currentUser.email) {
                        set({ loading: true });
                        let newProfile = await getProfile(currentUser.id);
                        if (!newProfile) {
                            const fullName = currentUser.user_metadata?.full_name;
                            newProfile = await createProfileIfNotExists(currentUser.id, currentUser.email, fullName);
                        }
                        set({ session, user: currentUser, profile: newProfile, loading: false });
                    } else {
                        // Signed out
                        set({ session, user: null, profile: null, loading: false });
                    }
                } else {
                    // Just session refresh
                    set({ session, user: currentUser });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ loading: false });
        }
    },

    signUpWithEmail: async (email, password, fullName) => {
        set({ loading: true });
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    signInWithEmail: async (email, password) => {
        set({ loading: true });
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error) {
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        if (error) throw error;
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
    },
}));
