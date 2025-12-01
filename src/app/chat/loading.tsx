import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header Skeleton */}
            <div className="border-b p-4">
                <div className="flex items-center gap-3 max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </div>

            {/* Messages Skeleton */}
            <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
                <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-20 w-[60%] rounded-lg" />
                </div>
                <div className="flex gap-3 flex-row-reverse">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-12 w-[40%] rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-24 w-[70%] rounded-lg" />
                </div>
            </div>

            {/* Input Skeleton */}
            <div className="p-4 border-t">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-12 w-full rounded-full" />
                </div>
            </div>
        </div>
    )
}
