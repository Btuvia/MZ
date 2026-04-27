'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, 
    User, 
    ClipboardList, 
    AlertTriangle, 
    Building2, 
    BarChart3, 
    FileCheck, 
    Download, 
    Send, 
    X, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft,
    Flame,
    HeartPulse,
    Search,
    MessageSquare,
    Save,
    Mail
} from 'lucide-react';
import { NeonModal, NeonInput, NeonSelect, NeonButton, NeonCard } from '../ui/neon-form';
import { insuranceReportService, ComparisonReportData, ReportResult } from '@/lib/services/insurance-report-service';
import { INSURANCE_COMPANIES_DATA } from '@/lib/data/insurance-advantages';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    clientData: any; // Data from the client profile
    onSaveReport: (report: ReportResult) => void;
}

export const InsuranceComparisonWizard: React.FC<Props> = ({ isOpen, onClose, clientData, onSaveReport }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ComparisonReportData>({
        clientName: clientData?.name || '',
        clientAge: 0,
        smokingStatus: 'non-smoker',
        healthChanged: 'no',
        hasClaims: false,
        priority: 'balanced',
        currentCompany: '',
        currentPremium: 0,
        targetCompanies: [],
        notes: ''
    });
    const [result, setResult] = useState<ReportResult | null>(null);

    // Auto-calculate age and populate data on open
    useEffect(() => {
        if (clientData) {
            let age = 0;
            if (clientData.birthDate) {
                const birth = new Date(clientData.birthDate);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
                    age--;
                }
            }

            // Find current insurance from policies
            const currentInsurance = clientData.policies?.find((p: any) => p.type === 'ביטוח בריאות' || p.type === 'חיים');

            setFormData(prev => ({
                ...prev,
                clientName: clientData.name || '',
                clientAge: age,
                currentCompany: currentInsurance?.company || '',
                currentPremium: parseInt(String(currentInsurance?.premium || '0').replace(/[^\d]/g, '') || '0')
            }));
        }
    }, [clientData, isOpen]);

    const handleNext = () => {
        if (step === 4 && formData.targetCompanies.length === 0) {
            toast.error('אנא בחר לפחות חברה אחת להשוואה');
            return;
        }
        if (step === 4) {
            const report = insuranceReportService.generateReport(formData);
            setResult(report);
        }
        
        // Call onSaveReport when moving from Step 6 (Preview) to Step 7 (Success)
        if (step === 6 && result) {
            onSaveReport(result);
        }

        setStep(s => s + 1);
    };

    const handlePrev = () => setStep(s => s - 1);

    const toggleCompany = (name: string) => {
        setFormData(prev => {
            const exists = prev.targetCompanies.includes(name);
            if (exists) {
                return { ...prev, targetCompanies: prev.targetCompanies.filter(c => c !== name) };
            }
            if (prev.targetCompanies.length >= 2) {
                toast.warning('ניתן לבחור עד 2 חברות להשוואה');
                return prev;
            }
            return { ...prev, targetCompanies: [...prev.targetCompanies, name] };
        });
    };

    const steps = [
        { id: 1, title: 'נתוני לקוח', icon: User },
        { id: 2, title: 'שאלון סוכן', icon: ClipboardList },
        { id: 3, title: 'ניתוח סיכונים', icon: AlertTriangle },
        { id: 4, title: 'בחירת חברות', icon: Building2 },
        { id: 5, title: 'השוואה', icon: BarChart3 },
        { id: 6, title: 'תצוגה מקדימה', icon: FileCheck },
        { id: 7, title: 'פעולות', icon: CheckCircle2 }
    ];

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <NeonInput label="שם מלא" value={formData.clientName} disabled />
                            <NeonInput label="גיל" value={formData.clientAge} disabled />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <NeonSelect 
                                label="חברה קיימת" 
                                value={formData.currentCompany}
                                onChange={(e) => setFormData({...formData, currentCompany: e.target.value})}
                                options={Object.keys(INSURANCE_COMPANIES_DATA).map(c => ({ value: c, label: c }))}
                            />
                            <NeonInput 
                                label="פרמיה חודשית נוכחית (₪)" 
                                type="number"
                                value={formData.currentPremium}
                                onChange={(e) => setFormData({...formData, currentPremium: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                            <Shield className="text-amber-500 shrink-0" size={20} />
                            <p className="text-sm text-amber-200/80">הנתונים נמשכו אוטומטית מכרטיס הלקוח. ניתן לעדכן ידנית במידה וחסר מידע.</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <NeonSelect 
                            label="מצב עישון" 
                            value={formData.smokingStatus}
                            onChange={(e) => setFormData({...formData, smokingStatus: e.target.value as any})}
                            options={[
                                { value: 'non-smoker', label: 'לא מעשן' },
                                { value: 'smoker', label: 'מעשן' },
                                { value: 'former-smoker', label: 'מעשן לשעבר' }
                            ]}
                        />
                        <NeonSelect 
                            label="האם חל שינוי במצב הבריאותי?" 
                            value={formData.healthChanged}
                            onChange={(e) => setFormData({...formData, healthChanged: e.target.value as any})}
                            options={[
                                { value: 'no', label: 'לא' },
                                { value: 'minor', label: 'שינוי קל' },
                                { value: 'significant', label: 'שינוי משמעותי' }
                            ]}
                        />
                        <div className="flex items-center gap-4 p-4 border border-white/5 rounded-xl">
                            <label className="flex-1 text-sm font-bold text-white">האם היו תביעות קודמות?</label>
                            <button 
                                onClick={() => setFormData({...formData, hasClaims: !formData.hasClaims})}
                                className={`px-6 py-2 rounded-lg font-black transition-all ${formData.hasClaims ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-800 text-slate-400'}`}
                            >
                                {formData.hasClaims ? 'כן' : 'לא'}
                            </button>
                        </div>
                        <NeonSelect 
                            label="עדיפות מרכזית של הלקוח" 
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                            options={[
                                { value: 'price', label: 'מחיר הנמוך ביותר' },
                                { value: 'coverage', label: 'כיסוי מקסימלי' },
                                { value: 'service', label: 'שירות מעולה' },
                                { value: 'brand', label: 'מותג חזק' },
                                { value: 'balanced', label: 'המלצה מאוזנת' }
                            ]}
                        />
                    </div>
                );
            case 3:
                const warnings = result?.warnings || insuranceReportService.generateReport(formData).warnings;
                return (
                    <div className="space-y-4">
                        <h4 className="text-lg font-black text-white italic mb-4">ניתוח סיכונים חכם</h4>
                        {warnings.length > 0 ? (
                            warnings.map((w, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i} 
                                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex gap-3 items-start"
                                >
                                    <AlertTriangle className="text-red-500 shrink-0" size={24} />
                                    <p className="text-red-100 font-bold leading-relaxed">{w}</p>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-12 text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="text-emerald-500" size={32} />
                                </div>
                                <p className="text-slate-400 font-bold">לא נמצאו סיכונים חריגים למעבר.</p>
                            </div>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm font-bold mb-4">בחר עד 2 חברות להשוואה מול המצב הקיים:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(INSURANCE_COMPANIES_DATA).filter(c => c !== formData.currentCompany).map(company => (
                                <button
                                    key={company}
                                    onClick={() => toggleCompany(company)}
                                    className={`p-4 rounded-2xl border text-right transition-all group ${
                                        formData.targetCompanies.includes(company) 
                                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                                        : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-black italic">{company}</span>
                                        {formData.targetCompanies.includes(company) && <CheckCircle2 size={18} className="text-amber-500" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {result?.comparison.map((item, i) => (
                            <NeonCard key={i} className="p-6 relative overflow-hidden">
                                {i === 0 && <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl">המלצה מובילה</div>}
                                <div className="flex justify-between items-start mb-4">
                                    <h5 className="text-2xl font-black italic text-white">{item.company}</h5>
                                    <div className="text-left">
                                        <div className="text-amber-500 font-black text-2xl">₪{item.estimatedPremium}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">לחודש מוערך</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-white/5">
                                        <div className="text-emerald-500 font-black text-lg">₪{item.savings}</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">חיסכון</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-white/5">
                                        <div className="text-blue-500 font-black text-lg">{item.qualityScore}%</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">ציון איכות</div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-xl text-center border border-white/5">
                                        <div className="text-purple-500 font-black text-lg">{item.approvalProb}%</div>
                                        <div className="text-[9px] text-slate-500 font-bold uppercase">סיכוי קבלה</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-slate-500 uppercase italic">יתרונות מרכזיים:</div>
                                    {item.pros.slice(0, 2).map((p, idx) => (
                                        <div key={idx} className="flex gap-2 text-sm text-slate-300">
                                            <span className="text-emerald-500">✔</span> {p}
                                        </div>
                                    ))}
                                </div>
                            </NeonCard>
                        ))}
                    </div>
                );
            case 6:
                return (
                    <div className="bg-linear-to-b from-slate-900 to-black border-2 border-amber-500/20 p-10 rounded-[3rem] space-y-8 text-right max-h-[550px] overflow-y-auto relative">
                        {/* Report Header Decorative Element */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-amber-500 to-transparent opacity-50" />
                        
                        <div className="flex justify-between items-start border-b border-white/5 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-linear-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Shield className="text-slate-900" size={36} />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-amber-100 tracking-tight italic">מגן זהב</div>
                                    <div className="text-[10px] text-amber-500/70 font-black uppercase tracking-[0.2em]">סוכנות לביטוח ופיננסים</div>
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">מזהה דוח: #REP-{Math.floor(Math.random() * 10000)}</div>
                                <div className="text-slate-500 text-xs font-bold">{new Date().toLocaleDateString('he-IL')} | {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="relative">
                                <div className="absolute -right-4 top-0 w-1 h-full bg-amber-500 rounded-full" />
                                <h3 className="text-3xl font-black text-white mb-2">דוח אופטימיזציה ביטוחית</h3>
                                <p className="text-slate-400 font-medium">לכבוד: <span className="text-amber-400 font-black">{formData.clientName}</span></p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Current Situation */}
                                <div className="p-6 bg-slate-800/40 rounded-3xl border border-white/5 hover:border-red-500/20 transition-all group">
                                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex justify-between items-center">
                                        <span>מצב ביטוחי קיים</span>
                                        <AlertTriangle size={14} className="text-red-500/50" />
                                    </div>
                                    <div className="text-2xl font-black text-white mb-1">{formData.currentCompany}</div>
                                    <div className="text-red-400 font-black text-3xl">₪{formData.currentPremium}<span className="text-xs text-slate-500 font-normal mr-1">/ לחודש</span></div>
                                    <div className="mt-4 p-2 bg-red-500/5 rounded-xl border border-red-500/10 text-[10px] text-red-400/70 font-bold text-center">
                                        פוטנציאל לשיפור משמעותי
                                    </div>
                                </div>

                                {/* Recommended Alternative */}
                                <div className="p-6 bg-amber-500/5 rounded-3xl border-2 border-amber-500/30 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                                    <div className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4 flex justify-between items-center relative z-10">
                                        <span>חלופה מומלצת על ידי המערכת</span>
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                    </div>
                                    <div className="text-2xl font-black text-white mb-1 relative z-10">{result?.comparison[0].company}</div>
                                    <div className="text-emerald-400 font-black text-3xl relative z-10">₪{result?.comparison[0].estimatedPremium}<span className="text-xs text-slate-500 font-normal mr-1">/ לחודש</span></div>
                                    <div className="mt-4 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] text-emerald-400 font-black text-center relative z-10 uppercase tracking-wider">
                                        חיסכון של ₪{result?.comparison[0].savings} בחודש!
                                    </div>
                                </div>
                            </div>

                            {/* Key Highlights */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">יתרונות המעבר</div>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {result?.comparison[0].pros.slice(0, 3).map((p, i) => (
                                        <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 hover:bg-white/[0.04] transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                                <Zap size={16} />
                                            </div>
                                            <p className="text-slate-300 text-xs font-bold leading-relaxed">{p}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Note */}
                            <div className="p-6 bg-linear-to-r from-amber-500/10 to-transparent rounded-3xl border-r-4 border-amber-500">
                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                    "לאחר ניתוח מעמיק של תנאי הפוליסה הנוכחית מול האלטרנטיבות בשוק, הצוות המקצועי שלנו ממליץ על המעבר המפורט לעיל. המעבר יקנה לך כיסוי רחב יותר בעלות מופחתת."
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-black text-amber-500 uppercase tracking-widest">
                                    <Award size={14} />
                                    <span>נחתם על ידי: מחלקת חיתום - מגן זהב</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="py-12 text-center space-y-8">
                        <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto relative">
                            <FileCheck className="text-amber-500" size={48} />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-1 -right-1"
                            >
                                <CheckCircle2 className="text-emerald-500 fill-slate-900" size={28} />
                            </motion.div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black text-white italic">הדוח מוכן!</h4>
                            <p className="text-slate-400 font-bold">הדוח נשמר בהצלחה בתיק הלקוח.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all">
                                <Download size={20} /> הורד PDF
                            </button>
                            <button className="flex items-center justify-center gap-3 p-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black transition-all">
                                <MessageSquare size={20} /> שלח בוואטסאפ
                            </button>
                            <button className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all">
                                <Mail size={20} /> שלח במייל
                            </button>
                            <button onClick={onClose} className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black transition-all">
                                <X size={20} /> סגור
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <NeonModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="יצירת דוח השוואת ביטוח חכם"
            size="2xl"
        >
            <div className="flex flex-col h-full">
                {/* Stepper Header */}
                <div className="flex justify-between items-center mb-10 px-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0" />
                    {steps.map((s) => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                                step >= s.id ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-900 border border-white/10 text-slate-500'
                            }`}>
                                <s.icon size={18} />
                            </div>
                            <span className={`text-[9px] mt-2 font-black uppercase tracking-widest ${step >= s.id ? 'text-amber-500' : 'text-slate-600'}`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Buttons */}
                {step < 7 && (
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
                        <button 
                            onClick={handlePrev}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                                step === 1 ? 'opacity-0 cursor-default' : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <ChevronRight size={18} /> הקודם
                        </button>
                        
                        <div className="text-xs text-slate-500 font-black uppercase italic">
                            שלב {step} מתוך 7
                        </div>

                        <NeonButton 
                            onClick={handleNext}
                            className="px-10 py-3"
                        >
                            {step === 6 ? 'סיום והפקה' : 'המשך'} <ChevronLeft size={18} className="mr-2" />
                        </NeonButton>
                    </div>
                )}
            </div>
        </NeonModal>
    );
};
