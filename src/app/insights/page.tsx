'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, AlertTriangle, Calendar, Wallet, PiggyBank, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Pattern {
    type: string
    severity?: string
    insight: string
    recommendation?: string
    data?: any
}

export default function InsightsPage() {
    const [patterns, setPatterns] = useState<Pattern[]>([])
    const [loading, setLoading] = useState(false)
    const [analyzed, setAnalyzed] = useState(false)

    const analyzePatterns = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/analyze-patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            // Check for error in response
            if (!response.ok || data.error) {
                console.error('API Error:', data.error || 'Unknown error')
                throw new Error(data.error || 'Failed to analyze patterns')
            }

            if (data.patterns && data.patterns.length > 0) {
                setPatterns(data.patterns)
                setAnalyzed(true)
                toast.success('Analysis complete!')
            } else {
                toast.info(data.message || 'Not enough data to analyze patterns yet. Keep tracking!')
                setPatterns([])
                setAnalyzed(true)
            }
        } catch (error: any) {
            console.error('Analysis error:', error)
            toast.error(error.message || 'Failed to analyze patterns. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getPatternIcon = (type: string) => {
        switch (type) {
            case 'recurring_payment':
                return <Calendar className="h-5 w-5 text-blue-500" />
            case 'overspending':
                return <AlertTriangle className="h-5 w-5 text-red-500" />
            case 'unusual_activity':
                return <Zap className="h-5 w-5 text-yellow-500" />
            case 'weekend_pattern':
                return <TrendingUp className="h-5 w-5 text-purple-500" />
            case 'savings_rate':
                return <PiggyBank className="h-5 w-5 text-green-500" />
            default:
                return <Wallet className="h-5 w-5 text-gray-500" />
        }
    }

    const getPatternColor = (type: string) => {
        switch (type) {
            case 'recurring_payment':
                return 'border-blue-200 bg-blue-50/50'
            case 'overspending':
                return 'border-red-200 bg-red-50/50'
            case 'unusual_activity':
                return 'border-yellow-200 bg-yellow-50/50'
            case 'weekend_pattern':
                return 'border-purple-200 bg-purple-50/50'
            case 'savings_rate':
                return 'border-green-200 bg-green-50/50'
            default:
                return 'border-gray-200 bg-gray-50/50'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Financial Insights</h1>
                        <p className="text-muted-foreground">
                            Discover patterns in your spending and get smart recommendations
                        </p>
                    </div>
                    <Link href="/profile">
                        <Button variant="ghost">
                            Back to Profile
                        </Button>
                    </Link>
                </div>

                {/* Analyze Button */}
                {!analyzed && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Analyze Your Spending</CardTitle>
                            <CardDescription>
                                We'll analyze your last 90 days of transactions to find patterns,
                                recurring payments, and opportunities to save money.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={analyzePatterns}
                                disabled={loading}
                                size="lg"
                                className="w-full md:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Analyze My Spending
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Results */}
                {analyzed && (
                    <>
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">
                                {patterns.length > 0 ? 'Your Insights' : 'No Patterns Found Yet'}
                            </h2>
                            <Button
                                onClick={analyzePatterns}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Refresh'
                                )}
                            </Button>
                        </div>

                        {patterns.length === 0 ? (
                            <Alert>
                                <AlertDescription>
                                    Keep tracking your expenses! We need at least 10 transactions
                                    from the last 90 days to provide insights.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="grid gap-4">
                                {patterns.map((pattern, index) => (
                                    <Card
                                        key={index}
                                        className={`${getPatternColor(pattern.type)} transition-all hover:shadow-md`}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    {getPatternIcon(pattern.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg mb-2">
                                                        {pattern.type.split('_').map(word =>
                                                            word.charAt(0).toUpperCase() + word.slice(1)
                                                        ).join(' ')}
                                                    </CardTitle>
                                                    <CardDescription className="text-base text-foreground">
                                                        {pattern.insight}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        {pattern.recommendation && (
                                            <CardContent>
                                                <div className="bg-background/80 rounded-lg p-3 border">
                                                    <p className="text-sm font-medium mb-1">💡 Recommendation:</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {pattern.recommendation}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Info Card */}
                {!analyzed && (
                    <Card className="border-dashed">
                        <CardContent className="pt-6">
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">What insights will you get?</p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <Calendar className="h-4 w-4 mt-0.5 text-blue-500" />
                                        <span><strong>Recurring Payments:</strong> Automatic detection of subscriptions and monthly bills</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
                                        <span><strong>Overspending Alerts:</strong> Categories where you're exceeding your budget</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Zap className="h-4 w-4 mt-0.5 text-yellow-500" />
                                        <span><strong>Unusual Activity:</strong> Transactions that are significantly higher than normal</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <TrendingUp className="h-4 w-4 mt-0.5 text-purple-500" />
                                        <span><strong>Spending Patterns:</strong> When and how you spend money</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <PiggyBank className="h-4 w-4 mt-0.5 text-green-500" />
                                        <span><strong>Savings Rate:</strong> How much you're saving each month</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}