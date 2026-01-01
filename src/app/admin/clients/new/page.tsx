"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { UserPlus, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function NewClientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        idNumber: "",
        phone: "",
        email: "",
        status: "פעיל" as const,
        address: { city: "תל אביב", street: "הירקון", num: "1" },
        employment: { status: "שכיר", occupation: "עצמאי" },
        family: [],
        policies: [],
        tasks: [],
        pensionSales: [],
        insuranceSales: [],
        documents: [],
        interactions: []
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setShowFallback(false);

        // Timer to show a "Skip" button if Firebase is hanging
        const timer = setTimeout(() => {
            setShowFallback(true);
            setLastError("הפעולה לוקחת יותר מדי זמן (Timeout). בדוק את החיבור לאינטרנט.");
            console.log("Creation taking longer than expected... showing fallback.");
        }, 10000);

        try {
            console.log("Attempting to save client to Firestore...");
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const clientData = {
                ...formData,
                name: fullName,
                createdAt: new Date().toISOString()
            };

            // Use client-side Firestore SDK (Firebase Admin not configured)
            const newId = await firestoreService.addClient(clientData);

            clearTimeout(timer);
            console.log("Success! New ID:", newId);
            toast.success("לקוח נוצר בהצלחה!");
            router.push(`/admin/clients/${newId}`);
        } catch (error: any) {
            clearTimeout(timer);
            console.error("Firebase Error:", error);
            toast.error(`שגיאה בשמירה: ${error.message || "בדוק חיבור אינטרנט"}`);
            setLastError(error.message || "שגיאה לא ידועה");
            setLoading(false);
            setShowFallback(true);
        }
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700" dir="rtl">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.push('/admin/dashboard')}
                            className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-2 text-sm font-bold"
                        >
                            <ArrowRight size={16} /> חזרה ללוח הבקרה
                        </button>
                        <h1 className="text-4xl font-black text-primary italic font-display leading-tight">
                            הוספת לקוח חדש
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <Card className="p-10 border-none shadow-2xl bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-2.5 h-full bg-accent group-hover:bg-blue-600 transition-colors"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">שם פרטי</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="שם פרטי"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">שם משפחה</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="שם משפחה"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">תעודת זהות</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    placeholder="מספר ת.ז"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">טלפון נייד</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="טלפון ליצירת קשר"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-2">דואר אלקטרוני</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-6 pt-4">
                        <Button
                            type="submit"
                            disabled={loading && !showFallback}
                            className="w-full py-6 shadow-2xl shadow-accent/20 text-xl font-black rounded-[1.5rem]"
                            variant="secondary"
                        >
                            {loading && !showFallback ? (
                                <span className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    מעבד נתונים ב-Firebase...
                                </span>
                            ) : (
                                <span className="flex items-center gap-3">
                                    <CheckCircle2 size={24} />
                                    צור לקוח והמשך לכרטיסייה
                                </span>
                            )}
                        </Button>

                        {showFallback && (
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 animate-in fade-in zoom-in duration-500 shadow-3xl text-right">
                                <div className="flex items-start gap-4 text-white mb-6">
                                    <AlertTriangle size={28} className="text-amber-400 shrink-0 mt-1" />
                                    <div>
                                        <p className="text-lg font-black italic mb-2">משהו עוצר את השמירה...</p>
                                        <p className="text-sm text-slate-400 font-bold leading-relaxed">
                                            ייתכן שישנה בעיית הרשאות, תקשורת או שה-FIrebase טרם הוגדר כראוי לחלוטין.
                                            כדי לא לעכב אותך, תוכל לעקוף את השמירה ולהיכנס לממשק הלקוח במצב דמו.
                                        </p>
                                        {lastError && (
                                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-200 font-mono" dir="ltr">
                                                Error: {lastError}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/clients/active')}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black transition-all shadow-xl text-md flex items-center justify-center gap-3"
                                >
                                    <span>🚀</span>
                                    מעקף מהיר: המשך לכרטיסיית דמו
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => router.push('/admin/dashboard')}
                            className="text-xs font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em] transition-colors"
                        >
                            ביטול וחזרה
                        </button>
                    </div>
                </form>
            </div>
        </DashboardShell>
    );
}
