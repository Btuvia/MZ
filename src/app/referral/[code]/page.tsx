"use client";

import { Send, User, Phone, Mail, FileText, CheckCircle, Loader2, Building2, Heart, Briefcase } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import { firestoreService } from "@/lib/firebase/firestore-service";

type CollaboratorInfo = {
    id: string;
    name: string;
    type: string;
};

export default function ReferralPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [collaborator, setCollaborator] = useState<CollaboratorInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        // פרטים אישיים
        firstName: "",
        lastName: "",
        idNumber: "",
        phone: "",
        email: "",
        birthDate: "",
        
        // כתובת
        city: "",
        street: "",
        
        // פרטי עבודה
        occupation: "",
        employmentStatus: "שכיר" as "שכיר" | "עצמאי" | "לא עובד",
        
        // ביטוח
        healthFund: "" as "" | "לאומית" | "כללית" | "מכבי" | "מאוחדת",
        isSmoker: false,
        
        // הערות
        notes: "",
        
        // מה מעניין אותו
        interestArea: "הכל" as "פנסיוני" | "פיננסי" | "ביטוח" | "הכל",
        idIssueDate: ""
    });

    useEffect(() => {
        loadCollaborator();
    }, [code]);

    const loadCollaborator = async () => {
        try {
            const collaborations = await firestoreService.getCollaborations();
            const found = collaborations.find((c) => c.referralCode === code);
            
            if (found && found.id) {
                setCollaborator({
                    id: found.id,
                    name: found.name,
                    type: found.type
                });
            } else {
                setError("קוד הפניה לא תקין או שפג תוקפו");
            }
        } catch (err) {
            console.error("Error loading collaborator:", err);
            setError("שגיאה בטעינת הדף");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            toast.error("יש למלא שם פרטי, שם משפחה וטלפון");
            return;
        }

        if (!collaborator) return;

        setSubmitting(true);
        try {
            // Create lead/client with referral source
            const clientData = {
                name: `${formData.firstName} ${formData.lastName}`,
                firstName: formData.firstName,
                lastName: formData.lastName,
                idNumber: formData.idNumber,
                phone: formData.phone,
                email: formData.email,
                birthDate: formData.birthDate,
                address: {
                    city: formData.city,
                    street: formData.street,
                    num: ""
                },
                employment: {
                    status: formData.employmentStatus,
                    occupation: formData.occupation
                },
                healthFund: formData.healthFund || undefined,
                isSmoker: formData.isSmoker,
                status: "ליד",
                salesStatus: "new_lead",
                
                // Referral Info
                referralSource: collaborator.id,
                referralName: collaborator.name,
                referralCode: code,
                referralNotes: formData.notes,
                
                // Urgency & Hot Lead Status
                isHotLead: true,
                priority: "critical",
                
                // Interests
                interestArea: formData.interestArea,
                idIssueDate: formData.idIssueDate,
                
                // Initial data
                policies: [],
                tasks: [],
                pensionSales: [],
                insuranceSales: [],
                documents: [],
                interactions: [{
                    id: Date.now().toString(),
                    type: 'referral',
                    direction: 'inbound',
                    date: new Date().toLocaleString("he-IL"),
                    summary: `🔥 ליד רותח! הגיע דרך "חבר מביא חבר" מ: ${collaborator.name}\n\nהערות מהמפנה: ${formData.notes || "אין"}`,
                    sentiment: 'positive'
                }],
                
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const addedClient = await firestoreService.addClient(clientData as any);

            // Create an immediate urgent task for the agent
            await firestoreService.addTask({
                title: `🔥 ליד רותח: ${clientData.name}`,
                description: `ליד חדש הגיע מהפניה של ${collaborator.name}. יש לחזור בדחיפות!`,
                priority: "high",
                status: "pending",
                dueDate: new Date().toISOString().split('T')[0],
                clientName: clientData.name,
                clientId: addedClient || "",
                type: "call"
            } as any);
            setSubmitted(true);
            toast.success("הפרטים נשלחו בהצלחה!");
        } catch (err) {
            console.error("Error submitting lead:", err);
            toast.error("שגיאה בשליחת הפרטים, נסה שוב");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">טוען...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4" dir="rtl">
                <Card className="max-w-md w-full p-8 text-center border-none shadow-2xl">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">אופס!</h1>
                    <p className="text-slate-600">{error}</p>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4" dir="rtl">
                <Toaster position="top-center" richColors />
                <Card className="max-w-md w-full p-8 text-center border-none shadow-2xl">
                    <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">תודה רבה! 🎉</h1>
                    <p className="text-slate-600 mb-6">הפרטים נקלטו בהצלחה. נציג יצור איתך קשר בהקדם.</p>
                    <div className="bg-indigo-50 rounded-xl p-4">
                        <p className="text-sm text-indigo-600 font-bold">הופנית על ידי: {collaborator?.name}</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-8 px-4" dir="rtl">
            <Toaster position="top-center" richColors />
            
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white text-3xl font-black shadow-xl mb-4">
                        🛡️
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">מגן זהב</h1>
                    <p className="text-slate-600">סוכנות לביטוח פנסיוני ופיננסי</p>
                    
                    {collaborator ? <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold">
                            <User size={16} />
                            הופנית על ידי: {collaborator.name}
                        </div> : null}
                </div>

                {/* Form */}
                <Card className="border-none shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <User size={20} className="text-indigo-600" />
                                פרטים אישיים
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">שם פרטי *</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">שם משפחה *</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">תעודת זהות</label>
                                    <input
                                        type="text"
                                        value={formData.idNumber}
                                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 mb-1 block">תאריך לידה</label>
                                        <input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none px-2!"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 mb-1 block">תאריך הנפקה</label>
                                        <input
                                            type="date"
                                            value={formData.idIssueDate}
                                            onChange={e => setFormData({ ...formData, idIssueDate: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none px-2!"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <Phone size={20} className="text-emerald-600" />
                                פרטי התקשרות
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">טלפון נייד *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        dir="ltr"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">אימייל</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">עיר</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">רחוב</label>
                                    <input
                                        type="text"
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Employment */}
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <Briefcase size={20} className="text-amber-600" />
                                תעסוקה
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">סטטוס תעסוקתי</label>
                                    <select
                                        value={formData.employmentStatus}
                                        onChange={e => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="שכיר">שכיר</option>
                                        <option value="עצמאי">עצמאי</option>
                                        <option value="לא עובד">לא עובד</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">מקצוע</label>
                                    <input
                                        type="text"
                                        value={formData.occupation}
                                        onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Health */}
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <Heart size={20} className="text-red-500" />
                                בריאות
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">קופת חולים</label>
                                    <select
                                        value={formData.healthFund}
                                        onChange={e => setFormData({ ...formData, healthFund: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">בחר קופת חולים</option>
                                        <option value="כללית">כללית</option>
                                        <option value="מכבי">מכבי</option>
                                        <option value="מאוחדת">מאוחדת</option>
                                        <option value="לאומית">לאומית</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isSmoker}
                                            onChange={e => setFormData({ ...formData, isSmoker: e.target.checked })}
                                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="font-bold text-slate-700">מעשן/ת</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <Building2 size={20} className="text-purple-600" />
                                באיזה ענף הנך מתעניין?
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: 'פנסיוני', label: 'פנסיוני', icon: '🏦' },
                                    { value: 'פיננסי', label: 'פיננסי', icon: '💰' },
                                    { value: 'ביטוח', label: 'ביטוח', icon: '🛡️' },
                                    { value: 'הכל', label: 'הכל', icon: '✨' },
                                ].map(item => (
                                    <label 
                                        key={item.value}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                            formData.interestArea === item.value
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="interestArea"
                                            value={item.value}
                                            checked={formData.interestArea === item.value}
                                            onChange={e => setFormData({
                                                ...formData,
                                                interestArea: e.target.value as any
                                            })}
                                            className="sr-only"
                                        />
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="font-bold text-slate-700 text-sm">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-slate-600" />
                                הערות
                            </h3>
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-y"
                                placeholder="הוסף הערות או פרטים נוספים שחשוב לנו לדעת..."
                            />
                        </div>

                        {/* Submit */}
                        <Button 
                            type="submit"
                            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-black text-lg shadow-xl gap-2"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    שולח...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    שלח פרטים
                                </>
                            )}
                        </Button>

                        <p className="text-center text-xs text-slate-400">
                            בלחיצה על "שלח פרטים" אני מאשר/ת קבלת פניות מנציגי מגן זהב
                        </p>
                    </form>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-slate-400 text-sm">
                    <p>© {new Date().getFullYear()} מגן זהב - כל הזכויות שמורות</p>
                </div>
            </div>
        </div>
    );
}
