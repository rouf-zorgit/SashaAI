"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Moon, Sun, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [exporting, setExporting] = useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    useState(() => {
        setMounted(true)
    })

    const handleExport = async () => {
        setExporting(true)
        try {
            const response = await fetch('/api/export')

            if (!response.ok) {
                throw new Error('Failed to export data')
            }

            // Get the CSV content
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            // Create a download link
            const a = document.createElement('a')
            a.href = url
            a.download = `finai-export-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Data exported successfully!')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Failed to export data. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    if (!mounted) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="theme">Theme</Label>
                                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                            </div>
                            <Select value={theme} onValueChange={setTheme}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">
                                        <div className="flex items-center gap-2">
                                            <Sun className="h-4 w-4" />
                                            Light
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="dark">
                                        <div className="flex items-center gap-2">
                                            <Moon className="h-4 w-4" />
                                            Dark
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Data</h2>
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <>Exporting...</>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export All Data
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            Download all your financial data (transactions, goals, reminders, chat history) as a CSV file
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">About</h2>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>FinAI - Smart Finance Tracking</p>
                        <p>Version 1.0.0</p>
                        <p>Built with Next.js, Supabase, and Claude AI</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
