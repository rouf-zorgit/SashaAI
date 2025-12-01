'use client'

import { useState, useEffect } from "react"
import { updateWallet, Wallet } from "@/app/actions/wallet"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditWalletDialogProps {
    wallet: Wallet | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditWalletDialog({ wallet, open, onOpenChange }: EditWalletDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState({
        name: '',
        type: 'bank',
        monthlyLimit: '',
        isDefault: false,
        isLocked: false
    })

    useEffect(() => {
        if (wallet) {
            setData({
                name: wallet.name,
                type: wallet.type,
                monthlyLimit: wallet.monthly_limit?.toString() || '',
                isDefault: wallet.is_default,
                isLocked: wallet.is_locked
            })
        }
    }, [wallet])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!wallet) return

        setIsLoading(true)

        try {
            const result = await updateWallet(wallet.id, {
                name: data.name,
                type: data.type,
                monthly_limit: data.monthlyLimit ? parseFloat(data.monthlyLimit) : undefined,
                is_default: data.isDefault,
                is_locked: data.isLocked
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Wallet updated successfully')
                onOpenChange(false)
            }
        } catch (error) {
            toast.error('Failed to update wallet')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Wallet</DialogTitle>
                    <DialogDescription>
                        Update wallet details. Balance adjustments should be done via the "Adjust Balance" option.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Wallet Name</Label>
                        <Input
                            id="edit-name"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-type">Type</Label>
                        <Select
                            value={data.type}
                            onValueChange={(value) => setData({ ...data, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank">Bank Account</SelectItem>
                                <SelectItem value="mobile_wallet">Mobile Wallet</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-limit">Monthly Spending Limit (Optional)</Label>
                        <Input
                            id="edit-limit"
                            type="number"
                            placeholder="Optional"
                            value={data.monthlyLimit}
                            onChange={(e) => setData({ ...data, monthlyLimit: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Default Wallet</Label>
                            <div className="text-xs text-muted-foreground">
                                Use this wallet for transactions by default
                            </div>
                        </div>
                        <Switch
                            checked={data.isDefault}
                            onCheckedChange={(checked) => setData({ ...data, isDefault: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Lock Wallet</Label>
                            <div className="text-xs text-muted-foreground">
                                Prevent accidental spending from this wallet
                            </div>
                        </div>
                        <Switch
                            checked={data.isLocked}
                            onCheckedChange={(checked) => setData({ ...data, isLocked: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
