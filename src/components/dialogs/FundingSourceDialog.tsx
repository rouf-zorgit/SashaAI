'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, TrendingUp, Gift, CreditCard, ArrowLeftRight, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import type { InsufficientFundsError, FundingSource } from '@/app/actions/insufficient-funds'
import { handleFundingSource } from '@/app/actions/insufficient-funds'

interface FundingSourceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    error: InsufficientFundsError
    availableWallets: Array<{ id: string; name: string; balance: number }>
    onSuccess: () => void
}

export function FundingSourceDialog({
    open,
    onOpenChange,
    error,
    availableWallets,
    onSuccess
}: FundingSourceDialogProps) {
    const [selectedSource, setSelectedSource] = useState<FundingSource | null>(null)
    const [loading, setLoading] = useState(false)

    // Transfer specific state
    const [sourceWalletId, setSourceWalletId] = useState<string>('')

    // Loan specific state
    const [loanDetails, setLoanDetails] = useState({
        lender: '',
        interestRate: 0,
        dueDate: ''
    })

    const handleQuickSelect = async (source: FundingSource) => {
        if (source === 'transfer' || source === 'loan') {
            setSelectedSource(source)
            return
        }

        setLoading(true)
        try {
            await handleFundingSource(
                source,
                error.wallet.id,
                error.shortfall,
                error.transaction.description
            )

            toast.success(`Money added successfully from ${source}!`)
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Funding source error:', err)
            toast.error(err.message || 'Failed to add funding source')
        } finally {
            setLoading(false)
        }
    }

    const handleTransfer = async () => {
        if (!sourceWalletId) {
            toast.error('Please select a source wallet')
            return
        }

        setLoading(true)
        try {
            await handleFundingSource(
                'transfer',
                error.wallet.id,
                error.shortfall,
                error.transaction.description,
                { sourceWalletId }
            )

            toast.success('Transfer completed successfully!')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Transfer error:', err)
            toast.error(err.message || 'Transfer failed')
        } finally {
            setLoading(false)
        }
    }

    const handleLoan = async () => {
        if (!loanDetails.lender.trim()) {
            toast.error('Please enter lender name')
            return
        }

        setLoading(true)
        try {
            await handleFundingSource(
                'loan',
                error.wallet.id,
                error.shortfall,
                error.transaction.description,
                { loanDetails }
            )

            toast.success('Loan recorded successfully!')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Loan error:', err)
            toast.error(err.message || 'Failed to record loan')
        } finally {
            setLoading(false)
        }
    }

    // Filter wallets that have enough balance for transfer
    const eligibleWallets = availableWallets.filter(
        w => w.id !== error.wallet.id && w.balance >= error.shortfall
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>💰 Where Did This Money Come From?</DialogTitle>
                    <DialogDescription>
                        Your <strong>{error.wallet.name}</strong> wallet only has ৳{error.wallet.balance.toFixed(2)},
                        but you're trying to spend ৳{error.transaction.amount.toFixed(2)}.
                        <br /><br />
                        <strong className="text-foreground">Shortfall: ৳{error.shortfall.toFixed(2)}</strong>
                    </DialogDescription>
                </DialogHeader>

                {!selectedSource ? (
                    <div className="space-y-3 py-4">
                        <Button
                            onClick={() => handleQuickSelect('income')}
                            disabled={loading}
                            className="w-full justify-start h-auto py-4 px-4"
                            variant="outline"
                        >
                            <TrendingUp className="h-5 w-5 mr-3 text-green-500" />
                            <div className="text-left">
                                <div className="font-semibold">I got income/salary</div>
                                <div className="text-sm text-muted-foreground">Add ৳{error.shortfall.toFixed(2)} as income</div>
                            </div>
                        </Button>

                        <Button
                            onClick={() => handleQuickSelect('gift')}
                            disabled={loading}
                            className="w-full justify-start h-auto py-4 px-4"
                            variant="outline"
                        >
                            <Gift className="h-5 w-5 mr-3 text-purple-500" />
                            <div className="text-left">
                                <div className="font-semibold">It was a gift/bonus</div>
                                <div className="text-sm text-muted-foreground">Add ৳{error.shortfall.toFixed(2)} as gift</div>
                            </div>
                        </Button>

                        <Button
                            onClick={() => handleQuickSelect('loan')}
                            disabled={loading}
                            className="w-full justify-start h-auto py-4 px-4"
                            variant="outline"
                        >
                            <CreditCard className="h-5 w-5 mr-3 text-red-500" />
                            <div className="text-left">
                                <div className="font-semibold">I took a loan</div>
                                <div className="text-sm text-muted-foreground">Borrow ৳{error.shortfall.toFixed(2)} from someone</div>
                            </div>
                        </Button>

                        {eligibleWallets.length > 0 && (
                            <Button
                                onClick={() => setSelectedSource('transfer')}
                                disabled={loading}
                                className="w-full justify-start h-auto py-4 px-4"
                                variant="outline"
                            >
                                <ArrowLeftRight className="h-5 w-5 mr-3 text-blue-500" />
                                <div className="text-left">
                                    <div className="font-semibold">From another wallet</div>
                                    <div className="text-sm text-muted-foreground">Transfer from savings or other wallet</div>
                                </div>
                            </Button>
                        )}

                        <Button
                            onClick={() => handleQuickSelect('manual')}
                            disabled={loading}
                            className="w-full justify-start h-auto py-4 px-4"
                            variant="outline"
                        >
                            <Edit3 className="h-5 w-5 mr-3 text-gray-500" />
                            <div className="text-left">
                                <div className="font-semibold">I'll handle it manually</div>
                                <div className="text-sm text-muted-foreground">I know what I'm doing</div>
                            </div>
                        </Button>
                    </div>
                ) : selectedSource === 'transfer' ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transfer From</Label>
                            <Select value={sourceWalletId} onValueChange={setSourceWalletId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select wallet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleWallets.map(wallet => (
                                        <SelectItem key={wallet.id} value={wallet.id}>
                                            {wallet.name} (৳{wallet.balance.toFixed(2)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedSource(null)}
                                variant="outline"
                                className="flex-1"
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleTransfer}
                                className="flex-1"
                                disabled={loading || !sourceWalletId}
                            >
                                {loading ? 'Transferring...' : 'Transfer'}
                            </Button>
                        </div>
                    </div>
                ) : selectedSource === 'loan' ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Lender Name</Label>
                            <Input
                                placeholder="e.g., Friend, Family, Bank"
                                value={loanDetails.lender}
                                onChange={e => setLoanDetails({ ...loanDetails, lender: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Interest Rate (%) - Optional</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={loanDetails.interestRate || ''}
                                onChange={e => setLoanDetails({ ...loanDetails, interestRate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Due Date - Optional</Label>
                            <Input
                                type="date"
                                value={loanDetails.dueDate}
                                onChange={e => setLoanDetails({ ...loanDetails, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSelectedSource(null)}
                                variant="outline"
                                className="flex-1"
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleLoan}
                                className="flex-1"
                                disabled={loading || !loanDetails.lender.trim()}
                            >
                                {loading ? 'Recording...' : 'Record Loan'}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}