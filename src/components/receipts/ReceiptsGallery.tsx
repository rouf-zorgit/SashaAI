'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ReceiptUploadDialog } from './ReceiptUploadDialog'
import { BulkReceiptUploadDialog } from './BulkReceiptUploadDialog'
import { ReplaceReceiptDialog } from './ReplaceReceiptDialog'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteReceipt } from '@/app/actions/receipts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReceiptsGalleryProps {
    initialReceipts: any[]
    userId: string
}

// Helper function to get Supabase thumbnail URL
const getThumbnailUrl = (url: string, width: number = 400) => {
    // If it's a Supabase storage URL, add transformation parameters
    if (url.includes('supabase')) {
        const urlObj = new URL(url)
        urlObj.searchParams.set('width', width.toString())
        urlObj.searchParams.set('quality', '80')
        return urlObj.toString()
    }
    return url
}

export function ReceiptsGallery({ initialReceipts, userId }: ReceiptsGalleryProps) {
    const [receipts, setReceipts] = useState(initialReceipts)
    const [visibleReceipts, setVisibleReceipts] = useState<any[]>([])
    const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
    const router = useRouter()
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)
    const [page, setPage] = useState(1)
    const ITEMS_PER_PAGE = 12

    useEffect(() => {
        setReceipts(initialReceipts)
        setVisibleReceipts(initialReceipts.slice(0, ITEMS_PER_PAGE))
        setPage(1)
    }, [initialReceipts])

    // Virtual scrolling with Intersection Observer
    useEffect(() => {
        if (receipts.length <= ITEMS_PER_PAGE) return

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleReceipts.length < receipts.length) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [receipts, visibleReceipts])

    const loadMore = useCallback(() => {
        const nextPage = page + 1
        const startIndex = 0
        const endIndex = nextPage * ITEMS_PER_PAGE
        setVisibleReceipts(receipts.slice(startIndex, endIndex))
        setPage(nextPage)
    }, [page, receipts])

    const handleDelete = async (receipt: any) => {
        if (!confirm('Are you sure you want to delete this receipt image? The transaction will remain.')) return

        const result = await deleteReceipt(receipt.receipt_url)
        if (result.success) {
            toast.success('Receipt deleted')
            setReceipts(receipts.filter(r => r.id !== receipt.id))
            setVisibleReceipts(visibleReceipts.filter(r => r.id !== receipt.id))
            router.refresh()
        } else {
            toast.error('Failed to delete receipt')
        }
    }

    const handleReplace = (receipt: any) => {
        setSelectedReceipt(receipt)
        setReplaceDialogOpen(true)
    }

    const handleReplaceComplete = (newData: any) => {
        // Update the receipt in the list
        const updatedReceipts = receipts.map(r =>
            r.id === selectedReceipt.id
                ? { ...r, ...newData, receipt_url: newData.receiptUrl }
                : r
        )
        setReceipts(updatedReceipts)
        setVisibleReceipts(visibleReceipts.map(r =>
            r.id === selectedReceipt.id
                ? { ...r, ...newData, receipt_url: newData.receiptUrl }
                : r
        ))
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <ReceiptUploadDialog onSuccess={() => router.refresh()} />
                <BulkReceiptUploadDialog onComplete={() => router.refresh()} />
            </div>

            {receipts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">No receipts uploaded yet</p>
                    <div className="flex gap-2 justify-center">
                        <ReceiptUploadDialog onSuccess={() => router.refresh()} />
                        <BulkReceiptUploadDialog onComplete={() => router.refresh()} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleReceipts.map((receipt) => (
                            <Card key={receipt.id} className="overflow-hidden group relative">
                                <div className="aspect-[3/4] relative bg-muted">
                                    <Image
                                        src={getThumbnailUrl(receipt.receipt_url, 400)}
                                        alt={receipt.merchant_name || 'Receipt'}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        quality={80}
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => window.open(receipt.receipt_url, '_blank')}
                                            title="View Full Size"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => handleReplace(receipt)}
                                            title="Replace Receipt"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDelete(receipt)}
                                            title="Delete Receipt"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold truncate pr-2">{receipt.merchant_name || 'Unknown Merchant'}</h3>
                                        <span className="font-mono text-sm font-medium">{receipt.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{format(new Date(receipt.date || receipt.created_at), 'MMM d, yyyy')}</span>
                                        <span className="capitalize px-2 py-0.5 bg-muted rounded-full text-xs">{receipt.category}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Load more trigger */}
                    {visibleReceipts.length < receipts.length && (
                        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Loading more...</p>
                        </div>
                    )}

                    {visibleReceipts.length >= receipts.length && receipts.length > ITEMS_PER_PAGE && (
                        <p className="text-center text-sm text-muted-foreground">
                            All {receipts.length} receipts loaded
                        </p>
                    )}
                </>
            )}

            {selectedReceipt && (
                <ReplaceReceiptDialog
                    open={replaceDialogOpen}
                    onOpenChange={setReplaceDialogOpen}
                    currentReceipt={{
                        url: selectedReceipt.receipt_url,
                        merchant: selectedReceipt.merchant_name,
                        amount: selectedReceipt.amount,
                        date: selectedReceipt.date,
                        category: selectedReceipt.category
                    }}
                    onReplace={handleReplaceComplete}
                />
            )}
        </div>
    )
}
