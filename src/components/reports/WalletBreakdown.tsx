'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "@/app/actions/wallet"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface WalletBreakdownProps {
    wallets: Wallet[]
    currency: string
}

export function WalletBreakdown({ wallets, currency }: WalletBreakdownProps) {
    const data = wallets.map(wallet => ({
        name: wallet.name,
        value: wallet.balance,
        color: wallet.type === 'mobile_wallet' ? '#ec4899' : // pink-500
            wallet.type === 'bank' ? '#3b82f6' : // blue-500
                wallet.type === 'cash' ? '#22c55e' : // green-500
                    '#94a3b8' // slate-400
    })).filter(item => item.value > 0)

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallet Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-medium">{formatCurrency(item.value)}</span>
                                <span className="text-muted-foreground w-12 text-right">
                                    {((item.value / totalBalance) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
