'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Lazy load the ReceiptsGallery component
const ReceiptsGallery = dynamic(
    () => import('@/components/receipts/ReceiptsGallery').then(mod => ({ default: mod.ReceiptsGallery })),
    {
        loading: () => (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
            </div>
        ),
        ssr: false
    }
)

export default function ReceiptsPage() {
    const [userId, setUserId] = useState<string | null>(null)
    const [receipts, setReceipts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserId(user.id)

                // Fetch receipts
                const { data: receiptsData } = await supabase
                    .from('receipts')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                setReceipts(receiptsData || [])
            }

            setLoading(false)
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">My Receipts</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="container mx-auto p-4">
                <p>Please log in to view receipts</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">My Receipts</h1>
            <ReceiptsGallery userId={userId} initialReceipts={receipts} />
        </div>
    )
}