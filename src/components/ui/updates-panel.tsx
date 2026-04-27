"use client";

import { Bell, X, Clock, CheckCircle2, AlertTriangle, Timer, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { type Task } from "@/types";
import { useRouter } from "next/navigation";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Card, Badge } from "./base";
import { motion, AnimatePresence } from "framer-motion";

interface UpdatesPanelProps {
    userId: string;
}

export function UpdatesPanel({ userId }: UpdatesPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    const loadUpdates = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [tasks, reminders] = await Promise.all([
                firestoreService.getTasks(),
                firestoreService.getReminders(userId)
            ]);

            const now = new Date();
            
            const combined = [
                ...reminders.map(r => ({ ...r, type: 'reminder', priority: 'high' })),
                ...tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
                    .map(t => ({ ...t, type: 'task' }))
            ].sort((a, b) => {
                const dateA = a.reminderTime || (a.date ? new Date(`${a.date}T${a.time || '00:00'}`) : new Date(0));
                const dateB = b.reminderTime || (b.date ? new Date(`${b.date}T${b.time || '00:00'}`) : new Date(0));
                return dateA.getTime() - dateB.getTime();
            });

            setItems(combined);
            
            // Count "due" items as unread/alert count
            const dueCount = combined.filter(item => {
                const date = item.reminderTime || (item.date ? new Date(`${item.date}T${item.time || '00:00'}`) : new Date(0));
                return date <= now;
            }).length;
            
            setUnreadCount(dueCount);
        } catch (error) {
            console.error("Error loading updates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUpdates();
        const interval = setInterval(loadUpdates, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [userId]);

    return (
        <div className="relative" dir="rtl">
            {/* Updates Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-widest ${
                    unreadCount > 0 
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30 animate-pulse' 
                    : 'bg-slate-800 text-amber-400 border border-amber-500/20 hover:border-amber-500/50'
                }`}
            >
                <Bell size={16} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                עדכונים
                {unreadCount > 0 && (
                    <span className="bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded-lg text-[10px]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10, x: 0 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10, x: 0 }}
                            className="absolute left-0 top-12 w-96 z-50"
                        >
                            <Card className="glass-card border-2 border-amber-500/30 shadow-2xl overflow-hidden rounded-3xl">
                                <div className="p-4 border-b border-amber-500/20 bg-slate-900/50 flex items-center justify-between">
                                    <h3 className="text-amber-100 font-black flex items-center gap-2">
                                        <Sparkles size={18} className="text-amber-400" />
                                        מרכז עדכונים
                                    </h3>
                                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                                    {loading && items.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500 font-bold">טוען עדכונים...</div>
                                    ) : items.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <CheckCircle2 size={40} className="mx-auto text-slate-700 mb-3" />
                                            <p className="text-slate-500 font-bold text-sm">אין עדכונים חדשים</p>
                                        </div>
                                    ) : (
                                        items.map((item) => {
                                            const itemDate = item.reminderTime || (item.date ? new Date(`${item.date}T${item.time || '00:00'}`) : new Date(0));
                                            const isDue = itemDate <= new Date();
                                            
                                            return (
                                                <div 
                                                    key={item.id}
                                                    className={`p-3 rounded-2xl border transition-all ${
                                                        isDue 
                                                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                                                        : 'bg-slate-800/50 border-slate-700/50 hover:border-amber-500/30'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-xl ${isDue ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                                                            {item.type === 'reminder' ? <Clock size={16} /> : <Timer size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="font-bold text-amber-100 text-sm truncate">{item.title}</h4>
                                                                {isDue && <Badge variant="gold" className="text-[8px] animate-pulse">דחוף</Badge>}
                                                            </div>
                                                            <p className="text-xs text-slate-400 line-clamp-2 mb-2">{item.description || 'אין תיאור'}</p>
                                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                                <span className={isDue ? 'text-amber-400' : 'text-slate-500'}>
                                                                    {itemDate.toLocaleDateString('he-IL')} {itemDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <button 
                                                                    className="text-amber-400 hover:underline"
                                                                    onClick={() => {
                                                                        if (item.type === 'task') {
                                                                            router.push(`/admin/tasks?id=${item.id}`);
                                                                        } else if (item.itemType === 'lead') {
                                                                            router.push(`/admin/leads?id=${item.itemId}`);
                                                                        }
                                                                        setIsOpen(false);
                                                                    }}
                                                                >
                                                                    פתח
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function Sparkles({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
        </svg>
    );
}
