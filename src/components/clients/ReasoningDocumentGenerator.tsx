'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    ClipboardCheck, 
    ShieldCheck, 
    Send, 
    Download,
    X,
    Info,
    CheckCircle2
} from 'lucide-react';
import { NeonModal, NeonButton, NeonInput, NeonSelect } from '../ui/neon-form';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    analysisData: any;
    clientData: any;
}

export const ReasoningDocumentGenerator: React.FC<Props> = ({ isOpen, onClose, analysisData, clientData }) => {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [formData, setFormData] = useState({
        reasoningSummary: analysisData?.executiveSummary || '',
        mainMotivation: 'שיפור דמי ניהול וביצועים',
        recommendationType: 'החלפת קופה קיימת',
        comparisonDetails: 'הקופה החדשה מציגה דמי ניהול נמוכים ב-30% ותשואה עודפת של 1.5% בממוצע.',
        familyStatusMatch: 'תואם את הצרכים המשפחתיים המעודכנים',
        riskProfile: 'מתון-אגרסיבי'
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Simulate PDF generation logic
        setTimeout(() => {
            setIsGenerating(false);
            setStep(2);
            toast.success('מסמך הנמקה הופק בהצלחה!');
        }, 2000);
    };

    return (
        <NeonModal isOpen={isOpen} onClose={onClose} title="מחולל מסמכי הנמקה (Regulatory)" maxWidth="max-w-3xl">
            <div className="p-8">
                {step === 1 ? (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic">עריכת מסמך הנמקה</h3>
                                <p className="text-slate-400 text-sm font-bold">המערכת ריכזה את נתוני הניתוח עבור המסמך הרשמי.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NeonSelect 
                                label="סוג הפעולה"
                                value={formData.recommendationType}
                                onChange={(e) => setFormData({...formData, recommendationType: e.target.value})}
                                options={[
                                    { value: 'החלפת קופה קיימת', label: 'החלפת קופה קיימת' },
                                    { value: 'הוספת קופה חדשה', label: 'הוספת קופה חדשה' },
                                    { value: 'עדכון דמי ניהול', label: 'עדכון דמי ניהול' }
                                ]}
                            />
                            <NeonSelect 
                                label="רמת סיכון מומלצת"
                                value={formData.riskProfile}
                                onChange={(e) => setFormData({...formData, riskProfile: e.target.value})}
                                options={[
                                    { value: 'שמרני', label: 'שמרני' },
                                    { value: 'מתון', label: 'מתון' },
                                    { value: 'מתון-אגרסיבי', label: 'מתון-אגרסיבי' },
                                    { value: 'אגרסיבי', label: 'אגרסיבי' }
                                ]}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-2">תמצית הנימוקים</label>
                            <textarea 
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all text-sm leading-relaxed"
                                value={formData.reasoningSummary}
                                onChange={(e) => setFormData({...formData, reasoningSummary: e.target.value})}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-2">פירוט השוואתי</label>
                            <textarea 
                                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-amber-500/50 transition-all text-sm leading-relaxed"
                                value={formData.comparisonDetails}
                                onChange={(e) => setFormData({...formData, comparisonDetails: e.target.value})}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <NeonButton onClick={onClose} variant="secondary" className="flex-1">
                                ביטול
                            </NeonButton>
                            <NeonButton onClick={handleGenerate} isLoading={isGenerating} className="flex-1 py-4">
                                הפק מסמך לחתימה <FileText size={20} className="mr-2" />
                            </NeonButton>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-8">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={64} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white italic mb-2">המסמך מוכן!</h3>
                            <p className="text-slate-400 font-medium">מסמך ההנמקה נוצר וממתין לחתימת הלקוח.</p>
                        </div>

                        <div className="flex flex-col w-full gap-3">
                            <button className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <Send size={20} /> שלח לחתימה דיגיטלית מהירה
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Download size={18} /> הורד PDF
                                </button>
                                <button className="py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <FileText size={18} /> הצג מסמך
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </NeonModal>
    );
};
