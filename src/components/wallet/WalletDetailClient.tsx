'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { WalletTrendChart } from "@/components/wallet/WalletTrendChart"
import { WalletCategoryBreakdown } from "@/components/wallet/WalletCategoryBreakdown"
import { TransactionRow } from "@/components/history/TransactionRow"

interface WalletDetailClientProps {
    wallet: any
    transactions: any[]
    stats: {
        spending: number
        income: number
        utilization: number
    }
}

export function WalletDetailClient({ wallet, transactions, stats }: WalletDetailClientProps) {
    // Calculate runway (simple estimation)
    const avgDailySpending = stats.spending / 30 // Assuming 30 days of data roughly
    const runwayDays = avgDailySpending > 0 ? Math.floor(wallet.balance / avgDailySpending) : Infinity
    const runwayText = runwayDays === Infinity ? "Infinite" : `${runwayDays} days`

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{wallet.name}</h1>
                        <p className="text-muted-foreground">{wallet.type} • {wallet.currency}</p>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</div>
                            {wallet.monthly_limit && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Limit: {formatCurrency(wallet.monthly_limit, wallet.currency)}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Spending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4" />
                                {formatCurrency(stats.spending, wallet.currency)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.utilization.toFixed(1)}% of limit used
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Runway</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-500">{runwayText}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Based on recent spending
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    <WalletTrendChart transactions={transactions} currency={wallet.currency} />
                    <WalletCategoryBreakdown transactions={transactions} currency={wallet.currency} />
                </div>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <TransactionRow
                                        key={tx.id}
                                        transaction={tx}
                                        currency={wallet.currency}
                                        onDelete={() => { }} // Read-only view for now
                                    />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No transactions found</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
