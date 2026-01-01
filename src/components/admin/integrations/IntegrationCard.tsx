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
}

export default function IntegrationCard({ integration, index }: { integration: IntegrationProps, index: number }) {
    const [status, setStatus] = useState(integration.status);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const handleConnectClick = () => {
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
        if (confirm("האם אתה בטוח שברצונך לנתק את האינטגרציה?")) {
            setStatus('disconnected');
            toast.info(`${integration.name} נותק.`);
        }
    };

    const handleSync = () => {
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
                                <Badge className="bg-emerald-100 text-emerald-700 border-none flex items-center gap-1.5 px-3 py-1">
                                    <CheckCircle2 size={14} /> מחובר
                                </Badge>
                            ) : status === 'syncing' ? (
                                <Badge className="bg-blue-100 text-blue-700 border-none flex items-center gap-1.5 px-3 py-1">
                                    <RefreshCw size={14} className="animate-spin" /> מסנכרן
                                </Badge>
                            ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-none flex items-center gap-1.5 px-3 py-1">
                                    <XCircle size={14} /> מנותק
                                </Badge>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2">{integration.name}</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed flex-1">{integration.description}</p>

                        <div className="mt-auto space-y-3">
                            {status === 'connected' ? (
                                <>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 font-bold border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                                            onClick={handleSync}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} className="ml-2" />}
                                            סנכרן כעת
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-slate-200 text-slate-400 hover:text-slate-600"
                                        >
                                            <Settings size={18} />
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 pt-2">
                                        <span>סנכרון אחרון: {integration.lastSync || 'עכשיו'}</span>
                                        <button onClick={handleDisconnect} className="text-red-400 hover:text-red-500 hover:underline transition-colors">נתק חיבור</button>
                                    </div>
                                </>
                            ) : (
                                <Button
                                    className={`w-full py-6 font-bold shadow-lg shadow-indigo-100 ${integration.color} text-white opacity-90 hover:opacity-100 hover:scale-[1.02] active:scale-95 transition-all`}
                                    onClick={handleConnectClick}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "מתחבר..." : "חבר למערכת"} <ExternalLink size={16} className="ml-2" />
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
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
                                <p className="text-sm text-slate-500 font-medium">כדי לחבר את {integration.name}, אנו צריכים לאמת את החשבון שלך.</p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <Key size={14} className="text-indigo-500" /> API Key / Token
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="sk_live_..."
                                            defaultValue="******************"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <Lock size={14} className="text-indigo-500" /> Secret Key
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
