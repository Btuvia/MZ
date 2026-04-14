"use client";

import { useState } from "react";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { motion } from "framer-motion";
import { Send, Phone, User, FileText, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ClientContactPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        topic: "service",
        scheduledTime: "",
        phone: "",
        contactName: "",
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await firestoreService.addContactRequest({
                ...formData,
                source: "client_portal"
            });

            setIsSuccess(true);
            toast.success("בקשתך נשלחה בהצלחה! נציג יחזור אליך בהקדם.");

            // Reset form after 2 seconds or redirect
            setTimeout(() => {
                // Optional: router.push("/client/dashboard");
                setFormData({
                    topic: "service",
                    scheduledTime: "",
                    phone: "",
                    contactName: "",
                    description: "",
                });
                setIsSuccess(false);
            }, 3000);

        } catch (error) {
            console.error("Error sending contact request:", error);
            toast.error("אירעה שגיאה בשליחת הבקשה. אנא נסה שנית.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-12 text-center shadow-xl max-w-md w-full"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 font-display">פנייתך התקבלה!</h2>
                    <p className="text-slate-500 mb-8">נציג מגן זהב יחזור אליך במועד שציינת.</p>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="text-primary font-bold hover:underline"
                    >
                        שלח פנייה נוספת
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 font-display mb-2">צור קשר עם נציג</h1>
                <p className="text-slate-500 text-lg">אנחנו כאן בשבילך. מלא את הפרטים ונחזור אליך בהקדם.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6 relative overflow-hidden">
                {/* Decorative Background Blob */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Topic Selection */}
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            נושא הפנייה
                        </label>
                        <select
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                            <option value="sales">מכירות (רוצה הצעה חדשה)</option>
                            <option value="service">שירות לקוחות</option>
                            <option value="claims">תביעות</option>
                            <option value="other">אחר</option>
                        </select>
                    </div>

                    {/* Contact Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            איש קשר
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="שם מלא"
                            value={formData.contactName}
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-primary" />
                            טלפון לחזרה
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="05X-XXXXXXX"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                    </div>

                    {/* Schedule Time */}
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            מתי נוח לך שנתקשר?
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            מהות הפנייה
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="נא פרט בקצרה..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5 rtl:-scale-x-100" />
                                שלח בקשה לנציג
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        * פנייתך תטופל בשעות הפעילות (א'-ה' 09:00-17:00)
                    </p>
                </div>
            </form>
        </div>
    );
}
