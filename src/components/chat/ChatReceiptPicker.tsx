'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image-compression'
import { extractReceiptData, uploadReceipt } from '@/app/actions/receipts'
import { ReceiptReviewDialog } from '@/components/receipts/ReceiptReviewDialog'
import { ErrorMessages } from '@/lib/error-messages'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatReceiptPickerProps {
    onSuccess?: (data?: any) => void
    disabled?: boolean
}

export function ChatReceiptPicker({ onSuccess, disabled }: ChatReceiptPickerProps) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)

    // Review state
    const [reviewOpen, setReviewOpen] = useState(false)
    const [reviewData, setReviewData] = useState<any>(null)
    const [receiptUrl, setReceiptUrl] = useState<string>('')
    const [receiptPath, setReceiptPath] = useState<string>('')

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
        // Reset input
        e.target.value = ''
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
        const loadingToast = toast.loading('Processing receipt...')

        try {
            const compressedFile = await compressImage(file)

            const formData = new FormData()
            formData.append('file', compressedFile)

            const uploadResult = await uploadReceipt(formData)
            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || ErrorMessages.receipt.uploadFailed)
            }

            setReceiptUrl(uploadResult.url)
            setReceiptPath(uploadResult.path!)

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

            setReviewOpen(true)
            toast.dismiss(loadingToast)

        } catch (error: any) {
            console.error('Receipt processing error:', error)
            toast.error(error.message || ErrorMessages.receipt.uploadFailed)
            toast.dismiss(loadingToast)
        } finally {
            setUploading(false)
        }
    }

    const handleReviewSave = (savedTx: any) => {
        setReviewOpen(false)
        if (onSuccess) onSuccess(savedTx)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 flex-shrink-0 cursor-pointer"
                        disabled={disabled || uploading}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Camera className="h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                    <DropdownMenuItem onClick={() => cameraInputRef.current?.click()} className="cursor-pointer">
                        <Camera className="mr-2 h-4 w-4" />
                        Open Camera
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Open Gallery
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden Inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            <ReceiptReviewDialog
                open={reviewOpen}
                onOpenChange={setReviewOpen}
                data={reviewData || {}}
                receiptUrl={receiptUrl}
                receiptPath={receiptPath}
                onSave={handleReviewSave}
                onCancel={() => setReviewOpen(false)}
            />
        </>
    )
}
