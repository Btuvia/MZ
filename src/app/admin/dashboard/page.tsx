"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import Link from "next/link";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Zap, Activity, Users, FileText, ArrowLeft, Bell, TrendingUp } from "lucide-react";

interface ClientData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: "active" | "inactive" | "lead";
    policies: any[];
    pensionSales?: any[];
    insuranceSales?: any[];
    tasks?: any[];
}

// Visual "Commissions Rain" Effect Component
const CommissionsRain = ({ isActive, onComplete }: { isActive: boolean, onComplete: () => void }) => {
    const [particles, setParticles] = useState<{ id: number; left: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        if (isActive) {
            const newParticles = Array.from({ length: 50 }).map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                duration: 1 + Math.random() * 2,
                delay: Math.random() * 0.5
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
                onComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-0 text-2xl animate-fall"
                    style={{
                        left: `${p.left}%`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`
                    }}
                >
                    💰
                </div>
            ))}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
};


export default function AdminDashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const [clients, setClients] = useState<any[]>([]);
    const [showRain, setShowRain] = useState(false);
    const [stats, setStats] = useState([
        { label: "סה״כ לקוחות", value: "0", change: "+0%", icon: "👤", trend: "up" },
        { label: "עמלות (ש״ח)", value: "₪0", change: "+0%", icon: "💰", trend: "up" },
        { label: "יעד חודשי", value: "84%", change: "עוד ₪12k", icon: "🎯", trend: "neutral" },
        { label: "לידים חדשים", value: "0", change: "השבוע", icon: "⚡", trend: "up" },
    ]);
    const [isLoading, setIsLoading] = useState(true);

    // Mock Live Pulse Feed
    const [pulseFeed, setPulseFeed] = useState([
        { id: 1, text: "רועי כהן סגר מכירה: ביטוח בריאות (₪250)", time: "לפני 2 דק'", type: "sale" },
        { id: 2, text: "ליד חדש נכנס מקמפיין פייסבוק", time: "לפני 15 דק'", type: "lead" },
        { id: 3, text: "משימת חידוש בוצעה עבור לקוח: דני דין", time: "לפני 32 דק'", type: "task" },
        { id: 4, text: "מסמך חדש הועלה לתיק: מנחם גולן", time: "לפני שעה", type: "doc" }
    ]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const clientsData = await firestoreService.getClients();

                const loadedClients: any[] = [];
                let totalPremium = 0;

                clientsData.forEach((clientData: any) => {
                    // Calculate client specific derived data
                    const hasPension = (clientData.pensionSales?.length || 0) > 0;
                    const hasInsurance = (clientData.insuranceSales?.length || 0) > 0;
                    const hasPolicies = (clientData.policies?.length || 0) > 0;

                    // Calculate Premiums (Clean "₪" and ",")
                    const policyPremiums = (clientData.policies || []).reduce((sum: number, p: any) => {
                        const val = parseFloat(p.premium?.toString().replace(/[^\d.-]/g, '') || "0");
                        return sum + (isNaN(val) ? 0 : val);
                    }, 0);
                    const insurancePremiums = (clientData.insuranceSales || []).reduce((sum: number, p: any) => {
                        const val = parseFloat(p.premium?.toString().replace(/[^\d.-]/g, '') || "0");
                        return sum + (isNaN(val) ? 0 : val);
                    }, 0);

                    totalPremium += policyPremiums + insurancePremiums;

                    // Format for table
                    loadedClients.push({
                        ...clientData,
                        fullName: clientData.name || `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim(),
                        salesStatus: (hasPension || hasInsurance)
                            ? { label: "נמכר בהצלחה", color: "bg-emerald-50 text-emerald-600 border-emerald-100" }
                            : (hasPolicies ? { label: "לקוח קיים", color: "bg-indigo-50 text-indigo-600 border-indigo-100" } : { label: "ליד חדש", color: "bg-amber-50 text-amber-600 border-amber-100" }),
                        activity: { label: "פעיל", color: "bg-slate-50 text-slate-500 border-slate-100" }, // Mock activity
                        portfolio: `₪${(policyPremiums + insurancePremiums).toLocaleString()}`,
                        agent: "רועי כהן", // Mock
                        policiesMap: {
                            life: clientData.policies?.some((p: any) => p.type?.includes("חיים") || p.type?.includes("ריסק")) || clientData.insuranceSales?.some((p: any) => p.product?.includes("ריסק")),
                            health: clientData.policies?.some((p: any) => p.type?.includes("בריאות")) || clientData.insuranceSales?.some((p: any) => p.product?.includes("בריאות")),
                            pension: clientData.policies?.some((p: any) => p.type?.includes("פנסיה") || p.type?.includes("גמל")) || (clientData.pensionSales?.length || 0) > 0,
                            car: clientData.policies?.some((p: any) => p.type?.includes("רכב")),
                            home: clientData.policies?.some((p: any) => p.type?.includes("דירה")),
                            child: false
                        }
                    });
                });

                setClients(loadedClients);

                // Update Stats
                setStats([
                    { label: "סה״כ לקוחות", value: loadedClients.length.toString(), change: "+12.5%", icon: "👥", trend: "up" },
                    { label: "עמלות (ש״ח)", value: `₪${totalPremium.toLocaleString()}`, change: "+8.2%", icon: "💰", trend: "up" },
                    { label: "יעד חודשי", value: "84%", change: "נשאר ₪12k", icon: "🎯", trend: "up" },
                    { label: "לידים חדשים", value: "14", change: "+4 השבוע", icon: "⚡", trend: "up" },
                ]);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const filteredClients = clients.filter(client =>
        client.fullName?.includes(searchTerm) ||
        client.id?.includes(searchTerm) ||
        client.email?.includes(searchTerm)
    );

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-10 animate-in fade-in duration-700" dir="rtl">

                {/* Header & Search */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-right">
                        <h2 className="text-4xl font-black text-primary italic leading-none font-display mb-2">
                            היי רועי, בוקר טוב! 👋
                        </h2>
                        <p className="text-slate-500 font-medium">הנה מה שקורה בסוכנות היום.</p>
                    </div>

                    <div className="w-full md:w-auto flex-1 max-w-md">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="חיפוש מהיר של לקוח..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-4 focus:ring-accent/5 outline-none font-bold text-sm transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors">🔍</span>
                        </div>
                    </div>
                </header>

                {/* Visual Effects */}
                <CommissionsRain isActive={showRain} onComplete={() => setShowRain(false)} />

                <div className="grid lg:grid-cols-4 gap-8">

                    {/* Live Pulse Feed - NEW */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Pulse</h3>
                        </div>

                        <div className="space-y-4">
                            {pulseFeed.map(item => (
                                <Card key={item.id} className="p-4 border-none shadow-md bg-white hover:bg-slate-50 transition-colors cursor-default">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.type === 'sale' ? 'bg-emerald-500' :
                                            item.type === 'lead' ? 'bg-amber-500' :
                                                item.type === 'task' ? 'bg-indigo-500' : 'bg-slate-300'
                                            }`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700 leading-snug">{item.text}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Mini Charts Widget */}
                        <Card className="p-5 border-none shadow-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white mt-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-indigo-200">צמיחה שנתית</p>
                                    <p className="text-2xl font-black">+22%</p>
                                </div>
                                <TrendingUp size={20} className="text-emerald-300" />
                            </div>
                            <div className="flex gap-1 items-end h-12 opacity-80">
                                {[40, 65, 50, 80, 75, 90, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-white/30 rounded-t-sm hover:bg-white/50 transition-colors" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, i) => (
                                <Card
                                    key={i}
                                    onClick={() => stat.label.includes("עמלות") && setShowRain(true)}
                                    className={`group overflow-hidden relative border-none shadow-xl bg-white p-6 ${stat.label.includes("עמלות") ? "cursor-pointer hover:scale-105 transition-transform active:scale-95" : ""}`}
                                >
                                    <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-2xl h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors shadow-sm">{stat.icon}</div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{stat.change}</div>
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">{stat.label}</p>
                                    <h4 className="text-3xl font-black text-primary tracking-tighter font-display">{stat.value}</h4>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Clients Table */}
                        <Card className="border-none shadow-2xl bg-white p-0 overflow-hidden min-h-[400px]">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-primary italic font-display flex items-center gap-2">
                                    <Users size={20} className="text-slate-400" />
                                    ניהול תיקים
                                </h3>
                                <Link href="/admin/clients/new">
                                    <Button size="sm" className="bg-slate-900 text-white hover:bg-accent rounded-xl text-xs font-black px-4 shadow-lg shadow-slate-200">
                                        + לקוח חדש
                                    </Button>
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="p-12 text-center text-slate-400 animate-pulse">טוען נתונים...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-50/50">
                                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                                <th className="px-6 py-5">לקוח</th>
                                                <th className="px-6 py-5">סטטוס מכירה</th>
                                                <th className="px-6 py-5 text-center">פוליסות</th>
                                                <th className="px-6 py-5">תיק (שנתי)</th>
                                                <th className="px-6 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredClients.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-slate-400 font-medium">
                                                        לא נמצאו לקוחות מתאימים לחיפוש.
                                                    </td>
                                                </tr>
                                            ) : filteredClients.slice(0, 5).map((client, i) => (
                                                <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] shadow-inner group-hover:bg-white transition-colors">
                                                                {client.firstName?.[0] || client.name?.[0]}{client.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-primary leading-tight">{client.fullName}</p>
                                                                <p className="text-[10px] text-slate-400 font-display">{client.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-3 py-1.5 rounded-xl font-black text-[10px] border ${client.salesStatus.color}`}>
                                                            {client.salesStatus.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center -space-x-2 space-x-reverse">
                                                            {Object.keys(client.policiesMap).filter(k => client.policiesMap[k]).map((key, j) => (
                                                                <div key={j} className="h-8 w-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-xs relative z-0 hover:z-10 hover:scale-110 transition-transform"
                                                                    title={key === 'car' ? 'רכב' : key === 'health' ? 'בריאות' : key === 'life' ? 'חיים' : 'אחר'}>
                                                                    {key === 'car' ? '🚗' : key === 'health' ? '🩺' : key === 'life' ? '❤️' : key === 'pension' ? '💰' : key === 'home' ? '🏠' : '📄'}
                                                                </div>
                                                            ))}
                                                            {Object.keys(client.policiesMap).filter(k => client.policiesMap[k]).length === 0 && <span className="text-slate-300">-</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="font-black text-slate-700 font-display">{client.portfolio}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <Link href={`/admin/clients/${client.id}`} className="block h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">
                                                            <ArrowLeft size={14} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {filteredClients.length > 5 && (
                                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                                    <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                                        צפה ב- {filteredClients.length - 5} לקוחות נוספים
                                    </button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
