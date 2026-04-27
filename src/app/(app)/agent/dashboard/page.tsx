"use client";

import { motion } from "framer-motion";
import { 
    Target, Clock, AlertTriangle, TrendingUp, Users, Calendar, 
    Plus, Phone, CheckCircle2, RefreshCw, Bell, Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonCard, NeonButton } from "@/components/ui/neon-form";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";

// Dynamic greeting helper
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "בוקר טוב", emoji: "☀️" };
    if (hour >= 12 && hour < 17) return { text: "צהריים טובים", emoji: "🌤️" };
    if (hour >= 17 && hour < 21) return { text: "ערב טוב", emoji: "🌅" };
    return { text: "לילה טוב", emoji: "🌙" };
};

// Skeleton loader for stats
const StatCardSkeleton = () => (
    <div className="p-10 rounded-[3rem] bg-[#0d1326] border border-slate-800 animate-pulse h-48" />
);

export default function AgentDashboard() {
    const { user } = useAuth();
    const greeting = getGreeting();
    const userName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'שם';
    const [stats, setStats] = useState({
        tasksToday: 0,
        urgentTasks: 0,
        renewalsCount: 0,
        renewalsValue: 0,
        salesGoalProgress: 0,
        salesGoalTotal: 60000,
        closedValue: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [allTasks, allDeals, allClients] = await Promise.all([
                    firestoreService.getTasks(),
                    firestoreService.getDeals(),
                    firestoreService.getClients()
                ]);

                const today = new Date().toISOString().split('T')[0];
                const todaysTasks = allTasks.filter((t: any) => t.dueDate === today || t.dueDate < today && t.status !== 'completed');
                const urgentTasks = todaysTasks.filter((t: any) => t.priority === 'high').length;

                const closedDeals = allDeals.filter((d: any) => d.stage === 'closed');
                const closedValue = closedDeals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

                let upcomingRenewals = 0;
                let potentialValue = 0;
                const recentClients: any[] = [];

                allClients.forEach((client: any) => {
                    if (client.policies && Array.isArray(client.policies)) {
                        client.policies.forEach((p: any) => {
                            if (p.status === 'פעיל' && p.endDate) {
                                const endDate = new Date(p.endDate);
                                const diffTime = endDate.getTime() - new Date().getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays >= 0 && diffDays <= 30) {
                                    upcomingRenewals++;
                                    potentialValue += Number(p.premium || 0);
                                }
                            }
                        });
                    }
                    recentClients.push({
                        id: client.id,
                        name: `${client.firstName} ${client.lastName}`,
                        type: client.policies?.[0]?.type || "כללי",
                        status: client.status || "פעיל",
                        company: client.policies?.[0]?.company || "לא משויך",
                        updatedAt: client.updatedAt ? new Date(client.updatedAt.seconds * 1000).toLocaleDateString() : "חדש"
                    });
                });

                const sortedClients = recentClients.slice(0, 5);

                setStats({
                    tasksToday: todaysTasks.length,
                    urgentTasks,
                    renewalsCount: upcomingRenewals,
                    renewalsValue: potentialValue,
                    salesGoalProgress: (closedValue / 60000) * 100,
                    salesGoalTotal: 60000,
                    closedValue
                });
                setRecentActivity(sortedClients);

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
                <div className="max-w-7xl mx-auto space-y-12 p-8" dir="rtl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="h-12 w-64 bg-slate-800 rounded-2xl animate-pulse mb-3" />
                            <div className="h-4 w-40 bg-slate-800 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <div className="grid gap-10 sm:grid-cols-3">
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </div>
                    <div className="p-10 rounded-[3rem] bg-[#0d1326] border border-slate-800 animate-pulse h-96" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="max-w-7xl mx-auto space-y-12 p-8 animate-in fade-in slide-in-from-bottom-10 duration-1000" dir="rtl">
                
                {/* Header Premium Section */}
                <div className="relative group p-12 rounded-[3rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                היי {userName}, <span className="text-amber-500">{greeting.text}!</span> {greeting.emoji}
                            </h2>
                            <p className="text-slate-500 font-bold mt-4 text-xl tracking-tight">מרכז הבקרה האישי שלך לסגירת עסקאות וניהול תיק הלקוחות</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/agent/leads">
                                <NeonButton variant="blue" className="px-10 py-6 text-lg shadow-xl shadow-blue-500/10 group">
                                    <Zap size={20} className="ml-2 group-hover:animate-pulse" />
                                    ניהול לידים
                                </NeonButton>
                            </Link>
                            <Link href="/agent/sales">
                                <NeonButton className="px-10 py-6 text-lg shadow-xl shadow-amber-500/10 group">
                                    <Plus size={20} className="ml-2 group-hover:rotate-90 transition-transform" />
                                    הוספת עסקה
                                </NeonButton>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Urgent Alerts Neon */}
                {stats.urgentTasks > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 flex items-center gap-6 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-red-500/5 to-transparent animate-pulse" />
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center relative z-10">
                            <AlertTriangle size={32} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        </div>
                        <div className="flex-1 relative z-10">
                            <p className="text-xl font-black text-red-500 italic">שים לב! {stats.urgentTasks} משימות דחופות ממתינות לך</p>
                            <p className="text-slate-400 font-medium">טיפול מיידי ישפר את אחוז הסגירה שלך היום</p>
                        </div>
                        <Link href="/agent/tasks" className="relative z-10">
                            <NeonButton variant="secondary" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                                צפה עכשיו
                            </NeonButton>
                        </Link>
                    </motion.div>
                )}

                {/* Stats Cards Neon */}
                <div className="grid gap-10 sm:grid-cols-3">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <NeonCard title="📊 משימות להיום">
                            <div className="flex items-end justify-between">
                                <p className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                                    {stats.tasksToday}
                                </p>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${stats.urgentTasks > 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                    {stats.urgentTasks} דחופות
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold mt-4">משימות פתוחות וטיפול בלידים</p>
                        </NeonCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <NeonCard title="🔄 חיחידושים קרובים">
                            <div className="flex items-end justify-between">
                                <p className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                                    {stats.renewalsCount}
                                </p>
                                <span className="text-xl font-black text-orange-400 drop-shadow-lg">₪{stats.renewalsValue.toLocaleString()}</span>
                            </div>
                            <p className="text-slate-500 font-bold mt-4">פוטנציאל שימור החודש</p>
                        </NeonCard>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <NeonCard title="🎯 יעד מכירות">
                            <div className="flex items-end justify-between">
                                <p className="text-6xl font-black text-white italic tracking-tighter drop-shadow-2xl">
                                    {Math.round(stats.salesGoalProgress)}%
                                </p>
                                <span className="text-sm font-black text-emerald-400">₪{stats.closedValue.toLocaleString()} / ₪{stats.salesGoalTotal.toLocaleString()}</span>
                            </div>
                            <div className="h-4 w-full bg-slate-900 border border-slate-800 rounded-full mt-6 overflow-hidden relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(stats.salesGoalProgress, 100)}%` }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="h-full bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                 />
                            </div>
                        </NeonCard>
                    </motion.div>
                </div>

                {/* Recent Clients Table Premium */}
                <NeonCard 
                    title="👥 לקוחות אחרונים" 
                    action={
                        <Link href="/agent/clients" className="text-[10px] font-black text-amber-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 underline underline-offset-8">
                            צפה בכל הלקוחות <RefreshCw size={12} />
                        </Link>
                    }
                >
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-800">
                                    <th className="px-4 py-6">לקוח</th>
                                    <th className="px-4 py-6">סוג פוליסה</th>
                                    <th className="px-4 py-6">סטטוס</th>
                                    <th className="px-4 py-6">חברה</th>
                                    <th className="px-4 py-6">עודכן</th>
                                    <th className="px-4 py-6 text-left">פעולה</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-slate-500 italic font-black">אין פעילות אחרונה במערכת</td>
                                    </tr>
                                ) : (
                                    recentActivity.map((row, i) => (
                                        <motion.tr 
                                            key={i} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="hover:bg-slate-900/30 transition-all group"
                                        >
                                            <td className="px-4 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-500 group-hover:scale-110 transition-all text-sm shadow-inner overflow-hidden">
                                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        {row.name ? row.name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-black text-white italic">{row.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-6 text-slate-400 font-bold">{row.type}</td>
                                            <td className="px-4 py-6">
                                                <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-6 text-slate-400 font-black">{row.company}</td>
                                            <td className="px-4 py-6 text-slate-600 font-medium">{row.updatedAt}</td>
                                            <td className="px-4 py-6 text-left">
                                                <Link href={`/agent/clients/${row.id}`}>
                                                    <NeonButton variant="secondary" size="sm" className="px-6 py-2 border-amber-500/20 hover:border-amber-500 transition-all">
                                                        <Phone size={12} className="ml-2" />
                                                        ניהול
                                                    </NeonButton>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>
            </div>
        </DashboardShell>
    );
}
