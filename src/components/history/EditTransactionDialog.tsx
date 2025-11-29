'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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
    const supabase = createClient();

    if (!transaction) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('🚀 Form submitted');

        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);

            const amount = parseFloat(formData.get('amount') as string);
            const category = formData.get('category') as string;
            const type = formData.get('type') as 'income' | 'expense';
            const description = formData.get('description') as string;
            const date = formData.get('date') as string;

            console.log('📝 Update data:', { amount, category, type, description, date });

            const updateData = {
                amount: amount,
                base_amount: amount, // CRITICAL: Required field
                category: category,
                type: type,
                description: description,
                date: date,
            };

            console.log('📡 Calling Supabase update...');

            const { error } = await supabase
                .from('transactions')
                .update(updateData)
                .eq('id', transaction.id);

            console.log('📥 Supabase response:', { error });

            if (error) {
                console.error('❌ Update error:', error);
                throw new Error(error.message);
            }

            console.log('✅ Update successful!');

            toast.success('Transaction updated successfully');

            onClose();
            onSuccess();

        } catch (error: any) {
            console.error('❌ Catch error:', error);

            toast.error(error.message || 'Failed to update transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            defaultValue={transaction.amount}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            defaultValue={transaction.category}
                            onValueChange={(value) => {
                                const input = document.querySelector('input[name="category"]') as HTMLInputElement;
                                if (input) input.value = value;
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="category" defaultValue={transaction.category} />
                    </div>

                    <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                            defaultValue={transaction.type}
                            onValueChange={(value) => {
                                const input = document.querySelector('input[name="type"]') as HTMLInputElement;
                                if (input) input.value = value;
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="type" defaultValue={transaction.type} />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            defaultValue={transaction.description}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={transaction.date}
                            required
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>
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
