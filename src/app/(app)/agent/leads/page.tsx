"use client";

import { motion } from "framer-motion";
import { Layers, Plus, Phone, Mail, Calendar, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateLeadsInsights } from "@/app/actions/gemini";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonCard, NeonButton } from "@/components/ui/neon-form";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";

export default function LeadsPage() {
    const { user } = useAuth();
    const [selectedStatus, setSelectedStatus] = useState("הכל");
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiInsights, setAiInsights] = useState("");

    useEffect(() => {
        const loadLeads = async () => {
            setLoading(true);
            try {
                const fetched = await firestoreService.getLeads();
                setLeads(fetched);
            } catch (e) {
                console.error(e);
                toast.error("שגיאה בטעינת לידים");
            } finally {
                setLoading(false);
            }
        };
        loadLeads();
    }, []);

    const handleCreateTestLead = async () => {
        const name = prompt("שם הליד:");
        if (!name) return;
        const newLead = {
            name,
            phone: "050-0000000",
            email: "test@example.com",
            source: "ידני",
            status: "חדש",
            score: 50,
            lastContact: new Date().toISOString(),
            notes: "נוצר ידנית"
        };
        try {
            const id = await firestoreService.addLead(newLead as any);
            setLeads(prev => [...prev, { ...newLead, id }]);
            toast.success("ליד נוצר בהצלחה");
        } catch (e) {
            toast.error("שגיאה ביצירת ליד");
        }
    };

    const updateLeadStatus = async (id: string, newStatus: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        try {
            await firestoreService.updateLead(id, { status: newStatus } as any);
            toast.success(`סטטוס עודכן ל-${newStatus}`);
        } catch (e) {
            toast.error("שגיאה בעדכון סטטוס");
        }
    };

    const filteredLeads = leads.filter(lead =>
        selectedStatus === "הכל" || lead.status === selectedStatus
    );

    const stats = {
        total: leads.length,
        new: leads.filter(l => l.status === "חדש").length,
        inProgress: leads.filter(l => l.status === "בטיפול").length,
        scheduled: leads.filter(l => l.status === "פגישה נקבעה").length,
    };

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="max-w-7xl mx-auto space-y-12 p-8 animate-in fade-in slide-in-from-bottom-10 duration-1000" dir="rtl">
                
                {/* Header Premium */}
                <div className="relative group p-12 rounded-[3rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                <span className="text-emerald-500">💎</span> ניהול לידים
                            </h1>
                            <p className="text-slate-500 font-bold mt-4 text-xl tracking-tight">מעקב, ניהול והמרה של לידים פוטנציאליים ללקוחות משלמים</p>
                        </div>
                        <NeonButton onClick={handleCreateTestLead} className="px-10 py-6 text-lg shadow-xl shadow-emerald-500/10 group">
                            <Plus size={20} className="ml-2 group-hover:rotate-90 transition-transform" />
                            ליד חדש
                        </NeonButton>
                    </div>
                </div>

                {/* Stats Grid Neon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "סך לידים", value: stats.total, icon: <Layers size={24} />, color: "text-blue-500" },
                        { label: "לידים חדשים", value: stats.new, icon: <Sparkles size={24} />, color: "text-emerald-500" },
                        { label: "בטיפול", value: stats.inProgress, icon: <RefreshCw size={24} />, color: "text-amber-500" },
                        { label: "פגישות", value: stats.scheduled, icon: <Calendar size={24} />, color: "text-purple-500" }
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
                            <NeonCard className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                                    <span className="text-4xl font-black text-white italic">{stat.value}</span>
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{stat.label}</p>
                            </NeonCard>
                        </motion.div>
                    ))}
                </div>

                {/* Filters Neon */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                    {["הכל", "חדש", "בטיפול", "פגישה נקבעה", "לא מגיב"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-8 py-4 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${selectedStatus === status
                                ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105'
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Leads Grid Neon */}
                <div className="grid gap-8">
                    {loading ? (
                        <div className="text-center py-20 text-slate-500 animate-pulse font-black italic">טוען לידים מהשרת...</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-800 text-slate-600 font-black italic">אין לידים להצגה בחתך זה</div>
                    ) : (
                        filteredLeads.map((lead, i) => (
                            <motion.div key={lead.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                <NeonCard className="group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-[1.5rem] bg-linear-to-br from-emerald-500/20 to-teal-700/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-black text-2xl shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform">
                                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                {lead.name ? lead.name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter">{lead.name}</h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                                    <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                                        <Phone size={14} className="text-slate-600" /> {lead.phone}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                                        <Mail size={14} className="text-slate-600" /> {lead.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">ציון התאמה</p>
                                                <p className={`text-lg font-black ${lead.score >= 80 ? 'text-emerald-500' : lead.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {lead.score || 0}%
                                                </p>
                                            </div>
                                            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">סטטוס נוכחי</p>
                                                <p className="text-sm font-black text-white italic">{lead.status}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <NeonButton onClick={() => updateLeadStatus(lead.id, "בטיפול")} variant="blue" size="sm" className="flex-1 lg:flex-none">
                                                <Phone size={14} className="ml-2" /> בטיפול
                                            </NeonButton>
                                            <NeonButton onClick={() => updateLeadStatus(lead.id, "פגישה נקבעה")} variant="primary" size="sm" className="flex-1 lg:flex-none">
                                                <Calendar size={14} className="ml-2" /> פגישה
                                            </NeonButton>
                                            <NeonButton 
                                                variant="secondary" 
                                                size="sm" 
                                                className="px-4 text-emerald-500 border-emerald-500/20 hover:border-emerald-500"
                                                onClick={() => {
                                                    if (confirm("האם להמיר ליד זה ללקוח?")) {
                                                        toast.promise(
                                                            firestoreService.addClient({
                                                                firstName: lead.name.split(' ')[0] || lead.name,
                                                                lastName: lead.name.split(' ').slice(1).join(' ') || '',
                                                                email: lead.email,
                                                                phone: lead.phone,
                                                                status: 'פעיל',
                                                                source: lead.source,
                                                                notes: lead.notes
                                                            } as any).then(() => updateLeadStatus(lead.id, "בוצעה המרה")),
                                                            {
                                                                loading: 'מעבד המרה...',
                                                                success: 'הליד הומר ללקוח בהצלחה! 🎉',
                                                                error: 'שגיאה בהמרת ליד'
                                                            }
                                                        );
                                                    }
                                                }}
                                            >
                                                🤝 המרה
                                            </NeonButton>
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-900/50 rounded-[1.5rem] border border-slate-800">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">מקור הגעה</p>
                                            <p className="text-sm font-bold text-slate-300">{lead.source || 'לא ידוע'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">קשר אחרון</p>
                                            <p className="text-sm font-bold text-slate-300">{lead.lastContact || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">הערות</p>
                                            <p className="text-sm font-medium text-slate-400 truncate">{lead.notes || 'אין הערות'}</p>
                                        </div>
                                    </div>
                                </NeonCard>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* AI Insights Neon */}
                <NeonCard title="✨ תובנות AI חכמות" className="bg-slate-900/40! border-amber-500/20!">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="h-24 w-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-amber-500 text-4xl shadow-inner animate-pulse">
                            <Sparkles />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="text-lg text-slate-300 font-medium leading-relaxed italic whitespace-pre-wrap">
                                {aiInsights || "לחץ ליצירת המלצות חכמות לשיפור יחסי ההמרה המבוססות על מודל Gemini Pro."}
                            </div>
                            <NeonButton
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const res = await generateLeadsInsights(leads);
                                        setAiInsights(res.text || res.error || "שגיאה ביצירת המלצות");
                                    } catch (e) {
                                        toast.error("שגיאה בחיבור ל-AI");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading || leads.length === 0}
                                className="shadow-2xl shadow-amber-500/10"
                            >
                                <Sparkles size={18} className="ml-2" /> {loading ? "מחשב תובנות..." : "צור המלצות"}
                            </NeonButton>
                        </div>
                    </div>
                </NeonCard>
            </div>
        </DashboardShell>
    );
}
