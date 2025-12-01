"use client"

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

interface MenuCardProps {
    icon: ReactNode
    title: string
    description: string
    href: string
    badge?: number
}

export function MenuCard({ icon, title, description, href, badge }: MenuCardProps) {
    return (
        <Link href={href}>
            <Card className="p-4 mb-3 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">{icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{title}</h3>
                            {badge !== undefined && badge > 0 && (
                                <Badge variant="secondary">{badge}</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </Card>
        </Link>
    )
}
