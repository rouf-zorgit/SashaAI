import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/supabase';
import { getProfile, createProfileIfNotExists } from '@/lib/db/profiles';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;

    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (loading: boolean) => void;

    // Helper to refresh profile
    refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    profile: null,
    session: null,
    loading: true,

    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    refreshProfile: async () => {
        const { user } = get();
        if (!user) return;

        const supabase = createClient();
        const profile = await getProfile(supabase, user.id);
        set({ profile });
    }
}));
