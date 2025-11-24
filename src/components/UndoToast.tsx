import React, { useEffect, useState } from 'react';
import { Undo, X } from 'lucide-react';

interface UndoToastProps {
    message: string;
    onUndo: () => void;
    onDismiss: () => void;
    duration?: number; // in milliseconds
}

export const UndoToast: React.FC<UndoToastProps> = ({
    message,
    onUndo,
    onDismiss,
    duration = 5000
}) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 100) {
                    clearInterval(interval);
                    handleDismiss();
                    return 0;
                }
                return prev - 100;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleUndo = () => {
        setIsVisible(false);
        onUndo();
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
    };

    if (!isVisible) return null;

    const progress = (timeLeft / duration) * 100;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium flex-1">{message}</p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleUndo}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Undo size={14} />
                            Undo
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
