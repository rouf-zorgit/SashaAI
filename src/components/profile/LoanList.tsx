'use client'

import { useState } from "react"
import { Loan, deleteLoan } from "@/app/actions/loans"
import { Wallet } from "@/app/actions/wallet"
import { LoanCard } from "./LoanCard"
import { AddLoanDialog } from "./AddLoanDialog"
import { RecordPaymentDialog } from "./RecordPaymentDialog"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface LoanListProps {
    loans: Loan[]
    wallets: Wallet[]
}

export function LoanList({ loans, wallets }: LoanListProps) {
    const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null)
    const [loanToPayment, setLoanToPayment] = useState<Loan | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (loan: Loan) => {
        // TODO: Implement edit dialog
        toast.info('Edit functionality coming soon!')
    }

    const handleDeleteClick = (loan: Loan) => {
        setLoanToDelete(loan)
    }

    const handleConfirmDelete = async () => {
        if (!loanToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteLoan(loanToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Loan deleted successfully')
                setLoanToDelete(null)
            }
        } catch (error) {
            toast.error('Failed to delete loan')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRecordPayment = (loan: Loan) => {
        setLoanToPayment(loan)
    }

    // Calculate totals
    const totalDebt = loans.reduce((sum, loan) => sum + loan.remaining_amount, 0)
    const totalPaid = loans.reduce((sum, loan) => sum + (loan.total_amount - loan.remaining_amount), 0)
    const activeLoans = loans.filter(loan => loan.remaining_amount > 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Loans</h2>
                    {loans.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {activeLoans.length} active • Total debt: {loans[0]?.currency || 'BDT'} {totalDebt.toFixed(2)}
                        </p>
                    )}
                </div>
                <AddLoanDialog wallets={wallets} />
            </div>

            {loans.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">No loans tracked yet</p>
                    <AddLoanDialog wallets={wallets} />
                </div>
            ) : (
                <div className="grid gap-3">
                    {loans.map((loan) => (
                        <LoanCard
                            key={loan.id}
                            loan={loan}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onRecordPayment={handleRecordPayment}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!loanToDelete} onOpenChange={() => setLoanToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Loan?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the loan from {loanToDelete?.provider}?
                            This will also delete all payment records.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLoanToDelete(null)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Record Payment Dialog */}
            <RecordPaymentDialog
                loan={loanToPayment}
                wallets={wallets}
                open={!!loanToPayment}
                onOpenChange={(open) => !open && setLoanToPayment(null)}
            />
        </div>
    )
}
