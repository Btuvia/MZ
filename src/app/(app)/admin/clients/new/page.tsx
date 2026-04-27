"use client";

import { UserPlus, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Button } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonCard, NeonButton, NeonInput, NeonSelect } from "@/components/ui/neon-form";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

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
        isSmoker: false,
        idIssueDate: "",
        birthDate: "",
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

        const timer = setTimeout(() => {
            setShowFallback(true);
            setLastError("הפעולה לוקחת יותר מדי זמן (Timeout). בדוק את החיבור לאינטרנט.");
        }, 10000);

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const clientData = {
                ...formData,
                name: fullName,
                createdAt: new Date().toISOString()
            };

            const newId = await firestoreService.addClient(clientData as any);

            clearTimeout(timer);
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
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000" dir="rtl">

                {/* Header - Neon Premium */}
                <div className="relative group p-10 rounded-[3rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <button
                                onClick={() => router.push('/admin/clients')}
                                className="flex items-center gap-2 text-amber-500/60 hover:text-amber-500 transition-colors mb-4 text-[10px] font-black uppercase tracking-widest"
                            >
                                <ArrowRight size={14} className="rotate-180" /> חזרה לרשימת הלקוחות
                            </button>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                <span className="text-amber-500">✨</span> יצירת לקוח חדש
                            </h1>
                            <p className="text-slate-500 font-bold mt-3 text-lg">הוספת פרופיל מבוטח חדש למערכת המגדל</p>
                        </div>
                        <div className="h-20 w-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/5 pulse-amber">👤</div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-10">
                    <NeonCard title="📋 פרטי זיהוי והתקשרות">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                            <NeonInput 
                                label="שם פרטי *" 
                                value={formData.firstName} 
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                                placeholder="לדוגמא: ישראל"
                                required
                            />
                            <NeonInput 
                                label="שם משפחה *" 
                                value={formData.lastName} 
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                                placeholder="לדוגמא: ישראלי"
                                required
                            />
                            <NeonInput 
                                label="תעודת זהות *" 
                                value={formData.idNumber} 
                                onChange={e => setFormData({ ...formData, idNumber: e.target.value })} 
                                placeholder="9 ספרות כולל ספרת ביקורת"
                                required
                            />
                            <NeonInput 
                                label="מספר טלפון *" 
                                value={formData.phone} 
                                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                placeholder="05XXXXXXXX"
                                required
                                dir="ltr"
                            />
                            <div className="md:col-span-2">
                                <NeonInput 
                                    label="כתובת דואר אלקטרוני *" 
                                    type="email"
                                    value={formData.email} 
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} 
                                    placeholder="your@email.com"
                                    required
                                    dir="ltr"
                                />
                            </div>
                            <NeonInput 
                                label="תאריך לידה" 
                                type="date"
                                value={formData.birthDate} 
                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })} 
                            />
                            <NeonInput 
                                label="תאריך הנפקת ת.ז" 
                                type="date"
                                value={formData.idIssueDate} 
                                onChange={e => setFormData({ ...formData, idIssueDate: e.target.value })} 
                            />
                            <NeonSelect 
                                label="האם מעשן" 
                                value={formData.isSmoker ? 'כן' : 'לא'} 
                                onChange={e => setFormData({ ...formData, isSmoker: e.target.value === 'כן' })}
                            >
                                <option value="לא">לא</option>
                                <option value="כן">כן</option>
                            </NeonSelect>
                        </div>
                    </NeonCard>

                    <div className="flex flex-col gap-8 pt-4">
                        <NeonButton
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="w-full py-8 text-2xl shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:shadow-[0_0_70px_rgba(245,158,11,0.4)]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-4 italic animate-pulse">
                                    <div className="w-6 h-6 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                                    מעבד נתונים...
                                </span>
                            ) : (
                                <span className="flex items-center gap-4 italic uppercase">
                                    <CheckCircle2 size={28} />
                                    צור לקוח ופתח תיק מבוטח
                                </span>
                            )}
                        </NeonButton>

                        {showFallback ? <NeonCard title="⚠️ התראה מהמערכת" className="bg-red-500/5! border-red-500/20!">
                                <div className="space-y-6">
                                    <p className="text-slate-400 font-bold leading-relaxed text-right">
                                        זיהינו עיכוב בתקשורת. בדוק את חיבור האינטרנט או הרשאות Firebase.
                                    </p>
                                    <NeonButton
                                        type="button"
                                        onClick={() => router.push('/admin/clients')}
                                        variant="blue"
                                        className="w-full py-6 text-lg shadow-xl shadow-blue-500/10 group"
                                    >
                                        <ArrowRight size={20} className="ml-2 rotate-180 group-hover:-translate-x-2 transition-transform" />
                                        חזרה לרשימת הלקוחות
                                    </NeonButton>
                                </div>
                            </NeonCard> : null}

                        <button
                            type="button"
                            onClick={() => router.push('/admin/clients')}
                            className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] transition-colors"
                        >
                            ביטול וחזרה לרשימה
                        </button>
                    </div>
                </form>
            </div>
        </DashboardShell>
    );
}
