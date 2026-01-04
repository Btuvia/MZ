"use client";

import { Plus, Calendar, X, Sparkles, Gift, Building2, Brain, AlertCircle, CheckCircle2, RefreshCcw, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { generateWithGemini } from "@/app/actions/gemini";
import { Card, Button } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useDeals } from "@/lib/hooks/useQueryHooks";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

// --- Types ---

type Campaign = {
    id: string;
    company: string;
    productType: string;
    discountPercent: number;
    startDate: Date;
    endDate: Date;
    minPremium: number;
    target: number;
    current: number;
    createdAt: Date;
};

type CampaignFormData = {
    company?: string;
    productType?: string;
    discountPercent?: number;
    startDate?: string;
    endDate?: string;
    target?: number;
};

export default function CampaignsPage() {
    const [showModal, setShowModal] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);
    const [formData, setFormData] = useState<CampaignFormData>({});

    // Firebase Hooks
    const { data: campaigns = [], isLoading, refetch } = useCampaigns();
    const { data: deals = [] } = useDeals();
    const createCampaign = useCreateCampaign();
    const deleteCampaign = useDeleteCampaign();

    // Calculate actual sales per company from deals
    const salesByCompany = useMemo(() => {
        const sales: Record<string, number> = {};
        deals.forEach(deal => {
            // Extract company from deal title or clientName
            const title = (deal.title || '').toLowerCase();
            const company = 
                title.includes('הראל') ? 'הראל' :
                title.includes('הפניקס') ? 'הפניקס' :
                title.includes('מנורה') ? 'מנורה' :
                title.includes('איילון') ? 'איילון' :
                title.includes('כלל') ? 'כלל' :
                title.includes('מגדל') ? 'מגדל' : 'אחר';
            sales[company] = (sales[company] || 0) + (deal.value || 0);
        });
        return sales;
    }, [deals]);

    const calculateProgress = (company: string, target: number) => {
        const sales = salesByCompany[company] || 0;
        const percent = target > 0 ? Math.min(100, Math.round((sales / target) * 100)) : 0;
        return { sales, percent };
    };

    const handleAnalyzeAndSave = async () => {
        if (!formData.company || !formData.target || !formData.productType) {
            alert("אנא מלא את כל שדות החובה");
            return;
        }

        setLoadingAi(true);

        try {
            // Optional: AI analysis of product type
            const prompt = `
                Analyze this insurance product type in Hebrew: "${formData.productType}".
                Just return a brief summary.
            `;
            const res = await generateWithGemini(prompt);
            console.log("AI response:", res);
        } catch (e) {
            console.error("AI Analysis failed", e);
        } finally {
            setLoadingAi(false);
        }

        const newCampaign = {
            company: formData.company,
            productType: formData.productType,
            discountPercent: Number(formData.discountPercent || 0),
            startDate: new Date(formData.startDate || Date.now()),
            endDate: new Date(formData.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
            minPremium: 0,
            target: Number(formData.target),
        };

        try {
            await createCampaign.mutateAsync(newCampaign);
            setShowModal(false);
            setFormData({});
        } catch (error) {
            console.error("Error creating campaign:", error);
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!confirm("האם למחוק קמפיין זה?")) return;
        try {
            await deleteCampaign.mutateAsync(id);
        } catch (error) {
            console.error("Error deleting campaign:", error);
        }
    };

    const getDaysLeft = (endDate: string) => {
        if (!endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700 pb-20" dir="rtl">

                {/* Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-fuchsia-600/30 via-transparent to-transparent rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-indigo-500/20 via-transparent to-transparent rounded-full blur-3xl -ml-20 -mb-20" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-right">
                            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight flex items-center justify-center md:justify-start gap-4">
                                <span className="bg-white/10 p-3 rounded-2xl backdrop-blur-md shadow-lg border border-white/10">🎁</span>
                                ניהול מבצעים בחברות
                            </h1>
                            <p className="text-indigo-200 text-lg font-medium max-w-xl mx-auto md:mx-0">
                                מערכת מעקב ובקרה אחר יעדי מכירות ומבצעי סוכנות. ה-AI שלנו יעזור לך להבין את השורות הקטנות.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => refetch()}
                                className="bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-4 rounded-xl font-black"
                            >
                                <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                            </Button>
                            <Button
                                onClick={() => setShowModal(true)}
                                className="bg-white text-indigo-900 border-none hover:bg-indigo-50 px-8 py-6 rounded-2xl text-lg font-black shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <Plus size={24} className="stroke-[3]" />
                                הוספת מבצע חדש
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? <div className="flex items-center justify-center py-20">
                        <RefreshCcw className="animate-spin text-indigo-500" size={40} />
                    </div> : null}

                {/* Empty State */}
                {!isLoading && campaigns.length === 0 && (
                    <Card className="p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                            <Gift size={40} className="text-indigo-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">אין מבצעים פעילים</h3>
                        <p className="text-slate-500 mb-6">התחל להוסיף מבצעים של חברות הביטוח כדי לעקוב אחרי היעדים</p>
                        <Button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-xl"
                        >
                            <Plus size={18} className="ml-2" />
                            הוסף מבצע ראשון
                        </Button>
                    </Card>
                )}

                {/* Campaigns Grid */}
                {!isLoading && campaigns.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {campaigns.map((campaign) => {
                            const { sales, percent } = calculateProgress(campaign.company, campaign.target);
                            const daysLeft = getDaysLeft(campaign.endDate instanceof Date ? campaign.endDate.toISOString().split('T')[0] : String(campaign.endDate));

                            return (
                                <Card key={campaign.id} className="border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                                    {/* Card Header with Company & Gradient */}
                                    <div className="h-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />
                                    <div className="p-8 relative">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">
                                                    <Building2 className="text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-800">{campaign.company}</h3>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                                                        <Calendar size={12} />
                                                        {campaign.startDate instanceof Date ? campaign.startDate.toLocaleDateString('he-IL') : String(campaign.startDate)} - {campaign.endDate instanceof Date ? campaign.endDate.toLocaleDateString('he-IL') : String(campaign.endDate)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {percent >= 100 ? (
                                                    <div className="flex flex-col items-end text-emerald-500 animate-pulse">
                                                        <CheckCircle2 size={32} />
                                                        <span className="text-xs font-black">הושלם!</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-3xl font-black text-slate-800">{daysLeft}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase font-black">ימים נותרו</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Section */}
                                        <div className="mb-8">
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <span className="text-3xl font-black text-indigo-600 block pl-2">₪{sales.toLocaleString()}</span>
                                                    <span className="text-xs text-slate-400 font-bold">מתוך ₪{campaign.target.toLocaleString()}</span>
                                                </div>
                                                <span className="text-xl font-black text-indigo-600">{percent}%</span>
                                            </div>
                                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-fuchsia-500'}`}
                                                    style={{ width: `${percent}%` }}
                                                 />
                                            </div>
                                        </div>

                                        {/* Campaign Details Card */}
                                        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-6 border border-slate-100/50 relative overflow-hidden">
                                            <div className="mb-4">
                                                <h4 className="flex items-center gap-2 text-indigo-900 font-black mb-1">
                                                    <Brain size={16} className="text-indigo-500" />
                                                    סוג המוצר
                                                </h4>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{campaign.productType}</p>
                                            </div>

                                            <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white/50 mb-3">
                                                <Gift className="text-fuchsia-500 shrink-0" size={20} />
                                                <div>
                                                    <span className="text-[10px] uppercase font-black text-slate-400 block">הנחה</span>
                                                    <span className="font-black text-slate-800">{campaign.discountPercent}%</span>
                                                </div>
                                            </div>

                                            {campaign.minPremium > 0 && (
                                                <div className="flex items-start gap-2 mt-2">
                                                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-amber-700 font-medium">פרמיה מינימלית: ₪{campaign.minPremium.toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* New Campaign Modal */}
                {showModal ? <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <Card className="w-full max-w-2xl bg-white border-none shadow-2xl overflow-y-auto max-h-[90vh] rounded-3xl">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
                                        <Sparkles className="text-fuchsia-500" />
                                        הקמת מבצע חדש
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 space-y-2">
                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">חברת ביטוח</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {["הפניקס", "מנורה", "איילון", "הראל"].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormData({ ...formData, company: c as Campaign['company'] })}
                                                    className={`p-3 rounded-xl border-2 font-black transition-all ${formData.company === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">תאריך התחלה</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.startDate || ''}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">תאריך סיום</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.endDate || ''}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">יעד מכירות (₪)</label>
                                        <input
                                            type="number"
                                            placeholder="לדוגמה: 100000"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.target || ''}
                                            onChange={e => setFormData({ ...formData, target: +e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">אחוז הנחה (%)</label>
                                        <input
                                            type="number"
                                            placeholder="לדוגמה: 10"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.discountPercent || ''}
                                            onChange={e => setFormData({ ...formData, discountPercent: +e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">סוג המוצר</label>
                                        <textarea
                                            rows={4}
                                            placeholder="תאר את סוג המוצר (לדוגמה: ביטוח חיים, פנסיה, בריאות...)"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                            value={formData.productType || ''}
                                            onChange={e => setFormData({ ...formData, productType: e.target.value })}
                                        />
                                        <div className="bg-indigo-50 mt-2 p-3 rounded-xl flex items-center gap-2 text-indigo-600 text-xs font-bold">
                                            <Sparkles size={14} />
                                            תיאור ברור יעזור בהתאמת הקמפיין ללקוחות.
                                        </div>
                                    </div>

                                    <div className="col-span-2 pt-4">
                                        <Button
                                            onClick={handleAnalyzeAndSave}
                                            disabled={loadingAi || createCampaign.isPending}
                                            className="w-full py-5 text-lg font-black bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white shadow-xl rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            {loadingAi || createCampaign.isPending ? (
                                                <>
                                                    <RefreshCcw size={20} className="animate-spin" /> מנתח נתונים...
                                                </>
                                            ) : (
                                                <>
                                                    <Brain size={20} /> הפעל מבצע + ניתוח AI
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div> : null}
            </div>
        </DashboardShell>
    );
}
