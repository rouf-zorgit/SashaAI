'use client'

import { useState } from "react"
import { transferFunds, Wallet } from "@/app/actions/wallet"
import { calculateAvailableBalance, hasSufficientBalance } from "@/lib/wallet-calculations"
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
import { Loader2, ArrowDown, Wallet as WalletIcon } from "lucide-react"
import { toast } from "sonner"

interface TransferFundsDialogProps {
    wallets: Wallet[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TransferFundsDialog({ wallets, open, onOpenChange }: TransferFundsDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [fromWalletId, setFromWalletId] = useState<string>('')
    const [toWalletId, setToWalletId] = useState<string>('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fromWalletId || !toWalletId || !amount) {
            toast.error('Please fill in all required fields')
            return
        }

        if (fromWalletId === toWalletId) {
            toast.error('Cannot transfer to the same wallet')
            return
        }

        // Check available balance
        const fromWallet = wallets.find(w => w.id === fromWalletId)
        if (!fromWallet) {
            toast.error('Source wallet not found')
            return
        }

        const transferAmount = parseFloat(amount)
        const availableBalance = calculateAvailableBalance(fromWallet, 0) // TODO: Pass actual monthly spending

        if (transferAmount > availableBalance) {
            toast.error(`Insufficient available balance. Available: ${fromWallet.currency} ${availableBalance.toFixed(2)}`)
            return
        }

        setIsLoading(true)

        try {
            const result = await transferFunds({
                fromWalletId,
                toWalletId,
                amount: parseFloat(amount),
                description
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Transfer successful! 💸')
                onOpenChange(false)
                // Reset form
                setAmount('')
                setDescription('')
                setFromWalletId('')
                setToWalletId('')
            }
        } catch (error) {
            toast.error('Failed to transfer funds')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter wallets for destination (exclude selected source)
    const sourceWallets = wallets
    const destWallets = wallets.filter(w => w.id !== fromWalletId)

    // Get selected wallet details for display
    const fromWallet = wallets.find(w => w.id === fromWalletId)
    const toWallet = wallets.find(w => w.id === toWalletId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Transfer Funds</DialogTitle>
                    <DialogDescription>
                        Move money between your wallets instantly
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* From Wallet */}
                    <div className="space-y-2">
                        <Label htmlFor="from-wallet" className="text-xs font-medium text-muted-foreground uppercase">
                            From Wallet
                        </Label>
                        <Select value={fromWalletId} onValueChange={setFromWalletId}>
                            <SelectTrigger
                                id="from-wallet"
                                className="h-11"
                            >
                                <div className="flex items-center gap-2">
                                    <WalletIcon className="w-4 h-4 text-primary" />
                                    <SelectValue placeholder="Choose source wallet" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {sourceWallets.map((wallet) => (
                                    <SelectItem
                                        key={wallet.id}
                                        value={wallet.id}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium">{wallet.name}</span>
                                            <span className="text-muted-foreground ml-3 text-sm">
                                                {wallet.currency} {wallet.balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fromWallet && (
                            <p className="text-xs text-muted-foreground">
                                Available: <span className="font-semibold text-foreground">
                                    {fromWallet.currency} {fromWallet.balance.toFixed(2)}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Arrow Indicator */}
                    <div className="flex justify-center -my-1">
                        <div className="bg-muted rounded-full p-1.5">
                            <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* To Wallet */}
                    <div className="space-y-2">
                        <Label htmlFor="to-wallet" className="text-xs font-medium text-muted-foreground uppercase">
                            To Wallet
                        </Label>
                        <Select
                            value={toWalletId}
                            onValueChange={setToWalletId}
                            disabled={!fromWalletId}
                        >
                            <SelectTrigger
                                id="to-wallet"
                                className="h-11 disabled:opacity-50"
                            >
                                <div className="flex items-center gap-2">
                                    <WalletIcon className="w-4 h-4 text-primary" />
                                    <SelectValue placeholder="Choose destination wallet" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {destWallets.map((wallet) => (
                                    <SelectItem
                                        key={wallet.id}
                                        value={wallet.id}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium">{wallet.name}</span>
                                            <span className="text-muted-foreground ml-3 text-sm">
                                                {wallet.currency} {wallet.balance.toFixed(2)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {toWallet && (
                            <p className="text-xs text-muted-foreground">
                                Current balance: <span className="font-semibold text-foreground">
                                    {toWallet.currency} {toWallet.balance.toFixed(2)}
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground uppercase">
                            Amount
                        </Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                min="0.01"
                                step="0.01"
                                className="h-11 pr-16"
                            />
                            {fromWallet && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                                    {fromWallet.currency}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase">
                            Description (Optional)
                        </Label>
                        <Input
                            id="description"
                            placeholder="e.g., Monthly savings"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="h-10"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isLoading || !fromWalletId || !toWalletId || !amount}
                        className="w-full h-11 font-semibold mt-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Transfer Funds'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
