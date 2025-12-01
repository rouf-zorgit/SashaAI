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

interface ReportsClientProps {
    initialData: any
    wallets: any[]
    user: User
    currency: string
}

export function ReportsClient({ initialData, wallets, user, currency }: ReportsClientProps) {
    const [selectedMonth] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    })
    const [isLoading] = useState(false)
    const report = initialData

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
                    onChange={() => {
                        // Month selection disabled for now - would need server action or API route
                    }}
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
                                income={report.income}
                                expenses={report.expenses}
                                balance={report.balance}
                                transactionCount={report.transactionCount}
                                currency={currency}
                            />

                            {report.topCategories && report.topCategories.length > 0 && (
                                <div className="bg-card p-6 rounded-lg border">
                                    <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
                                    <div className="space-y-3">
                                        {report.topCategories.map((cat: any) => (
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
