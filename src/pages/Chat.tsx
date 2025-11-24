import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Camera, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { useTransactions } from '../contexts/TransactionContext';
import { processChat, processReceipt } from '../lib/ai';
import { createMessage, getMessages } from '../lib/db/messages';
import { generateSessionId } from '../lib/db/sasha';
import { createTransaction, getLastTransaction, updateTransaction, softDeleteTransaction, getRecentTransactions } from '../lib/db/transactions';
import { createReceipt } from '../lib/db/receipts';
import ReceiptReviewModal from '../components/ReceiptReviewModal';

interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Helper functions
const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Mock currency conversion
const convertCurrency = async (amount: number, from: string, to: string): Promise<number> => {
    if (from === to) return amount;
    const rates: Record<string, number> = {
        'USD': 110,
        'EUR': 120,
        'GBP': 140,
        'INR': 1.3,
        'BDT': 1
    };
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    return (amount * fromRate) / toRate;
};

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    chart?: {
        type: 'pie' | 'bar';
        title: string;
        data: Array<{ name: string; value: number }>;
    };
}

interface PendingTransaction {
    id: string;
    amount: number;
    category: string;
    description: string;
    question: string;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const MemoizedMessage = React.memo(({ message }: { message: Message }) => {
    if (message.id === 'thinking') {
        return (
            <div className="flex gap-3 mb-6 message-appear">
                <img src="/sasha.jpg" alt="Sasha" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (message.sender === 'user') {
        return (
            <div className="flex justify-end mb-6 message-appear">
                <div className="max-w-[75%]">
                    <div className="chat-bubble-user">
                        <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-1 prose-p:leading-relaxed">
                            <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-right">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 mb-6 message-appear">
            <img src="/sasha.jpg" alt="Sasha" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
            <div className="max-w-[75%]">
                <div className="chat-bubble-ai">
                    <div className="prose prose-slate max-w-none text-sm leading-relaxed prose-p:my-1 prose-p:leading-relaxed">
                        <ReactMarkdown>{message.text}</ReactMarkdown>

                        {message.chart && message.chart.data && message.chart.data.length > 0 && (
                            <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 not-prose">
                                <div className="flex items-center mb-2">
                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{message.chart.title}</span>
                                </div>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={message.chart.data}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {message.chart.data.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
});

const ChatInput = React.memo(({
    onSendMessage,
    isProcessing,
    onImageSelect,
    onRemoveImage,
    imagePreview,
    onProcessReceipt
}: {
    onSendMessage: (text: string) => void,
    isProcessing: boolean,
    onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemoveImage: () => void,
    imagePreview: string | null,
    onProcessReceipt: () => void
}) => {
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInput = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className="p-4 border-t border-gray-100 bg-white">
            {imagePreview && (
                <div className="mb-4 max-w-4xl mx-auto">
                    <div className="relative inline-block">
                        <img
                            src={imagePreview}
                            alt="Receipt preview"
                            className="max-h-40 rounded-xl border-2 border-indigo-500"
                        />
                        <button
                            onClick={onRemoveImage}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <button
                        onClick={onProcessReceipt}
                        disabled={isProcessing}
                        className="ml-4 btn-primary"
                    >
                        {isProcessing ? 'Processing...' : 'Process Receipt'}
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto w-full">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onImageSelect}
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors flex-shrink-0"
                    title="Upload receipt"
                >
                    <Camera size={20} />
                </button>

                <div className="relative flex-1">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={isProcessing ? "Sasha is thinking..." : "Type a message..."}
                        rows={1}
                        className="input pr-12 min-h-[48px] max-h-[200px]"
                    />
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </form>
        </div>
    );
});

const Chat: React.FC = () => {
    const { user } = useAuthStore();
    const { refresh: refreshTransactions } = useTransactions();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
    const [sessionId, setSessionId] = useState<string>('');

    // Receipt Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [currentReceiptData, setCurrentReceiptData] = useState<any>(null);
    const [currentReceiptImage, setCurrentReceiptImage] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isProcessingRef = useRef(false);

    const scrollToBottom = (instant = false) => {
        if (instant) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (user) {
            loadMessages();
        }
    }, [user]);

    // Initialize/restore session ID for STM
    useEffect(() => {
        if (user) {
            const storageKey = `chat_session_${user.id}`;
            const stored = localStorage.getItem(storageKey);

            if (stored) {
                try {
                    const session = JSON.parse(stored);
                    // Check if session is still valid (< 30 min old)
                    if (Date.now() - session.timestamp < 30 * 60 * 1000) {
                        setSessionId(session.id);
                        console.log('Restored session:', session.id);
                    } else {
                        // Session expired, create new one
                        const newId = generateSessionId(user.id);
                        setSessionId(newId);
                        localStorage.setItem(storageKey, JSON.stringify({
                            id: newId,
                            timestamp: Date.now()
                        }));
                        console.log('Session expired, created new:', newId);
                    }
                } catch (e) {
                    // Invalid stored data, create new session
                    const newId = generateSessionId(user.id);
                    setSessionId(newId);
                    localStorage.setItem(storageKey, JSON.stringify({
                        id: newId,
                        timestamp: Date.now()
                    }));
                }
            } else {
                // No stored session, create new one
                const newId = generateSessionId(user.id);
                setSessionId(newId);
                localStorage.setItem(storageKey, JSON.stringify({
                    id: newId,
                    timestamp: Date.now()
                }));
                console.log('Created new session:', newId);
            }
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!user) return;
        const { data: dbMessages, error } = await getMessages(user.id);

        if (error) {
            if (error.code === '42P01') {
                const errorMsg: Message = {
                    id: 'error-table',
                    text: "⚠️ Database Error: The 'messages' table is missing. Please run the SQL script in your Supabase Dashboard.",
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages([errorMsg]);
            }
            return;
        }

        if (dbMessages.length === 0) {
            const welcomeMsg = {
                id: 'welcome',
                text: "Hello! I'm Sasha, your Chief Spending Officer. I can help you track expenses and income through natural conversation. Try saying something like 'Spent 500 on groceries' or ask me for financial advice!",
                sender: 'ai' as const,
                timestamp: new Date(),
            };
            setMessages([welcomeMsg]);
        } else {
            setMessages(dbMessages.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender,
                timestamp: new Date(m.created_at),
            })));
        }

        // Scroll to bottom after messages are loaded
        setTimeout(() => scrollToBottom(true), 100);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleProcessReceipt = async () => {
        if (!selectedImage || !user || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessing(true);

        try {
            const base64Full = await convertImageToBase64(selectedImage);
            // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = base64Full.split(',')[1] || base64Full;

            const userMsg: Message = {
                id: Date.now().toString(),
                text: '📷 Uploaded receipt',
                sender: 'user',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMsg]);
            await createMessage(user.id, '📷 Uploaded receipt', 'user');

            const thinkingMsg: Message = {
                id: 'thinking',
                text: '...',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, thinkingMsg]);

            console.log('Calling processReceipt with userId:', user.id);
            const ocrResult = await processReceipt({ userId: user.id, imageBase64: base64 });

            setMessages((prev) => prev.filter(m => m.id !== 'thinking'));

            if (!ocrResult.success || !ocrResult.transaction) {
                const errorMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: ocrResult.error || 'Could not read receipt. Please try again.',
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMsg]);
                await createMessage(user.id, errorMsg.text, 'ai');
            } else {
                // Show review modal instead of saving directly
                setCurrentReceiptData({
                    merchant: ocrResult.transaction.merchant || '',
                    amount: ocrResult.transaction.amount,
                    currency: ocrResult.transaction.currency,
                    date: ocrResult.transaction.date || new Date().toISOString().split('T')[0],
                    category: ocrResult.transaction.category,
                    items: ocrResult.transaction.items || []
                });
                setCurrentReceiptImage(imagePreview || '');
                setShowReviewModal(true);
            }

            handleRemoveImage();
        } catch (error) {
            console.error('OCR error:', error);
            setMessages((prev) => prev.filter(m => m.id !== 'thinking'));

            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Failed to process receipt. Please try again.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    };

    const handleSaveReceipt = async (data: any) => {
        if (!user) return;

        try {
            const baseAmount = await convertCurrency(data.amount, data.currency, 'BDT');

            // Create transaction
            const transaction = await createTransaction({
                user_id: user.id,
                amount: data.amount,
                currency: data.currency,
                type: 'expense',
                category: data.category,
                description: `${data.merchant}${data.items?.length ? ': ' + data.items.join(', ') : ''}`,
                is_confirmed: true,
                base_amount: baseAmount,
            });

            // Save receipt record
            await createReceipt({
                user_id: user.id,
                storage_path: currentReceiptImage,
                merchant: data.merchant,
                amount: data.amount,
                currency: data.currency,
                date: data.date,
                items: data.items,
                status: 'confirmed',
                transaction_id: transaction.id
            });

            await refreshTransactions();

            const successMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `✅ Receipt saved! **${data.currency} ${data.amount}** from **${data.merchant}** as ${data.category}.`,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, successMsg]);
            await createMessage(user.id, successMsg.text, 'ai');

            setShowReviewModal(false);
        } catch (error) {
            console.error('Error saving receipt:', error);
            throw error;
        }
    };

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !user || isProcessingRef.current) return;

        isProcessingRef.current = true;
        setIsProcessing(true);

        try {
            const tempUserMsg: Message = {
                id: Date.now().toString(),
                text: text,
                sender: 'user',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, tempUserMsg]);

            await createMessage(user.id, text, 'user');

            const thinkingMsg: Message = {
                id: 'thinking',
                text: '...',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, thinkingMsg]);

            const recentMessages: AIChatMessage[] = messages.slice(-5).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const recentTransactions = await getRecentTransactions(user.id, 3);

            const aiResponse = await processChat({
                userId: user.id,
                sessionId: sessionId, // STM: Pass session ID for context
                message: text,
                recentMessages,
                recentTransactions: recentTransactions.map(t => ({
                    amount: Number(t.amount),
                    category: t.category,
                    type: t.type,
                    created_at: t.created_at
                }))
            });

            setMessages((prev) => prev.filter(m => m.id !== 'thinking'));

            if (aiResponse.mode === 'conversation') {
                if (aiResponse.intent === 'ghost') {
                    console.log('Sasha is ghosting this conversation.');
                } else {
                    await createMessage(user.id, aiResponse.reply, 'ai');
                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        text: aiResponse.reply,
                        sender: 'ai',
                        timestamp: new Date(),
                        chart: aiResponse.chart
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                }
            } else if (aiResponse.mode === 'transaction') {
                let finalResponseText = '';

                if (aiResponse.intent === 'create') {
                    if (aiResponse.transaction) {
                        const shouldConfirm = aiResponse.transaction.duplicateSuspect ||
                            aiResponse.transaction.isRecurringSuspect ||
                            aiResponse.confidence < 0.85;

                        if (shouldConfirm) {
                            const txPayload = {
                                user_id: user.id,
                                amount: aiResponse.transaction.amount,
                                currency: aiResponse.transaction.currency,
                                type: aiResponse.transaction.type,
                                category: aiResponse.transaction.category,
                                description: aiResponse.transaction.description,
                                merchant_name: aiResponse.transaction.merchant,
                                is_confirmed: false,
                                base_amount: aiResponse.transaction.amount,
                            };

                            const pendingTx = await createTransaction(txPayload);

                            setPendingTransactions(prev => [...prev, {
                                id: pendingTx.id,
                                amount: aiResponse.transaction!.amount,
                                category: aiResponse.transaction!.category || 'Unknown',
                                description: aiResponse.transaction!.description || '',
                                question: aiResponse.reply
                            }]);

                            finalResponseText = `I noticed: ${aiResponse.transaction.description || 'transaction'} for ${aiResponse.transaction.amount} BDT. ${aiResponse.transaction.duplicateSuspect ? 'This looks like a duplicate. ' : ''
                                }${aiResponse.transaction.isRecurringSuspect ? 'This might be a recurring bill. ' : ''
                                }Should I save this?`;

                        } else {
                            const txPayload = {
                                user_id: user.id,
                                amount: aiResponse.transaction.amount,
                                currency: aiResponse.transaction.currency,
                                type: aiResponse.transaction.type,
                                category: aiResponse.transaction.category,
                                description: aiResponse.transaction.description,
                                merchant_name: aiResponse.transaction.merchant,
                                is_confirmed: true,
                                base_amount: aiResponse.transaction.amount,
                            };

                            await createTransaction(txPayload);

                            await refreshTransactions();

                            finalResponseText = `Done! I saved ${aiResponse.transaction.amount} BDT for ${aiResponse.transaction.category || 'expense'}. If that's wrong, just say 'make it 350' or 'delete that'.`;
                        }

                        await createMessage(user.id, finalResponseText, 'ai');
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            text: finalResponseText,
                            sender: 'ai',
                            timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, aiMsg]);
                    }
                } else if (aiResponse.intent === 'edit') {
                    const lastTx = await getLastTransaction(user.id);
                    if (lastTx && aiResponse.transaction) {
                        await updateTransaction(lastTx.id, {
                            amount: aiResponse.transaction.amount,
                            category: aiResponse.transaction.category,
                            description: aiResponse.transaction.description,
                        });
                        await refreshTransactions();
                    }

                    await createMessage(user.id, aiResponse.reply, 'ai');
                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        text: aiResponse.reply,
                        sender: 'ai',
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                } else if (aiResponse.intent === 'delete' || aiResponse.intent === 'undo') {
                    const lastTx = await getLastTransaction(user.id);
                    if (lastTx) {
                        await softDeleteTransaction(lastTx.id);
                        await refreshTransactions();
                    }

                    await createMessage(user.id, aiResponse.reply, 'ai');
                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        text: aiResponse.reply,
                        sender: 'ai',
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, aiMsg]);
                } else if (aiResponse.intent === 'confirm') {
                    if (pendingTransactions.length > 0) {
                        for (const pending of pendingTransactions) {
                            await updateTransaction(pending.id, { is_confirmed: true });
                        }
                        setPendingTransactions([]);
                        await refreshTransactions();

                        const confirmText = `Great! I've saved all pending transactions.`;
                        await createMessage(user.id, confirmText, 'ai');
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            text: confirmText,
                            sender: 'ai',
                            timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, aiMsg]);
                    } else {
                        await createMessage(user.id, aiResponse.reply, 'ai');
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            text: aiResponse.reply,
                            sender: 'ai',
                            timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, aiMsg]);
                    }
                } else if (aiResponse.intent === 'reject') {
                    if (pendingTransactions.length > 0) {
                        for (const pending of pendingTransactions) {
                            await softDeleteTransaction(pending.id);
                        }
                        setPendingTransactions([]);

                        const rejectText = `Okay, I've discarded those transactions.`;
                        await createMessage(user.id, rejectText, 'ai');
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            text: rejectText,
                            sender: 'ai',
                            timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, aiMsg]);
                    } else {
                        await createMessage(user.id, aiResponse.reply, 'ai');
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            text: aiResponse.reply,
                            sender: 'ai',
                            timestamp: new Date(),
                        };
                        setMessages((prev) => [...prev, aiMsg]);
                    }
                }
            }

            if (pendingTransactions.length > 0 && aiResponse.intent !== 'confirm' && aiResponse.intent !== 'reject') {
                const reminderText = `By the way, you still have ${pendingTransactions.length} pending item(s): ${pendingTransactions.map(p => `${p.description} ${p.amount} BDT`).join(', ')
                    }. Should I save ${pendingTransactions.length === 1 ? 'it' : 'them'}?`;

                await createMessage(user.id, reminderText, 'ai');
                const reminderMsg: Message = {
                    id: (Date.now() + 2).toString(),
                    text: reminderText,
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, reminderMsg]);
            }

        } catch (error) {
            console.error('Error processing message:', error);

            setMessages((prev) => prev.filter(m => m.id !== 'thinking'));

            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "Something went wrong on my side. Could you try again in a moment?",
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorResponse]);
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    }, [user, messages, pendingTransactions, refreshTransactions]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                    <img src="/sasha.jpg" alt="Sasha" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <h2 className="font-semibold text-gray-900">Sasha</h2>
                        <p className="text-xs text-gray-500">Chief Spending Officer</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-4xl mx-auto">
                    {messages.map((message) => (
                        <MemoizedMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <ChatInput
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                onImageSelect={handleImageSelect}
                onRemoveImage={handleRemoveImage}
                imagePreview={imagePreview}
                onProcessReceipt={handleProcessReceipt}
            />

            {showReviewModal && currentReceiptData && (
                <ReceiptReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onConfirm={handleSaveReceipt}
                    initialData={currentReceiptData}
                    imageUrl={currentReceiptImage}
                />
            )}
        </div>
    );
};

export default Chat;
