"use client"

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

interface QuickStatsProps {
    income: number
    expenses: number
    balance: number
    currency: string
}

export function QuickStats({ income, expenses, balance, currency }: QuickStatsProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Income</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(income, currency)}
                </p>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span>Expenses</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(expenses, currency)}
                </p>
            </Card>

            <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span>Balance</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(balance, currency)}
                </p>
            </Card>
        </div>
    )
}
