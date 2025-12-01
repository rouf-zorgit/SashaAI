import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletDetailClient } from '@/components/wallet/WalletDetailClient'
import { getWalletUtilization } from '@/lib/wallet-calculations'

export default async function WalletDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params first
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch wallet details - use id instead of params.id
    const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (walletError || !wallet) {
        redirect('/profile')
    }

    // Fetch transactions for this wallet - use id instead of params.id
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100)

    if (txError) {
        console.error('Error fetching wallet transactions:', txError)
    }

    // Calculate stats
    const spending = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const income = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const utilization = getWalletUtilization(wallet, spending)

    return (
        <WalletDetailClient
            wallet={wallet}
            transactions={transactions || []}
            stats={{ spending, income, utilization }}
        />
    )
}