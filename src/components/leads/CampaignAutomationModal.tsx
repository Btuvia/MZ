"use client";

import { Facebook, Instagram, Search, CheckCircle2, AlertCircle, Sparkles, MessageSquare, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { NeonModal, NeonCard, NeonButton, NeonInput, NeonSelect } from '@/components/ui/neon-form';

interface CampaignAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CampaignAutomationModal: React.FC<CampaignAutomationModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'status' | 'add' | 'settings'>('status');
    const [selectedSource, setSelectedSource] = useState<'google' | 'facebook' | 'instagram'>('facebook');
    const [isConnecting, setIsConnecting] = useState(false);

    const sources = [
        { id: 'facebook', name: 'Facebook Ads', icon: <Facebook className="text-[#1877F2]" />, status: 'מחובר', color: '#1877F2' },
        { id: 'instagram', name: 'Instagram', icon: <Instagram className="text-[#E4405F]" />, status: 'מחובר', color: '#E4405F' },
        { id: 'google', name: 'Google Ads', icon: <Search className="text-[#4285F4]" />, status: 'לא מחובר', color: '#4285F4' },
    ];

    const handleConnect = (source: string) => {
        setIsConnecting(true);
        setTimeout(() => {
            setIsConnecting(false);
            toast.success(`מערכת ${source} חוברה בהצלחה!`);
        }, 1500);
    };

    return (
        <NeonModal
            isOpen={isOpen}
            onClose={onClose}
            title="ניהול קמפיינים ואוטומציה"
            maxWidth="max-w-3xl"
        >
            <div className="space-y-8" dir="rtl">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-800 pb-4">
                    <button 
                        onClick={() => setActiveTab('status')}
                        className={`text-sm font-black italic px-4 py-2 rounded-xl transition-all ${activeTab === 'status' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                        📊 מצב קמפיינים
                    </button>
                    <button 
                        onClick={() => setActiveTab('add')}
                        className={`text-sm font-black italic px-4 py-2 rounded-xl transition-all ${activeTab === 'add' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                        ➕ הוספת מקור
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`text-sm font-black italic px-4 py-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-white'}`}
                    >
                        ⚙️ הגדרות שדה
                    </button>
                </div>

                {activeTab === 'status' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sources.map(source => (
                                <NeonCard key={source.id} className="p-6! group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" style={{ backgroundColor: source.color }} />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-lg">
                                                {source.icon}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-white">{source.name}</h5>
                                                <p className={`text-[10px] font-bold ${source.status === 'מחובר' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                    ● {source.status}
                                                </p>
                                            </div>
                                        </div>
                                        {source.status === 'מחובר' ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">לידים היום</span>
                                                <span className="text-xl font-black text-amber-500 italic">24</span>
                                            </div>
                                        ) : (
                                            <NeonButton size="sm" variant="primary" onClick={() => handleConnect(source.name)} className="py-2! px-4! text-![10px]">חבר עכשיו</NeonButton>
                                        )}
                                    </div>
                                </NeonCard>
                            ))}
                        </div>

                        <NeonCard title="💡 תובנות קמפיין AI" className="bg-blue-500!/5 border-blue-500!/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500 text-black rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                    <Sparkles size={20} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-blue-200 leading-relaxed text-right">
                                        הקמפיין ב-Facebook מראה יחס המרה גבוה ב-15% בשעות הערב. מומלץ להעלות את התקציב בין 19:00 ל-22:00.
                                    </p>
                                    <div className="flex gap-2">
                                        <button className="text-[10px] font-black text-blue-400 hover:underline">החלת אופטימיזציה</button>
                                        <button className="text-[10px] font-black text-slate-500 hover:underline">התעלם</button>
                                    </div>
                                </div>
                            </div>
                        </NeonCard>
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="space-y-6">
                        <p className="text-slate-400 text-sm font-bold">בחר שירות לחיבור אוטומטי של לידים:</p>
                        <div className="grid grid-cols-3 gap-6">
                            {['Google', 'Facebook', 'Zapier', 'Make', 'Instagram', 'Webhooks'].map(platform => (
                                <button 
                                    key={platform}
                                    className="p-8 rounded-[2.5rem] bg-slate-900 border-2 border-slate-800 hover:border-amber-500 hover:bg-slate-800 transition-all group flex flex-col items-center gap-4 active:scale-95"
                                >
                                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">
                                        {platform === 'Facebook' && '🔵'}
                                        {platform === 'Google' && '🔴'}
                                        {platform === 'Zapier' && '🟠'}
                                        {platform === 'Instagram' && '🟣'}
                                        {platform === 'Make' && '⚪'}
                                        {platform === 'Webhooks' && '⚡'}
                                    </div>
                                    <span className="font-black text-xs text-slate-400 group-hover:text-white">{platform}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <NeonCard title="מיפוי שדות אוטומטי">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        <span className="text-sm font-bold text-slate-300 italic">שם מלא</span>
                                    </div>
                                    <div className="text-slate-600">←</div>
                                    <span className="text-xs font-black text-white bg-slate-800 px-3 py-1 rounded-lg">fb_full_name</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-sm font-bold text-slate-300 italic">טלפון</span>
                                    </div>
                                    <div className="text-slate-600">←</div>
                                    <span className="text-xs font-black text-white bg-slate-800 px-3 py-1 rounded-lg">lead_phone</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800 opacity-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                                        <span className="text-sm font-bold text-slate-500 italic">הערות</span>
                                    </div>
                                    <div className="text-slate-600">←</div>
                                    <span className="text-xs font-black text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">notes_custom</span>
                                </div>
                            </div>
                        </NeonCard>
                    </div>
                )}
            </div>
        </NeonModal>
    );
};

export default CampaignAutomationModal;
