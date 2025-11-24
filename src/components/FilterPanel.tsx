import React, { useState } from 'react';
import { X, Calendar, DollarSign, Tag, Search } from 'lucide-react';

export interface FilterState {
    dateRange: {
        start: string;
        end: string;
    };
    categories: string[];
    amountRange: {
        min: number;
        max: number;
    };
    merchant: string;
}

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
    availableCategories: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    isOpen,
    onClose,
    onApply,
    currentFilters,
    availableCategories
}) => {
    const [filters, setFilters] = useState<FilterState>(currentFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        const emptyFilters: FilterState = {
            dateRange: { start: '', end: '' },
            categories: [],
            amountRange: { min: 0, max: 100000 },
            merchant: ''
        };
        setFilters(emptyFilters);
        onApply(emptyFilters);
        onClose();
    };

    const toggleCategory = (category: string) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Filter Transactions</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Date Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                            <Calendar size={16} />
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">From</label>
                                <input
                                    type="date"
                                    value={filters.dateRange.start}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, start: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">To</label>
                                <input
                                    type="date"
                                    value={filters.dateRange.end}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, end: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                            <Tag size={16} />
                            Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filters.categories.includes(category)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                            <DollarSign size={16} />
                            Amount Range (BDT)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                                <input
                                    type="number"
                                    value={filters.amountRange.min}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        amountRange: { ...prev.amountRange, min: Number(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                                <input
                                    type="number"
                                    value={filters.amountRange.max}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        amountRange: { ...prev.amountRange, max: Number(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Merchant Search */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                            <Search size={16} />
                            Merchant
                        </label>
                        <input
                            type="text"
                            value={filters.merchant}
                            onChange={(e) => setFilters(prev => ({ ...prev, merchant: e.target.value }))}
                            placeholder="Search by merchant name..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleClear}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
