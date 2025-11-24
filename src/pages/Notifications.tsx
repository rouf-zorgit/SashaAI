import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Lightbulb, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getUserNotifications, markNotificationRead, type Notification } from '../lib/notifications';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'insight' | 'reminder' | 'alert'>('all');

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await getUserNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (notification: Notification) => {
        await markNotificationRead(notification.id);
        setNotifications(prev => prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
        ));

        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'insight': return <Lightbulb size={20} className="text-purple-600" />;
            case 'reminder': return <Calendar size={20} className="text-blue-600" />;
            case 'alert': return <AlertCircle size={20} className="text-red-600" />;
            default: return <Bell size={20} className="text-gray-600" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'insight': return 'border-purple-200 bg-purple-50';
            case 'reminder': return 'border-blue-200 bg-blue-50';
            case 'alert': return 'border-red-200 bg-red-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {['all', 'insight', 'reminder', 'alert'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-4 py-2 font-medium capitalize transition-colors ${filter === tab
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="text-center py-12">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No notifications</p>
                    <p className="text-sm text-gray-400 mt-2">
                        We'll notify you about important insights and reminders
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${notification.is_read
                                ? 'bg-white border-gray-200 opacity-60'
                                : `${getColor(notification.type)} border-2`
                                }`}
                            onClick={() => !notification.is_read && handleMarkRead(notification)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-1">{getIcon(notification.type)}</div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {notification.title}
                                        </h3>
                                        {!notification.is_read && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
