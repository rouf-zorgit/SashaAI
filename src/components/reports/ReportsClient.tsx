"use client"

import { useState } from 'react'
import Link from 'next/link'
import { MonthSelector } from '@/components/reports/MonthSelector'
import { SummaryCards } from '@/components/reports/SummaryCards'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletBreakdown } from "@/components/reports/WalletBreakdown"
import { WalletSpendingChart } from "@/components/reports/WalletSpendingChart"
import { WalletInsights } from "@/components/reports/WalletInsights"
import { ChartSkeleton, StatCardSkeleton } from '@/components/ui/skeleton'
import type { User } from '@supabase/supabase-js'
import { Card } from '@/components/ui/card'

interface ReportsClientProps {
    initialData: any
    wallets: any[]
    user: User
    currency: string
}

export function ReportsClient({ initialData, wallets, user, currency }: ReportsClientProps) {
    const [selectedMonth, setSelectedMonth] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    })
    const [isLoading, setIsLoading] = useState(false)
    const [report, setReport] = useState(initialData)

    const handleMonthChange = async (year: number, month: number) => {
        setSelectedMonth({ year, month })
        setIsLoading(true)

        try {
            const response = await fetch(`/api/reports?year=${year}&month=${month}`)
            if (response.ok) {
                const data = await response.json()
                setReport(data)
            }
        } catch (error) {
            console.error('Failed to fetch report data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatAmount = (amount: number) => {
        return `${currency === 'BDT' ? '৳' : '$'}${Math.abs(amount).toFixed(2)}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Reports</h1>
                </div>

                <MonthSelector
                    value={selectedMonth}
                    onChange={handleMonthChange}
                />

                {isLoading ? (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <ChartSkeleton />
                    </div>
                ) : report ? (
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="wallets">Wallets</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <SummaryCards
                                income={report.totalIncome}
                                expenses={report.totalExpenses}
                                balance={report.netSavings}
                                transactionCount={report.transactions?.length || 0}
                                currency={currency}
                            />

                            {report.categoryBreakdown && Object.keys(report.categoryBreakdown).length > 0 && (() => {
                                const total = Object.values(report.categoryBreakdown).reduce((sum: number, val: any) => sum + Number(val), 0)
                                const topCategories = Object.entries(report.categoryBreakdown)
                                    .map(([category, amount]: [string, any]) => ({
                                        category,
                                        amount: Number(amount),
                                        percentage: total > 0 ? (Number(amount) / total) * 100 : 0
                                    }))
                                    .sort((a, b) => b.amount - a.amount)
                                    .slice(0, 5)

                                return (
                                    <div className="bg-card p-6 rounded-lg border">
                                        <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
                                        <div className="space-y-3">
                                            {topCategories.map((cat: any) => (
                                                <div key={cat.category} className="flex items-center justify-between">
                                                    <span className="capitalize">{cat.category}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-32 bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full"
                                                                style={{ width: `${cat.percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-medium w-20 text-right">
                                                            {currency === 'BDT' ? '৳' : '$'}{cat.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Transaction List */}
                            {report.transactions && report.transactions.length > 0 && (
                                <Card className="p-6">
                                    <h2 className="text-lg font-semibold mb-4">
                                        Transactions ({report.transactions.length})
                                    </h2>
                                    <div className="space-y-1">
                                        {report.transactions.map((tx: any) => (
                                            <div
                                                key={tx.id}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium capitalize">
                                                        {tx.description || tx.category}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(tx.created_at)} • {tx.category}
                                                    </div>
                                                </div>
                                                <div className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="wallets" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <WalletBreakdown wallets={wallets} currency={currency} />
                                <WalletSpendingChart
                                    data={report.byWallet || {}}
                                    currency={currency}
                                />
                            </div>
                            <WalletInsights
                                wallets={wallets}
                                spendingByWallet={report.byWallet || {}}
                                currency={currency}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No transactions this month</p>
                    </div>
                )}
            </div>
        </div>
    )
}
