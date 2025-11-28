"use client"

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/custom/Navbar'

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const hideNavbar = ['/', '/login', '/signup', '/onboarding', '/forgot-password'].includes(pathname)

    return (
        <>
            {!hideNavbar && <Navbar />}
            <main className={!hideNavbar ? 'pb-16 md:pb-0' : ''}>
                {children}
            </main>
        </>
    )
}
