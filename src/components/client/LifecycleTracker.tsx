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
    
    // בדיקה האם התפעול נעול (לא נשלח מייל עדיין)
    const isOpsLocked = !client.opsUnlocked;

    const currentStatusLabel = activeMode === 'sales'
        ? SALES_STATUSES.find(s => s.id === currentSalesStatus)?.label
        : OPS_STATUSES.find(s => s.id === currentOpsStatus)?.label;

    return (
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl p-8 rounded-3xl">
            {/* Header / Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex bg-gradient-to-r from-slate-100 to-slate-50 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
                    <button
                        onClick={() => setActiveMode('sales')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 justify-center ${
                            activeMode === 'sales' 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                    >
                        <span>📊</span> סטטוס מכירות
                    </button>
                    <button
                        onClick={() => setActiveMode('ops')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-2 justify-center ${
                            activeMode === 'ops' 
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                        }`}
                    >
                        <span>⚙️</span> סטטוס תפעול
                    </button>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-400">סטטוס נוכחי:</span>
                    <span className="text-sm font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
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
                        <div className="relative h-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden mx-4 shadow-inner">
                            <motion.div
                                className="absolute bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 h-full rounded-full shadow-lg"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${((SALES_STATUSES.findIndex(s => s.id === currentSalesStatus) + 1) / SALES_STATUSES.length) * 100}%`
                                }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
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
                                            relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 group
                                            ${isActive 
                                                ? 'bg-gradient-to-br from-white to-indigo-50 ring-2 ring-indigo-500 ring-offset-4 scale-110 shadow-2xl shadow-indigo-500/20' 
                                                : readOnly 
                                                    ? 'opacity-80 bg-slate-50' 
                                                    : 'hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50/30 cursor-pointer hover:shadow-lg hover:scale-105'
                                            }
                                            ${isPassed ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                                        `}
                                    >
                                        <div className={`
                                            h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300
                                            ${isActive 
                                                ? `bg-gradient-to-br ${status.bg} ${status.color} shadow-lg` 
                                                : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-lg group-hover:text-indigo-500'
                                            }
                                        `}>
                                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className={`text-[11px] font-bold text-center leading-tight transition-colors ${
                                            isActive ? 'text-indigo-700' : 'text-slate-400 group-hover:text-slate-600'
                                        }`}>
                                            {status.label}
                                        </span>

                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute -bottom-3 w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"
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
                        {/* הודעה אם התפעול נעול */}
                        {isOpsLocked && (
                            <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl flex items-center gap-4 shadow-lg shadow-amber-100">
                                <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                                    🔒
                                </div>
                                <div>
                                    <p className="font-black text-amber-800 text-base">סטטוס התפעול נעול</p>
                                    <p className="text-sm text-amber-600 mt-1">יש לסגור את המכירה בהצלחה קודם. לאחר הסגירה יישלח מייל לתפעול והסטטוס ייפתח לעריכה.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {OPS_STATUSES.map((status, index) => {
                                const isActive = status.id === currentOpsStatus;
                                const Icon = status.icon;
                                const isDisabled = readOnly || isOpsLocked;

                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => !isDisabled && onUpdate?.('ops', status.id)}
                                        disabled={isDisabled}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className={`
                                            flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 w-full text-right
                                            ${isActive 
                                                ? `border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl shadow-indigo-500/10 transform scale-[1.03]` 
                                                : isDisabled 
                                                    ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' 
                                                    : 'border-slate-100 bg-white/80 hover:border-indigo-200 hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50/30 hover:shadow-lg hover:scale-[1.02]'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            h-12 w-12 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300
                                            ${isActive 
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' 
                                                : 'bg-slate-100 text-slate-400'
                                            }
                                        `}>
                                            {isActive ? <Check size={22} strokeWidth={3} /> : <Icon size={22} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>
                                                {status.label}
                                            </span>
                                            {isActive && <span className="text-[10px] text-indigo-500 font-bold mt-0.5">✓ סטטוס נוכחי</span>}
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
