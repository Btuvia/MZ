"use client";

import { motion } from "framer-motion";
import { 
    Target, Clock, AlertTriangle, TrendingUp, Users, Calendar, 
    Plus, Phone, CheckCircle2, RefreshCw, Bell, Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
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
    <Card className="p-6 animate-pulse">
        <div className="h-3 w-20 bg-slate-700/50 rounded mb-4" />
        <div className="h-10 w-16 bg-slate-700/50 rounded mb-2" />
        <div className="h-3 w-24 bg-slate-700/30 rounded" />
    </Card>
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
        salesGoalTotal: 60000, // Monthly goal
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

                // --- 1. Tasks Logic ---
                const today = new Date().toISOString().split('T')[0];
                const todaysTasks = allTasks.filter((t: any) => t.dueDate === today || t.dueDate < today && t.status !== 'completed'); // Due today or overdue
                const urgentTasks = todaysTasks.filter((t: any) => t.priority === 'high').length;

                // --- 2. Sales Logic ---
                const closedDeals = allDeals.filter((d: any) => d.stage === 'closed');
                const closedValue = closedDeals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);

                // --- 3. Renewals Logic (Mocking "upcoming" based on policies) ---
                let upcomingRenewals = 0;
                let potentialValue = 0;
                const recentClients: any[] = [];

                allClients.forEach((client: any) => {
                    // Check policies for renewal (simplified: just checking if any exist for now as data might be sparse)
                    if (client.policies && Array.isArray(client.policies)) {
                        client.policies.forEach((p: any) => {
                            // In a real app, compare p.renewalDate to next 30 days
                            // For demo: if status is 'active', count it randomly or if standard date format matches
                            if (p.status === 'פעיל' && p.endDate) {
                                const endDate = new Date(p.endDate);
                                const diffTime = endDate.getTime() - new Date().getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                // Check if renewal is within next 30 days
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

                // Sort recent clients by date (mock or real) - taking last 5
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

    // Loading skeleton
    if (loading) {
        return (
            <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
                <div className="space-y-8" dir="rtl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-gradient-gold neon-text-gold">
                                היי {userName}, {greeting.text}! {greeting.emoji}
                            </h2>
                            <p className="text-slate-400 mt-1">טוען את הנתונים שלך...</p>
                        </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-3">
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </div>
                    <Card className="p-6 animate-pulse">
                        <div className="h-6 w-40 bg-slate-700/50 rounded mb-4" />
                        <div className="space-y-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="h-12 bg-slate-700/30 rounded" />
                            ))}
                        </div>
                    </Card>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500" dir="rtl">
                
                {/* Header with greeting */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gradient-gold neon-text-gold">
                            היי {userName}, {greeting.text}! {greeting.emoji}
                        </h2>
                        <p className="text-slate-400 mt-1">הנה סיכום היום שלך</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/agent/leads">
                            <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                <Zap size={16} className="ml-2" />
                                ניהול לידים
                            </Button>
                        </Link>
                        <Link href="/agent/sales">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20">
                                <Plus size={16} className="ml-2" />
                                הוספת עסקה
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Urgent Alerts */}
                {stats.urgentTasks > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card border border-red-500/30 bg-red-500/10 p-4 rounded-2xl flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-red-400">יש לך {stats.urgentTasks} משימות דחופות!</p>
                            <p className="text-sm text-slate-400">לחץ כדי לצפות בהן</p>
                        </div>
                        <Link href="/agent/tasks">
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                                צפה עכשיו
                            </Button>
                        </Link>
                    </motion.div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-6 sm:grid-cols-3">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="border-r-4 border-r-amber-500 p-6 flex flex-col justify-between neon-gold">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">משימות להיום</span>
                                <Clock size={18} className="text-amber-500" />
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-4xl font-black text-amber-100 tracking-tighter">
                                    {stats.tasksToday}
                                </p>
                                <Badge className={stats.urgentTasks > 0 ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                                    {stats.urgentTasks} דחופות
                                </Badge>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="border-r-4 border-r-orange-500 p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">חידושים קרובים</span>
                                <RefreshCw size={18} className="text-orange-500" />
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-4xl font-black text-amber-100 tracking-tighter">
                                    {stats.renewalsCount}
                                </p>
                                <span className="text-xs font-bold text-orange-400 pb-1">₪{stats.renewalsValue.toLocaleString()}</span>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="border-r-4 border-r-emerald-500 p-6 flex flex-col justify-between overflow-hidden relative">
                            <div className="absolute top-[-10px] left-[-10px] h-20 w-20 bg-emerald-500/10 rounded-full blur-2xl" />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">יעד מכירות חודשי</span>
                                <Target size={18} className="text-emerald-500" />
                            </div>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-4xl font-black text-amber-100 tracking-tighter">
                                    {Math.round(stats.salesGoalProgress)}%
                                </p>
                                <span className="text-xs font-bold text-emerald-400 pb-1">₪{stats.closedValue.toLocaleString()} / ₪{stats.salesGoalTotal.toLocaleString()}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-700/50 rounded-full mt-4 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(stats.salesGoalProgress, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-lg shadow-emerald-500/30"
                                 />
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Recent Clients Table */}
                <Card className="border-amber-500/20 overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                        <div>
                            <h3 className="text-lg font-bold text-amber-100 tracking-tight flex items-center gap-2">
                                <Users size={18} className="text-amber-500" />
                                לקוחות אחרונים
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">דוח בזמן אמת</p>
                        </div>
                        <Link href="/agent/clients" className="text-xs font-bold text-amber-400 hover:underline">צפה בכל הלקוחות</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-800/50">
                                <tr className="border-b border-slate-700/50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                                    <th className="px-6 py-4 font-black">לקוח</th>
                                    <th className="px-6 py-4 font-black">סוג פוליסה</th>
                                    <th className="px-6 py-4 font-black">סטטוס</th>
                                    <th className="px-6 py-4 font-black">חברה</th>
                                    <th className="px-6 py-4 font-black">עודכן</th>
                                    <th className="px-6 py-4 font-black" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-slate-500">אין פעילות אחרונה</td>
                                    </tr>
                                ) : (
                                    recentActivity.map((row, i) => (
                                        <motion.tr 
                                            key={i} 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-900 group-hover:scale-110 transition-all text-xs shadow-lg shadow-amber-500/20">
                                                        {row.name ? row.name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-bold text-slate-200">{row.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-400 font-medium">{row.type}</td>
                                            <td className="px-6 py-5">
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{row.status}</Badge>
                                            </td>
                                            <td className="px-6 py-5 text-slate-400 font-bold">{row.company}</td>
                                            <td className="px-6 py-5 text-slate-500 font-medium">{row.updatedAt}</td>
                                            <td className="px-6 py-5">
                                                <Link href={`/agent/clients/${row.id}`}>
                                                    <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                                        <Phone size={14} className="ml-1" />
                                                        ניהול
                                                    </Button>
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
