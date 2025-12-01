'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, PiggyBank, CreditCard, ArrowUpRight, ArrowRightLeft } from "lucide-react"
import { TransferFundsDialog } from "./TransferFundsDialog"
import type { Wallet as WalletType } from "@/app/actions/wallet"

interface FinancialOverviewProps {
    totalBalance: number
    savings: number
    loans: number
    currency: string
    wallets: WalletType[]
    availableToSpend: number
}

export function FinancialOverview({
    totalBalance,
    savings,
    loans,
    currency,
    wallets,
    availableToSpend
}: FinancialOverviewProps) {
    const [isTransferOpen, setIsTransferOpen] = useState(false)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <>
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-muted-foreground">Financial Overview</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setIsTransferOpen(true)}
                    >
                        <ArrowRightLeft className="w-3 h-3 mr-2" />
                        Transfer
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-primary" />
                                Total Balance
                            </p>
                            <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <PiggyBank className="w-4 h-4 text-green-500" />
                                Savings
                            </p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(savings)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-red-500" />
                                Loans
                            </p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(loans)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                                Available to Spend
                            </p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(availableToSpend)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <TransferFundsDialog
                wallets={wallets}
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
            />
        </>
    )
}

