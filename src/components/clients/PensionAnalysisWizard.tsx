'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, 
    User, 
    Calculator, 
    Building2, 
    BarChart3, 
    FileText, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft,
    Upload,
    Users,
    Calendar,
    Target,
    ShieldCheck,
    Download,
    MessageSquare,
    Mail,
    X,
    AlertCircle
} from 'lucide-react';
import { NeonModal, NeonInput, NeonSelect, NeonButton, NeonCard } from '../ui/neon-form';
import { pensionAnalysisService, PensionAnalysisInput, PensionAnalysisResult } from '@/lib/services/pension-analysis-service';
import { PENSION_COMPANIES_DATA } from '@/lib/data/pension-advantages';
import { toast } from 'sonner';
import { ReasoningDocumentGenerator } from './ReasoningDocumentGenerator';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    clientData: any;
    onSaveAnalysis: (result: PensionAnalysisResult) => void;
}

export const PensionAnalysisWizard: React.FC<Props> = ({ isOpen, onClose, clientData, onSaveAnalysis }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<PensionAnalysisInput>({
        clientName: clientData?.name || '',
        birthDate: clientData?.birthDate || '',
        productType: 'קרן פנסיה',
        currentCompany: '',
        managementFeeAccumulation: 0.5,
        managementFeeDeposit: 4,
        familyStatus: 'ללא בן/בת זוג וללא ילדים',
        riskPreference: 'medium',
        currentBalance: 100000,
        monthlyDeposit: 2000
    });
    const [result, setResult] = useState<PensionAnalysisResult | null>(null);
    const [age, setAge] = useState<number>(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
    const [showReasoningModal, setShowReasoningModal] = useState(false);

    useEffect(() => {
        if (formData.birthDate) {
            setAge(pensionAnalysisService.calculateAge(formData.birthDate));
        }
    }, [formData.birthDate]);

    useEffect(() => {
        if (clientData && isOpen) {
            setFormData(prev => ({
                ...prev,
                clientName: clientData.name || '',
                birthDate: clientData.birthDate || '',
                familyStatus: clientData.familyStatus || 'ללא בן/בת זוג וללא ילדים',
                currentBalance: clientData.totalAssets || 100000,
                monthlyDeposit: clientData.monthlySavings || 2000
            }));
        }
    }, [clientData, isOpen]);

    const handleNext = () => {
        if (step === 4) {
            setIsAnalyzing(true);
            setIsAnalysisComplete(false);
            
            // Simulate AI analysis with animation
            setTimeout(() => {
                const analysis = pensionAnalysisService.generateAnalysis(formData);
                setResult(analysis);
                setIsAnalysisComplete(true);
                
                // Automatically save to client card
                onSaveAnalysis(analysis);
                
                // Show completion text for a moment before moving to results
                setTimeout(() => {
                    setIsAnalyzing(false);
                    setStep(5);
                }, 3500);
            }, 4000);
            return;
        }
        
        if (step === 5 && result) {
            // Already saved via button in Step 6, but we can call it here if needed
        }

        if (step === 6) {
            onClose();
            return;
        }

        setStep(s => s + 1);
    };

    const handlePrev = () => setStep(s => s - 1);

    const handleShareWhatsApp = () => {
        if (!result) return;
        const savings = result.benchmarking[0].savingsPotential;
        const msg = `
*🦁 דוח אופטימיזציה פנסיונית - מגן זהב CRM*
---------------------------------------
👤 *לקוח/ה:* ${formData.clientName}
📅 *תאריך:* ${new Date().toLocaleDateString('he-IL')}

*📊 השוואת הון בפרישה:*
- מצב קיים: ₪${(result.forecastedAccumulation - savings * 0.8).toLocaleString()}
- *מצב אופטימלי:* ₪${result.forecastedAccumulation.toLocaleString()}

💰 *פוטנציאל חיסכון מצטבר: ₪${savings.toLocaleString()}*
---------------------------------------
*📝 סיכום המלצות AI:*
${result.recommendation}

_הופק באמצעות מערכת הבינה המלאכותית של מגן זהב_
`.trim();
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleShareEmail = () => {
        if (!result) return;
        const subject = encodeURIComponent(`דוח אופטימיזציה פנסיונית עבור ${formData.clientName}`);
        const body = encodeURIComponent(result.reportText);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleDownloadPDF = () => {
        window.print(); // Simple print to PDF simulation
    };

    const steps = [
        { id: 1, title: 'מוצר וחברה', icon: Building2 },
        { id: 2, title: 'דמי ניהול', icon: Calculator },
        { id: 3, title: 'פרטים אישיים', icon: Users },
        { id: 4, title: 'העלאת מסמכים', icon: Upload },
        { id: 5, title: 'ניתוח ותוצאות', icon: BarChart3 },
        { id: 6, title: 'דוח מסכם', icon: FileText }
    ];

    const renderStep = () => {
        if (isAnalyzing) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    {/* Falling Money Animation */}
                    {!isAnalysisComplete && [...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: -100, x: Math.random() * 300 - 150, opacity: 0, rotate: 0 }}
                            animate={{ y: 500, opacity: [0, 1, 1, 0], rotate: 360 }}
                            transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                delay: i * 0.3,
                                ease: "linear"
                            }}
                            className="absolute top-0 text-3xl z-0"
                        >
                            {['💰', '💵', '🪙', '💸'][i % 4]}
                        </motion.div>
                    ))}

                    <div className="relative">
                        <motion.div
                            animate={isAnalysisComplete ? { 
                                scale: [1, 1.4, 1.1],
                                rotate: [0, -20, 20, -10, 0],
                                filter: ['blur(0px)', 'blur(2px)', 'blur(0px)']
                            } : { 
                                scale: [1, 1.05, 1],
                                rotate: [0, -2, 2, 0]
                            }}
                            transition={{ 
                                duration: isAnalysisComplete ? 0.6 : 2, 
                                repeat: isAnalysisComplete ? 0 : Infinity 
                            }}
                            className="text-9xl mb-8 relative z-10 select-none"
                        >
                            {isAnalysisComplete ? '💔' : '🐖'}
                        </motion.div>
                        
                        {isAnalysisComplete && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1.5 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl pointer-events-none"
                            >
                                💥
                            </motion.div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {isAnalysisComplete ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center z-20"
                            >
                                <h3 className="text-4xl font-black text-amber-500 italic mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                                    וואי וואי כמה כסף נחסך פה!
                                </h3>
                                <p className="text-white font-bold text-lg">מעבד את התוצאות הסופיות...</p>
                                <div className="mt-8 flex justify-center gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <motion.span 
                                            key={i}
                                            animate={{ 
                                                y: [0, -40, 0],
                                                x: [0, (i % 2 === 0 ? 20 : -20), 0],
                                                opacity: [1, 0.8, 1]
                                            }}
                                            transition={{ 
                                                delay: i * 0.1, 
                                                repeat: Infinity,
                                                duration: 1.2
                                            }}
                                            className="text-4xl"
                                        >
                                            💵
                                        </motion.span>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="loading" className="text-center">
                                <h3 className="text-2xl font-black text-white italic mb-2">מנתח נתונים בבינה מלאכותית...</h3>
                                <p className="text-slate-400 font-bold text-lg">סורק דמי ניהול וביצועי קופות מול המתחרים</p>
                                <div className="mt-4 flex items-center justify-center gap-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            className="w-2 h-2 bg-amber-500 rounded-full"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <NeonSelect 
                            label="סוג המוצר" 
                            value={formData.productType}
                            onChange={(e) => setFormData({...formData, productType: e.target.value as any})}
                        >
                            <option>קרן פנסיה</option>
                            <option>פוליסה פנסיונית</option>
                            <option>קרנות השתלמות</option>
                            <option>קופת גמל</option>
                        </NeonSelect>
                        <NeonSelect 
                            label="חברה מנהלת נוכחית" 
                            value={formData.currentCompany}
                            onChange={(e) => setFormData({...formData, currentCompany: e.target.value})}
                        >
                            <option value="">בחר חברה...</option>
                            {Object.keys(PENSION_COMPANIES_DATA).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </NeonSelect>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3">
                            <Target className="text-blue-500 shrink-0" size={20} />
                            <p className="text-sm text-blue-200/80">בחר את המוצר שברצונך לנתח ביחס למחירי השוק וביצועי המתחרים.</p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <NeonInput 
                                label='דנ"ה מצבירה (%)' 
                                type="number"
                                step="0.01"
                                value={formData.managementFeeAccumulation}
                                onChange={(e) => setFormData({...formData, managementFeeAccumulation: parseFloat(e.target.value)})}
                            />
                            <NeonInput 
                                label='דנ"ה מהפקדה (%)' 
                                type="number"
                                step="0.1"
                                value={formData.managementFeeDeposit}
                                onChange={(e) => setFormData({...formData, managementFeeDeposit: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <NeonInput 
                                label="צבירה נוכחית (₪)" 
                                type="number"
                                value={formData.currentBalance}
                                onChange={(e) => setFormData({...formData, currentBalance: parseInt(e.target.value)})}
                            />
                            <NeonInput 
                                label="הפקדה חודשית (₪)" 
                                type="number"
                                value={formData.monthlyDeposit}
                                onChange={(e) => setFormData({...formData, monthlyDeposit: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <NeonSelect 
                            label="סטטוס משפחתי" 
                            value={formData.familyStatus}
                            onChange={(e) => setFormData({...formData, familyStatus: e.target.value as any})}
                        >
                            <option>ללא בן/בת זוג וללא ילדים</option>
                            <option>עם בן/בת זוג ללא ילדים</option>
                            <option>עם ילדים ועם בן/בת זוג</option>
                        </NeonSelect>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <NeonInput 
                                label="תאריך לידה" 
                                type="date"
                                value={formData.birthDate}
                                onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                            />
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 h-[56px] flex items-center justify-between">
                                <span className="text-slate-500 text-sm font-bold">גיל מחושב:</span>
                                <span className="text-amber-500 font-black text-xl">{age || '--'}</span>
                            </div>
                        </div>
                        <NeonSelect 
                            label="העדפת סיכון" 
                            value={formData.riskPreference}
                            onChange={(e) => setFormData({...formData, riskPreference: e.target.value as any})}
                        >
                            <option value="low">נמוך (סולידי)</option>
                            <option value="medium">בינוני (כללי)</option>
                            <option value="high">גבוה (מנייתי)</option>
                        </NeonSelect>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 py-4">
                        <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-12 text-center hover:border-amber-500/30 transition-all group cursor-pointer bg-slate-900/50">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="text-amber-500" size={32} />
                            </div>
                            <h4 className="text-xl font-black text-white italic mb-2">גרור או העלה דוח קופה</h4>
                            <p className="text-slate-500 text-sm font-bold">תומך בפורמט PDF, JPG (צילום מסך מהאפליקציה)</p>
                            <div className="mt-8">
                                <NeonButton variant="secondary" size="sm">בחר קובץ</NeonButton>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                            <AlertCircle className="text-amber-500 shrink-0" size={20} />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                המערכת תסרוק את הדוח באופן אוטומטי ותשווה את הנתונים הקיימים לנתוני השוק בזמן אמת. 
                                <span className="text-amber-500/80 font-bold block mt-1">מומלץ להעלות דוח רבעוני או שנתי אחרון.</span>
                            </p>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <NeonCard className="bg-linear-to-br from-amber-500/10 to-transparent border-amber-500/20">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">צבירה צפויה בפרישה (67)</p>
                                <h3 className="text-3xl font-black text-white italic">₪{result?.forecastedAccumulation.toLocaleString()}</h3>
                                <p className="text-xs text-slate-500 mt-2">גידול של {(result?.forecastedAccumulation! / (formData.currentBalance + (formData.monthlyDeposit * 12 * result?.yearsToRetirement!)) * 100 - 100).toFixed(1)}% מההון העצמי</p>
                            </NeonCard>
                            <NeonCard className="bg-linear-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">פוטנציאל חיסכון מצטבר</p>
                                <h3 className="text-3xl font-black text-white italic">₪{result?.benchmarking[0].savingsPotential.toLocaleString()}</h3>
                                <p className="text-xs text-slate-500 mt-2">באמצעות אופטימיזציה של דמי ניהול ותשואות</p>
                            </NeonCard>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-white italic uppercase tracking-tighter">דירוג חלופות מובילות בשוק:</h4>
                            {result?.benchmarking.map((item, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} 
                                    className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all hover:scale-[1.02] ${i === 0 ? 'bg-slate-800 border-amber-500/50 shadow-lg shadow-amber-500/10' : 'bg-slate-900/50 border-white/5'}`}
                                >
                                    {i === 0 && <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-br-2xl">הבחירה האופטימלית</div>}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h5 className="text-xl font-black text-white italic">{item.company}</h5>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-400 font-bold">תשואה 5ש: {item.returns5Y}%</span>
                                                <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full text-emerald-400 font-bold">שירות: {item.score}</span>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-emerald-400 font-black text-xl">₪{item.savingsPotential.toLocaleString()}</div>
                                            <div className="text-[9px] text-slate-500 font-black uppercase">חיסכון משוער</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.pros.map((p, idx) => (
                                            <span key={idx} className="text-[10px] text-slate-300 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-xl">
                                                <ShieldCheck size={12} className="text-amber-500" /> {p}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );
            case 6:
                const savings = result?.benchmarking[0].savingsPotential || 0;
                const currentForecast = result ? (result.forecastedAccumulation - (result.benchmarking[0].savingsPotential * 0.8)) : 0; // Estimation of current
                const optimizedForecast = result?.forecastedAccumulation || 0;

                return (
                    <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible" id="report-content">
                        {/* Premium Report Header */}
                        <div className="relative p-8 rounded-[3rem] bg-linear-to-br from-slate-900 to-black border border-amber-500/30 overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] -ml-24 -mb-24 rounded-full pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                                        🦁
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black text-white italic tracking-tighter">דוח אופטימיזציה פנסיונית</h4>
                                        <p className="text-amber-500/80 font-bold text-sm">הופק ע"י מגן זהב CRM - בינה מלאכותית</p>
                                    </div>
                                </div>
                                <div className="text-right border-r-2 border-amber-500/30 pr-6">
                                    <div className="text-slate-400 text-xs font-black uppercase tracking-widest">לקוח/ה</div>
                                    <div className="text-white text-xl font-black">{formData.clientName}</div>
                                    <div className="text-slate-500 text-[10px] font-bold mt-1">{new Date().toLocaleDateString('he-IL')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Comparison Chart */}
                        <NeonCard className="bg-slate-900/40 border-white/5 p-10">
                            <h5 className="text-xl font-black text-white italic mb-10 flex items-center gap-3">
                                <BarChart3 className="text-amber-500" /> השוואת הון צפוי בפרישה (גיל 67)
                            </h5>
                            
                            <div className="space-y-12">
                                {/* Current Bar */}
                                <div className="relative">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-slate-400 font-black text-xs uppercase">מצב קיים: {formData.currentCompany}</span>
                                        <span className="text-white font-black">₪{currentForecast.toLocaleString()}</span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '65%' }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            className="h-full bg-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Optimized Bar */}
                                <div className="relative">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-500 font-black text-xs uppercase tracking-tighter">מצב אופטימלי: {result?.benchmarking[0].company}</span>
                                            <div className="bg-amber-500/20 text-amber-500 text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">המלצת AI</div>
                                        </div>
                                        <span className="text-amber-500 font-black text-2xl">₪{optimizedForecast.toLocaleString()}</span>
                                    </div>
                                    <div className="h-6 bg-slate-800 rounded-full overflow-hidden border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                            className="h-full bg-linear-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                        />
                                    </div>
                                    
                                    {/* Savings Gap Callout */}
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 2 }}
                                        className="absolute -bottom-10 right-0 flex items-center gap-2 text-emerald-400 font-black"
                                    >
                                        <TrendingUp size={16} />
                                        <span>פער חיסכון: ₪{savings.toLocaleString()}+</span>
                                    </motion.div>
                                </div>
                            </div>
                        </NeonCard>

                        {/* Executive Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                                    <Calculator size={24} />
                                </div>
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">הפחתת דמי ניהול</div>
                                <div className="text-xl font-black text-white">כ-65% פחות</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">שיפור תשואה שנתי</div>
                                <div className="text-xl font-black text-white">~1.85% נטו</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-900 border border-white/5 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">ציון איכות קופה</div>
                                <div className="text-xl font-black text-white">9.8/10</div>
                            </div>
                        </div>

                {/* Detailed Analysis Text */}
                <style jsx global>{`
                    @media print {
                        #report-content {
                            background-color: white !important;
                            color: black !important;
                            padding: 2rem !important;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                `}</style>

                <div className="bg-slate-950/50 border border-white/5 rounded-[2.5rem] p-10 relative">
                            <h6 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-6">פירוט המלצות מקצועי</h6>
                            <div className="text-slate-300 leading-loose text-lg whitespace-pre-wrap font-medium">
                                {result?.reportText.split('\n').map((line, i) => {
                                    if (line.includes(':') && line.length < 50) {
                                        return <div key={i} className="text-white font-black mt-6 mb-2 text-xl italic">{line}</div>;
                                    }
                                    if (line.includes('₪')) {
                                        const parts = line.split(/(₪[\d,]+)/);
                                        return (
                                            <p key={i} className="mb-4">
                                                {parts.map((part, pi) => part.startsWith('₪') ? <span key={pi} className="text-amber-400 font-black bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">{part}</span> : part)}
                                            </p>
                                        );
                                    }
                                    return <p key={i} className="mb-4">{line}</p>;
                                })}
                            </div>
                        </div>

                        {/* Sharing Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-white/5 print:hidden">
                            <button 
                                onClick={handleShareWhatsApp}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black transition-all hover:scale-105 shadow-lg shadow-[#25D366]/10"
                            >
                                <MessageSquare size={20} /> שתף בוואטסאפ
                            </button>
                            <button 
                                onClick={handleShareEmail}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black transition-all hover:scale-105"
                            >
                                <Mail size={20} /> שלח במייל
                            </button>
                            <button 
                                onClick={handleDownloadPDF}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black transition-all hover:scale-105"
                            >
                                <Download size={20} /> שמור כ-PDF
                            </button>
                            <button 
                                onClick={() => setShowReasoningModal(true)}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-amber-500 text-black rounded-2xl font-black transition-all hover:scale-105 shadow-xl shadow-amber-500/20"
                            >
                                <ShieldCheck size={20} /> הפק מסמך הנמקה
                            </button>
                            <button 
                                onClick={() => {
                                    onSaveAnalysis(result!);
                                    toast.success('הדוח נשמר בהצלחה בתיק הלקוח');
                                }}
                                className="flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-amber-400 to-amber-600 text-black rounded-2xl font-black transition-all hover:scale-105 shadow-xl shadow-amber-500/20"
                            >
                                <CheckCircle2 size={20} /> שמור בכרטיס לקוח
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
            title="🤖 ניתוח שוק והשוואת תשואות AI"
            maxWidth="max-w-2xl"
        >
            <div className="flex flex-col h-full">
                {/* Custom Stepper */}
                <div className="flex justify-between items-center mb-12 px-6 relative">
                    <div className="absolute top-5 left-10 right-10 h-[1px] bg-white/5 z-0" />
                    {steps.map((s) => (
                        <div key={s.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 transform ${
                                step >= s.id 
                                ? 'bg-linear-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] rotate-0' 
                                : 'bg-slate-900 border border-white/10 text-slate-600 rotate-12'
                            }`}>
                                <s.icon size={18} />
                            </div>
                            <span className={`text-[8px] mt-3 font-black uppercase tracking-[0.2em] transition-colors ${step >= s.id ? 'text-amber-500' : 'text-slate-600'}`}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[420px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isAnalyzing ? 'analyzing' : step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation Footer */}
                {!isAnalyzing && (
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
                        <button 
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-red-500/70 hover:text-red-500 hover:bg-red-500/5 transition-all"
                        >
                            <X size={18} /> ביטול וסגירה
                        </button>
                        
                        <div className="flex justify-between items-center flex-1">
                            <button 
                                onClick={handlePrev}
                                disabled={step === 1}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${
                                    step === 1 ? 'opacity-0 cursor-default' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <ChevronRight size={18} /> הקודם
                            </button>
                            
                            <div className="hidden md:flex gap-1.5">
                                {steps.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i + 1 ? 'w-8 bg-amber-500' : 'w-1.5 bg-white/10'}`} />
                                ))}
                            </div>

                            <NeonButton 
                                onClick={handleNext}
                                className="px-12 py-3.5 group"
                            >
                                <span className="flex items-center gap-3">
                                    {step === 4 ? 'התחל ניתוח AI' : step === 5 ? 'הפק דוח מסכם' : step === 6 ? 'סיום' : 'המשך'}
                                    {step < 6 && <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />}
                                    {step === 6 && <X size={18} />}
                                </span>
                            </NeonButton>
                        </div>
                    </div>
                )}
            </div>
            <ReasoningDocumentGenerator 
                isOpen={showReasoningModal}
                onClose={() => setShowReasoningModal(false)}
                analysisData={result}
                clientData={clientData}
            />
        </NeonModal>
    );
};
