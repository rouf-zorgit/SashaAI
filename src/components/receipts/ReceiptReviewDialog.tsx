'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { WalletPicker } from '@/components/wallet/WalletPicker'
import { toast } from 'sonner'
import { deleteReceipt } from '@/app/actions/receipts'
import { getWallets, Wallet } from '@/app/actions/wallet'
import { saveReceiptTransaction } from '@/app/actions/transactions'
import { FundingSourceDialog } from '@/components/dialogs/FundingSourceDialog'
import type { InsufficientFundsError } from '@/app/actions/insufficient-funds'

interface ReceiptReviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: any
    receiptUrl: string
    receiptPath: string
    onSave: (savedTransaction: any) => void
    onCancel: () => void
}

export function ReceiptReviewDialog({
    open,
    onOpenChange,
    data,
    receiptUrl,
    receiptPath,
    onSave,
    onCancel
}: ReceiptReviewDialogProps) {
    const [loading, setLoading] = useState(false)
    const [wallets, setWallets] = useState<Wallet[]>([])
    const [showFundingDialog, setShowFundingDialog] = useState(false)
    const [insufficientFundsError, setInsufficientFundsError] = useState<InsufficientFundsError | null>(null)
    const [formData, setFormData] = useState({
        amount: data.amount?.toString() || '',
        merchant: data.merchant || '',
        date: data.date || new Date().toISOString().split('T')[0],
        category: data.category || 'other',  // ✅ FIXED: lowercase default
        description: data.items ? data.items.join(', ') : '',
        walletId: ''
    })

    useEffect(() => {
        if (open) {
            // Fetch wallets
            getWallets().then(w => {
                setWallets(w)
                // Set default wallet
                const defaultWallet = w.find(wallet => wallet.is_default)
                if (defaultWallet) {
                    setFormData(prev => ({ ...prev, walletId: defaultWallet.id }))
                } else if (w.length > 0) {
                    setFormData(prev => ({ ...prev, walletId: w[0].id }))
                }
            })

            // Update form data if data prop changes
            setFormData(prev => ({
                ...prev,
                amount: data.amount?.toString() || '',
                merchant: data.merchant || '',
                date: data.date || new Date().toISOString().split('T')[0],
                category: data.category || 'other',  // ✅ FIXED: lowercase default
                description: data.items ? data.items.join(', ') : '',
            }))
        }
    }, [open, data])

    const handleSave = async () => {
        if (!formData.amount || !formData.walletId) {
            toast.error('Please fill in amount and select a wallet')
            return
        }

        setLoading(true)
        try {
            // ✅ FIXED: Convert date to ISO datetime format (YYYY-MM-DDT00:00:00Z)
            const dateTime = new Date(formData.date + 'T00:00:00Z').toISOString()
            
            const result = await saveReceiptTransaction({
                amount: parseFloat(formData.amount),
                category: formData.category,
                description: formData.description || `Receipt from ${formData.merchant}`,
                date: dateTime,  // ✅ Now in correct ISO format
                receiptUrl: receiptUrl,
                walletId: formData.walletId,
                merchant: formData.merchant
            }) as any  // ✅ Type assertion to handle dynamic error response

            // Check for insufficient funds error
            if (result.error === 'insufficient_funds' && result.insufficientFundsData) {
                setInsufficientFundsError(result.insufficientFundsData)
                setShowFundingDialog(true)
                setLoading(false)
                return
            }

            if (result.error) {
                toast.error(result.error)
                return
            }

            if (result.warning) {
                toast.warning(result.warning)
            } else {
                toast.success('Receipt saved successfully')
            }

            onSave(result.transaction)
            onOpenChange(false)
        } catch (error: any) {
            console.error('Receipt save error:', error)
            toast.error(error.message || 'Failed to save receipt')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        // Delete the uploaded image
        if (receiptPath) {
            await deleteReceipt(receiptPath)
        }
        onCancel()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleCancel()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review Receipt</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Preview */}
                    <div className="relative rounded-lg overflow-hidden border bg-muted/50 flex items-center justify-center min-h-[300px]">
                        {receiptUrl ? (
                            <img
                                src={receiptUrl}
                                alt="Receipt"
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Loading image...</p>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Merchant</Label>
                            <Input
                                value={formData.merchant}
                                onChange={e => setFormData({ ...formData, merchant: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={val => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="groceries">Groceries</SelectItem>
                                    <SelectItem value="dining">Dining</SelectItem>
                                    <SelectItem value="transport">Transport</SelectItem>
                                    <SelectItem value="shopping">Shopping</SelectItem>
                                    <SelectItem value="entertainment">Entertainment</SelectItem>
                                    <SelectItem value="healthcare">Healthcare</SelectItem>
                                    <SelectItem value="bills">Bills & Utilities</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <WalletPicker
                            wallets={wallets}
                            value={formData.walletId}
                            onValueChange={val => setFormData({ ...formData, walletId: val })}
                            label="Wallet"
                        />

                        <div className="space-y-2">
                            <Label>Notes / Items</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Transaction
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Insufficient Funds Dialog */}
            {insufficientFundsError && (
                <FundingSourceDialog
                    open={showFundingDialog}
                    onOpenChange={setShowFundingDialog}
                    error={insufficientFundsError}
                    availableWallets={wallets.map(w => ({
                        id: w.id,
                        name: w.name,
                        balance: w.balance
                    }))}
                    onSuccess={() => {
                        // Retry saving the transaction after funding source is added
                        handleSave()
                    }}
                />
            )}
        </Dialog>
    )
}