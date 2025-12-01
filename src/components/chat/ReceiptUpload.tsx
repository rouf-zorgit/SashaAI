"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReceiptUploadProps {
    userId: string
    onTransactionExtracted: (transaction: any) => void
}

export function ReceiptUpload({ userId, onTransactionExtracted }: ReceiptUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUpload = async () => {
        if (!preview) return

        setUploading(true)
        try {
            // Extract base64 data from preview
            const base64Data = preview.split(',')[1]

            // Call Next.js API Route
            const response = await fetch('/api/receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for auth
                body: JSON.stringify({
                    imageBase64: base64Data,
                }),
            })

            const result = await response.json()

            if (!result.success || result.error) {
                toast.error(result.error || 'Failed to process receipt')
                return
            }

            // Extract transaction from result
            const transaction = result.transaction
            if (transaction) {
                toast.success(`Receipt processed! ${transaction.merchant} - ${transaction.currency} ${transaction.amount}`)
                onTransactionExtracted(transaction)

                // Clear preview
                setPreview(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            } else {
                toast.error('Could not extract transaction from receipt')
            }
        } catch (error) {
            console.error('Receipt upload error:', error)
            toast.error('Failed to process receipt. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleCancel = () => {
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="space-y-4">
            {!preview ? (
                <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">Upload Receipt Image</p>
                    <p className="text-xs text-muted-foreground mb-4">
                        Click to select or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG up to 5MB
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <Card className="p-4 space-y-4">
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Receipt preview"
                            className="w-full h-auto max-h-96 object-contain rounded-lg"
                        />
                        <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={handleCancel}
                            disabled={uploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex-1"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Process Receipt
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}
