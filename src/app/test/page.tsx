"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function TestPage() {
    const [status, setStatus] = useState<string>("Checking connection...")
    const supabase = createClient()

    useEffect(() => {
        async function checkConnection() {
            try {
                const { data, error } = await supabase.from("profiles").select("count").limit(1)
                if (error) {
                    setStatus(`Error: ${error.message}`)
                } else {
                    setStatus("Connected to Supabase successfully!")
                }
            } catch (e: any) {
                setStatus(`Exception: ${e.message}`)
            }
        }
        checkConnection()
    }, [])

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">System Verification</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Supabase Connection</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <Badge variant={status.includes("Success") ? "default" : "destructive"}>
                            {status}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>UI Components Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button>Primary Button</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="destructive">Destructive</Button>
                    </div>
                    <div className="max-w-sm">
                        <Input placeholder="Test input field..." />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
