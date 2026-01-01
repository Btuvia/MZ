"use client";

import { useState } from "react";
import { Card, Button } from "./base";
import { ClientProfile } from "@/lib/services/analysis-service";

interface LeadReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ClientProfile) => void;
    initialData: ClientProfile;
}

export default function LeadReviewModal({ isOpen, ...rest }: LeadReviewModalProps) {
    if (!isOpen) return null;
    return <LeadReviewModalInner {...rest} />;
}

function LeadReviewModalInner({ onClose, onSubmit, initialData }: Omit<LeadReviewModalProps, "isOpen">) {
    const [formData, setFormData] = useState<ClientProfile>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "שם מלא הוא שדה חובה";
        if (!formData.phone) newErrors.phone = "טלפון הוא שדה חובה";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
            <Card className="max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 bg-white/95 border-none p-0 flex flex-col max-h-[90vh]">
                <header className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <h2 className="text-2xl font-black relative z-10">סקירת פרטי ליד</h2>
                    <p className="text-indigo-100 text-xs mt-1 relative z-10">אנא וודא את הפרטים לפני היצירה</p>
                </header>

                <div className="p-8 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">שם מלא *</label>
                            <input
                                type="text"
                                value={formData.name || ""}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full bg-slate-50 border ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                placeholder="ישראל ישראלי"
                            />
                            {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">תעודת זהות</label>
                            <input
                                type="text"
                                value={formData.idNumber || ""}
                                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="000000000"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">טלפון *</label>
                            <input
                                type="tel"
                                value={formData.phone || ""}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                                placeholder="050-0000000"
                                dir="ltr"
                            />
                            {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">אימייל</label>
                            <input
                                type="email"
                                value={formData.email || ""}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="email@example.com"
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">כתובת</label>
                            <input
                                type="text"
                                value={formData.address || ""}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="רחוב, עיר"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl">ביטול</Button>
                    <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8 rounded-xl">
                        צור ליד
                    </Button>
                </div>
            </Card>
        </div>
    );
}
