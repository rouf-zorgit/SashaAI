import { Outlet, Link, useLocation } from 'react-router-dom';
import { MessageSquare, History, BarChart3, User, Settings, CreditCard, LogOut, TrendingUp, TrendingDown, Wallet, Receipt, Target, Bell, TrendingUp as BudgetIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../store/authStore';
import { useStats } from '../hooks/useStats';

const Layout: React.FC = () => {
    const location = useLocation();
    const { signOut } = useAuthStore();
    const stats = useStats();

    const navItems = [
        { path: '/chat', label: 'Chat', icon: MessageSquare },
        { path: '/history', label: 'History', icon: History },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/receipts', label: 'Receipts', icon: Receipt },
        { path: '/budgets', label: 'Budgets', icon: BudgetIcon },
        { path: '/goals', label: 'Goals', icon: Target },
        { path: '/reminders', label: 'Reminders', icon: Bell },
        { path: '/profile', label: 'Profile', icon: User },
        { path: '/settings', label: 'Settings', icon: Settings },
        { path: '/subscription', label: 'Subscription', icon: CreditCard },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">FinAI</h1>
                    <p className="text-xs text-gray-500 mt-1">Personal Finance Assistant</p>
                </div>

                {/* Stats Section */}
                <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3 tracking-wide">This Month</h3>
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Wallet size={14} className="text-indigo-600" />
                                </div>
                                <span className="text-sm text-gray-700">Balance</span>
                            </div>
                            <span className={clsx(
                                "text-sm font-semibold",
                                stats.monthlyBalance >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                ৳{stats.monthlyBalance.toFixed(0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                                    <TrendingUp size={14} className="text-green-600" />
                                </div>
                                <span className="text-sm text-gray-700">Income</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                ৳{stats.monthlyIncome.toFixed(0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                                    <TrendingDown size={14} className="text-red-600" />
                                </div>
                                <span className="text-sm text-gray-700">Expenses</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                ৳{stats.monthlyExpenses.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                                    isActive
                                        ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all text-sm"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
