"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { generateLeadsInsights } from "@/app/actions/gemini";

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

                // Demo: If empty, populate with some mock data just so the agent sees something
                if (fetched.length === 0) {
                    const mockLeads = [
                        { name: "דניאל כהן", phone: "052-1111111", email: "daniel@example.com", source: "פייסבוק", status: "חדש", score: 85, lastContact: "היום", notes: "מעוניין בביטוח בריאות" },
                        { name: "תמר לוי", phone: "053-2222222", email: "tamar@example.com", source: "Google Ads", status: "בטיפול", score: 72, lastContact: "אתמול", notes: "ביקש הצעת מחיר לביטוח רכב" },
                        { name: "אורי מזרחי", phone: "054-3333333", email: "uri@example.com", source: "המלצה", status: "פגישה נקבעה", score: 95, lastContact: "לפני 2 ימים", notes: "המלצה מלקוח קיים - VIP" },
                        { name: "נועה דוד", phone: "050-4444444", email: "noa@example.com", source: "אתר", status: "חדש", score: 68, lastContact: "היום", notes: "מילאה טופס באתר" },
                    ];
                    // Should we auto-save? Let's just create one for now or leave empty in prod.
                    // For the user request, let's keep it "real" but maybe seed one if they click "Add Mock".
                    setLeads([]);
                } else {
                    setLeads(fetched);
                }
            } catch (e) {
                console.error(e);
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
            status: "new" as const,
            score: 50,
            lastContact: new Date(),
            notes: "נוצר ידנית"
        };
        const id = await firestoreService.addLead(newLead as any);
        setLeads(prev => [...prev, { ...newLead, id }]);
    };

    const updateLeadStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        await firestoreService.updateLead(id, { status: newStatus } as any);
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-success bg-success/10 border-success/20";
        if (score >= 60) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
        return "text-red-600 bg-red-500/10 border-red-500/20";
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "חדש": return "bg-blue-100 text-blue-600 border-blue-200";
            case "בטיפול": return "bg-amber-100 text-amber-600 border-amber-200";
            case "פגישה נקבעה": return "bg-success/10 text-success border-success/20";
            case "לא מגיב": return "bg-slate-100 text-slate-600 border-slate-200";
            default: return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">ניהול לידים</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                עקוב אחר כל הלידים שלך, נהל תהליכי מכירה והפוך לידים ללקוחות משלמים.
                            </p>
                        </div>
                        <Button onClick={handleCreateTestLead} variant="glass" className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                            + ליד חדש
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך לידים", value: stats.total, icon: "📊", color: "from-blue-600 to-indigo-700" },
                        { label: "לידים חדשים", value: stats.new, icon: "✨", color: "from-emerald-600 to-teal-700" },
                        { label: "בטיפול", value: stats.inProgress, icon: "⚡", color: "from-amber-500 to-orange-600" },
                        { label: "פגישות קבועות", value: stats.scheduled, icon: "📅", color: "from-purple-600 to-indigo-700" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {["הכל", "חדש", "בטיפול", "פגישה נקבעה", "לא מגיב"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedStatus === status
                                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Leads Grid */}
                <div className="grid gap-6">
                    {loading ? <p className="text-center text-slate-400">טוען לידים...</p> : filteredLeads.map((lead) => (
                        <Card key={lead.id} className="border-none shadow-xl bg-white hover:shadow-2xl transition-all group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                                            {lead.name ? lead.name.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-primary">{lead.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-bold text-slate-400">{lead.phone}</span>
                                                <span className="text-xs font-medium text-slate-400">{lead.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getScoreColor(lead.score || 0)}>
                                            ציון: {lead.score || 0}
                                        </Badge>
                                        <Badge className={getStatusColor(lead.status)}>
                                            {lead.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מקור</p>
                                        <p className="text-sm font-bold text-primary">{lead.source || 'לא ידוע'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">קשר אחרון</p>
                                        <p className="text-sm font-bold text-primary">{lead.lastContact || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">הערות</p>
                                        <p className="text-sm font-medium text-slate-600 truncate">{lead.notes || ''}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={() => updateLeadStatus(lead.id, "בטיפול")} variant="secondary" size="sm" className="flex-1">
                                        📞 התקשר / בטיפול
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        ✉️ שלח מייל
                                    </Button>
                                    <Button onClick={() => updateLeadStatus(lead.id, "פגישה נקבעה")} variant="outline" size="sm" className="flex-1">
                                        📅 קבע פגישה
                                    </Button>
                                    <Button variant="outline" size="sm" className="px-4">
                                        ✏️
                                    </Button>
                                    <Button onClick={async () => {
                                        if (confirm("האם להמיר ליד זה ללקוח? הליד יעבור לסטטוס 'בוצעה המרה' ויוצר כרטיס לקוח חדש.")) {
                                            try {
                                                // 1. Create Client
                                                await firestoreService.addClient({
                                                    firstName: lead.name.split(' ')[0] || lead.name,
                                                    lastName: lead.name.split(' ').slice(1).join(' ') || '',
                                                    email: lead.email,
                                                    phone: lead.phone,
                                                    status: 'active',
                                                    source: lead.source,
                                                    notes: lead.notes
                                                } as any);

                                                // 2. Update Lead Status
                                                await updateLeadStatus(lead.id, "won");

                                                alert("הליד הומר ללקוח בהצלחה! 🎉");
                                            } catch (e: any) {
                                                console.error(e);
                                                alert("שגיאה בהמרה: " + e.message);
                                            }
                                        }
                                    }} variant="outline" size="sm" className="px-4 text-emerald-600 hover:bg-emerald-50 border-emerald-200">
                                        🤝
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {!loading && filteredLeads.length === 0 && <div className="text-center py-10 opacity-50 font-black italic">אין לידים להצגה</div>}
                </div>

                {/* AI Insights */}
                <Card className="border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-accent"></div>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent text-xl animate-pulse">
                            ✨
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black mb-2">המלצות AI</h3>
                            <div className="text-sm text-slate-300 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                                {aiInsights || "לחץ ליצירת המלצות חכמות לשיפור יחסי ההמרה."}
                            </div>
                            <Button
                                onClick={async () => {
                                    setLoading(true);
                                    const res = await generateLeadsInsights(leads);
                                    setAiInsights(res.text || res.error || "שגיאה ביצירת המלצות");
                                    setLoading(false);
                                }}
                                variant="secondary"
                                size="sm"
                                className="shadow-xl shadow-accent/20"
                                disabled={loading}
                            >
                                {loading && !aiInsights ? "מעבד..." : "צור המלצות"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
