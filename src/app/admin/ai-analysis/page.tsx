"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { FileUpload } from "@/components/ui/file-upload";
import { Sparkles, FileText, CheckCircle2, ArrowRight, BrainCircuit, Search, Zap, Calendar, Shield, Save } from "lucide-react";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface ExtractedPolicy {
    id: string;
    company: string;
    type: string;
    premium: number;
    expirationDate: string; // YYYY-MM-DD
}

export default function DocumentIntelligencePage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ clientName: string, policies: ExtractedPolicy[] } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleUpload = (file: File) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);

        // Mock Analysis Delay & Har HaBituach Extraction
        setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult({
                clientName: "ישראל ישראלי",
                policies: [
                    { id: "1", company: "הראל", type: "ביטוח רכב (חובה + מקיף)", premium: 4500, expirationDate: "2024-06-15" },
                    { id: "2", company: "מנורה מבטחים", type: "ביטוח דירה", premium: 600, expirationDate: "2024-08-01" },
                    { id: "3", company: "הפניקס", type: "ביטוח בריאות", premium: 120, expirationDate: "2024-12-31" }
                ]
            });
            toast.success("הקובץ ניתוח בהצלחה!");
        }, 2000);
    };

    const handleSmartSchedule = async () => {
        if (!analysisResult) return;
        setIsSaving(true);

        try {
            let tasksCreated = 0;

            for (const policy of analysisResult.policies) {
                // Logic: 1st of the month of expiration
                const expDate = new Date(policy.expirationDate);
                const targetDate = new Date(expDate.getFullYear(), expDate.getMonth(), 1); // 1st of month

                // Create Task
                await firestoreService.addTask({
                    title: `חידוש ${policy.type} - ${analysisResult.clientName}`,
                    description: `הפוליסה בחברת ${policy.company} מסתיימת ב-${policy.expirationDate}. פרמיה נוכחית: ₪${policy.premium}. יש ליצור קשר לשימור/ניוד.`,
                    dueDate: Timestamp.fromDate(targetDate),
                    priority: "high",
                    status: "todo",
                    type: "sales",
                    assignedTo: "agent",
                    clientName: analysisResult.clientName
                });
                tasksCreated++;
            }

            toast.success(`${tasksCreated} משימות חידוש נוצרו בהצלחה ביומן!`);
            // Optional: Clear or reset
        } catch (error) {
            console.error(error);
            toast.error("שגיאה ביצירת המשימות");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardShell role="מנהל">
            <div className="space-y-8" dir="rtl">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 mb-2 font-display">
                            ניתוח הר הביטוח <span className="text-accent">AI</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl">
                            העלה דוח הר הביטוח (Excel/PDF/תמונה), והמערכת תחלץ את תאריכי הפקיעה ותייצר אוטומטית משימות חידוש ל-1 בחודש הרלוונטי.
                        </p>
                    </div>

                    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 flex items-center gap-3 py-3 px-5 mb-1 md:mb-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center animate-pulse">
                            <BrainCircuit size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">מנוע פעיל</p>
                            <p className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                                <Sparkles size={12} />
                                זיהוי אוטומטי של תאריכי תפוגה
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
                                סריקת דוח
                            </h3>

                            <FileUpload
                                label="גרור דוח הר הביטוח לכאן"
                                onUpload={handleUpload}
                                accept=".pdf,.xlsx,.png,.jpg"
                            />

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">קבצים שנסרקו לאחרונה</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-slate-500 opacity-60">
                                        <FileText size={14} /> הר הביטוח 2023 - כהן
                                    </div>
                                </div>
                            </div>
                        </Card>
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
                                <h3 className="text-xl font-black text-primary mt-8 animate-pulse">מפענח נתוני ביטוח...</h3>
                                <p className="text-slate-400 font-medium mt-2">מזהה פוליסות, פרמיות ותאריכי סיום</p>
                            </Card>
                        ) : analysisResult ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

                                <Card className="bg-white border-none shadow-xl border-t-4 border-t-accent">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-2xl font-black text-primary">תוצאות סריקה</h2>
                                            <p className="text-sm font-bold text-slate-400">לקוח מזוהה: {analysisResult.clientName}</p>
                                        </div>
                                        <Badge variant="success" className="px-3 py-1">נמצאו {analysisResult.policies.length} פוליסות</Badge>
                                    </div>

                                    {/* Policy Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="p-3 rounded-tr-lg">חברה</th>
                                                    <th className="p-3">סוג ביטוח</th>
                                                    <th className="p-3">פרמיה</th>
                                                    <th className="p-3">תוקף עד</th>
                                                    <th className="p-3 bg-accent/10 text-accent rounded-tl-lg">תזמון אוטומטי (1 לחודש)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {analysisResult.policies.map((policy) => {
                                                    const expDate = new Date(policy.expirationDate);
                                                    const targetDate = new Date(expDate.getFullYear(), expDate.getMonth(), 1);
                                                    return (
                                                        <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-3 font-medium text-slate-700">{policy.company}</td>
                                                            <td className="p-3 text-slate-600">{policy.type}</td>
                                                            <td className="p-3 font-bold text-slate-800">₪{policy.premium}</td>
                                                            <td className="p-3 text-slate-500">{policy.expirationDate}</td>
                                                            <td className="p-3 font-bold text-accent">
                                                                {targetDate.toLocaleDateString("he-IL")}
                                                                <span className="block text-[10px] text-accent/60 font-normal">יצירת ליד לחידוש</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Actions */}
                                <div className="flex justify-end gap-4 mt-8">
                                    <Button variant="outline" onClick={() => setAnalysisResult(null)}>ביטול / סריקה חדשה</Button>
                                    <Button
                                        className="pl-4 pr-6 bg-accent hover:bg-accent/90 text-white shadow-lg hover:shadow-accent/30 transition-all"
                                        onClick={handleSmartSchedule}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>שומר...</>
                                        ) : (
                                            <>
                                                <Calendar size={18} className="ml-2" />
                                                אשר ותזמן משימות חידוש
                                            </>
                                        )}
                                    </Button>
                                </div>

                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                                <div className="h-40 w-40 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                    <Shield size={64} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-400">העלה דוח הר הביטוח</h3>
                                <p className="text-slate-400 font-medium max-w-xs mt-2">
                                    המערכת תמנע נטישת לקוחות ע"י תזמון פניות יזומות לפני תום תקופת הביטוח
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
