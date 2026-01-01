"use client";

import { Card } from "@/components/ui/base";
import { Bell, Eye, DollarSign, MailOpen, Activity } from "lucide-react";

export default function SmartAlerts() {
    const alerts = [
        { id: 1, icon: <Eye size={14} />, text: "דני רופ צפה בביטוח חיים", time: "עכשיו", color: "text-blue-400" },
        { id: 2, icon: <MailOpen size={14} />, text: "מייל הצעת מחיר נקרא ע״י שרה", time: "לפני 2 דק׳", color: "text-emerald-400" },
        { id: 3, icon: <DollarSign size={14} />, text: "תשלום נדחה - פוליסת בריאות", time: "לפני 15 דק׳", color: "text-red-400" },
        { id: 4, icon: <Activity size={14} />, text: "ליד חדש נכנס מהאתר", time: "לפני 32 דק׳", color: "text-amber-400" },
    ];

    return (
        <Card className="bg-slate-900 border-none shadow-xl overflow-hidden p-6 text-white h-full">
            <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-slate-200">
                <Bell size={18} className="text-indigo-400 animate-pulse" />
                רדאר חי (Live)
            </h3>

            <div className="space-y-6 relative">
                {/* Timeline line */}
                <div className="absolute top-2 bottom-2 right-[7px] w-0.5 bg-slate-800"></div>

                {alerts.map((alert) => (
                    <div key={alert.id} className="relative flex items-start gap-4 animate-in slide-in-from-right-4 duration-500">
                        <div className={`
                            relative z-10 w-4 h-4 rounded-full bg-slate-900 border-2 flex items-center justify-center shrink-0 mt-1
                            ${alert.color.replace('text-', 'border-')}
                        `}>
                            <div className={`w-1.5 h-1.5 rounded-full ${alert.color.replace('text-', 'bg-')}`}></div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-300 leading-tight">{alert.text}</p>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-600 mt-1">{alert.time}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                <button className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    צפה בכל ההתראות
                </button>
            </div>
        </Card>
    );
}
