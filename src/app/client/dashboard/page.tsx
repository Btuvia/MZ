"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";
import Image from "next/image";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";



export default function ClientDashboard() {
    // Hardcoded demo client for visualization
    const clientName = "ישראל ישראלי";

    // Policy Status State (Simulation)
    type PolicyStatus = { exists: boolean; label: string; reason?: string };
    const policies: Record<string, PolicyStatus> = {
        life: { exists: true, label: "ביטוח חיים" },
        health: { exists: true, label: "ביטוח בריאות" },
        pension: { exists: true, label: "קרן פנסיה" },
        car: { exists: false, label: "ביטוח רכב", reason: "ביטוח רכב מגן עליך מפני נזקי גוף ורכוש לצד ג' ולרכבך שלך. הכרחי לכל נהג!" },
        home: { exists: false, label: "ביטוח דירה", reason: "הבית הוא הנכס היקר ביותר שלך. ביטוח דירה מכסה מפני שריפות, נזקי מים ופריצות." },
        sc: { exists: false, label: "מחלות קשות", reason: "כיסוי קריטי המעניק פיצוי כספי מיידי בעת גילוי מחלה קשה, ומאפשר להתמקד בהחלמה." }
    };

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-10" dir="rtl">

                {/* Welcome Hero */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/grid.svg')]"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black mb-2">שלום, {clientName} 👋</h1>
                            <p className="text-slate-400 font-bold opacity-80">ברוך הבא לאיזור האישי המתקדם שלך ב-Magen Zahav</p>
                        </div>
                        <div className="h-20 w-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                            <span className="text-4xl">🛡️</span>
                        </div>
                    </div>
                </div>

                {/* The Insurance Shield Grid */}
                <div>
                    <h3 className="text-xl font-black text-slate-700 italic mb-6 flex items-center gap-2">
                        <span className="bg-amber-100 p-2 rounded-lg text-amber-600">🛡️</span> מגן הביטוח האישי שלך
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {Object.entries(policies).map(([key, data]) => (
                            <div key={key} className="relative group perspective-1000">
                                <Card className={`h-40 flex flex-col items-center justify-center gap-4 border-none shadow-lg transition-all duration-500 transform
                                    ${data.exists
                                        ? "bg-gradient-to-b from-white to-slate-50 border-b-4 border-emerald-500"
                                        : "bg-slate-100/50 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 hover:-translate-y-2 hover:shadow-2xl hover:bg-white cursor-pointer"
                                    }`}>

                                    <div className={`text-4xl filter ${data.exists ? "drop-shadow-lg" : "grayscale"}`}>
                                        {key === 'life' && '❤️'}
                                        {key === 'health' && '🏥'}
                                        {key === 'pension' && '💰'}
                                        {key === 'car' && '🚗'}
                                        {key === 'home' && '🏠'}
                                        {key === 'sc' && '💊'}
                                    </div>

                                    <span className={`font-black text-sm ${data.exists ? "text-slate-700" : "text-slate-400"}`}>
                                        {data.label}
                                    </span>

                                    {/* Badge for Missing */}
                                    {!data.exists && (
                                        <div className="absolute top-3 right-3 h-3 w-3 bg-red-500 rounded-full animate-ping"></div>
                                    )}

                                    {/* Hover Tooltip for Missing */}
                                    {!data.exists && (
                                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                            <p className="text-white text-xs font-bold leading-relaxed mb-3">
                                                {data.reason}
                                            </p>
                                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black w-full">
                                                קבל הצעה 👈
                                            </Button>
                                        </div>
                                    )}
                                </Card>

                                {/* Status Indicator */}
                                <div className={`mt-2 text-center text-xs font-black uppercase tracking-wider ${data.exists ? "text-emerald-600" : "text-slate-300"}`}>
                                    {data.exists ? "פעיל ✔" : "לא קיים ✘"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-indigo-600 text-white border-none p-8 flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-black mb-1">זקוק לעזרה?</h4>
                            <p className="text-indigo-200 text-sm font-bold">הצוות שלנו זמין עבורך בוואטסאפ</p>
                        </div>
                        <Button className="bg-white text-indigo-600 font-black hover:bg-indigo-50">צ'אט מהיר 💬</Button>
                    </Card>
                    <Card className="bg-white border-none shadow-xl p-8">
                        <h4 className="text-xl font-black text-slate-800 mb-4">עדכונים אחרונים</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                הצטרפת בהצלחה לקרן פנסיה "מניבים"
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                עודכנה כתובת המגורים שלך
                            </div>
                        </div>
                    </Card>
                </div>

            </div>
        </DashboardShell>
    );
}
