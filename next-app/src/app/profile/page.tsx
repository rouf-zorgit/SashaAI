"use client"

import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, Mail, DollarSign, Globe } from 'lucide-react'

export default function ProfilePage() {
    const { user, profile, loading } = useAuthStore()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Not authenticated</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Profile</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Full Name</p>
                                <p className="font-medium">{profile.full_name || 'Not set'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{profile.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Currency</p>
                                <Badge variant="secondary">{profile.currency || 'Not set'}</Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                                <p className="font-medium">
                                    {profile.monthly_salary
                                        ? `${profile.currency} ${profile.monthly_salary.toLocaleString()}`
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>

                        {profile.primary_goal && (
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 flex items-center justify-center text-muted-foreground">
                                    🎯
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Primary Goal</p>
                                    <p className="font-medium">{profile.primary_goal}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
