"use client";

import { motion } from "framer-motion";
import { Briefcase, Plus, TrendingUp, Target, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateSalesTips } from "@/app/actions/gemini";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonCard, NeonButton } from "@/components/ui/neon-form";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";

export default function SalesPage() {
    const { user } = useAuth();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiTips, setAiTips] = useState("");

    const stages = [
        { id: "lead", title: "ליד חדש", color: "from-blue-500 to-indigo-600", borderColor: "border-blue-500/30" },
        { id: "contact", title: "נוצר קשר", color: "from-purple-500 to-pink-600", borderColor: "border-purple-500/30" },
        { id: "proposal", title: "הצעה נשלחה", color: "from-amber-500 to-orange-600", borderColor: "border-amber-500/30" },
        { id: "negotiation", title: "משא ומתן", color: "from-orange-500 to-red-600", borderColor: "border-orange-500/30" },
        { id: "closed", title: "נסגר", color: "from-emerald-500 to-teal-600", borderColor: "border-emerald-500/30" },
    ];

    useEffect(() => {
        const loadDeals = async () => {
            setLoading(true);
            try {
                const fetched = await firestoreService.getDeals();
                setDeals(fetched);
            } catch (e) {
                console.error(e);
                toast.error("שגיאה בטעינת עסקאות");
            } finally {
                setLoading(false);
            }
        };
        loadDeals();
    }, []);

    const handleAddTestDeal = async () => {
        const client = prompt("שם הלקוח:");
        if (!client) return;
        const newDeal = {
            title: `עסקה - ${client}`,
            clientName: client,
            value: 5000,
            probability: 50,
            stage: "lead",
            createdAt: new Date().toISOString()
        };
        try {
            const id = await firestoreService.addDeal(newDeal as any);
            setDeals(prev => [...prev, { ...newDeal, id }]);
            toast.success("עסקה חדשה נוצרה");
        } catch (e) {
            toast.error("שגיאה ביצירת עסקה");
        }
    };

    const updateStage = async (deal: any, direction: 'next' | 'prev') => {
        const currentIdx = stages.findIndex(s => s.id === deal.stage);
        if (currentIdx === -1) return;

        const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= stages.length) return;

        const newStage = stages[newIdx].id;

        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
        try {
            await firestoreService.updateDeal(deal.id, { stage: newStage } as any);
            toast.success(`העסקה הועברה ל-${stages[newIdx].title}`);
        } catch (e) {
            toast.error("שגיאה בעדכון שלב העסקה");
        }
    };

    const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
    const closedValue = deals.filter(d => d.stage === 'closed').reduce((sum, deal) => sum + Number(deal.value || 0), 0);

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="max-w-[100vw] space-y-12 p-8 animate-in fade-in slide-in-from-bottom-10 duration-1000" dir="rtl">
                
                {/* Header Premium */}
                <div className="relative group p-12 rounded-[3rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl mx-auto max-w-7xl">
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 blur-[100px] rounded-full translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                <Briefcase className="text-orange-500" size={48} /> ניהול מכירות
                            </h1>
                            <p className="text-slate-500 font-bold mt-4 text-xl tracking-tight">ניהול ויזואלי של תהליך המכירה - מהליד ועד חתימת החוזה</p>
                        </div>
                        <NeonButton onClick={handleAddTestDeal} className="px-10 py-6 text-lg shadow-xl shadow-orange-500/10 group">
                            <Plus size={20} className="ml-2 group-hover:rotate-90 transition-transform" />
                            עסקה חדשה
                        </NeonButton>
                    </div>
                </div>

                {/* Stats Summary Neon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mx-auto max-w-7xl">
                    {[
                        { label: "סך עסקאות", value: deals.length, icon: <TrendingUp size={24} />, color: "text-blue-500" },
                        { label: "שווי צנרת", value: `₪${totalValue.toLocaleString()}`, icon: <ShieldCheck size={24} />, color: "text-amber-500" },
                        { label: "עסקאות שנסגרו", value: deals.filter(d => d.stage === 'closed').length, icon: <CheckCircle2 size={24} />, color: "text-emerald-500" },
                        { label: "שווי סגור", value: `₪${closedValue.toLocaleString()}`, icon: <Target size={24} />, color: "text-purple-500" }
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <NeonCard className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{stat.label}</p>
                                </div>
                                <h4 className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</h4>
                            </NeonCard>
                        </motion.div>
                    ))}
                </div>

                {/* Kanban Board Board */}
                <div className="overflow-x-auto pb-10 scrollbar-thin scrollbar-thumb-slate-800">
                    <div className="flex gap-8 min-w-max px-4">
                        {stages.map((stage, sIdx) => {
                            const stageDeals = deals.filter(d => d.stage === stage.id);
                            return (
                                <div key={stage.id} className="w-96 shrink-0 space-y-6">
                                    <div className={`p-6 rounded-[2rem] bg-linear-to-br ${stage.color} shadow-2xl relative overflow-hidden group`}>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex items-center justify-between text-white">
                                            <h3 className="text-xl font-black italic tracking-tighter">{stage.title}</h3>
                                            <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
                                                {stageDeals.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 min-h-[500px] p-4 rounded-[2.5rem] bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                                        {loading ? (
                                            <div className="h-full flex items-center justify-center py-20 text-slate-700 animate-pulse font-black italic">טוען...</div>
                                        ) : stageDeals.length === 0 ? (
                                            <div className="text-center py-20 text-slate-800 font-black italic text-sm">אין עסקאות</div>
                                        ) : (
                                            stageDeals.map((deal, dIdx) => (
                                                <motion.div 
                                                    key={deal.id} 
                                                    initial={{ opacity: 0, scale: 0.95 }} 
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: dIdx * 0.05 }}
                                                >
                                                    <NeonCard className={`${stage.borderColor} group cursor-grab active:cursor-grabbing`}>
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h4 className="text-lg font-black text-white italic tracking-tighter group-hover:text-amber-400 transition-colors">
                                                                    {deal.clientName || deal.client}
                                                                </h4>
                                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                                    {deal.product || "מוצר משולב"}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {stage.id !== 'lead' && (
                                                                    <button onClick={() => updateStage(deal, 'prev')} className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors text-white">
                                                                        <ArrowRight size={14} />
                                                                    </button>
                                                                )}
                                                                {stage.id !== 'closed' && (
                                                                    <button onClick={() => updateStage(deal, 'next')} className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors text-white">
                                                                        <ArrowLeft size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mt-6">
                                                            <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">
                                                                ₪{Number(deal.value || 0).toLocaleString()}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                                                    <div
                                                                        className={`h-full bg-linear-to-r ${stage.color} rounded-full`}
                                                                        style={{ width: `${deal.probability || 50}%` }}
                                                                     />
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-500">
                                                                    {deal.probability || 50}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </NeonCard>
                                                </motion.div>
                                            )
                                        ))}

                                        {stage.id === 'lead' && (
                                            <button 
                                                onClick={handleAddTestDeal} 
                                                className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-600 hover:border-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5 transition-all text-sm font-black italic flex flex-col items-center gap-2 group"
                                            >
                                                <Plus className="group-hover:rotate-90 transition-transform" />
                                                הוסף פרויקט חדש
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Performance & AI Tips Neon */}
                <div className="grid lg:grid-cols-2 gap-10 mx-auto max-w-7xl">
                    <NeonCard title="📈 ביצועים ויעד חודשי">
                        <div className="space-y-8 py-4">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">התקדמות יעד מכירות</span>
                                    <span className="text-xl font-black text-white italic">₪{closedValue.toLocaleString()} / ₪60,000</span>
                                </div>
                                <div className="h-6 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                    <motion.div
                                        className="h-full bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((closedValue / 60000) * 100, 100)}%` }}
                                        transition={{ duration: 1.5, ease: "circOut" }}
                                     />
                                </div>
                                <p className="text-[10px] text-slate-600 font-bold mt-3 text-left">נתונים נכון להיום</p>
                            </div>
                        </div>
                    </NeonCard>

                    <NeonCard title="🎯 אופטימיזציה מבוססת AI" className="bg-slate-900/40! border-amber-500/20!">
                        <div className="flex flex-col gap-8">
                            <div className="text-lg text-slate-300 font-medium leading-relaxed italic whitespace-pre-wrap flex items-start gap-4">
                                <span className="text-amber-500 text-3xl shrink-0 mt-1">💡</span>
                                {aiTips || "לחץ לקבלת תובנות אסטרטגיות מבוססות בינה מלאכותית לשיפור תהליכי הסגירה בקאנבן."}
                            </div>
                            <NeonButton
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const res = await generateSalesTips(deals);
                                        setAiTips(res.text || res.error || "שגיאה ביצירת טיפים");
                                    } catch (e) {
                                        toast.error("שגיאה בחיבור ל-AI");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="shadow-2xl shadow-amber-500/10"
                            >
                                <Target size={18} className="ml-2" /> {loading ? "מנתח נתונים..." : "צור טיפים חכמים"}
                            </NeonButton>
                        </div>
                    </NeonCard>
                </div>
            </div>
        </DashboardShell>
    );
}
