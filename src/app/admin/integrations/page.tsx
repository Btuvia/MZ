"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import IntegrationCard from "@/components/admin/integrations/IntegrationCard";
import { Zap, Plug, ShieldCheck, Share2, Phone, Mail, Calendar as CalendarIcon, MessageCircle } from "lucide-react";

export default function IntegrationsPage() {
    const integrations = [
        {
            id: "whatsapp",
            name: "WhatsApp Business",
            description: "חיבור לוואטסאפ לניהול צ'אטים, שליחת הודעות אוטומטיות ובוטים חכמים.",
            icon: <MessageCircle />,
            status: "disconnected" as const,
            color: "bg-emerald-500",
        },
        {
            id: "gmail",
            name: "Gmail / G-Suite",
            description: "סנכרון מיילים דו-כיווני, תיוק אוטומטי של מסמכים וזיהוי לידים מהמייל.",
            icon: <Mail />,
            status: "connected" as const,
            lastSync: "היום, 09:30",
            color: "bg-red-500",
        },
        {
            id: "calendar",
            name: "Google Calendar",
            description: "ניהול פגישות, תזמון אוטומטי ומניעת התנגשויות ביומן הסוכן.",
            icon: <CalendarIcon />,
            status: "connected" as const,
            lastSync: "היום, 09:45",
            color: "bg-blue-500",
        },
        {
            id: "voip",
            name: "מרכזיית טלפוניה",
            description: "חיבור ל-VoiceSpin/CallMarker להקלטת שיחות, חיוג מהיר ותיעוד בתיק לקוח.",
            icon: <Phone />,
            status: "disconnected" as const,
            color: "bg-purple-500",
        },
        {
            id: "facebook",
            name: "Facebook Leads",
            description: "יבוא אוטומטי של לידים מקמפיינים בפייסבוק ואינסטגרם ישירות ל-CRM.",
            icon: <Share2 />,
            status: "syncing" as const,
            color: "bg-indigo-500",
        },
        {
            id: "gov",
            name: "הר הביטוח",
            description: "אינטגרציה (סמי-אוטומטית) למשיכת נתונים והפקת דוחות באופן מאובטח.",
            icon: <ShieldCheck />,
            status: "disconnected" as const,
            color: "bg-amber-500",
        },
    ];

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-display flex items-center gap-3">
                            <span className="bg-slate-900 text-white p-2 rounded-xl"><Plug size={24} /></span>
                            מרכז האינטגרציות
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">נהל את כל החיבורים החיצוניים של הסוכנות במקום אחד</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <Zap size={16} />
                        <span>3 אינטגרציות פעילות</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration, index) => (
                        <IntegrationCard key={integration.id} integration={integration} index={index} />
                    ))}
                </div>

                {/* Info Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">חסר לך חיבור?</h4>
                        <p className="text-slate-500 text-sm mt-1 mb-3">
                            אנחנו מוסיפים אינטגרציות חדשות כל הזמן. אם אתה משתמש במערכת שלא מופיעה כאן, שלח לנו בקשה ונבדוק אפשרות לחיבור.
                        </p>
                        <button className="text-sm font-bold text-indigo-600 hover:underline">שלח בקשת אינטגרציה &larr;</button>
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
