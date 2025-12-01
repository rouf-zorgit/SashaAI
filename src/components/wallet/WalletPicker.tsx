'use client'

import { Wallet } from "@/app/actions/wallet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Wallet as WalletIcon, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface WalletPickerProps {
    wallets: Wallet[]
    value?: string
    onValueChange: (walletId: string) => void
    label?: string
    placeholder?: string
    disabled?: boolean
    filterCurrency?: string
    showBalance?: boolean
    className?: string
}

export function WalletPicker({
    wallets,
    value,
    onValueChange,
    label = "Wallet",
    placeholder = "Select wallet",
    disabled = false,
    filterCurrency,
    showBalance = true,
    className
}: WalletPickerProps) {
    // Filter wallets by currency if specified
    const filteredWallets = filterCurrency
        ? wallets.filter(w => w.currency === filterCurrency)
        : wallets

    // Get selected wallet for display
    const selectedWallet = wallets.find(w => w.id === value)

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <Label className="text-sm font-medium">
                    {label}
                </Label>
            )}
            <Select
                value={value}
                onValueChange={onValueChange}
                disabled={disabled || filteredWallets.length === 0}
            >
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2 w-full">
                        <WalletIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <SelectValue placeholder={placeholder}>
                            {selectedWallet && (
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{selectedWallet.name}</span>
                                    {showBalance && (
                                        <span className="text-sm text-muted-foreground ml-2">
                                            {selectedWallet.currency} {selectedWallet.balance.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {filteredWallets.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                            No wallets available
                            {filterCurrency && ` with ${filterCurrency}`}
                        </div>
                    ) : (
                        filteredWallets.map((wallet) => (
                            <SelectItem
                                key={wallet.id}
                                value={wallet.id}
                                disabled={wallet.is_locked}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center justify-between w-full gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{wallet.name}</span>
                                        {wallet.is_locked && (
                                            <Lock className="w-3 h-3 text-muted-foreground" />
                                        )}
                                        {wallet.is_default && (
                                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {showBalance && (
                                        <span className="text-sm text-muted-foreground">
                                            {wallet.currency} {wallet.balance.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            {selectedWallet?.is_locked && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                    ⚠️ This wallet is locked
                </p>
            )}
            {selectedWallet?.monthly_limit && showBalance && (
                <p className="text-xs text-muted-foreground">
                    Monthly limit: {selectedWallet.currency} {selectedWallet.monthly_limit.toFixed(2)}
                </p>
            )}
        </div>
    )
}
