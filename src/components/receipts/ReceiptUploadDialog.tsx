'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image-compression'
import { extractReceiptData, uploadReceipt, checkRateLimit } from '@/app/actions/receipts'
import { ReceiptReviewDialog } from './ReceiptReviewDialog'
import { ErrorMessages } from '@/lib/error-messages'

interface ReceiptUploadDialogProps {
    trigger?: React.ReactNode
    onSuccess?: (data?: any) => void
}

export function ReceiptUploadDialog({ trigger, onSuccess }: ReceiptUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [processingStep, setProcessingStep] = useState<string>('')
    const [rateLimit, setRateLimit] = useState<{ remaining: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Review state
    const [reviewOpen, setReviewOpen] = useState(false)
    const [reviewData, setReviewData] = useState<any>(null)
    const [receiptUrl, setReceiptUrl] = useState<string>('')
    const [receiptPath, setReceiptPath] = useState<string>('')

    // Check rate limit when dialog opens
    useEffect(() => {
        if (open) {
            checkRateLimit().then(limit => setRateLimit(limit))
        }
    }, [open])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
    }

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(ErrorMessages.receipt.invalidFile)
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error(ErrorMessages.receipt.fileTooLarge)
            return
        }

        setUploading(true)
        setProcessingStep('Compressing image...')

        try {
            const compressedFile = await compressImage(file)

            setProcessingStep('Uploading to secure storage...')
            const formData = new FormData()
            formData.append('file', compressedFile)

            const uploadResult = await uploadReceipt(formData)
            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || ErrorMessages.receipt.uploadFailed)
            }

            setReceiptUrl(uploadResult.url)
            setReceiptPath(uploadResult.path!)

            setProcessingStep('Analyzing receipt with AI...')

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

            if (!extractResult.success) {
                console.error('Receipt extraction error:', extractResult.error)
                toast.error(extractResult.error || ErrorMessages.receipt.extractionFailed)
                setReviewData({})
            } else {
                setReviewData(extractResult.data)
            }

            setOpen(false)
            setReviewOpen(true)

        } catch (error: any) {
            console.error('Receipt processing error:', error)
            toast.error(error.message || ErrorMessages.receipt.uploadFailed)
        } finally {
            setUploading(false)
            setProcessingStep('')
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleReviewSave = (savedTx: any) => {
        setReviewOpen(false)
        if (onSuccess) onSuccess(savedTx)
    }

    const handleReviewCancel = () => {
        setReviewOpen(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || (
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Receipt
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Receipt</DialogTitle>
                        {rateLimit && (
                            <p className="text-sm text-muted-foreground">
                                {rateLimit.remaining} receipts remaining today
                            </p>
                        )}
                    </DialogHeader>

                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                                <p className="text-sm font-medium">{processingStep}</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <Camera className="h-8 w-8 text-primary" />
                                </div>
                                <p className="text-lg font-medium mb-2">Click to upload or drag & drop</p>
                                <p className="text-sm text-muted-foreground">
                                    Supports JPG, PNG, WEBP
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
                </DialogContent>
            </Dialog>

            <ReceiptReviewDialog
                open={reviewOpen}
                onOpenChange={setReviewOpen}
                data={reviewData || {}}
                receiptUrl={receiptUrl}
                receiptPath={receiptPath}
                onSave={handleReviewSave}
                onCancel={handleReviewCancel}
            />
        </>
    )
}
