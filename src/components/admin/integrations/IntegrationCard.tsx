"use client";

import { Card, Button, Badge } from "@/components/ui/base";
import { CheckCircle2, XCircle, RefreshCw, Settings, ExternalLink, Key, Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface IntegrationProps {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'syncing';
    lastSync?: string;
    color: string;
    // Custom action handlers for specific integrations
    onAction?: () => void;
    actionLabel?: string;
    onSync?: () => void;
    eventsCount?: number;
}

export default function IntegrationCard({ integration, index }: { integration: IntegrationProps, index: number }) {
    const [status, setStatus] = useState(integration.status);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    // Update local status when prop changes
    useState(() => {
        setStatus(integration.status);
    });

    const handleConnectClick = () => {
        // If there's a custom action handler, use it
        if (integration.onAction) {
            integration.onAction();
            return;
        }
        setShowConfigModal(true);
    };

    const handleConfirmConnect = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setStatus('connected');
            setShowConfigModal(false);
            toast.success(`${integration.name} חובר בהצלחה!`);
        }, 1500);
    };

    const handleDisconnect = () => {
        // If there's a custom action handler, use it
        if (integration.onAction) {
            integration.onAction();
            return;
        }
        if (confirm("האם אתה בטוח שברצונך לנתק את האינטגרציה?")) {
            setStatus('disconnected');
            toast.info(`${integration.name} נותק.`);
        }
    };

    const handleSync = () => {
        // If there's a custom sync handler, use it
        if (integration.onSync) {
            setIsLoading(true);
            integration.onSync();
            setTimeout(() => setIsLoading(false), 2000);
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success(`סנכרון ${integration.name} הושלם.`);
        }, 2000);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
                <Card className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group h-full flex flex-col relative">
                    <div className={`absolute top-0 left-0 w-full h-1 ${integration.color}`}></div>

                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${integration.color.replace('bg-', 'bg-opacity-10 text-')}`}>
                                {integration.icon}
                            </div>
                            {status === 'connected' ? (
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1">
                                    <CheckCircle2 size={14} /> מחובר
                                </Badge>
                            ) : status === 'syncing' ? (
                                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 px-3 py-1">
                                    <RefreshCw size={14} className="animate-spin" /> מסנכרן
                                </Badge>
                            ) : (
                                <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1.5 px-3 py-1">
                                    <XCircle size={14} /> מנותק
                                </Badge>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-amber-100 mb-2">{integration.name}</h3>
                        <p className="text-sm text-slate-300 mb-8 leading-relaxed flex-1">{integration.description}</p>

                        <div className="mt-auto space-y-3">
                            {status === 'connected' ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 font-bold border-amber-500/30 text-amber-200 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10"
                                            onClick={handleSync}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} className="ml-2" />}
                                            סנכרן כעת
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-amber-500/30 text-slate-300 hover:text-amber-400"
                                        >
                                            <Settings size={18} />
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 pt-2">
                                        <span>
                                            סנכרון אחרון: {integration.lastSync || 'עכשיו'}
                                            {integration.eventsCount !== undefined && ` (${integration.eventsCount} אירועים)`}
                                        </span>
                                        <button onClick={handleDisconnect} className="text-red-400 hover:text-red-500 hover:underline transition-colors">
                                            {integration.actionLabel || 'נתק חיבור'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <Button
                                    className={`w-full py-6 font-bold shadow-lg shadow-indigo-100 ${integration.color} text-white opacity-90 hover:opacity-100 hover:scale-[1.02] active:scale-95 transition-all`}
                                    onClick={handleConnectClick}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "מתחבר..." : (integration.actionLabel || "חבר למערכת")} <ExternalLink size={16} className="ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Config Modal Overlay */}
            <AnimatePresence>
                {showConfigModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setShowConfigModal(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card border border-amber-500/20 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
                        >
                            <div className={`p-6 ${integration.color} text-white flex justify-between items-center`}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                        <Settings size={20} />
                                    </div>
                                    <h3 className="font-black text-lg">הגדרת {integration.name}</h3>
                                </div>
                                <button onClick={() => setShowConfigModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-sm text-slate-300 font-medium">כדי לחבר את {integration.name}, אנו צריכים לאמת את החשבון שלך.</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
                                            <Key size={14} className="text-amber-400" /> API Key / Token
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full glass-card border border-amber-500/20 rounded-xl p-3 text-sm font-mono text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all placeholder-slate-500"
                                            placeholder="sk_live_..."
                                            defaultValue="******************"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-2">
                                            <Lock size={14} className="text-amber-400" /> Secret Key
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full glass-card border border-amber-500/20 rounded-xl p-3 text-sm font-mono text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 transition-all placeholder-slate-500"
                                            placeholder="whsec_..."
                                            defaultValue="******************"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button onClick={() => setShowConfigModal(false)} variant="outline" className="flex-1">ביטול</Button>
                                    <Button
                                        onClick={handleConfirmConnect}
                                        className={`flex-1 ${integration.color} text-white`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "מאמת..." : "אמת ושמור"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
