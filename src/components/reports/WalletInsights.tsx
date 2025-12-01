'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "@/app/actions/wallet"
import { AlertTriangle, CheckCircle, TrendingUp, Wallet as WalletIcon } from "lucide-react"
import { getWalletUtilization } from "@/lib/wallet-calculations"

interface WalletInsightsProps {
    wallets: Wallet[]
    spendingByWallet: Record<string, { amount: number }>
    currency: string
}

export function WalletInsights({ wallets, spendingByWallet, currency }: WalletInsightsProps) {
    const insights = []

    // 1. Check for high utilization
    wallets.forEach(wallet => {
        const spending = spendingByWallet[wallet.id]?.amount || 0
        const utilization = getWalletUtilization(wallet, spending)

        if (utilization >= 90) {
            insights.push({
                type: 'warning',
                icon: AlertTriangle,
                color: 'text-red-500',
                title: 'High Utilization',
                message: `You've used ${utilization.toFixed(0)}% of your limit on ${wallet.name}.`
            })
        } else if (utilization >= 75) {
            insights.push({
                type: 'caution',
                icon: TrendingUp,
                color: 'text-amber-500',
                title: 'Approaching Limit',
                message: `You're at ${utilization.toFixed(0)}% of your limit on ${wallet.name}.`
            })
        }
    })

    // 2. Check for unused wallets
    wallets.forEach(wallet => {
        const spending = spendingByWallet[wallet.id]?.amount || 0
        if (spending === 0 && wallet.balance > 0) {
            insights.push({
                type: 'info',
                icon: WalletIcon,
                color: 'text-blue-500',
                title: 'Unused Balance',
                message: `You have ${wallet.currency} ${wallet.balance} in ${wallet.name} that hasn't been used this month.`
            })
        }
    })

    // 3. Savings recommendation
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
    const savingsWallet = wallets.find(w => w.type === 'savings')

    if (totalBalance > 50000 && !savingsWallet) {
        insights.push({
            type: 'tip',
            icon: CheckCircle,
            color: 'text-green-500',
            title: 'Savings Opportunity',
            message: 'You have a healthy total balance. Consider creating a Savings wallet to set aside funds.'
        })
    }

    if (insights.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                        <p>Everything looks good! No specific recommendations right now.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallet Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <insight.icon className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                        <div>
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.message}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
