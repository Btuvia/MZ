"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link"; // For navigation

export default function AgentDashboard() {
    const { user } = useAuth();
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

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500" dir="rtl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-primary">היעדים שלי</h2>
                        <p className="text-slate-500">ביצועים אישיים לרבעון הנוכחי</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/agent/leads">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-border text-sm font-bold text-primary hover:shadow-md transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                ניהול לידים
                            </button>
                        </Link>
                        <Link href="/agent/sales">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-accent rounded-xl text-sm font-bold text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                הוספת עסקה
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    <Card className="border-r-4 border-r-accent p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">משימות להיום</span>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {loading ? "-" : stats.tasksToday}
                            </p>
                            <div className="text-xs font-bold text-slate-400 pb-1">{stats.urgentTasks} דחופות</div>
                        </div>
                    </Card>
                    <Card className="border-r-4 border-r-warning p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">חידושים (הערכה)</span>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {loading ? "-" : stats.renewalsCount}
                            </p>
                            <div className="text-xs font-bold text-orange-400 pb-1">פער: ₪{stats.renewalsValue.toLocaleString()}</div>
                        </div>
                    </Card>
                    <Card className="border-r-4 border-r-success p-6 flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute top-[-10px] left-[-10px] h-20 w-20 bg-success/5 rounded-full blur-2xl"></div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">יעד מכירות חודשי</span>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-4xl font-black text-primary tracking-tighter">
                                {loading ? "-" : `${Math.round(stats.salesGoalProgress)}%`}
                            </p>
                            <div className="text-xs font-bold text-success pb-1">₪{stats.closedValue.toLocaleString()} / ₪{stats.salesGoalTotal.toLocaleString()}</div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-success rounded-full shadow-sm transition-all duration-1000"
                                style={{ width: `${Math.min(stats.salesGoalProgress, 100)}%` }}
                            ></div>
                        </div>
                    </Card>
                </div>

                <Card className="border-none shadow-md overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-slate-50">
                        <div>
                            <h3 className="text-lg font-bold text-primary tracking-tight">לקוחות אחרונים</h3>
                            <p className="text-xs text-slate-400 mt-0.5">דוח בזמן אמת</p>
                        </div>
                        <Link href="/agent/clients" className="text-xs font-bold text-accent hover:underline">צפה בכל הלקוחות</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50/50">
                                <tr className="border-b border-border text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                    <th className="px-6 py-4 font-black">לקוח</th>
                                    <th className="px-6 py-4 font-black">סוג פוליסה</th>
                                    <th className="px-6 py-4 font-black">סטטוס</th>
                                    <th className="px-6 py-4 font-black">חברה</th>
                                    <th className="px-6 py-4 font-black">עודכן</th>
                                    <th className="px-6 py-4 font-black"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-slate-400">טוען נתונים...</td>
                                    </tr>
                                ) : recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-slate-400">אין פעילות אחרונה</td>
                                    </tr>
                                ) : (
                                    recentActivity.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-primary group-hover:bg-accent group-hover:text-white transition-all text-xs">
                                                        {row.name ? row.name.charAt(0) : '?'}
                                                    </div>
                                                    <span className="font-bold text-primary">{row.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-500 font-medium">{row.type}</td>
                                            <td className="px-6 py-5">
                                                <Badge variant="outline" className="bg-slate-100 border-none">{row.status}</Badge>
                                            </td>
                                            <td className="px-6 py-5 text-slate-500 font-bold">{row.company}</td>
                                            <td className="px-6 py-5 text-slate-400 font-medium">{row.updatedAt}</td>
                                            <td className="px-6 py-5">
                                                <Link href={`/admin/clients/${row.id}`}>
                                                    <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 border-slate-200">ניהול תיק</Button>
                                                </Link>
                                            </td>
                                        </tr>
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
