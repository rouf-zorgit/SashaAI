"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, User, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    {
        name: 'Chat',
        href: '/chat',
        icon: MessageSquare,
    },
    {
        name: 'Profile',
        href: '/profile',
        icon: User,
    },
    {
        name: 'History',
        href: '/history',
        icon: Clock,
    },
]

export function Navbar() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop Navigation (Top) */}
            <nav className="hidden md:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                FinAI
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-accent text-accent-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation (Bottom) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                )}
                            >
                                <item.icon className={cn('h-6 w-6', isActive && 'fill-primary/20')} />
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}