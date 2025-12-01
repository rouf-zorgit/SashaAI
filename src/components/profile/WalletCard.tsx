'use client'

import { memo, useMemo } from "react"
import { Wallet } from "@/app/actions/wallet"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Smartphone, Building2, Banknote, PiggyBank, Lock, ExternalLink } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { calculateAvailableBalance, getWalletUtilization } from "@/lib/wallet-calculations"
import Link from "next/link"

interface WalletCardProps {
    wallet: Wallet
    onEdit: (wallet: Wallet) => void
    onDelete: (wallet: Wallet) => void
    onAdjustBalance: (wallet: Wallet) => void
    monthlySpending?: number
}

export const WalletCard = memo(function WalletCard({ wallet, onEdit, onDelete, onAdjustBalance, monthlySpending = 0 }: WalletCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: wallet.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const availableBalance = calculateAvailableBalance(wallet, monthlySpending)
    const utilization = getWalletUtilization(wallet, monthlySpending)

    const getIcon = () => {
        switch (wallet.type) {
            case 'mobile_wallet':
                return <Smartphone className="w-5 h-5" />
            case 'bank':
                return <Building2 className="w-5 h-5" />
            case 'cash':
                return <Banknote className="w-5 h-5" />
            case 'savings':
                return <PiggyBank className="w-5 h-5" />
            default:
                return <WalletIcon className="w-5 h-5" />
        }
    }

    // Renamed to avoid conflict with imported Wallet type
    const WalletIcon = ({ className }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
    )

    return (
        <Card className="hover:bg-accent/50 transition-colors relative group">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${wallet.type === 'mobile_wallet' ? 'bg-pink-100 text-pink-600' :
                        wallet.type === 'bank' ? 'bg-blue-100 text-blue-600' :
                            wallet.type === 'cash' ? 'bg-green-100 text-green-600' :
                                'bg-gray-100 text-gray-600'
                        }`}>
                        {getIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{wallet.name}</h3>
                            {wallet.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                            {wallet.is_locked && (
                                <Lock className="w-3 h-3 text-muted-foreground" />
                            )}
                            <Link href={`/profile/wallet/${wallet.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{wallet.type.replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(wallet.balance)}</p>
                        {availableBalance !== wallet.balance && (
                            <p className="text-xs text-muted-foreground">
                                Available: {formatCurrency(availableBalance)}
                            </p>
                        )}
                        {wallet.monthly_limit && (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    Limit: {formatCurrency(wallet.monthly_limit)}
                                </p>
                                {utilization > 0 && (
                                    <div className="mt-1">
                                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${utilization >= 100 ? 'bg-red-500' :
                                                    utilization >= 80 ? 'bg-amber-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, utilization)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {utilization.toFixed(0)}% used
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(wallet)}>
                                Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAdjustBalance(wallet)}>
                                Adjust Balance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(wallet)}
                            >
                                Delete Wallet
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
})
