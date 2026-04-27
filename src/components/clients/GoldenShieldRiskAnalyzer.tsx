'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, 
    ShieldAlert, 
    HeartPulse, 
    Activity, 
    TrendingUp, 
    Users,
    Zap,
    CheckCircle2,
    Info
} from 'lucide-react';
import { NeonCard } from '../ui/neon-form';

interface Props {
    policies: any[];
    clientAge: number;
    income?: number;
}

export const GoldenShieldRiskAnalyzer: React.FC<Props> = ({ policies, clientAge, income = 15000 }) => {
    // Logic to calculate scores (Mock logic for demo)
    const hasLife = policies.some(p => p.type?.includes('חיים') || p.type?.includes('ריסק'));
    const hasHealth = policies.some(p => p.type?.includes('בריאות'));
    const hasPension = policies.some(p => p.type?.includes('פנסיה') || p.type?.includes('גמל'));
    const hasDisability = policies.some(p => p.type?.includes('אובדן כושר עבודה'));

    const scores = {
        life: hasLife ? 85 : 10,
        health: hasHealth ? 92 : 0,
        pension: hasPension ? 78 : 30,
        income: hasDisability ? 95 : 15
    };

    const totalScore = Math.round((scores.life + scores.health + scores.pension + scores.income) / 4);

    return (
        <NeonCard className="p-8 border-amber-500/20 bg-slate-900/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row gap-12 items-center">
                {/* ═══════════════════════ VISUAL GAUGE ═══════════════════════ */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        {/* Background Circles */}
                        <circle cx="128" cy="128" r="110" className="stroke-white/5" strokeWidth="20" fill="none" />
                        
                        {/* Dynamic Progress Segments */}
                        <motion.circle 
                            cx="128" cy="128" r="110" 
                            className="stroke-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" 
                            strokeWidth="20" fill="none" 
                            strokeDasharray="691"
                            initial={{ strokeDashoffset: 691 }}
                            animate={{ strokeDashoffset: 691 - (691 * (totalScore / 100)) }}
                            transition={{ duration: 2, ease: "easeOut" }}
                        />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <motion.span 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-black text-white italic tracking-tighter"
                        >
                            {totalScore}%
                        </motion.span>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Shield Score</span>
                    </div>

                    {/* Quadrant Icons */}
                    <QuadrantIcon icon={<Users size={16} />} label="חיים" score={scores.life} position="top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <QuadrantIcon icon={<HeartPulse size={16} />} label="בריאות" score={scores.health} position="top-1/2 right-0 translate-x-1/2 -translate-y-1/2" />
                    <QuadrantIcon icon={<TrendingUp size={16} />} label="פנסיה" score={scores.pension} position="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
                    <QuadrantIcon icon={<Activity size={16} />} label="הכנסה" score={scores.income} position="top-1/2 left-0 -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* ═══════════════════════ ANALYSIS CONTENT ═══════════════════════ */}
                <div className="flex-1 space-y-8">
                    <div>
                        <h3 className="text-3xl font-black text-white italic mb-2 tracking-tighter flex items-center gap-3">
                            <ShieldCheck className="text-amber-500" /> ניתוח הגנת "מגן זהב"
                        </h3>
                        <p className="text-slate-400 font-medium">המערכת ניתחה {policies.length} פוליסות פעילות בתיק הלקוח.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RiskItem 
                            label="ביטוח חיים (ריסק)" 
                            status={scores.life > 70 ? 'ok' : 'risk'} 
                            desc={scores.life > 70 ? 'כיסוי הולם למבנה המשפחתי' : 'חסר כיסוי בסיסי למקרה מוות'}
                        />
                        <RiskItem 
                            label="ביטוח בריאות" 
                            status={scores.health > 70 ? 'ok' : 'risk'} 
                            desc={scores.health > 70 ? 'הגנה מלאה (קטסטרופות, השתלות)' : 'חשיפה כלכלית במקרה רפואי דחוף'}
                        />
                        <RiskItem 
                            label="אובדן כושר עבודה" 
                            status={scores.income > 70 ? 'ok' : 'risk'} 
                            desc={scores.income > 70 ? '75% מהשכר מבוטח' : 'הכנסה חודשית לא מוגנת'}
                        />
                        <RiskItem 
                            label="יעדי פרישה" 
                            status={scores.pension > 70 ? 'ok' : 'risk'} 
                            desc={scores.pension > 70 ? 'קצבה צפויה: 12,500 ₪' : 'פער משמעותי ביעד הקצבה'}
                        />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20">
                            <Zap size={20} /> הפק דוח המלצות מותאם אישית
                        </button>
                    </div>
                </div>
            </div>
        </NeonCard>
    );
};

const QuadrantIcon: React.FC<{ icon: React.ReactNode, label: string, score: number, position: string }> = ({ icon, label, score, position }) => (
    <div className={`absolute ${position} flex flex-col items-center gap-1`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md border ${
            score > 70 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-rose-500/20 border-rose-500/50 text-rose-500'
        }`}>
            {icon}
        </div>
        <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">{label}</span>
    </div>
);

const RiskItem: React.FC<{ label: string, status: 'ok' | 'risk', desc: string }> = ({ label, status, desc }) => (
    <div className={`p-4 rounded-2xl border ${status === 'ok' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'} flex items-start gap-3`}>
        <div className={`mt-0.5 ${status === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
            {status === 'ok' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
        </div>
        <div>
            <p className="text-white font-black text-sm">{label}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{desc}</p>
        </div>
    </div>
);
