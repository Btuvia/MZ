"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import LeadReviewModal from "@/components/ui/lead-review-modal";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { analyzeDocument, AnalysisResult, ClientProfile } from "@/lib/services/analysis-service";
import { firestoreService } from "@/lib/firebase/firestore-service";

export default function DocumentAnalysisPage() {
    const router = useRouter();
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [creatingLead, setCreatingLead] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setAnalyzing(true);
        setResults(null);
        try {
            const data = await analyzeDocument(selectedFile);
            setResults(data);
        } catch (error: any) {
            console.error(error);
            alert("שגיאה בניתוח הקובץ: " + (error.message || "נסה שנית"));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCreateLeadClick = () => {
        if (!results) return;
        setShowLeadModal(true);
    };

    const handleConfirmLead = async (clientData: ClientProfile) => {
        if (!results) return;
        setCreatingLead(true);
        setShowLeadModal(false); // Close modal while saving

        try {
            const leadData = {
                name: clientData.name,
                phone: clientData.phone || "",
                email: clientData.email || "",
                source: "הר הביטוח AI",
                status: "new" as const,
                score: 90, // High score for Har HaBituach leads
                lastContact: new Date(),
                notes: `נוצר מניתוח הר הביטוח.\nפוליסות שאותרו: ${results.policies.map(p => p.company).join(", ")}.\nתובנות: ${results.insights.join(". ")}`
            };

            await firestoreService.addLead(leadData as any);
            alert("הליד נוצר בהצלחה!");
            router.push("/agent/leads");
        } catch (error) {
            console.error(error);
            alert("שגיאה ביצירת הליד");
            setShowLeadModal(true); // Re-open modal if error
        } finally {
            setCreatingLead(false);
        }
    };

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Button
                                    variant="glass"
                                    className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-white/20 hover:bg-white/30"
                                    onClick={() => router.back()}
                                >
                                    ➜
                                </Button>
                                <h1 className="text-4xl font-black font-display leading-none">ניתוח הר הביטוח</h1>
                            </div>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                העלה דוח של הר הביטוח וה-AI ינתח אותו, יזהה הזדמנויות וימליץ על פעולות.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Upload Section */}
                    <div className="lg:col-span-1">
                        <Card className="border-none shadow-xl bg-white p-6 h-full">
                            <h2 className="text-xl font-black text-primary mb-6">העלאת דוח</h2>

                            <div
                                className={`
                                    border-3 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative overflow-hidden
                                    ${dragging ? 'border-accent bg-accent/5 scale-105' : 'border-slate-200 hover:border-accent/50 hover:bg-slate-50'}
                                    ${file ? 'bg-emerald-50 border-emerald-200' : ''}
                                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                <input
                                    type="file"
                                    id="file-input"
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleFileSelect}
                                />

                                {file ? (
                                    <div className="py-8 animate-in zoom-in">
                                        <div className="text-5xl mb-4">📄</div>
                                        <p className="font-bold text-emerald-600">{file.name}</p>
                                        <p className="text-xs text-slate-400 mt-2">לחץ להחלפה</p>
                                    </div>
                                ) : (
                                    <div className="py-8">
                                        <div className="text-5xl mb-4 text-slate-300">📤</div>
                                        <p className="font-bold text-slate-600">גרור קובץ לכאן</p>
                                        <p className="text-xs text-slate-400 mt-2">או לחץ לבחירה</p>
                                        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest">PDF, PNG, JPG</p>
                                    </div>
                                )}
                            </div>

                            {analyzing && (
                                <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
                                    <div className="inline-block relative">
                                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-accent animate-spin mb-4"></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
                                    </div>
                                    <h3 className="font-black text-lg text-primary">מנתח מסמך...</h3>
                                    <p className="text-sm text-slate-500">זה ייקח מספר שניות</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                        {results ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                                {/* Client Info */}
                                <Card className="border-none shadow-lg bg-white p-6">
                                    <h3 className="text-lg font-black text-primary mb-4 flex items-center gap-2">
                                        👤 פרטי לקוח שזוהו
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">שם מלא</p>
                                            <p className="font-bold text-primary">{results.client.name}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">תעודת זהות</p>
                                            <p className="font-bold text-primary">{results.client.idNumber}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">תאריך לידה</p>
                                            <p className="font-bold text-primary">{results.client.birthDate}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">כתובת</p>
                                            <p className="font-bold text-primary truncate" title={results.client.address}>{results.client.address}</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Policies Table */}
                                <Card className="border-none shadow-lg bg-white overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="text-lg font-black text-primary flex items-center gap-2">
                                            📋 תיק ביטוחי
                                        </h3>
                                        <Badge className="bg-blue-100 text-blue-700">
                                            {results.policies.length} פוליסות
                                        </Badge>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">חברה</th>
                                                    <th className="px-6 py-4">סוג מוצר</th>
                                                    <th className="px-6 py-4">פרמיה</th>
                                                    <th className="px-6 py-4">תוקף</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {results.policies.map((policy) => (
                                                    <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-primary">{policy.company}</td>
                                                        <td className="px-6 py-4">{policy.type}</td>
                                                        <td className="px-6 py-4 font-mono font-bold">₪{policy.premium}</td>
                                                        <td className="px-6 py-4 text-slate-500">{policy.endDate}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Insights & Actions */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-lg bg-indigo-900 text-white p-6">
                                        <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                            ✨ תובנות AI
                                        </h3>
                                        <ul className="space-y-3">
                                            {results.insights.map((insight, idx) => (
                                                <li key={idx} className="flex gap-3 text-sm font-medium text-indigo-100 bg-indigo-800/50 p-3 rounded-xl border border-indigo-700/50">
                                                    <span>💡</span>
                                                    {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>

                                    <Card className="border-none shadow-lg bg-white p-6 flex flex-col justify-center items-center text-center space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-2">
                                            🚀
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-primary">מוכן להתקדם?</h3>
                                            <p className="text-slate-500 text-sm">הפוך את המידע לליד פעיל והתחל במכירה</p>
                                        </div>
                                        <Button
                                            onClick={handleCreateLeadClick}
                                            disabled={creatingLead}
                                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/20 py-6 text-lg"
                                        >
                                            {creatingLead ? "יוצר ליד..." : "צור ליד חדש במערכת ➜"}
                                        </Button>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            !analyzing && (
                                <div className="h-full flex items-center justify-center p-12 text-center opacity-30 mt-12 lg:mt-0">
                                    <div>
                                        <div className="text-8xl mb-6 grayscale">📄</div>
                                        <h3 className="text-2xl font-black text-slate-900">ממתין לדוח</h3>
                                        <p className="text-slate-500">העלה קובץ כדי לראות את הקסם קורה</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Lead Review Modal */}
                {results && (
                    <LeadReviewModal
                        isOpen={showLeadModal}
                        onClose={() => setShowLeadModal(false)}
                        onSubmit={handleConfirmLead}
                        initialData={results.client}
                    />
                )}
            </div>
        </DashboardShell>
    );
}
