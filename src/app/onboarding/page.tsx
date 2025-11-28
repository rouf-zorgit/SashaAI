"use client"

import { useState } from 'react'
import { completeOnboarding } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, DollarSign, Target, Loader2, AlertCircle } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currency, setCurrency] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('currency', currency)

        const result = await completeOnboarding(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // If no error, redirect will happen automatically
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Welcome to FinAI! 🎉</CardTitle>
                    <CardDescription>Let's personalize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2 border border-destructive/20">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium">
                                Full Name <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="currency" className="text-sm font-medium">
                                Preferred Currency <span className="text-destructive">*</span>
                            </label>
                            <Select value={currency} onValueChange={setCurrency} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your currency" />
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
                            <label htmlFor="monthlySalary" className="text-sm font-medium">
                                Monthly Salary <span className="text-muted-foreground text-xs">(Optional)</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="monthlySalary"
                                    name="monthlySalary"
                                    type="number"
                                    placeholder="5000"
                                    min="0"
                                    step="0.01"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="primaryGoal" className="text-sm font-medium">
                                Savings Goal <span className="text-muted-foreground text-xs">(Optional)</span>
                            </label>
                            <div className="relative">
                                <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="primaryGoal"
                                    name="primaryGoal"
                                    type="text"
                                    placeholder="e.g., Save for vacation, Buy a car"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading || !currency}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                'Complete Setup'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
