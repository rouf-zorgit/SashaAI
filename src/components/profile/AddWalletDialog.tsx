'use client'

import { useState } from "react"
import { createWallet } from "@/app/actions/wallet"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export function AddWalletDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState({
        name: '',
        type: 'bank',
        balance: '',
        monthlyLimit: '',
        isDefault: false,
        isLocked: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await createWallet({
                name: data.name,
                type: data.type,
                balance: parseFloat(data.balance),
                currency: 'BDT', // Default for now
                monthly_limit: data.monthlyLimit ? parseFloat(data.monthlyLimit) : undefined,
                is_default: data.isDefault,
                is_locked: data.isLocked
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Wallet created successfully')
                setOpen(false)
                setData({
                    name: '',
                    type: 'bank',
                    balance: '',
                    monthlyLimit: '',
                    isDefault: false,
                    isLocked: false
                })
            }
        } catch (error) {
            toast.error('Failed to create wallet')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Wallet
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Wallet</DialogTitle>
                    <DialogDescription>
                        Create a new wallet to track your funds.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Wallet Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. City Bank"
                            value={data.name}
                            onChange={(e) => setData({ ...data, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={data.type}
                                onValueChange={(value) => setData({ ...data, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank">Bank Account</SelectItem>
                                    <SelectItem value="mobile">Mobile Wallet</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="balance">Current Balance</Label>
                            <Input
                                id="balance"
                                type="number"
                                placeholder="0.00"
                                value={data.balance}
                                onChange={(e) => setData({ ...data, balance: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="limit">Monthly Spending Limit (Optional)</Label>
                        <Input
                            id="limit"
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
                                    Creating...
                                </>
                            ) : (
                                'Create Wallet'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
