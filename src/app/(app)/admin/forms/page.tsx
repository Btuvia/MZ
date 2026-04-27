'use client';

import React, { useState, useEffect } from 'react';
import { DigitalFormMapper } from '@/components/admin/DigitalFormMapper';
import { DashboardShell } from '@/components/ui/dashboard-shell';
import { 
    FilePlus, 
    Layers, 
    FileText, 
    Send, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { NeonCard, NeonButton } from '@/components/ui/neon-form';
import { formSigningService, FormTemplate, SigningSession } from '@/lib/services/form-signing-service';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormsPage() {
    const [showMapper, setShowMapper] = useState(false);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await formSigningService.getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [showSendModal, setShowSendModal] = useState<FormTemplate | null>(null);
    const [selectedClient, setSelectedClient] = useState('');
    const [password, setPassword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    const handleCreateSession = async () => {
        if (!selectedClient || !showSendModal) return;
        setIsGenerating(true);
        try {
            const sessionId = await formSigningService.createSigningSession({
                templateId: showSendModal.id!,
                clientId: selectedClient,
                clientName: 'לקוח בדיקה', // Should fetch from client service
                status: 'pending',
                password: password,
                fieldValues: {},
                signers: [{ role: 'client', name: 'לקוח בדיקה', signed: false }]
            });
            const link = `${window.location.origin}/sign/${sessionId}`;
            setGeneratedLink(link);
            toast.success('קישור לחתימה נוצר בהצלחה');
        } catch (error) {
            console.error(error);
            toast.error('שגיאה ביצירת קישור');
        } finally {
            setIsGenerating(false);
        }
    };

    if (showMapper) {
        return (
            <div className="fixed inset-0 z-[100] bg-black">
                <button 
                    onClick={() => {
                        setShowMapper(false);
                        loadTemplates();
                    }}
                    className="absolute top-8 left-8 z-[110] flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black transition-all"
                >
                    <ArrowRight size={20} /> חזרה לרשימת הטפסים
                </button>
                <DigitalFormMapper />
            </div>
        );
    }

    return (
        <DashboardShell title="ניהול טפסים וחתימות דיגיטליות">
            <div className="space-y-12">
                {/* Send Modal Overlay */}
                <AnimatePresence>
                    {showSendModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
                                
                                <button 
                                    onClick={() => {
                                        setShowSendModal(null);
                                        setGeneratedLink('');
                                    }}
                                    className="absolute top-8 left-8 text-slate-500 hover:text-white transition-all"
                                >
                                    <X size={24} />
                                </button>

                                <h3 className="text-3xl font-black text-white italic mb-2 tracking-tighter">שליחת טופס לחתימה</h3>
                                <p className="text-slate-500 font-bold mb-10">{showSendModal.name}</p>

                                {!generatedLink ? (
                                    <div className="space-y-6">
                                        <NeonInput 
                                            label="חיפוש לקוח"
                                            placeholder="הזן שם לקוח..."
                                            value={selectedClient}
                                            onChange={(e) => setSelectedClient(e.target.value)}
                                        />
                                        <NeonInput 
                                            label="סיסמת אבטחה (אופציונלי)"
                                            placeholder="למשל: 4 ספרות אחרונות של ת״ז"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <NeonButton 
                                            onClick={handleCreateSession}
                                            isLoading={isGenerating}
                                            className="w-full py-4 mt-4"
                                            disabled={!selectedClient}
                                        >
                                            צור קישור מאובטח <Send size={20} className="mr-2" />
                                        </NeonButton>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                                            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">הקישור מוכן לשליחה</p>
                                            <p className="text-white font-mono text-xs break-all opacity-50 mb-6">{generatedLink}</p>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedLink);
                                                    toast.success('הקישור הועתק ללוח');
                                                }}
                                                className="text-amber-500 font-black text-sm hover:underline flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <Layers size={16} /> העתק קישור
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`שלום, מצורף טופס לחתימה דיגיטלית: ${generatedLink}`)}`, '_blank')}
                                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all text-[#25D366]"
                                            >
                                                <Send size={24} />
                                                <span className="text-[10px] font-black uppercase">WhatsApp</span>
                                            </button>
                                            <button 
                                                onClick={() => window.open(`mailto:?subject=טופס לחתימה דיגיטלית&body=שלום, מצורף טופס לחתימה דיגיטלית: ${generatedLink}`)}
                                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-blue-500"
                                            >
                                                <FileText size={24} />
                                                <span className="text-[10px] font-black uppercase">Email</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Header Actions */}
                <div className="flex justify-between items-center bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white italic">ספריית טפסים חכמה</h2>
                        <p className="text-slate-500 font-medium mt-1">נהל תבניות PDF, הגדר שדות חתימה ושלח ללקוחות תוך שניות.</p>
                    </div>
                    <NeonButton onClick={() => setShowMapper(true)} className="px-8 py-4">
                        <FilePlus size={20} className="ml-2" /> צור תבנית חדשה
                    </NeonButton>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[2.5rem]" />
                        ))
                    ) : templates.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10">
                            <FileText size={64} className="mx-auto text-slate-700 mb-6" />
                            <h3 className="text-xl font-black text-white">אין עדיין תבניות במערכת</h3>
                            <p className="text-slate-500 mt-2">העלה את הטופס הראשון שלך כדי להתחיל להחתים לקוחות מרחוק.</p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <motion.div 
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <NeonCard className="p-8 h-full flex flex-col border-white/5 hover:border-amber-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                            <FileText size={28} />
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
                                                <Layers size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-white mb-2">{template.name}</h3>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-8">
                                        <span className="flex items-center gap-1.5"><Layers size={14} /> {template.fields.length} שדות מיפוי</span>
                                        <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(template.createdAt.seconds * 1000).toLocaleDateString('he-IL')}</span>
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
                                        <button className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm transition-all flex items-center justify-center gap-2">
                                            עריכת מיפוי
                                        </button>
                                        <button 
                                            onClick={() => setShowSendModal(template)}
                                            className="px-4 py-3.5 rounded-2xl bg-amber-500 text-black font-black hover:scale-105 transition-all"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Recent Activity Section */}
                <div className="bg-slate-900/30 rounded-[3rem] border border-white/5 p-10">
                    <h3 className="text-2xl font-black text-white italic mb-8 flex items-center gap-3">
                        <Clock className="text-amber-500" /> מעקב חתימות אחרונות
                    </h3>
                    <div className="space-y-4">
                        {[
                            { client: 'יוסי כהן', form: 'הצהרת בריאות מנורה', status: 'signed', date: 'היום, 14:20' },
                            { client: 'שרה לוי', form: 'ייפוי כוח למסלקה', status: 'pending', date: 'אתמול, 11:05' },
                            { client: 'דוד אברהם', form: 'הסכם הצטרפות פנסיה', status: 'expired', date: 'לפני יומיים' }
                        ].map((activity, i) => (
                            <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        activity.status === 'signed' ? 'bg-emerald-500/10 text-emerald-500' :
                                        activity.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        {activity.status === 'signed' ? <CheckCircle2 size={20} /> :
                                         activity.status === 'pending' ? <Clock size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-black">{activity.client}</p>
                                        <p className="text-slate-500 text-xs font-bold">{activity.form}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-slate-400 text-xs font-black">{activity.date}</p>
                                    <button className="text-amber-500 text-[10px] font-black uppercase mt-1 hover:underline">צפה בפרטים</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
