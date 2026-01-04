"use client";

import { useState, useEffect } from "react";
import { generateSalesTips } from "@/app/actions/gemini";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";

export default function SalesPage() {
    const { user } = useAuth();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiTips, setAiTips] = useState("");

    const stages = [
        { id: "lead", title: "ליד חדש", color: "bg-blue-500" },
        { id: "contact", title: "נוצר קשר", color: "bg-purple-500" },
        { id: "proposal", title: "הצעה נשלחה", color: "bg-amber-500" },
        { id: "negotiation", title: "משא ומתן", color: "bg-orange-500" },
        { id: "closed", title: "נסגר", color: "bg-success" },
    ];

    useEffect(() => {
        const loadDeals = async () => {
            setLoading(true);
            try {
                const fetched = await firestoreService.getDeals();

                // Demo: Populate if empty
                if (fetched.length === 0) {
                    const mockDeals = [
                        { client: "דניאל כהן", product: "ביטוח בריאות", value: "2400", probability: 70, stage: "lead" },
                        { client: "תמר לוי", product: "ביטוח רכב", value: "3200", probability: 60, stage: "lead" },
                        { client: "אורי מזרחי", product: "פנסיה", value: "18000", probability: 85, stage: "contact" },
                        { client: "נועה דוד", product: "ביטוח דירה", value: "1320", probability: 75, stage: "proposal" },
                        { client: "יונתן ישראלי", product: "ביטוח מנהלים", value: "7800", probability: 90, stage: "negotiation" },
                        { client: "מיכל ברק", product: "ביטוח בריאות", value: "2880", probability: 100, stage: "closed" },
                    ];
                    setDeals([]); // Start empty for now, or we could auto-create one. 
                    // User can click "Add Deal" to test.
                } else {
                    setDeals(fetched);
                }
            } catch (e) {
                console.error(e);
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
            stage: "discovery" as const,
            createdAt: new Date()
        };
        const id = await firestoreService.addDeal(newDeal as any);
        setDeals(prev => [...prev, { ...newDeal, id }]);
    };

    const updateStage = async (deal: any, direction: 'next' | 'prev') => {
        const currentIdx = stages.findIndex(s => s.id === deal.stage);
        if (currentIdx === -1) return;

        const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= stages.length) return;

        const newStage = stages[newIdx].id;

        // Optimistic
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
        await firestoreService.updateDeal(deal.id, { stage: newStage } as any);
    };

    const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
    const closedValue = deals.filter(d => d.stage === 'closed').reduce((sum, deal) => sum + Number(deal.value || 0), 0);

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">ניהול מכירות (Kanban)</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                עקוב אחר תהליכי המכירה שלך בצורה ויזואלית. נהל עסקאות משלב הליד ועד לסגירה.
                            </p>
                        </div>
                        <Button onClick={handleAddTestDeal} variant="glass" className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                            + עסקה חדשה
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך עסקאות", value: deals.length, icon: "📊", color: "from-blue-600 to-indigo-700" },
                        { label: "שווי כולל", value: `₪${totalValue.toLocaleString()}`, icon: "💰", color: "from-emerald-600 to-teal-700" },
                        { label: "נסגרו", value: deals.filter(d => d.stage === 'closed').length, icon: "✅", color: "from-success to-emerald-600" },
                        { label: "שווי סגור", value: `₪${closedValue.toLocaleString()}`, icon: "💎", color: "from-purple-600 to-indigo-700" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-2xl md:text-3xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Kanban Board */}
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-6 min-w-max">
                        {stages.map((stage) => {
                            const stageDeals = deals.filter(d => d.stage === stage.id);
                            return (
                                <div key={stage.id} className="w-80 flex-shrink-0">
                                    <Card className="border-none shadow-xl bg-white h-full">
                                        <div className={`h-2 w-full ${stage.color}`} />
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-base font-black text-primary">{stage.title}</h3>
                                                <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                                                    {stageDeals.length}
                                                </Badge>
                                            </div>

                                            <div className="space-y-4">
                                                {loading ? <p className="text-xs text-center text-slate-400">טוען...</p> : stageDeals.map((deal) => (
                                                    <div
                                                        key={deal.id}
                                                        className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-lg hover:border-accent/30 transition-all group relative"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h4 className="text-sm font-black text-primary group-hover:text-accent transition-colors">
                                                                    {deal.client}
                                                                </h4>
                                                                <p className="text-xs font-medium text-slate-400 mt-1">
                                                                    {deal.product}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {stage.id !== 'lead' && <button onClick={() => updateStage(deal, 'prev')} className="text-xs p-1 bg-slate-200 rounded hover:bg-slate-300">➡️</button>}
                                                                {stage.id !== 'closed' && <button onClick={() => updateStage(deal, 'next')} className="text-xs p-1 bg-slate-200 rounded hover:bg-slate-300">⬅️</button>}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-lg font-black text-primary tracking-tighter">
                                                                ₪{Number(deal.value).toLocaleString()}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${stage.color} rounded-full`}
                                                                        style={{ width: `${deal.probability || 50}%` }}
                                                                     />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400">
                                                                    {deal.probability || 50}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {stage.id === 'lead' && (
                                                    <button onClick={handleAddTestDeal} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-all text-sm font-bold">
                                                        + הוסף עסקה
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Performance */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl bg-white p-8">
                        <h3 className="text-xl font-black text-primary mb-6">ביצועים חודשיים</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-600">יעד מכירות</span>
                                    <span className="text-sm font-black text-primary">₪{closedValue.toLocaleString()} / ₪60,000</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-success to-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((closedValue / 60000) * 100, 100)}%` }}
                                     />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl bg-slate-900 text-white p-8">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                            <span className="text-accent">🎯</span> המלצות לשיפור
                        </h3>
                        <div className="space-y-4">
                            <div className="text-sm text-slate-300 font-medium leading-relaxed mb-4 whitespace-pre-wrap">
                                {aiTips || "לחץ לקבלת טיפים מותאמים אישית לשיפור ביצועי המכירות."}
                            </div>
                            <Button
                                onClick={async () => {
                                    setLoading(true); // Re-using loading state or create a specific one? 
                                    // Better to create a specific one but simpler to reuse for now or just trust the async.
                                    // Actually, let's just update the button text.
                                    const res = await generateSalesTips(deals);
                                    setAiTips(res.text || res.error || "שגיאה ביצירת טיפים");
                                }}
                                variant="secondary"
                                size="sm"
                                className="shadow-xl shadow-accent/20"
                            >
                                צור טיפים חכמים
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    );
}
