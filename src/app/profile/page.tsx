import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { getProfileStats } from '@/lib/queries/profile'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { QuickStats } from '@/components/profile/QuickStats'
import { MenuCard } from '@/components/profile/MenuCard'
import { Button } from '@/components/ui/button'
import { signout } from '@/app/auth/actions'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const profile = await getProfile(supabase, user.id)
    if (!profile) {
        redirect('/onboarding')
    }

    const stats = await getProfileStats(user.id)

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Profile</h1>

                <ProfileHeader profile={{
                    full_name: profile.full_name,
                    email: profile.email,
                    currency: profile.currency || 'USD',
                    monthly_salary: profile.monthly_salary || 0
                }} />

                <div>
                    <h2 className="text-lg font-semibold mb-3">This Month</h2>
                    <QuickStats
                        income={stats.income}
                        expenses={stats.expenses}
                        balance={stats.balance}
                        currency={profile.currency || 'USD'}
                    />
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-3">Menu</h2>
                    <div className="space-y-4">
                        <MenuCard
                            icon="🎯"
                            title="Goals"
                            description="Set and track savings goals"
                            href="/profile/goals"
                        />
                        <MenuCard
                            icon="📊"
                            title="Reports"
                            description="Monthly and yearly insights"
                            href="/profile/reports"
                        />
                        <MenuCard
                            icon="⏰"
                            title="Reminders"
                            description="Bill and payment reminders"
                            href="/profile/reminders"
                        />
                        <MenuCard
                            icon="⚙️"
                            title="Settings"
                            description="Theme, currency, preferences"
                            href="/profile/settings"
                        />
                    </div>
                </div>

                <form action={signout} className="pt-4">
                    <Button variant="destructive" className="w-full cursor-pointer" type="submit">
                        🚪 Sign Out
                    </Button>
                </form>
            </div>
        </div>
    )
}
