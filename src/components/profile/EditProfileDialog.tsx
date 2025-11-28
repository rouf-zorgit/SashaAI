'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/profile/actions'
import { useRouter } from 'next/navigation'

interface Profile {
    id: string
    full_name: string | null
    email: string
    currency: string
    monthly_salary: number | null
}

interface EditProfileDialogProps {
    profile: Profile
}

const currencies = [
    { value: 'USD', label: '🇺🇸 USD - US Dollar' },
    { value: 'EUR', label: '🇪🇺 EUR - Euro' },
    { value: 'GBP', label: '🇬🇧 GBP - British Pound' },
    { value: 'JPY', label: '🇯🇵 JPY - Japanese Yen' },
    { value: 'AUD', label: '🇦🇺 AUD - Australian Dollar' },
    { value: 'CAD', label: '🇨🇦 CAD - Canadian Dollar' },
    { value: 'CHF', label: '🇨🇭 CHF - Swiss Franc' },
    { value: 'CNY', label: '🇨🇳 CNY - Chinese Yuan' },
    { value: 'INR', label: '🇮🇳 INR - Indian Rupee' },
    { value: 'BDT', label: '🇧🇩 BDT - Bangladeshi Taka' },
]

export function EditProfileDialog({ profile }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currency, setCurrency] = useState(profile.currency)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('currency', currency)

        const result = await updateProfile(formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success(result.message || 'Profile updated!')
            setOpen(false)
            router.refresh()
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            defaultValue={profile.full_name || ''}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={profile.email}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Changing email requires verification
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                            value={currency}
                            onValueChange={setCurrency}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((curr) => (
                                    <SelectItem key={curr.value} value={curr.value}>
                                        {curr.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="monthly_salary">Monthly Salary (Optional)</Label>
                        <Input
                            id="monthly_salary"
                            name="monthly_salary"
                            type="number"
                            step="0.01"
                            defaultValue={profile.monthly_salary || ''}
                            placeholder="50000"
                            disabled={loading}
                        />
                    </div>

                    <div className="border-t pt-4 space-y-4">
                        <h4 className="text-sm font-medium">Change Password (Optional)</h4>

                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                                id="new_password"
                                name="new_password"
                                type="password"
                                placeholder="Leave blank to keep current"
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm Password</Label>
                            <Input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                placeholder="Confirm new password"
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
