'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Skeleton components
const StatCardSkeleton = () => <Skeleton className="h-24 w-full" />
const ChartSkeleton = () => <Skeleton className="h-96 w-full" />

// Lazy load the heavy ReportsClient component
const ReportsClient = dynamic(
    () => import('@/components/reports/ReportsClient').then(mod => ({ default: mod.ReportsClient })),
    {
        loading: () => (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Reports</h1>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        ),
        ssr: false
    }
)

export default function ReportsPage() {
    const [data, setData] = useState<any>(null)
    const [wallets, setWallets] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [currency, setCurrency] = useState('BDT')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const supabase = createClient()
            
            // Get user
            const { data: { user: authUser } } = await supabase.auth.getUser()
            
            if (!authUser) {
                window.location.href = '/login'
                return
            }

            setUser(authUser)

            // Get profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('currency')
                .eq('id', authUser.id)
                .single()
            
            setCurrency(profile?.currency || 'BDT')

            // Get current month report
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const startDate = new Date(year, month - 1, 1).toISOString()
            const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

            // Fetch transactions for the month
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', authUser.id)
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false })

            // Calculate report data
            const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
            const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
            
            const categoryBreakdown: Record<string, number> = {}
            transactions?.forEach(t => {
                if (t.type === 'expense') {
                    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount
                }
            })

            const reportData = {
                month,
                year,
                totalIncome: income,
                totalExpenses: expenses,
                netSavings: income - expenses,
                categoryBreakdown,
                transactions: transactions || []
            }

            // Get wallet stats
            const { data: walletData } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', authUser.id)
                .order('is_default', { ascending: false })

            setData(reportData)
            setWallets(walletData || [])
            setLoading(false)
        }
        
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <h1 className="text-3xl font-bold">Reports</h1>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <ChartSkeleton />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ReportsClient
            initialData={data}
            wallets={wallets}
            user={user}
            currency={currency}
        />
    )
}