"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import Link from "next/link";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Zap, Activity, Users, FileText, ArrowLeft, Bell, TrendingUp, ShieldCheck, BarChart3, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import DailyBriefing from "@/components/admin/agent-companion/DailyBriefing";
import DataChat from "@/components/admin/agent-companion/DataChat";

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
    opsStatus?: string;
    salesRepresentative?: string;
}

interface SalesAnalytics {
    totalSold: number;
    totalIssued: number;
    byMonth: Record<string, { sold: number; issued: number }>;
    byCompany: Record<string, { sold: number; issued: number }>;
    byAgent: Record<string, { sold: number; issued: number }>;
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
    const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics>({
        totalSold: 0,
        totalIssued: 0,
        byMonth: {},
        byCompany: {},
        byAgent: {}
    });
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
                
                // Analytics tracking
                const analytics: SalesAnalytics = {
                    totalSold: 0,
                    totalIssued: 0,
                    byMonth: {},
                    byCompany: {},
                    byAgent: {}
                };

                const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                const months = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    return d.toISOString().slice(0, 7);
                }).reverse();

                // Initialize months
                months.forEach(m => {
                    analytics.byMonth[m] = { sold: 0, issued: 0 };
                });

                clientsData.forEach((clientData: any) => {
                    const hasPension = (clientData.pensionSales?.length || 0) > 0;
                    const hasInsurance = (clientData.insuranceSales?.length || 0) > 0;
                    const hasPolicies = (clientData.policies?.length || 0) > 0;
                    const agentName = clientData.salesRepresentative || 'לא משויך';

                    // Initialize agent if not exists
                    if (!analytics.byAgent[agentName]) {
                        analytics.byAgent[agentName] = { sold: 0, issued: 0 };
                    }

                    // Count policies and track analytics
                    const allSales = [
                        ...(clientData.policies || []).map((p: any) => ({
                            ...p,
                            type: 'policy',
                            company: p.company || 'לא ידוע',
                            date: p.startDate || new Date().toISOString()
                        })),
                        ...(clientData.insuranceSales || []).map((ins: any) => ({
                            ...ins,
                            type: 'insurance',
                            company: ins.company || 'לא ידוע',
                            date: ins.saleDate || new Date().toISOString()
                        })),
                        ...(clientData.pensionSales || []).map((pen: any) => ({
                            ...pen,
                            type: 'pension',
                            company: pen.company || 'לא ידוע',
                            date: pen.joinDate || new Date().toISOString()
                        }))
                    ];

                    allSales.forEach((sale: any) => {
                        const company = sale.company;
                        const opsStatus = sale.opsStatus || clientData.opsStatus;
                        const saleMonth = sale.date ? new Date(sale.date).toISOString().slice(0, 7) : currentMonth;
                        const isIssued = opsStatus === 'policy_issued' || opsStatus === 'פוליסה הופקה';

                        // Initialize company if not exists
                        if (!analytics.byCompany[company]) {
                            analytics.byCompany[company] = { sold: 0, issued: 0 };
                        }

                        // Count as sold
                        analytics.totalSold++;
                        analytics.byCompany[company].sold++;
                        analytics.byAgent[agentName].sold++;
                        if (analytics.byMonth[saleMonth]) {
                            analytics.byMonth[saleMonth].sold++;
                        }

                        // Count as issued if policy was issued
                        if (isIssued) {
                            analytics.totalIssued++;
                            analytics.byCompany[company].issued++;
                            analytics.byAgent[agentName].issued++;
                            if (analytics.byMonth[saleMonth]) {
                                analytics.byMonth[saleMonth].issued++;
                            }
                        }
                    });

                    // Calculate Premiums
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
                        activity: { label: "פעיל", color: "bg-slate-50 text-slate-500 border-slate-100" },
                        portfolio: `₪${(policyPremiums + insurancePremiums).toLocaleString()}`,
                        agent: agentName,
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
                setSalesAnalytics(analytics);

                // Calculate heikef commission (premium × 9.7)
                const heikefCommission = totalPremium * 9.7;

                // Update Stats
                setStats([
                    { label: "סה״כ לקוחות", value: loadedClients.length.toString(), change: "+12.5%", icon: "👥", trend: "up" },
                    { label: "עמלות היקף", value: `₪${heikefCommission.toLocaleString()}`, change: "+8.2%", icon: "💰", trend: "up" },
                    { label: "פוליסות הופקו", value: `${analytics.totalIssued}/${analytics.totalSold}`, change: `${Math.round((analytics.totalIssued / Math.max(analytics.totalSold, 1)) * 100)}%`, icon: "✅", trend: "up" },
                    { label: "לידים חדשים", value: loadedClients.filter(c => c.salesStatus.label === 'ליד חדש').length.toString(), change: "+4 השבוע", icon: "⚡", trend: "up" },
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
                        <h2 className="text-4xl font-black text-gradient-gold italic leading-none font-display mb-2 neon-text-gold">
                            היי רועי, בוקר טוב! 👋
                        </h2>
                        <p className="text-slate-400 font-medium">הנה מה שקורה בסוכנות היום.</p>
                    </div>

                    <div className="w-full md:w-auto flex-1 max-w-md">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="חיפוש מהיר של לקוח..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-12 pl-6 py-4 rounded-2xl glass-card border border-amber-500/20 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-sm text-slate-200 placeholder-slate-500 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 group-focus-within:text-amber-400 transition-colors">🔍</span>
                        </div>
                    </div>
                </header>

                {/* Briefing Bar (moved from AI Companion) */}
                <DailyBriefing />

                {/* Visual Effects */}
                <CommissionsRain isActive={showRain} onComplete={() => setShowRain(false)} />

                <div className="grid lg:grid-cols-4 gap-8">

                    {/* Live Pulse Feed - NEW */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
                            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest neon-text-gold">Live Pulse</h3>
                        </div>

                        <div className="space-y-4">
                            {pulseFeed.map(item => (
                                <Card key={item.id} className="p-4 border-amber-500/10 hover:border-amber-500/30 transition-colors cursor-default">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 shadow-lg ${item.type === 'sale' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                            item.type === 'lead' ? 'bg-amber-500 shadow-amber-500/50' :
                                                item.type === 'task' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-slate-400'
                                            }`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-300 leading-snug">{item.text}</p>
                                            <p className="text-[10px] text-slate-500 mt-1">{item.time}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Mini Charts Widget */}
                        <Card className="p-5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 mt-8 neon-gold">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-amber-300">צמיחה שנתית</p>
                                    <p className="text-2xl font-black text-gradient-gold neon-text-gold">+22%</p>
                                </div>
                                <TrendingUp size={20} className="text-amber-400" />
                            </div>
                            <div className="flex gap-1 items-end h-12">
                                {[40, 65, 50, 80, 75, 90, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-amber-500/40 rounded-t-sm hover:bg-amber-500/70 transition-colors" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </Card>

                        {/* AI Assistant (moved from AI Companion) */}
                        <DataChat />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {stats.map((stat, i) => (
                                <Card
                                    key={i}
                                    onClick={() => stat.label.includes("עמלות") && setShowRain(true)}
                                    className={`group overflow-hidden relative border-amber-500/20 p-6 hover:border-amber-500/40 ${stat.label.includes("עמלות") ? "cursor-pointer hover:scale-105 transition-transform active:scale-95 hover:neon-gold" : ""}`}
                                >
                                    <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-l from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-2xl h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-amber-600/20 transition-colors shadow-lg border border-amber-500/20">{stat.icon}</div>
                                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black border ${stat.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600/50'}`}>{stat.change}</div>
                                    </div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                    <h4 className="text-3xl font-black text-amber-100 tracking-tighter font-display">{stat.value}</h4>
                                </Card>
                            ))}
                        </div>

                        {/* Sales Analytics Section - NEW */}
                        <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6 neon-gold">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-amber-100 flex items-center gap-2">
                                    <span className="bg-amber-500/20 p-2 rounded-xl text-amber-400 border border-amber-500/30"><BarChart3 size={20} /></span>
                                    אנליטיקת מכירות - נמכר מול הופק
                                </h3>
                                <Badge variant="gold">
                                    {salesAnalytics.totalIssued}/{salesAnalytics.totalSold} הופקו
                                </Badge>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* By Month Chart */}
                                <div className="glass-card p-4 rounded-2xl border-amber-500/20">
                                    <h4 className="font-bold text-amber-200 mb-4 text-sm">לפי חודש</h4>
                                    <div className="space-y-3">
                                        {Object.entries(salesAnalytics.byMonth).slice(-4).map(([month, data], i) => {
                                            const monthName = new Date(month + '-01').toLocaleDateString('he-IL', { month: 'short' });
                                            const percentage = data.sold > 0 ? Math.round((data.issued / data.sold) * 100) : 0;
                                            return (
                                                <div key={month} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-bold text-slate-300">{monthName}</span>
                                                        <span className="text-slate-500">{data.issued}/{data.sold} ({percentage}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden flex gap-0.5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/30"
                                                        />
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${100 - percentage}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-lg shadow-amber-500/30"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-4 mt-4 text-[10px] font-bold">
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div> <span className="text-slate-400">הופק</span></span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50"></div> <span className="text-slate-400">ממתין</span></span>
                                    </div>
                                </div>

                                {/* By Company */}
                                <div className="glass-card p-4 rounded-2xl border-amber-500/20">
                                    <h4 className="font-bold text-amber-200 mb-4 text-sm flex items-center gap-2">
                                        <Building2 size={14} className="text-slate-500" />
                                        לפי חברה
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {Object.entries(salesAnalytics.byCompany)
                                            .sort(([, a], [, b]) => b.sold - a.sold)
                                            .slice(0, 5)
                                            .map(([company, data]) => {
                                            const percentage = data.sold > 0 ? Math.round((data.issued / data.sold) * 100) : 0;
                                            return (
                                                <div key={company} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700/50">
                                                    <span className="font-medium text-slate-300 text-xs truncate max-w-[100px]">{company}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">{data.issued}/{data.sold}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : percentage >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(salesAnalytics.byCompany).length === 0 && (
                                            <p className="text-center text-slate-500 text-xs py-4">אין נתונים</p>
                                        )}
                                    </div>
                                </div>

                                {/* By Agent */}
                                <div className="glass-card p-4 rounded-2xl border-amber-500/20">
                                    <h4 className="font-bold text-amber-200 mb-4 text-sm flex items-center gap-2">
                                        <Users size={14} className="text-slate-500" />
                                        לפי נציג
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {Object.entries(salesAnalytics.byAgent)
                                            .sort(([, a], [, b]) => b.sold - a.sold)
                                            .map(([agent, data], i) => {
                                            const percentage = data.sold > 0 ? Math.round((data.issued / data.sold) * 100) : 0;
                                            return (
                                                <div key={agent} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-700/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${i === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-amber-500/40' : 'bg-slate-700 text-slate-400'}`}>
                                                            {i + 1}
                                                        </div>
                                                        <span className="font-medium text-slate-300 text-xs">{agent}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">{data.issued}/{data.sold}</span>
                                                        <ShieldCheck size={14} className={percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-red-400'} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(salesAnalytics.byAgent).length === 0 && (
                                            <p className="text-center text-slate-500 text-xs py-4">אין נתונים</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Clients Table */}
                        <Card className="border-amber-500/20 p-0 overflow-hidden min-h-[400px]">
                            <div className="p-8 border-b border-slate-700/50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-amber-100 italic font-display flex items-center gap-2">
                                    <Users size={20} className="text-amber-500" />
                                    ניהול תיקים
                                </h3>
                                <Link href="/admin/clients/new">
                                    <Button size="sm" variant="gold" className="text-xs font-black px-4">
                                        + לקוח חדש
                                    </Button>
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="p-12 text-center text-slate-500 animate-pulse">טוען נתונים...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-slate-800/50">
                                            <tr className="text-amber-400/70 text-[10px] font-black uppercase tracking-widest">
                                                <th className="px-6 py-5">לקוח</th>
                                                <th className="px-6 py-5">סטטוס מכירה</th>
                                                <th className="px-6 py-5 text-center">פוליסות</th>
                                                <th className="px-6 py-5">תיק (שנתי)</th>
                                                <th className="px-6 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {filteredClients.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                                                        לא נמצאו לקוחות מתאימים לחיפוש.
                                                    </td>
                                                </tr>
                                            ) : filteredClients.slice(0, 5).map((client, i) => (
                                                <tr key={i} className="hover:bg-amber-500/5 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-blue-500/20 flex items-center justify-center text-amber-300 font-black text-[10px] shadow-inner group-hover:from-amber-500/30 group-hover:to-blue-500/30 transition-colors border border-amber-500/20">
                                                                {client.firstName?.[0] || client.name?.[0]}{client.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-200 leading-tight">{client.fullName}</p>
                                                                <p className="text-[10px] text-slate-500 font-display">{client.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-xl font-black text-[10px] border ${client.salesStatus.color}`}>
                                                            {client.salesStatus.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center -space-x-2 space-x-reverse">
                                                            {Object.keys(client.policiesMap).filter(k => client.policiesMap[k]).map((key, j) => (
                                                                <div key={j} className="h-8 w-8 rounded-full bg-slate-800 border border-amber-500/30 shadow-lg flex items-center justify-center text-xs relative z-0 hover:z-10 hover:scale-110 transition-transform hover:border-amber-500/60"
                                                                    title={key === 'car' ? 'רכב' : key === 'health' ? 'בריאות' : key === 'life' ? 'חיים' : 'אחר'}>
                                                                    {key === 'car' ? '🚗' : key === 'health' ? '🩺' : key === 'life' ? '❤️' : key === 'pension' ? '💰' : key === 'home' ? '🏠' : '📄'}
                                                                </div>
                                                            ))}
                                                            {Object.keys(client.policiesMap).filter(k => client.policiesMap[k]).length === 0 && <span className="text-slate-600">-</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="font-black text-amber-300 font-display">{client.portfolio}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <Link href={`/admin/clients/${client.id}`} className="block h-8 w-8 rounded-lg bg-slate-800 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:text-amber-300 hover:border-amber-500/50 transition-all shadow-lg hover:shadow-amber-500/20">
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
                                <div className="p-4 bg-slate-800/50 text-center border-t border-slate-700/50">
                                    <button className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
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
