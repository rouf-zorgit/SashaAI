'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, CheckCircle2, XCircle, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image-compression'
import { extractReceiptData, uploadReceipt, checkRateLimit } from '@/app/actions/receipts'
import { Progress } from '@/components/ui/progress'

interface BulkUploadResult {
    file: File
    status: 'pending' | 'processing' | 'success' | 'error'
    data?: any
    receiptUrl?: string
    receiptPath?: string
    error?: string
}

interface BulkReceiptUploadDialogProps {
    trigger?: React.ReactNode
    onComplete?: (results: BulkUploadResult[]) => void
}

export function BulkReceiptUploadDialog({ trigger, onComplete }: BulkReceiptUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState<BulkUploadResult[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Check rate limit
        const rateLimit = await checkRateLimit()
        if (!rateLimit.allowed) {
            toast.error(`Daily limit reached. You have ${rateLimit.remaining} receipts remaining today.`)
            return
        }

        if (files.length > rateLimit.remaining) {
            toast.error(`You can only upload ${rateLimit.remaining} more receipts today.`)
            return
        }

        // Initialize results
        const initialResults: BulkUploadResult[] = files.map(file => ({
            file,
            status: 'pending'
        }))
        setResults(initialResults)
        setCurrentIndex(0)
        setUploading(true)

        // Process files sequentially
        await processFiles(files, initialResults)
    }

    const processFiles = async (files: File[], initialResults: BulkUploadResult[]) => {
        const updatedResults = [...initialResults]

        for (let i = 0; i < files.length; i++) {
            setCurrentIndex(i)
            updatedResults[i].status = 'processing'
            setResults([...updatedResults])

            try {
                const file = files[i]

                // Validate
                if (!file.type.startsWith('image/')) {
                    throw new Error('Not an image file')
                }

                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('File too large (max 10MB)')
                }

                // Compress
                const compressedFile = await compressImage(file)

                // Upload
                const formData = new FormData()
                formData.append('file', compressedFile)
                const uploadResult = await uploadReceipt(formData)

                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error(uploadResult.error || 'Upload failed')
                }

                // Extract data
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

                updatedResults[i] = {
                    ...updatedResults[i],
                    status: 'success',
                    data: extractResult.success ? extractResult.data : {},
                    receiptUrl: uploadResult.url,
                    receiptPath: uploadResult.path
                }
            } catch (error: any) {
                updatedResults[i] = {
                    ...updatedResults[i],
                    status: 'error',
                    error: error.message || 'Processing failed'
                }
            }

            setResults([...updatedResults])
        }

        setUploading(false)

        // Show summary
        const successCount = updatedResults.filter(r => r.status === 'success').length
        const errorCount = updatedResults.filter(r => r.status === 'error').length

        if (successCount > 0) {
            toast.success(`${successCount} receipt${successCount > 1 ? 's' : ''} processed successfully!`)
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} receipt${errorCount > 1 ? 's' : ''} failed to process`)
        }

        if (onComplete) {
            onComplete(updatedResults)
        }
    }

    const handleClose = () => {
        if (!uploading) {
            setOpen(false)
            setResults([])
            setCurrentIndex(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const progress = results.length > 0 ? ((currentIndex + 1) / results.length) * 100 : 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Bulk Upload
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Receipt Upload</DialogTitle>
                </DialogHeader>

                {results.length === 0 ? (
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                            <Camera className="h-8 w-8 text-primary" />
                        </div>
                        <p className="text-lg font-medium mb-2">Select multiple receipts</p>
                        <p className="text-sm text-muted-foreground">
                            You can upload up to 20 receipts at once
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Processing {currentIndex + 1} of {results.length}</span>
                                <span>{successCount} success, {errorCount} failed</span>
                            </div>
                            <Progress value={progress} />
                        </div>

                        {/* Results List */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 border rounded-lg"
                                >
                                    {result.status === 'pending' && (
                                        <div className="w-5 h-5 rounded-full border-2 border-muted" />
                                    )}
                                    {result.status === 'processing' && (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    )}
                                    {result.status === 'success' && (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                    {result.status === 'error' && (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{result.file.name}</p>
                                        {result.status === 'success' && result.data && (
                                            <p className="text-xs text-muted-foreground">
                                                {result.data.merchant} - {result.data.currency} {result.data.amount}
                                            </p>
                                        )}
                                        {result.status === 'error' && (
                                            <p className="text-xs text-red-500">{result.error}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={uploading}
                            >
                                {uploading ? 'Processing...' : 'Close'}
                            </Button>
                            {!uploading && successCount > 0 && (
                                <Button onClick={() => {
                                    // Navigate to review page or handle success results
                                    handleClose()
                                }}>
                                    Review {successCount} Receipt{successCount > 1 ? 's' : ''}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
