"use client"

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/custom/Navbar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const hideNavbar = ['/', '/login', '/signup', '/onboarding', '/forgot-password'].includes(pathname)
    const isChatPage = pathname === '/chat'

    return (
        <>
            {!hideNavbar && <Navbar />}
            <main className={isChatPage ? 'h-[calc(100vh-4rem)] overflow-hidden' : (!hideNavbar ? 'pb-16 md:pb-0' : '')}>
                {children}
            </main>
        </>
    )
}
