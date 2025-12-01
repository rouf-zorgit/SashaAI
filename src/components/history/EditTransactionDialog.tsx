'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateTransaction } from '@/app/actions/transactions';
import { useRouter } from 'next/navigation';

interface Transaction {
    id: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    description: string;
    date: string;
}

interface Props {
    transaction: Transaction | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIES = [
    'groceries',
    'transport',
    'entertainment',
    'bills',
    'shopping',
    'food',
    'dining',
    'health',
    'income',
    'other',
];

export function EditTransactionDialog({ transaction, open, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [amount, setAmount] = useState('0');
    const [category, setCategory] = useState('other');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount.toString());
            setCategory(transaction.category);
            setType(transaction.type);
            setDescription(transaction.description);

            let dateStr = transaction.date;
            if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
            }
            setDate(dateStr);

            console.log('📝 Form initialized:', { dateStr, transaction });
        }
    }, [transaction]);

    if (!transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('💾 Submitting update for:', transaction.id);

            const result = await updateTransaction(transaction.id, {
                amount: parseFloat(amount),
                category,
                type,
                description,
                date,
            });

            console.log('📊 Update result:', result);

            if (!result.success) {
                throw new Error(result.error || 'Failed to update');
            }

            toast.success('Transaction updated successfully');

            onClose();
            router.refresh();
            onSuccess();

        } catch (error: any) {
            console.error('❌ Error:', error);
            toast.error(error.message || 'Failed to update transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <select
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}