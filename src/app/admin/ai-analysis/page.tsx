"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { FileUpload } from "@/components/ui/file-upload";
import { Sparkles, FileText, CheckCircle2, AlertTriangle, ArrowRight, BrainCircuit, Search, Zap } from "lucide-react";

export default function DocumentIntelligencePage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const handleUpload = (file: File) => {
        setIsAnalyzing(true);

        // Mock Analysis Delay
        setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult({
                clientName: "מנחם כהן",
                currentPolicy: {
                    company: "הפניקס",
                    type: "ביטוח בריאות - קו הכסף",
                    price: "₪320 / חודש",
                    renewal: "01/04/2026"
                },
                insights: [
                    {
                        type: "opportunity",
                        title: "שדרוג כיסוי אמבולטורי",
                        description: "לפי קובץ 'השוואה מוצרי הבריאות 2024', המוצר הנוכחי של הלקוח כולל תקרה נמוכה לייעוצים (עד ₪600).",
                        recommendation: "במוצר 'מגן זהב' שלנו, התקרה היא ₪900 לייעוץ. זהו טיעון מכירה חזק לשדרוג.",
                        impact: "high"
                    },
                    {
                        type: "warning",
                        title: "היעדר כיסוי לתרופות בהתאמה אישית",
                        description: "בפוליסה שנסרקה לא נמצא נספח תרופות מתקדם.",
                        recommendation: "זהו 'חור' ביטוחי משמעותי. מומלץ להציע את הנספח החדש שלנו שזכה בדירוג הגבוה ביותר ב-2024.",
                        impact: "critical"
                    },
                    {
                        type: "price",
                        title: "חיסכון פוטנציאלי",
                        description: "הלקוח משלם פרמיה גבוהה יחסית לגילו (45).",
                        recommendation: "ניתן להוזיל את העלות החודשית ל-₪285 תוך שיפור הכיסויים המרכזיים.",
                        impact: "medium"
                    }
                ]
            });
        }, 2500);
    };

    return (
        <DashboardShell role="מנהל">
            <div className="space-y-8" dir="rtl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 mb-2 font-display">
                            ניתוח מסמכים חכם <span className="text-accent">AI</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl">
                            העלה פוליסות של לקוחות, והבינה המלאכותית שלנו תנתח אותן מול בסיס הידע של הסוכנות כדי למצוא הזדמנויות מכירה ושיפור כיסויים.
                        </p>
                    </div>

                    {/* Knowledge Base Indicator */}
                    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100 flex items-center gap-3 py-3 px-5 mb-1 md:mb-0">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse">
                            <BrainCircuit size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">מחובר לבסיס ידע</p>
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <FileText size={12} />
                                יתרונות חברות ביטוח\השוואה מוצרי הבריאות 2024.pdf
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-xl relative overflow-hidden">
                            <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                                <Search size={20} className="text-accent" />
                                סריקת פוליסה
                            </h3>

                            <FileUpload
                                label="גרור פוליסה לכאן (PDF)"
                                onUpload={handleUpload}
                            />

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">קבצים שנסרקו לאחרונה</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500 opacity-60">
                                        <FileText size={14} /> פוליסת מנורה - ישראל ישראלי
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500 opacity-60">
                                        <FileText size={14} /> ביטוח רכב - דני דין
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Status Card (Simulating connectivity) */}
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                Magen Intelligence Engine v2.1
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Analysis Results */}
                    <div className="lg:col-span-2">
                        {isAnalyzing ? (
                            <Card className="min-h-[400px] flex flex-col items-center justify-center border-none shadow-none bg-transparent">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-accent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="text-accent animate-pulse" size={32} />
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-primary mt-8 animate-pulse">מנתח מסמך...</h3>
                                <p className="text-slate-400 font-medium mt-2">משווה נתונים מול "השוואה מוצרי הבריאות 2024"</p>
                            </Card>
                        ) : analysisResult ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                                {/* Client & Policy Snapshot */}
                                <Card className="bg-white border-none shadow-xl border-t-4 border-t-accent">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-black text-primary">דוח ניתוח חכם</h2>
                                            <p className="text-sm font-bold text-slate-400">עבור: {analysisResult.clientName}</p>
                                        </div>
                                        <Badge variant="primary" className="px-3 py-1">זוהתה פוליסה פעילה</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חברה מבטחת</p>
                                            <p className="font-black text-primary">{analysisResult.currentPolicy.company}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סוג מוצר</p>
                                            <p className="font-black text-primary">{analysisResult.currentPolicy.type}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פרמיה נוכחית</p>
                                            <p className="font-black text-primary">{analysisResult.currentPolicy.price}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך חידוש</p>
                                            <p className="font-black text-primary">{analysisResult.currentPolicy.renewal}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Insights Grid */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-primary flex items-center gap-2">
                                        <Zap className="text-yellow-500 fill-yellow-500" />
                                        תובנות והזדמנויות
                                    </h3>

                                    {analysisResult.insights.map((insight: any, i: number) => (
                                        <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                                            <div className="flex gap-4">
                                                <div className={`w-1.5 self-stretch rounded-full ${insight.impact === 'critical' ? 'bg-red-500' :
                                                    insight.impact === 'high' ? 'bg-orange-500' : 'bg-emerald-500'
                                                    }`}></div>

                                                <div className="flex-1 py-2">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-lg font-black text-primary mb-2 group-hover:text-accent transition-colors">
                                                            {insight.title}
                                                        </h4>
                                                        {insight.impact === 'critical' && <Badge variant="error">קריטי</Badge>}
                                                        {insight.impact === 'high' && <Badge variant="warning">הזדמנות גבוהה</Badge>}
                                                    </div>

                                                    <p className="text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <span className="font-bold">הממצא:</span> {insight.description}
                                                    </p>

                                                    <div className="flex items-start gap-3">
                                                        <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                        <p className="text-sm font-bold text-accent">
                                                            {insight.recommendation}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Generate Proposal Action */}
                                <div className="flex justify-end gap-4 mt-8">
                                    <Button variant="outline">שמור בדף לקוח</Button>
                                    <Button className="pl-4 pr-6">
                                        הפק מסמך השוואה ללקוח <ArrowRight size={18} className="mr-2" />
                                    </Button>
                                </div>

                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                                <div className="h-40 w-40 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                    <FileText size={64} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400">ממתין לקובץ...</h3>
                                <p className="text-slate-400 font-medium max-w-xs mt-2">
                                    גרור את הפוליסה לאזור המסומן כדי להתחיל בניתוח האוטומטי
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
