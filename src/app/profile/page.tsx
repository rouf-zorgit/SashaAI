import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/db/profiles'
import { getProfileStats } from '@/lib/queries/profile'
import { getWallets } from '@/app/actions/wallet'
import { getLoans } from '@/app/actions/loans'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { QuickStats } from '@/components/profile/QuickStats'
import { MenuCard } from '@/components/profile/MenuCard'
import { FinancialOverview } from '@/components/profile/FinancialOverview'
import { WalletList } from '@/components/profile/WalletList'
import { LoanList } from '@/components/profile/LoanList'
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

    const [stats, wallets, loans] = await Promise.all([
        getProfileStats(user.id),
        getWallets(),
        getLoans()
    ])

    // Calculate real values from actual data
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

    // Calculate actual savings (only positive balances from savings-type wallets)
    const actualSavings = wallets
        .filter(w => w.type === 'savings' && w.balance > 0)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    // Calculate total debt from:
    // 1. Active loans from loans table
    // 2. Negative wallet balances (overdrafts)
    const loanDebt = loans.reduce((sum, loan) => sum + loan.remaining_amount, 0)
    const overdraftDebt = wallets
        .filter(w => w.balance < 0)
        .reduce((sum, wallet) => sum + Math.abs(wallet.balance), 0)
    const totalLoans = loanDebt + overdraftDebt

    // Calculate available to spend (only cash/bank type wallets with positive balance)
    const availableToSpend = wallets
        .filter(w => (w.type === 'cash' || w.type === 'bank') && w.balance > 0)
        .reduce((sum, wallet) => sum + wallet.balance, 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Profile</h1>

                <ProfileHeader profile={{
                    id: user.id,
                    full_name: profile.full_name,
                    email: profile.email,
                    currency: profile.currency || 'USD',
                    monthly_salary: profile.monthly_salary || 0,
                    avatar_url: profile.avatar_url
                }} />

                <FinancialOverview
                    totalBalance={totalBalance}
                    savings={actualSavings}
                    loans={totalLoans}
                    currency={profile.currency || 'USD'}
                    wallets={wallets}
                    availableToSpend={availableToSpend}
                />

                <QuickStats
                    income={stats.income}
                    expenses={stats.expenses}
                    balance={stats.balance}
                    currency={profile.currency || 'USD'}
                />

                <WalletList wallets={wallets} />

                <LoanList loans={loans} wallets={wallets} />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold mb-3">Menu</h2>
                    <div className="space-y-3">
                        <MenuCard
                            icon="📈"
                            title="Financial Insights"
                            description="Spending patterns and recommendations"
                            href="/insights"
                        />
                        <MenuCard
                            icon="🎯"
                            title="Goals"
                            description="Set and track savings goals"
                            href="/profile/goals"
                        />
                        <MenuCard
                            icon="🧾"
                            title="Receipts"
                            description="Manage uploaded receipts"
                            href="/profile/receipts"
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
                    <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700 cursor-pointer" type="submit">
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    )
}