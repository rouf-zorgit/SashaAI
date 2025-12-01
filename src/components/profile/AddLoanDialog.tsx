'use client'

import { useState } from "react"
import { createLoan } from "@/app/actions/loans"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AddLoanDialogProps {
    wallets: Wallet[]
}

export function AddLoanDialog({ wallets }: AddLoanDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [provider, setProvider] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [interestRate, setInterestRate] = useState('')
    const [monthlyPayment, setMonthlyPayment] = useState('')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [walletId, setWalletId] = useState<string>('')
    const [currency, setCurrency] = useState('BDT')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!provider || !totalAmount || !interestRate || !monthlyPayment) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsLoading(true)

        try {
            console.log('📊 Creating loan with data:', {
                provider,
                total_amount: parseFloat(totalAmount),
                interest_rate: parseFloat(interestRate),
                monthly_payment: parseFloat(monthlyPayment),
                start_date: startDate,
                currency,
                wallet_id: walletId || undefined
            })

            const result = await createLoan({
                provider,
                total_amount: parseFloat(totalAmount),
                interest_rate: parseFloat(interestRate),
                monthly_payment: parseFloat(monthlyPayment),
                start_date: startDate,
                currency,
                wallet_id: walletId || undefined
            })

            console.log('📊 Loan creation result:', result)

            if (result.error) {
                console.error('❌ Loan creation error:', result.error)
                toast.error(result.error)
            } else {
                toast.success('Loan added successfully! 💰')
                setOpen(false)
                // Reset form
                setProvider('')
                setTotalAmount('')
                setInterestRate('')
                setMonthlyPayment('')
                setStartDate(new Date().toISOString().split('T')[0])
                setWalletId('')

                // Force page reload to show new loan
                window.location.reload()
            }
        } catch (error: any) {
            console.error('❌ Unexpected error:', error)
            toast.error(`Failed to add loan: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Loan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Loan</DialogTitle>
                    <DialogDescription>
                        Track your loans and manage repayments
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Provider */}
                    <div className="space-y-2">
                        <Label htmlFor="provider">Lender/Provider *</Label>
                        <Input
                            id="provider"
                            placeholder="e.g., Bank, Friend, Credit Card"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            required
                        />
                    </div>

                    {/* Total Amount & Currency */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="total-amount">Total Amount *</Label>
                            <Input
                                id="total-amount"
                                type="number"
                                step="0.01"
                                placeholder="10000"
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BDT">BDT</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Interest Rate & Monthly Payment */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="interest-rate">Interest Rate (%) *</Label>
                            <Input
                                id="interest-rate"
                                type="number"
                                step="0.01"
                                placeholder="5.5"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monthly-payment">Monthly Payment *</Label>
                            <Input
                                id="monthly-payment"
                                type="number"
                                step="0.01"
                                placeholder="500"
                                value={monthlyPayment}
                                onChange={(e) => setMonthlyPayment(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date *</Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Linked Wallet (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="wallet">Linked Wallet (Optional)</Label>
                        <Select value={walletId || 'none'} onValueChange={(value) => setWalletId(value === 'none' ? '' : value)}>
                            <SelectTrigger id="wallet">
                                <SelectValue placeholder="Select wallet for payments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name} ({wallet.currency})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Add Loan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
