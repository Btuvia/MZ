"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { CommissionCalculator, DealData } from "@/lib/commissions/calculator";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Card, Button, Badge } from "@/components/ui/base";
import {
    TrendingUp,
    AlertCircle,
    RefreshCw,
    DollarSign,
    Building2,
    BarChart3,
    Users,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Download
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminFinancePage() {
    const [deals, setDeals] = useState<DealData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDeals();
    }, []);

    const loadDeals = async () => {
        setIsLoading(true);
        try {
            const fetchedDeals = await firestoreService.getDeals();
            let mappedDeals = fetchedDeals.map((d: any) => ({
                id: d.id,
                productType: d.productType || 'life',
                company: d.company || 'Unknown',
                monthlyPremium: d.monthlyPremium || 0,
                salary: d.salary || 0,
                accumulatedAmount: d.accumulatedAmount || 0,
                startDate: d.startDate?.toDate ? d.startDate.toDate() : new Date(d.startDate || Date.now()),
                status: d.status || 'active',
                cancellationDate: d.cancellationDate?.toDate ? d.cancellationDate.toDate() : d.cancellationDate ? new Date(d.cancellationDate) : undefined,
                agentName: d.agentName || "ישראל ישראלי" // Mock agent assignment if missing
            })) as DealData[];

            // Demo Data Injection if empty
            if (mappedDeals.length === 0) {
                mappedDeals = [
                    { id: "1", productType: "life", company: "הראל", monthlyPremium: 100, startDate: new Date("2024-01-01"), status: "active", agentName: "דני דין" },
                    { id: "2", productType: "health", company: "מנורה", monthlyPremium: 250, startDate: new Date("2024-02-01"), status: "active", agentName: "מיכל סלע" },
                    { id: "3", productType: "pension", company: "הראל", salary: 15000, accumulatedAmount: 1200000, startDate: new Date("2024-03-01"), status: "active", agentName: "דני דין" },
                    { id: "4", productType: "pension", company: "מנורה", accumulatedAmount: 800000, startDate: new Date("2024-03-01"), status: "active", agentName: "יוסי כהן" },
                    { id: "5", productType: "life", company: "הפניקס", monthlyPremium: 200, startDate: new Date("2023-01-01"), status: "cancelled", cancellationDate: new Date("2023-06-01"), agentName: "מיכל סלע" },
                    { id: "6", productType: "health", company: "איילון", monthlyPremium: 450, startDate: new Date("2024-04-01"), status: "active", agentName: "יוסי כהן" },
                    { id: "7", productType: "finance", company: "מיטב", accumulatedAmount: 250000, startDate: new Date("2024-04-15"), status: "active", agentName: "דני דין" },
                ] as any;
            }
            setDeals(mappedDeals);
        } catch (error) {
            console.error("Failed to load deals", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Calculations ---
    const calculations = deals.map(deal => ({
        deal,
        result: CommissionCalculator.calculate(deal)
    }));

    const totalHeikef = calculations.reduce((acc, curr) => acc + curr.result.oneTimeCommission, 0);
    const totalMonthly = calculations.reduce((acc, curr) => acc + curr.result.monthlyCommission, 0);
    const totalClawback = calculations.reduce((acc, curr) => acc + curr.result.clawbackAmount, 0);
    const netCommission = totalHeikef - totalClawback;

    // Aggregations
    const companyStats: Record<string, number> = {};
    const agentStats: Record<string, number> = {};
    const productStats: Record<string, number> = {};

    calculations.forEach(calc => {
        const net = calc.result.oneTimeCommission - calc.result.clawbackAmount;

        // Company
        companyStats[calc.deal.company] = (companyStats[calc.deal.company] || 0) + net;

        // Agent (Mock field 'agentName' used)
        const agent = (calc.deal as any).agentName || "General";
        agentStats[agent] = (agentStats[agent] || 0) + net;

        // Product
        const prod = calc.deal.productType;
        productStats[prod] = (productStats[prod] || 0) + net;
    });

    const maxCompanyVal = Math.max(...Object.values(companyStats), 1);
    const maxAgentVal = Math.max(...Object.values(agentStats), 1);

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">

                {/* Header Hero */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 backdrop-blur-md">
                                    <Wallet size={24} />
                                </span>
                                <h1 className="text-3xl font-black font-display">ניהול כספים וביצועים</h1>
                            </div>
                            <p className="text-slate-400 font-medium max-w-xl">
                                מעקב מתקדם אחר עמלות היקף, נפרעים וביצועי סוכנים בזמן אמת.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none font-bold backdrop-blur-md">
                                <Download size={16} className="ml-2" />
                                ייצוא דוח מלא
                            </Button>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20">
                                <RefreshCw size={16} className="ml-2" />
                                סנכרון מסלקה
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats Row inside Hero */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">סה״כ עמלות (נטו)</p>
                            <h3 className="text-3xl font-black font-mono text-emerald-400">₪{netCommission.toLocaleString()}</h3>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs mt-2 font-bold bg-emerald-400/10 w-fit px-2 py-1 rounded-full">
                                <ArrowUpRight size={12} />
                                +12.5% מהחודש שעבר
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">הכנסה חודשית (נפרעים)</p>
                            <h3 className="text-3xl font-black font-mono text-blue-400">₪{totalMonthly.toLocaleString()}</h3>
                            <p className="text-slate-500 text-xs mt-2">שווי תיק שנתי: ₪{(totalMonthly * 12).toLocaleString()}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">ביטולים וקנסות</p>
                            <h3 className="text-3xl font-black font-mono text-red-400">₪{totalClawback.toLocaleString()}</h3>
                            <div className="flex items-center gap-1 text-red-400 text-xs mt-2 font-bold bg-red-400/10 w-fit px-2 py-1 rounded-full">
                                <ArrowDownRight size={12} />
                                זהירות: חריגה של 5%
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">מכירות החודש</p>
                            <h3 className="text-3xl font-black font-mono text-amber-400">{deals.length}</h3>
                            <p className="text-slate-500 text-xs mt-2">מספר עסקאות שנסגרו</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Chart Section (Simulated) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Company Performance Bar Chart */}
                        <Card className="border-none shadow-xl bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                    <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Building2 size={18} /></span>
                                    ביצועים לפי חברת ביטוח
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(companyStats)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([company, amount], i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-slate-700">{company}</span>
                                                <span className="text-slate-900 font-mono">₪{amount.toLocaleString()}</span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(amount / maxCompanyVal) * 100}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className={`h-full rounded-full ${i === 0 ? "bg-indigo-600" :
                                                            i === 1 ? "bg-indigo-500" :
                                                                "bg-indigo-400"
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Transactions Table */}
                        <Card className="border-none shadow-xl bg-white overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                    <span className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><DollarSign size={18} /></span>
                                    פירוט עסקאות אחרונות
                                </h3>
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 font-bold">צפה בהכל</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">סוכן/לקוח</th>
                                            <th className="p-4">מוצר</th>
                                            <th className="p-4">חברה</th>
                                            <th className="p-4">תאריך</th>
                                            <th className="p-4 text-emerald-600">עמלה</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {calculations.slice(0, 5).map(({ deal, result }, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700">
                                                    {(deal as any).agentName}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-medium">
                                                        {deal.productType === 'life' && '❤️ חיים'}
                                                        {deal.productType === 'health' && '🏥 בריאות'}
                                                        {deal.productType === 'pension' && '💰 פנסיה'}
                                                        {deal.productType === 'finance' && '📈 פיננסים'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-slate-500 font-medium">{deal.company}</td>
                                                <td className="p-4 text-slate-400 font-mono text-xs">{deal.startDate.toLocaleDateString('he-IL')}</td>
                                                <td className="p-4 font-black font-mono text-emerald-600">
                                                    ₪{(result.oneTimeCommission - result.clawbackAmount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Top Agents Leaderboard */}
                        <Card className="border-none shadow-xl bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                            <h3 className="font-black text-lg mb-6 flex items-center gap-2 relative z-10">
                                <span className="bg-white/10 p-2 rounded-lg text-amber-400"><Users size={18} /></span>
                                מובילים במכירות
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {Object.entries(agentStats)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([agent, amount], i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className={`
                                            h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-black text-sm border-2
                                            ${i === 0 ? "bg-amber-400 text-amber-900 border-amber-300 shadow-lg shadow-amber-500/20 scale-110" :
                                                    i === 1 ? "bg-slate-300 text-slate-800 border-slate-200" :
                                                        "bg-amber-700/50 text-amber-100 border-amber-800"}
                                        `}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate text-white group-hover:text-indigo-300 transition-colors">{agent}</p>
                                                <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(amount / maxAgentVal) * 100}%` }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    />
                                                </div>
                                            </div>
                                            <p className="font-mono text-sm font-bold text-white/50">₪{(amount / 1000).toFixed(0)}k</p>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Product Distribution Pie (Simulated) */}
                        <Card className="border-none shadow-xl bg-white p-6">
                            <h3 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
                                <span className="bg-purple-100 p-2 rounded-lg text-purple-600"><PieChart size={18} /></span>
                                התפלגות תיק
                            </h3>
                            <div className="flex justify-center mb-6">
                                <div className="relative h-40 w-40 rounded-full border-[1.5rem] border-slate-100 flex items-center justify-center">
                                    {/* CSS Pie Chart Simulation requires conic-gradient which Tailwind applies easily */}
                                    <div className="absolute inset-0 rounded-full border-[1.5rem] border-transparent"
                                        style={{
                                            background: `conic-gradient(
                                                #6366f1 0% 35%, 
                                                #a855f7 35% 60%, 
                                                #10b981 60% 85%, 
                                                #f59e0b 85% 100%
                                             )`,
                                            maskImage: 'radial-gradient(transparent 55%, black 56%)',
                                            WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)'
                                        }}>
                                    </div>
                                    <div className="text-center z-10">
                                        <p className="text-xs text-slate-400 font-bold uppercase">סה״כ</p>
                                        <p className="text-xl font-black text-slate-800">{deals.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> פנסיה וגמל</span>
                                    <span className="font-bold">35%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><div className="w-3 h-3 rounded-full bg-purple-500"></div> ביטוחי פרט</span>
                                    <span className="font-bold">25%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> בריאות</span>
                                    <span className="font-bold">25%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><div className="w-3 h-3 rounded-full bg-amber-500"></div> אלמנטרי</span>
                                    <span className="font-bold">15%</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
