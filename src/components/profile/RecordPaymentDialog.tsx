'use client'

import { useState } from "react"
import { recordPayment, Loan } from "@/app/actions/loans"
import { Wallet } from "@/app/actions/wallet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface RecordPaymentDialogProps {
    loan: Loan | null
    wallets: Wallet[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RecordPaymentDialog({ loan, wallets, open, onOpenChange }: RecordPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState('')
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [walletId, setWalletId] = useState<string>('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!loan || !amount) {
            toast.error('Please fill in all required fields')
            return
        }

        const paymentAmount = parseFloat(amount)
        if (paymentAmount <= 0) {
            toast.error('Payment amount must be greater than 0')
            return
        }

        if (paymentAmount > loan.remaining_amount) {
            toast.error(`Payment cannot exceed remaining balance of ${loan.currency} ${loan.remaining_amount}`)
            return
        }

        setIsLoading(true)

        try {
            const result = await recordPayment({
                loan_id: loan.id,
                amount: paymentAmount,
                payment_date: paymentDate,
                wallet_id: walletId || undefined
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment recorded successfully! 💸')
                onOpenChange(false)
                // Reset form
                setAmount('')
                setPaymentDate(new Date().toISOString().split('T')[0])
                setWalletId('')
            }
        } catch (error) {
            toast.error('Failed to record payment')
        } finally {
            setIsLoading(false)
        }
    }

    if (!loan) return null

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: loan.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    // Filter wallets by currency
    const compatibleWallets = wallets.filter(w => w.currency === loan.currency)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for {loan.provider}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-3 rounded-md mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining Balance:</span>
                        <span className="font-bold">{formatCurrency(loan.remaining_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Monthly Payment:</span>
                        <span>{formatCurrency(loan.monthly_payment)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder={loan.monthly_payment.toString()}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Suggested: {formatCurrency(loan.monthly_payment)}
                        </p>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label htmlFor="payment-date">Payment Date *</Label>
                        <Input
                            id="payment-date"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Wallet Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="wallet">Paid From Wallet (Optional)</Label>
                        <Select value={walletId || 'none'} onValueChange={(value) => setWalletId(value === 'none' ? '' : value)}>
                            <SelectTrigger id="wallet">
                                <SelectValue placeholder="Select wallet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {compatibleWallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({formatCurrency(wallet.balance)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {compatibleWallets.length === 0 && (
                            <p className="text-xs text-amber-600">
                                No wallets with {loan.currency} currency found
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Record Payment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
