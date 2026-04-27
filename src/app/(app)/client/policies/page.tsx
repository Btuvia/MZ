"use client";

import { useState } from "react";
import { PolicyTimeline } from "@/components/client/PolicyTimeline";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";

export default function PoliciesPage() {
    const [selectedPolicy, setSelectedPolicy] = useState<number | null>(null);

    const policies = [
        {
            id: 1,
            name: 'ביטוח בריאות - "משלים"',
            company: "הראל",
            policyNumber: "BH-2023-458921",
            startDate: "01/01/2023",
            renewalDate: "01/01/2026",
            premium: "₪240",
            period: "חודשי",
            status: "פעיל",
            coverage: "₪2,000,000",
            type: "בריאות",
            icon: "🏥",
            color: "from-blue-500 to-blue-700",
            benefits: [
                "כיסוי אשפוז בחו״ל",
                "ניתוחים פרטיים",
                "תרופות ללא השתתפות עצמית",
                "בדיקות מעבדה מורחבות"
            ]
        },
        {
            id: 2,
            name: 'ביטוח רכב מקיף',
            company: "הפניקס",
            policyNumber: "CAR-2024-112358",
            startDate: "05/01/2024",
            renewalDate: "05/01/2025",
            premium: "₪3,200",
            period: "שנתי",
            status: "פעיל",
            coverage: "₪180,000",
            type: "רכב",
            icon: "🚗",
            color: "from-emerald-500 to-teal-700",
            benefits: [
                "כיסוי מקיף לנזקי צד ג׳",
                "רכב חליפי",
                "גרירה ללא הגבלה",
                "השתתפות עצמית ₪1,000"
            ]
        },
        {
            id: 3,
            name: 'ביטוח דירה ומבנה',
            company: "מנורה מבטחים",
            policyNumber: "HOME-2023-789456",
            startDate: "08/15/2023",
            renewalDate: "08/15/2025",
            premium: "₪110",
            period: "חודשי",
            status: "פעיל",
            coverage: "₪1,500,000",
            type: "דירה",
            icon: "🏠",
            color: "from-purple-500 to-indigo-700",
            benefits: [
                "כיסוי מבנה ותכולה",
                "אחריות כלפי צד ג׳",
                "נזקי מים ושריפה",
                "גניבה ופריצה"
            ]
        },
        {
            id: 4,
            name: 'ביטוח חיים',
            company: "כלל ביטוח",
            policyNumber: "LIFE-2022-334455",
            startDate: "03/10/2022",
            renewalDate: "03/10/2032",
            premium: "₪180",
            period: "חודשי",
            status: "פעיל",
            coverage: "₪1,000,000",
            type: "חיים",
            icon: "❤️",
            color: "from-rose-500 to-pink-700",
            benefits: [
                "כיסוי מוות",
                "מחלות קשות",
                "אובדן כושר עבודה",
                "פטור מתשלום פרמיה"
            ]
        }
    ];

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-linear-to-r from-accent via-blue-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">הפוליסות שלי</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            כל פוליסות הביטוח שלך במקום אחד. עקוב אחר תאריכי חידוש, פרמיות וכיסויים בקלות.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                                {policies.length} פוליסות פעילות
                            </Badge>
                            <Badge className="bg-success/30 text-white border-success/30 px-4 py-2">
                                כל הפוליסות מעודכנות
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך כיסוי כולל", value: "₪4.68M", icon: "🛡️", color: "from-blue-600 to-indigo-700" },
                        { label: "תשלום חודשי", value: "₪530", icon: "💳", color: "from-emerald-600 to-teal-700" },
                        { label: "תשלום שנתי", value: "₪3,200", icon: "📅", color: "from-purple-600 to-indigo-700" },
                        { label: "חיסכון השנה", value: "₪1,240", icon: "💰", color: "from-amber-500 to-orange-600" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-linear-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-3xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Policies Grid */}
                <div className="grid gap-6">
                    {policies.map((policy) => (
                        <Card key={policy.id} className="border-none shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all">
                            <div className={`h-2 w-full bg-linear-to-r ${policy.color}`} />
                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-16 w-16 rounded-2xl bg-linear-to-br ${policy.color} flex items-center justify-center text-3xl shadow-lg`}>
                                            {policy.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-primary">{policy.name}</h3>
                                            <p className="text-sm font-bold text-slate-400 mt-1">{policy.company} • {policy.policyNumber}</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-success/10 text-success border-success/20 px-4 py-2">
                                        {policy.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך התחלה</p>
                                        <p className="text-sm font-bold text-primary">{policy.startDate}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך חידוש</p>
                                        <p className="text-sm font-bold text-primary">{policy.renewalDate}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פרמיה</p>
                                        <p className="text-sm font-bold text-primary">{policy.premium} <span className="text-xs text-slate-400">/ {policy.period}</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כיסוי</p>
                                        <p className="text-sm font-bold text-primary">{policy.coverage}</p>
                                    </div>
                                </div>

                                {selectedPolicy === policy.id && (
                                    <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <h4 className="text-sm font-black text-primary mb-4 flex items-center gap-2">
                                            <span className="text-accent">✓</span> יתרונות הפוליסה
                                        </h4>
                                        <ul className="space-y-2">
                                            {policy.benefits.map((benefit, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setSelectedPolicy(selectedPolicy === policy.id ? null : policy.id)}
                                    >
                                        {selectedPolicy === policy.id ? "הסתר פרטים" : "הצג פרטים מלאים"}
                                    </Button>
                                    <Button variant="outline" size="sm" className="px-6">
                                        הורד פוליסה
                                    </Button>
                                    <Button variant="outline" size="sm" className="px-6">
                                        צור קשר
                                    </Button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">סטטוס טיפול</h5>
                                    <PolicyTimeline status={policy.status === "פעיל" ? "active" : "underwriting"} />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Add New Policy CTA */}
                <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer group">
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                        ➕
                    </div>
                    <h3 className="text-lg font-black text-primary mb-2">צריך ביטוח נוסף?</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
                        הסוכן שלך יכול לעזור לך למצוא את הפוליסה המושלמת עבורך
                    </p>
                    <Button variant="secondary" className="shadow-xl shadow-accent/20">
                        דבר עם הסוכן שלך
                    </Button>
                </Card>
            </div>
        </DashboardShell>
    );
}
