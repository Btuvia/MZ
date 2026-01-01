"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { Zap, Plus, Calendar, Target, Trophy, Info, X, Sparkles, TrendingUp, Gift, Building2, Brain, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateWithGemini } from "@/app/actions/gemini";

// --- Types ---

type Campaign = {
    id: string;
    company: "הפניקס" | "מנורה" | "איילון" | "הראל" | "כלל";
    startDate: string;
    endDate: string;
    target: number;
    prizeValue: number;
    description: string;
    aiAnalysis?: {
        summary: string;
        realValue: string;
        highlight: string;
        caveats: string[];
    };
    status: "active" | "completed" | "upcoming";
};

// --- Mock Data ---

const MOCK_SALES = {
    "הפניקס": 125000,
    "מנורה": 85000,
    "איילון": 42000,
    "הראל": 156000,
    "כלל": 30000
};

const INITIAL_CAMPAIGNS: Campaign[] = [
    {
        id: "1",
        company: "מנורה",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
        target: 100000,
        prizeValue: 15000,
        description: "בונוס מיוחד על עמידה ביעדי בריאות וריסק מעל 100 אלף שח ברבעון הראשון. הפרס הוא חופשה זוגית או שווי ערך כספי.",
        aiAnalysis: {
            summary: "עבור מכירות בריאות וריסק במעל ₪100K ברבעון 1, מקבלים חופשה.",
            realValue: "שווי מוערך כ-₪15,000 (ניתן לפדיון)",
            highlight: "יעד בר השגה - כרגע עומדים על 85%",
            caveats: ["מותנה בשימור תיק מעל 90%"]
        },
        status: "active"
    },
    {
        id: "2",
        company: "הראל",
        startDate: "2024-02-01",
        endDate: "2024-04-01",
        target: 200000,
        prizeValue: 50000,
        description: "תחרות סוכנים מצטיינים - מקום ראשון זוכה ברכב יוקרה לסוף שבוע + מענק כספי.",
        aiAnalysis: {
            summary: "תחרות נפח - הראשון שמגיע ל-200K זוכה בחבילת פרימיום.",
            realValue: "₪50,000 (כולל שווי רכב)",
            highlight: "הראל מובילה במכירות החודש",
            caveats: ["תחרות קשה, נדרש מאמץ מרוכז"]
        },
        status: "active"
    }
];

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
    const [showModal, setShowModal] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Campaign>>({});

    // --- Logic ---

    const calculateProgress = (company: string, target: number) => {
        const sales = MOCK_SALES[company as keyof typeof MOCK_SALES] || 0;
        const percent = Math.min(100, Math.round((sales / target) * 100));
        return { sales, percent };
    };

    const handleAnalyzeAndSave = async () => {
        if (!formData.company || !formData.target || !formData.description) return alert("אנא מלא את כל שדות החובה");

        setLoadingAi(true);
        let analysis = {
            summary: formData.description, // Fallback
            realValue: "לא ניתן לחישוב",
            highlight: "מבצע חדש",
            caveats: [] as string[]
        };

        try {
            const prompt = `
                Analyze this insurance agency campaign description in Hebrew: "${formData.description}".
                Focus on uncovering the "real value" vs "perceived value". Simplify the terms.
                Return strictly JSON: { "summary": "Short simplified 1-line explanation", "realValue": "Estimated true monetary value explanation", "highlight": "Positive aspect", "caveats": ["Scanning hidden condition 1", "Condition 2"] }
                `;
            const res = await generateWithGemini(prompt);
            if (!res.error) {
                analysis = JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim());
            }
        } catch (e) {
            console.error("AI Analysis failed", e);
        } finally {
            setLoadingAi(false);
        }

        const newCampaign: Campaign = {
            id: Date.now().toString(),
            company: formData.company as any,
            startDate: formData.startDate || new Date().toISOString().split('T')[0],
            endDate: formData.endDate || "",
            target: Number(formData.target),
            prizeValue: Number(formData.prizeValue || 0),
            description: formData.description!,
            aiAnalysis: analysis,
            status: "active"
        };

        setCampaigns([...campaigns, newCampaign]);
        setShowModal(false);
        setFormData({});
    };

    const getDaysLeft = (endDate: string) => {
        const diff = new Date(endDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700 pb-20" dir="rtl">

                {/* Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 p-12 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-fuchsia-600/30 via-transparent to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-indigo-500/20 via-transparent to-transparent rounded-full blur-3xl -ml-20 -mb-20"></div>

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
                        <Button
                            onClick={() => setShowModal(true)}
                            className="bg-white text-indigo-900 border-none hover:bg-indigo-50 px-8 py-6 rounded-2xl text-lg font-black shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Plus size={24} className="stroke-[3]" />
                            הוספת מבצע חדש
                        </Button>
                    </div>
                </div>

                {/* Campaigns Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {campaigns.map(campaign => {
                        const { sales, percent } = calculateProgress(campaign.company, campaign.target);
                        const daysLeft = getDaysLeft(campaign.endDate);

                        return (
                            <Card key={campaign.id} className="border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-[2rem]">
                                {/* Card Header with Company & Gradient */}
                                <div className="h-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500"></div>
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
                                                    {campaign.startDate} - {campaign.endDate}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-left">
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
                                            ></div>
                                        </div>
                                    </div>

                                    {/* AI Insights Card */}
                                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-6 border border-slate-100/50 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-indigo-500/10 px-3 py-1 rounded-bl-xl text-[10px] font-black text-indigo-600 flex items-center gap-1">
                                            <Sparkles size={10} />
                                            AI Generated
                                        </div>

                                        <div className="mb-4 pt-2">
                                            <h4 className="flex items-center gap-2 text-indigo-900 font-black mb-1">
                                                <Brain size={16} className="text-indigo-500" />
                                                תקציר המבצע
                                            </h4>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed">"{campaign.aiAnalysis?.summary}"</p>
                                        </div>

                                        <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white/50 mb-3">
                                            <Gift className="text-fuchsia-500 shrink-0" size={20} />
                                            <div>
                                                <span className="text-[10px] uppercase font-black text-slate-400 block">שווי הטבה (AI הערכה)</span>
                                                <span className="font-black text-slate-800">{campaign.aiAnalysis?.realValue}</span>
                                            </div>
                                        </div>

                                        {campaign.aiAnalysis?.caveats && campaign.aiAnalysis.caveats.length > 0 && (
                                            <div className="flex items-start gap-2 mt-2">
                                                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-700 font-medium">{campaign.aiAnalysis.caveats.join(", ")}</p>
                                            </div>
                                        )}

                                        <div className="mt-4 text-[10px] text-slate-400 italic text-center">
                                            מקור: {campaign.description.substring(0, 60)}...
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* New Campaign Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <Card className="w-full max-w-2xl bg-white border-none shadow-2xl overflow-y-auto max-h-[90vh] rounded-3xl">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-indigo-900 flex items-center gap-3">
                                        <Zap className="text-fuchsia-500" />
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
                                                    onClick={() => setFormData({ ...formData, company: c as any })}
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
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">תאריך סיום</label>
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">יעד מכירות (₪)</label>
                                        <input
                                            type="number"
                                            placeholder="לדוגמה: 100000"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            onChange={e => setFormData({ ...formData, target: +e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">שווי הפרס (₪)</label>
                                        <input
                                            type="number"
                                            placeholder="לדוגמה: 5000"
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            onChange={e => setFormData({ ...formData, prizeValue: +e.target.value })}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">פרטי המבצע / אותיות קטנות</label>
                                        <textarea
                                            rows={4}
                                            placeholder="הדבק כאן את טקסט המבצע המקורי מהחברה... ה-AI שלנו ינתח אותו."
                                            className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                        <div className="bg-indigo-50 mt-2 p-3 rounded-xl flex items-center gap-2 text-indigo-600 text-xs font-bold">
                                            <Sparkles size={14} />
                                            הבינה המלאכותית תנתח את הטקסט ותחלץ את התובנות החשובות אוטומטית.
                                        </div>
                                    </div>

                                    <div className="col-span-2 pt-4">
                                        <Button
                                            onClick={handleAnalyzeAndSave}
                                            disabled={loadingAi}
                                            className="w-full py-5 text-lg font-black bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white shadow-xl rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            {loadingAi ? (
                                                <>
                                                    <span className="animate-spin">⏳</span> מנתח נתונים...
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
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
