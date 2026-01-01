"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import LifecycleTracker from "@/components/client/LifecycleTracker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, FileText, CheckCircle, AlertTriangle } from "lucide-react";

export default function ClientDashboard() {
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadClient = async () => {
            const storedId = localStorage.getItem("current_client_id");
            let clientId = storedId;

            // Demo fallback if no ID or phone number
            if (!clientId) {
                // Try to find 'active' client or mock
                clientId = "active";
            }

            try {
                // In a real app we would search by phone if clientId is a phone number
                // simpler for now: try direct get, if not found, use mock
                let data = await firestoreService.getClient(clientId);

                if (!data && clientId.length > 5) {
                    // It's likely a phone number, try to find client with this phone
                    // This is a client-side search simulation for the demo
                    const allClients = await firestoreService.getClients();
                    data = allClients.find((c: any) => c.phone === clientId || c.idNumber === clientId) || null;
                }

                if (data) {
                    setClient(data);
                } else {
                    // Fallback to static mock for "Israel Israeli"
                    setClient({
                        name: "ישראל ישראלי",
                        policies: [
                            { type: "ביטוח חיים", company: "הראל", status: "active" },
                            { type: "ביטוח בריאות", company: "מגדל", status: "active" }
                        ],
                        salesStatus: 'negotiation',
                        opsStatus: 'medical_pending'
                    });
                }
            } catch (error) {
                console.error("Failed to load client", error);
            } finally {
                setLoading(false);
            }
        };

        loadClient();
    }, []);

    // Policy mapping helpers
    const getPolicyStatus = (type: string) => {
        if (!client || !client.policies) return { exists: false };
        const policy = client.policies.find((p: any) => p.type.includes(type) || p.productType?.includes(type));
        return policy ? { exists: true, label: policy.type || policy.productType } : { exists: false };
    };

    const policyMap: Record<string, { label: string, key: string, reason: string }> = {
        life: { label: "ביטוח חיים", key: "חיים", reason: "הגנה כלכלית למשפחה במקרה חלילה של פטירה." },
        health: { label: "ביטוח בריאות", key: "בריאות", reason: "כיסוי לתרופות שלא בסל, השתלות וניתוחים בחו\"ל." },
        pension: { label: "קרן פנסיה", key: "פנסיה", reason: "חיסכון חובה לגיל פרישה עם הטבות מס." },
        car: { label: "ביטוח רכב", key: "רכב", reason: "חובה + מקיף/צד ג' לנסיעה שקטה." },
        home: { label: "ביטוח דירה", key: "דירה", reason: "כיסוי למבנה ולתכולה מפני נזקים." },
        sc: { label: "מחלות קשות", key: "מחלות", reason: "פיצוי כספי בעת גילוי מחלה קשה." }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center mesh-gradient">
                <div className="animate-spin text-4xl">🛡️</div>
            </div>
        );
    }

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-8 pb-20" dir="rtl">

                {/* Hero */}
                <div className="glass-card bg-gradient-to-r from-slate-900/80 via-blue-900/50 to-amber-900/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-amber-500/20 neon-gold">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-black mb-2 text-gradient-gold neon-text-gold">שלום, {client.name.split(" ")[0]} 👋</h1>
                            <p className="text-blue-300 font-medium text-sm neon-text-blue">כיף לראות אותך שוב!</p>
                        </div>
                        <div className="h-16 w-16 bg-gradient-to-br from-amber-500/30 to-amber-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-amber-500/40 shadow-lg shadow-amber-500/30">
                            <Shield className="text-amber-400" size={32} />
                        </div>
                    </div>
                </div>

                {/* Status Tracker */}
                <div>
                    <h3 className="text-lg font-black text-amber-100 mb-4 px-2 flex items-center gap-2">
                        <span className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 border border-blue-500/30"><CheckCircle size={16} /></span>
                        סטטוס תהליך
                    </h3>
                    <LifecycleTracker client={client} readOnly={true} />
                </div>

                {/* Shield Grid */}
                <div>
                    <h3 className="text-lg font-black text-amber-100 mb-4 px-2 flex items-center gap-2">
                        <span className="bg-amber-500/20 p-1.5 rounded-lg text-amber-400 border border-amber-500/30"><Shield size={16} /></span>
                        התיק הביטוחי שלי
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(policyMap).map(([id, info]) => {
                            const status = getPolicyStatus(info.key);
                            return (
                                <Card key={id} className={`
                                    border-amber-500/20 p-4 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden transition-all
                                    ${status.exists ? 'neon-gold' : 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.02] cursor-pointer'}
                                `}>
                                    <div className={`
                                        text-3xl p-3 rounded-full mb-1
                                        ${status.exists ? 'bg-amber-500/20 shadow-lg shadow-amber-500/30' : 'bg-slate-700/50'}
                                    `}>
                                        {id === 'life' && '❤️'}
                                        {id === 'health' && '🏥'}
                                        {id === 'pension' && '💰'}
                                        {id === 'car' && '🚗'}
                                        {id === 'home' && '🏠'}
                                        {id === 'sc' && '💊'}
                                    </div>

                                    <div>
                                        <h4 className="font-black text-sm text-slate-200">{info.label}</h4>
                                        <span className={`text-[10px] font-bold ${status.exists ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {status.exists ? 'פעיל ✔' : 'לא קיים'}
                                        </span>
                                    </div>

                                    {!status.exists && (
                                        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 opacity-0 hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm border border-amber-500/30 rounded-3xl">
                                            <p className="text-slate-300 text-[10px] mb-2 leading-tight">{info.reason}</p>
                                            <Button size="sm" variant="gold" className="h-7 text-[10px] w-full font-bold">אני מעוניין</Button>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Documents Mock */}
                <Card className="border-amber-500/20 p-6">
                    <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                        <span className="bg-blue-500/20 p-1.5 rounded-lg text-blue-400 border border-blue-500/30"><FileText size={16} /></span>
                        מסמכים אחרונים
                    </h3>
                    <div className="space-y-3">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 glass-card rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 font-bold text-xs border border-red-500/30">PDF</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-200">פוליסת ביטוח חיים</p>
                                        <p className="text-[10px] text-slate-500">01/10/2025</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-blue-400"><AlertTriangle size={16} /></Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4 text-xs font-bold border-dashed border-2 border-amber-500/30 text-amber-300">
                        צפה בכל המסמכים
                    </Button>
                </Card>

            </div>
        </DashboardShell>
    );
}
