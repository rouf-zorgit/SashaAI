"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthSelectorProps {
    value: { year: number; month: number }
    onChange: (year: number, month: number) => void
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const handlePrevious = () => {
        const newMonth = value.month === 1 ? 12 : value.month - 1
        const newYear = value.month === 1 ? value.year - 1 : value.year
        onChange(newYear, newMonth)
    }

    const handleNext = () => {
        const newMonth = value.month === 12 ? 1 : value.month + 1
        const newYear = value.month === 12 ? value.year + 1 : value.year
        onChange(newYear, newMonth)
    }

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-semibold">
                    {monthNames[value.month - 1]} {value.year}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </Card>
    )
}
