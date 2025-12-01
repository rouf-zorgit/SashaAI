'use client'

import { useState } from "react"
import { Wallet } from "@/app/actions/wallet"
import { WalletCard } from "./WalletCard"
import { Button } from "@/components/ui/button"
import { deleteWallet } from "@/app/actions/wallet"
import { toast } from "sonner"
import { ErrorMessages } from "@/lib/error-messages"
import { AddWalletDialog } from "./AddWalletDialog"
import { EditWalletDialog } from "./EditWalletDialog"
import { AdjustBalanceDialog } from "./AdjustBalanceDialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface WalletListProps {
    wallets: Wallet[]
}

export function WalletList({ wallets }: WalletListProps) {
    const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null)
    const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null)
    const [walletToAdjust, setWalletToAdjust] = useState<Wallet | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (wallet: Wallet) => {
        setWalletToEdit(wallet)
    }

    const handleAdjustBalance = (wallet: Wallet) => {
        setWalletToAdjust(wallet)
    }

    const handleDeleteClick = (wallet: Wallet) => {
        setWalletToDelete(wallet)
    }

    const handleConfirmDelete = async () => {
        if (!walletToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteWallet(walletToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Wallet deleted successfully')
                setWalletToDelete(null)
            }
        } catch (error) {
            console.error('Delete wallet error:', error)
            toast.error(ErrorMessages.wallet.deleteFailed)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Wallets</h2>
                <AddWalletDialog />
            </div>

            <div className="grid gap-3">
                {wallets.map((wallet) => (
                    <WalletCard
                        key={wallet.id}
                        wallet={wallet}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        onAdjustBalance={handleAdjustBalance}
                    />
                ))}
            </div>

            <EditWalletDialog
                wallet={walletToEdit}
                open={!!walletToEdit}
                onOpenChange={(open) => !open && setWalletToEdit(null)}
            />

            <AdjustBalanceDialog
                wallet={walletToAdjust}
                open={!!walletToAdjust}
                onOpenChange={(open) => !open && setWalletToAdjust(null)}
            />

            <Dialog open={!!walletToDelete} onOpenChange={(open) => !open && setWalletToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Wallet?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{walletToDelete?.name}"? This action cannot be undone.
                            Any transactions associated with this wallet might be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setWalletToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
