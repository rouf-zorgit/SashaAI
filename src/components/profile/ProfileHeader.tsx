"use client"

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/currency'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { EditProfileDialog } from './EditProfileDialog'

interface Profile {
    id: string
    full_name: string | null
    email: string
    currency: string
    monthly_salary: number | null
    avatar_url?: string | null
}

interface ProfileHeaderProps {
    profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start gap-4">
                <ProfilePictureUpload
                    userId={profile.id}
                    currentAvatarUrl={profile.avatar_url}
                    userName={profile.full_name || profile.email}
                />
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">{profile.full_name || 'User'}</h2>
                    <p className="text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>💵 {profile.currency}</span>
                        {profile.monthly_salary && (
                            <span>💰 {formatCurrency(profile.monthly_salary, profile.currency)}/month</span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <EditProfileDialog profile={profile} />
                </div>
            </div>
        </Card>
    )
}
