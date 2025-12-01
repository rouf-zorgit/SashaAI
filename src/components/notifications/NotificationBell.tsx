'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { NotificationList } from './NotificationList'
import { createClient } from '@/lib/supabase/client'
import { markAllNotificationsRead } from '@/app/actions/notifications'

interface NotificationBellProps {
    userId: string
    initialUnreadCount: number
}

export function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const supabase = createClient()

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open)
        if (open && unreadCount > 0) {
            // Optimistically clear count
            setUnreadCount(0)
            await markAllNotificationsRead()
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <NotificationList userId={userId} />
            </PopoverContent>
        </Popover>
    )
}
