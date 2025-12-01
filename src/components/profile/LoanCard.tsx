'use client'

import { Loan } from "@/app/actions/loans"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, DollarSign, TrendingDown, Calendar } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface LoanCardProps {
    loan: Loan
    onEdit: (loan: Loan) => void
    onDelete: (loan: Loan) => void
    onRecordPayment: (loan: Loan) => void
}

export function LoanCard({ loan, onEdit, onDelete, onRecordPayment }: LoanCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: loan.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const paidAmount = loan.total_amount - loan.remaining_amount
    const progressPercentage = (paidAmount / loan.total_amount) * 100

    // Calculate next payment date (simplified - assumes monthly)
    const startDate = new Date(loan.start_date)
    const monthsSinceStart = Math.floor(paidAmount / loan.monthly_payment)
    const nextPaymentDate = new Date(startDate)
    nextPaymentDate.setMonth(startDate.getMonth() + monthsSinceStart + 1)

    const isFullyPaid = loan.remaining_amount === 0

    return (
        <Card className={`hover:bg-accent/50 transition-colors ${isFullyPaid ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{loan.provider}</h3>
                            {isFullyPaid && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    Paid Off
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                {loan.interest_rate}% APR
                            </span>
                            <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {formatCurrency(loan.monthly_payment)}/mo
                            </span>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {!isFullyPaid && (
                                <>
                                    <DropdownMenuItem onClick={() => onRecordPayment(loan)}>
                                        Record Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem onClick={() => onEdit(loan)}>
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(loan)}
                            >
                                Delete Loan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                            Paid: {formatCurrency(paidAmount)}
                        </span>
                        <span className="font-medium">
                            Remaining: {formatCurrency(loan.remaining_amount)}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${isFullyPaid ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progressPercentage.toFixed(1)}% paid</span>
                        {!isFullyPaid && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {nextPaymentDate.toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
