"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone,
    Calendar,
    FileText,
    MessageSquare,
    Award,
    XOctagon,
    UserPlus,
    Send,
    AlertCircle,
    Activity,
    FileCheck,
    ShieldCheck,
    Ban,
    X,
    Check
} from "lucide-react";
import { Card } from "@/components/ui/base";

export const SALES_STATUSES = [
    { id: 'new_lead', label: 'ליד חדש', icon: UserPlus, color: 'text-slate-600', bg: 'bg-slate-100' },
    { id: 'contacted', label: 'נוצר קשר', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'meeting_scheduled', label: 'פגישה נקבעה', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { id: 'proposal_sent', label: 'הצעה נשלחה', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'negotiation', label: 'משא ומתן', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-100' },
    { id: 'closed_won', label: 'נסגר בהצלחה', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { id: 'closed_lost', label: 'נסגר ללא מכירה', icon: XOctagon, color: 'text-red-600', bg: 'bg-red-100' },
];

export const OPS_STATUSES = [
    { id: 'sent_to_company', label: 'עבר לחברת הביטוח', icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'missing_docs', label: 'דרוש מידע/טפסים', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'medical_pending', label: 'מקדם מידע רפואי', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'underwriting_approval', label: 'אישור חיתום', icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'policy_issued', label: 'פוליסה הופקה', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'policy_rejected', label: 'פוליסה נדחתה', icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'cancellation', label: 'ביטול', icon: X, color: 'text-slate-600', bg: 'bg-slate-50' },
];

interface LifecycleTrackerProps {
    client: any;
    onUpdate?: (type: 'sales' | 'ops', status: string) => void;
    readOnly?: boolean;
}

export default function LifecycleTracker({ client, onUpdate, readOnly = false }: LifecycleTrackerProps) {
    const [activeMode, setActiveMode] = useState<'sales' | 'ops'>('sales');

    const currentSalesStatus = client.salesStatus || 'new_lead';
    const currentOpsStatus = client.opsStatus || 'sent_to_company';

    const currentStatusLabel = activeMode === 'sales'
        ? SALES_STATUSES.find(s => s.id === currentSalesStatus)?.label
        : OPS_STATUSES.find(s => s.id === currentOpsStatus)?.label;

    return (
        <Card className="border-none shadow-xl bg-white p-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header / Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveMode('sales')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 justify-center ${activeMode === 'sales' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span>📊</span> סטטוס מכירות
                    </button>
                    <button
                        onClick={() => setActiveMode('ops')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 justify-center ${activeMode === 'ops' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span>⚙️</span> סטטוס תפעול
                    </button>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400">סטטוס נוכחי:</span>
                    <span className="text-sm font-black text-primary flex items-center gap-2">
                        {activeMode === 'sales' ? '🏷️' : '🏗️'} {currentStatusLabel}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeMode === 'sales' ? (
                    <motion.div
                        key="sales"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Progress Bar Visual */}
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mx-4">
                            <motion.div
                                className="absolute bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${((SALES_STATUSES.findIndex(s => s.id === currentSalesStatus) + 1) / SALES_STATUSES.length) * 100}%`
                                }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            />
                        </div>

                        {/* Steps Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {SALES_STATUSES.map((status, index) => {
                                const isActive = status.id === currentSalesStatus;
                                const isPassed = SALES_STATUSES.findIndex(s => s.id === currentSalesStatus) > index;
                                const Icon = status.icon;

                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => !readOnly && onUpdate?.('sales', status.id)}
                                        disabled={readOnly}
                                        className={`
                                            relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all group
                                            ${isActive ? 'bg-slate-50 ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-lg' : readOnly ? 'opacity-80' : 'hover:bg-slate-50 cursor-pointer'}
                                            ${isPassed ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                                        `}
                                    >
                                        <div className={`
                                            h-12 w-12 rounded-2xl flex items-center justify-center transition-all
                                            ${isActive ? `${status.bg} ${status.color} shadow-inner` : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md'}
                                        `}>
                                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[10px] font-black text-center leading-tight ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                            {status.label}
                                        </span>

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute -bottom-2 w-1 h-1 bg-indigo-500 rounded-full"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="ops"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {OPS_STATUSES.map((status) => {
                                const isActive = status.id === currentOpsStatus;
                                const Icon = status.icon;

                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => !readOnly && onUpdate?.('ops', status.id)}
                                        disabled={readOnly}
                                        className={`
                                            flex items-center gap-4 p-4 rounded-2xl border-2 transition-all w-full text-right
                                            ${isActive ? `border-indigo-500 bg-indigo-50/50 shadow-md transform scale-[1.02]` : readOnly ? 'border-slate-100 bg-white' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'}
                                        `}
                                    >
                                        <div className={`
                                            h-10 w-10 shrink-0 rounded-xl flex items-center justify-center
                                            ${isActive ? 'bg-white shadow-sm text-indigo-600' : 'bg-slate-100 text-slate-400'}
                                        `}>
                                            {isActive ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                {status.label}
                                            </span>
                                            {isActive && <span className="text-[10px] text-indigo-500 font-bold">סטטוס נוכחי</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
