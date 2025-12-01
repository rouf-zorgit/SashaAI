'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Camera, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image-compression'
import { extractReceiptData, replaceReceipt } from '@/app/actions/receipts'
import { Card } from '@/components/ui/card'

interface ReplaceReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentReceipt: {
        url: string
        merchant?: string
        amount?: number
        date?: string
        category?: string
    }
    onReplace: (newData: any) => void
}

export function ReplaceReceiptDialog({
    open,
    onOpenChange,
    currentReceipt,
    onReplace
}: ReplaceReceiptDialogProps) {
    const [uploading, setUploading] = useState(false)
    const [newReceiptPreview, setNewReceiptPreview] = useState<string | null>(null)
    const [newData, setNewData] = useState<any>(null)
    const [showComparison, setShowComparison] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large. Max 10MB.')
            return
        }

        setUploading(true)

        try {
            // Show preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setNewReceiptPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)

            // Compress
            const compressedFile = await compressImage(file)

            // Upload and replace
            const formData = new FormData()
            formData.append('file', compressedFile)

            const uploadResult = await replaceReceipt(currentReceipt.url, formData)
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed')
            }

            // TypeScript now knows uploadResult has url and path
            const { url: newReceiptUrl, path: newReceiptPath } = uploadResult as { success: true; url: string; path: string }

            // Extract new data
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => {
                    const result = reader.result as string
                    const base64Data = result.split(',')[1]
                    resolve(base64Data)
                }
                reader.onerror = reject
                reader.readAsDataURL(compressedFile)
            })

            const extractResult = await extractReceiptData(base64, compressedFile.type)

            if (extractResult.success) {
                setNewData({
                    ...extractResult.data,
                    receiptUrl: newReceiptUrl,
                    receiptPath: newReceiptPath
                })
                setShowComparison(true)
            } else {
                toast.error('Could not extract data from new receipt')
            }
        } catch (error: any) {
            console.error('Replace error:', error)
            toast.error(error.message || 'Failed to replace receipt')
            setNewReceiptPreview(null)
        } finally {
            setUploading(false)
        }
    }

    const handleConfirmReplace = () => {
        if (newData) {
            onReplace(newData)
            toast.success('Receipt replaced successfully')
            onOpenChange(false)
            resetState()
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
        resetState()
    }

    const resetState = () => {
        setNewReceiptPreview(null)
        setNewData(null)
        setShowComparison(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Replace Receipt</DialogTitle>
                </DialogHeader>

                {!showComparison ? (
                    <div className="space-y-4">
                        {/* Current Receipt */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Current Receipt</h3>
                            <Card className="p-4">
                                <div className="flex gap-4">
                                    <img
                                        src={currentReceipt.url}
                                        alt="Current receipt"
                                        className="w-32 h-32 object-cover rounded"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{currentReceipt.merchant || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Amount: {currentReceipt.amount || 'N/A'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Date: {currentReceipt.date || 'N/A'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Category: {currentReceipt.category || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Upload New */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Upload New Receipt</h3>
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[150px]"
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                {uploading ? (
                                    <div className="space-y-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                        <p className="text-sm font-medium">Processing new receipt...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                                            <Camera className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="text-lg font-medium mb-2">Click to upload new receipt</p>
                                        <p className="text-sm text-muted-foreground">
                                            JPG, PNG, WEBP up to 10MB
                                        </p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Compare Data</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Old Data */}
                            <Card className="p-4">
                                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Current Data</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Merchant:</span> {currentReceipt.merchant || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Amount:</span> {currentReceipt.amount || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Date:</span> {currentReceipt.date || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Category:</span> {currentReceipt.category || 'N/A'}
                                    </div>
                                </div>
                            </Card>

                            {/* New Data */}
                            <Card className="p-4 border-primary">
                                <h4 className="font-medium mb-3 text-sm text-primary">New Data</h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Merchant:</span> {newData?.merchant || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Amount:</span> {newData?.amount || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Date:</span> {newData?.date || 'N/A'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Category:</span> {newData?.category || 'N/A'}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Image Comparison */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Old Receipt</p>
                                <img
                                    src={currentReceipt.url}
                                    alt="Old receipt"
                                    className="w-full h-48 object-contain border rounded"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">New Receipt</p>
                                <img
                                    src={newReceiptPreview || ''}
                                    alt="New receipt"
                                    className="w-full h-48 object-contain border rounded border-primary"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} disabled={uploading}>
                        Cancel
                    </Button>
                    {showComparison && (
                        <Button onClick={handleConfirmReplace}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Confirm Replace
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
