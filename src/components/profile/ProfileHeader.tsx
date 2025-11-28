"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

interface Profile {
    full_name: string | null
    email: string
    currency: string
    monthly_salary: number | null
}

interface ProfileHeaderProps {
    profile: Profile
    onEdit?: () => void
}

export function ProfileHeader({ profile, onEdit }: ProfileHeaderProps) {
    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : profile.email[0].toUpperCase()

    return (
        <Card className="p-6">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {initials}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile.full_name || 'User'}</h2>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>💵 {profile.currency}</span>
                        {profile.monthly_salary && (
                            <span>💰 ${profile.monthly_salary.toLocaleString()}/month</span>
                        )}
                    </div>
                </div>
                {onEdit && (
                    <Button variant="outline" onClick={onEdit}>
                        Edit Profile
                    </Button>
                )}
            </div>
        </Card>
    )
}
