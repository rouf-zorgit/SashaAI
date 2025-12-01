"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Check, Wallet, PiggyBank, CreditCard, DollarSign, User } from 'lucide-react'
import { completeOnboarding } from '@/app/auth/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface OnboardingData {
    fullName: string
    country: string
    monthlySalary: string
    currentBalance: string
    savings: string
    loans: string
}

export function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [data, setData] = useState<OnboardingData>({
        fullName: '',
        country: '',
        monthlySalary: '',
        currentBalance: '',
        savings: '',
        loans: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const updateData = (key: keyof OnboardingData, value: string) => {
        setData(prev => ({ ...prev, [key]: value }))
    }

    const handleNext = () => {
        if (step < 5) {
            setStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleSkip = () => {
        if (step < 5) {
            setStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleSubmit = async () => {
        if (!data.monthlySalary) {
            toast.error('Monthly salary is required')
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                full_name: data.fullName,
                country: data.country,
                monthly_salary: parseFloat(data.monthlySalary),
                current_balance: data.currentBalance ? parseFloat(data.currentBalance) : undefined,
                savings_amount: data.savings ? parseFloat(data.savings) : undefined,
                total_loans: data.loans ? parseFloat(data.loans) : undefined,
                currency: 'BDT'
            }
            console.log('Sending onboarding payload:', payload)

            const result = await completeOnboarding(payload)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profile setup complete!')
                router.push('/profile')
            }
        } catch (error) {
            console.error('Onboarding error:', error)
            toast.error('Failed to complete setup')
        } finally {
            setIsLoading(false)
        }
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    return (
        <div className="max-w-md w-full mx-auto p-6">
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 mx-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    Step {step} of 5
                </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                {step === 1 && (
                    <motion.div
                        key="step1"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ opacity: { duration: 0.2 } }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Welcome to FinAI! 🎉</h2>
                            <p className="text-muted-foreground">Let's get to know you better.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="e.g. John Doe"
                                    value={data.fullName}
                                    onChange={(e) => updateData('fullName', e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={data.country}
                                    onValueChange={(value) => updateData('country', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                                        <SelectItem value="USA">United States</SelectItem>
                                        <SelectItem value="UK">United Kingdom</SelectItem>
                                        <SelectItem value="Canada">Canada</SelectItem>
                                        <SelectItem value="Australia">Australia</SelectItem>
                                        <SelectItem value="India">India</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleNext}
                                disabled={!data.fullName || !data.country}
                            >
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ opacity: { duration: 0.2 } }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">What's your monthly salary?</h2>
                            <p className="text-muted-foreground">This helps me understand your earning pattern.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="salary">Monthly Salary (৳)</Label>
                                <Input
                                    id="salary"
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={data.monthlySalary}
                                    onChange={(e) => updateData('monthlySalary', e.target.value)}
                                    className="text-lg"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    This doesn't mean you have this amount right now - it's just your monthly income.
                                </p>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleNext}
                                disabled={!data.monthlySalary}
                            >
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ opacity: { duration: 0.2 } }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Current Balance?</h2>
                            <p className="text-muted-foreground">Total money you have right now across all accounts (bKash, bank, cash).</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="balance">Total Balance (৳)</Label>
                                <Input
                                    id="balance"
                                    type="number"
                                    placeholder="e.g. 25000"
                                    value={data.currentBalance}
                                    onChange={(e) => updateData('currentBalance', e.target.value)}
                                    className="text-lg"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground">
                                    💡 Don't worry about exact amounts, estimates are fine!
                                </p>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleNext}
                            >
                                {data.currentBalance ? 'Next' : 'Skip'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div
                        key="step4"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ opacity: { duration: 0.2 } }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PiggyBank className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Any Savings?</h2>
                            <p className="text-muted-foreground">Money set aside for emergencies or goals.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="savings">Total Savings (৳)</Label>
                                <Input
                                    id="savings"
                                    type="number"
                                    placeholder="e.g. 100000"
                                    value={data.savings}
                                    onChange={(e) => updateData('savings', e.target.value)}
                                    className="text-lg"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        updateData('savings', '')
                                        handleNext()
                                    }}
                                >
                                    No savings yet
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleNext}
                                >
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {step === 5 && (
                    <motion.div
                        key="step5"
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ opacity: { duration: 0.2 } }}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Any Loans or Debts?</h2>
                            <p className="text-muted-foreground">Credit cards, personal loans, etc.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="loans">Total Debt (৳)</Label>
                                <Input
                                    id="loans"
                                    type="number"
                                    placeholder="e.g. 5000"
                                    value={data.loans}
                                    onChange={(e) => updateData('loans', e.target.value)}
                                    className="text-lg"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        updateData('loans', '')
                                        handleSubmit()
                                    }}
                                    disabled={isLoading}
                                >
                                    No loans
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Setting up...' : 'Complete Setup'} <Check className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
