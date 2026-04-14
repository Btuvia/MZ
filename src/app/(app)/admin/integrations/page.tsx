"use client";

import { Zap, Plug, ShieldCheck, Share2, Phone, Mail, Calendar as CalendarIcon, MessageCircle, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import IntegrationCard from "@/components/admin/integrations/IntegrationCard";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useGoogleCalendar } from "@/lib/hooks/useGoogleCalendar";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

export default function IntegrationsPage() {
    const searchParams = useSearchParams();
    const { isConnected: calendarConnected, syncStatus, connect: connectCalendar, disconnect: disconnectCalendar, syncNow } = useGoogleCalendar();
    const [showCalendarSuccess, setShowCalendarSuccess] = useState(false);

    // Check for calendar connection callback
    useEffect(() => {
        if (searchParams.get('calendar') === 'connected') {
            setShowCalendarSuccess(true);
            toast.success('היומן חובר בהצלחה! הסנכרון יבוצע אוטומטית בכל התחברות.');
            setTimeout(() => setShowCalendarSuccess(false), 5000);
        }
        if (searchParams.get('error')) {
            toast.error(searchParams.get('error') || 'שגיאה בחיבור');
        }
    }, [searchParams]);

    const handleCalendarAction = () => {
        if (calendarConnected) {
            if (confirm('האם אתה בטוח שברצונך לנתק את היומן?')) {
                disconnectCalendar();
                toast.success('היומן נותק בהצלחה');
            }
        } else {
            connectCalendar();
        }
    };

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
            description: "ניהול פגישות, תזמון אוטומטי ומניעת התנגשויות ביומן הסוכן. מסתנכרן אוטומטית בכל כניסה למערכת.",
            icon: <CalendarIcon />,
            status: calendarConnected ? "connected" as const : "disconnected" as const,
            lastSync: syncStatus?.lastSync ? new Date(syncStatus.lastSync).toLocaleString('he-IL', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            }) : undefined,
            color: "bg-blue-500",
            onAction: handleCalendarAction,
            actionLabel: calendarConnected ? "נתק" : "חבר עכשיו",
            onSync: calendarConnected ? syncNow : undefined,
            eventsCount: syncStatus?.eventsCount
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

    const activeCount = integrations.filter(i => i.status === 'connected' || i.status === 'syncing').length;

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
                        <span>{activeCount} אינטגרציות פעילות</span>
                    </div>
                </div>

                {/* Calendar Success Banner */}
                {showCalendarSuccess ? <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                        <CheckCircle className="text-emerald-600" size={24} />
                        <div>
                            <p className="font-bold text-emerald-800">היומן חובר בהצלחה!</p>
                            <p className="text-sm text-emerald-600">הסנכרון יתבצע אוטומטית בכל פעם שתתחבר למערכת.</p>
                        </div>
                    </div> : null}

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
