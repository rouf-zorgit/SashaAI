'use client'

import { useState, useEffect } from "react"
import { adjustWalletBalance, Wallet } from "@/app/actions/wallet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdjustBalanceDialogProps {
    wallet: Wallet | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AdjustBalanceDialog({ wallet, open, onOpenChange }: AdjustBalanceDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [newBalance, setNewBalance] = useState('')
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (wallet) {
            setNewBalance(wallet.balance.toString())
            setReason('')
        }
    }, [wallet])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!wallet) return

        setIsLoading(true)

        try {
            const result = await adjustWalletBalance(
                wallet.id,
                parseFloat(newBalance),
                reason || 'Manual adjustment'
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Balance updated successfully')
                onOpenChange(false)
            }
        } catch (error) {
            toast.error('Failed to update balance')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Balance</DialogTitle>
                    <DialogDescription>
                        Manually update the balance for "{wallet?.name}". This will be recorded in the adjustment history.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-balance">Current Balance</Label>
                        <Input
                            id="current-balance"
                            value={wallet?.balance || 0}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-balance">New Balance</Label>
                        <Input
                            id="new-balance"
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Input
                            id="reason"
                            placeholder="e.g. Correction, Cash deposit"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Balance'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
