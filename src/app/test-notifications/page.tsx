'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestNotificationsPage() {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<any>(null)
    const router = useRouter()

    const runAllChecks = async () => {
        setLoading(true)
        setResults(null)

        try {
            const response = await fetch('/api/run-notification-checks', {
                method: 'POST'
            })

            const data = await response.json()

            if (data.success) {
                setResults({ success: true, message: 'All checks completed successfully!' })
                toast.success('Notification checks completed! Check History → Notifications')

                // Refresh after 2 seconds
                setTimeout(() => {
                    router.push('/history')
                }, 2000)
            } else {
                setResults({ success: false, message: data.error || 'Failed to run checks' })
                toast.error('Failed to run notification checks')
            }
        } catch (error: any) {
            console.error('Error:', error)
            setResults({ success: false, message: error.message })
            toast.error('Error running notification checks')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Test Notification System</h1>
                    <p className="text-muted-foreground">
                        Run Sasha's intelligent notification checks manually
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>🔍 Run Notification Analysis</CardTitle>
                        <CardDescription>
                            This will run all 4 notification checks for your account:
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="text-red-500">🔴</span>
                                <div>
                                    <strong>The Strict Auditor</strong>
                                    <p className="text-muted-foreground">Checks if you've exceeded category budgets</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-green-500">🟢</span>
                                <div>
                                    <strong>The Goal Keeper</strong>
                                    <p className="text-muted-foreground">Monitors goal progress and deadlines</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-500">🟡</span>
                                <div>
                                    <strong>The Forecaster</strong>
                                    <p className="text-muted-foreground">Predicts upcoming bills (3-day window)</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500">🔵</span>
                                <div>
                                    <strong>Unusual Spending Detector</strong>
                                    <p className="text-muted-foreground">Flags abnormally high transactions</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={runAllChecks}
                            disabled={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Running Analysis...
                                </>
                            ) : (
                                <>
                                    🔍 Run All Checks
                                </>
                            )}
                        </Button>

                        {results && (
                            <div className={`p-4 rounded-lg border ${results.success
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                                : 'bg-red-50 border-red-200 dark:bg-red-950/20'
                                }`}>
                                <div className="flex items-start gap-2">
                                    {results.success ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    )}
                                    <div>
                                        <p className={`font-medium ${results.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                                            }`}>
                                            {results.message}
                                        </p>
                                        {results.success && (
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Redirecting to History page...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>📊 Weekly Summary</CardTitle>
                        <CardDescription>
                            Generate a comprehensive weekly financial report
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={async () => {
                                const loadingToast = toast.loading('Generating weekly summary...')
                                try {
                                    const response = await fetch('/api/generate-weekly-summary', {
                                        method: 'POST'
                                    })

                                    const data = await response.json()

                                    if (data.success) {
                                        toast.success('Weekly summary generated!', { id: loadingToast })
                                        setTimeout(() => router.push('/history'), 1000)
                                    } else {
                                        toast.error(data.error || 'Failed to generate summary', { id: loadingToast })
                                    }
                                } catch (error) {
                                    console.error('Error:', error)
                                    toast.error('Failed to generate summary', { id: loadingToast })
                                }
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            📈 Generate Weekly Summary
                        </Button>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/history')}
                    >
                        ← Back to History
                    </Button>
                </div>
            </div>
        </div>
    )
}
