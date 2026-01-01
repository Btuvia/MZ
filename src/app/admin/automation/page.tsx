"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import {
    Bot,
    Play,
    Pause,
    Settings,
    Activity,
    CheckCircle2,
    AlertCircle,
    Clock,
    Zap,
    History,
    FileText,
    ArrowRight,
    Layers
} from "lucide-react";

export default function AutomationHubPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({
        activeWorkflows: 0,
        tasksAutomatedToday: 0,
        successRate: 100,
        pendingApprovals: 3
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Mock data for initial view - in real implementation this would fetch from firestoreService
            // const fetchedWorkflows = await firestoreService.getWorkflows();

            // Simulating data loaded from previous "workflow-automation.ts" logic
            const mockLogs = [
                { id: 1, type: "workflow_start", details: "תביעת רכב - ישראל ישראלי", time: "10:30", status: "success" },
                { id: 2, type: "task_created", details: "יצירת משימה: איסוף מסמכים", time: "10:31", status: "success" },
                { id: 3, type: "step_advanced", details: "תביעה אושרה -> העבר לתשלום", time: "11:45", status: "success" },
                { id: 4, type: "sla_breach", details: "חריגת זמנים: טיפול בערעור", time: "13:20", status: "warning" },
            ];

            setLogs(mockLogs);
            setStats({
                activeWorkflows: 12,
                tasksAutomatedToday: 45,
                successRate: 98,
                pendingApprovals: 2
            });

            setWorkflows([
                { id: "1", name: "קליטת לקוח חדש", status: "active", steps: 5, activeInstances: 3, lastRun: "10:00" },
                { id: "2", name: "חידוש פוליסה - רכב", status: "active", steps: 3, activeInstances: 8, lastRun: "11:30" },
                { id: "3", name: "טיפול בתביעה", status: "active", steps: 8, activeInstances: 1, lastRun: "09:15" },
                { id: "4", name: "שימור לקוח (בסיכון)", status: "paused", steps: 4, activeInstances: 0, lastRun: "Yesterday" },
            ]);

        } catch (error) {
            console.error("Failed to load automation data", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-display flex items-center gap-2">
                            <span className="bg-indigo-600 text-white p-2 rounded-xl"><Bot size={24} /></span>
                            מרכז האוטומציות
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">ניהול, מעקב ובקרה על תהליכי העבודה האוטומטיים בסוכנות</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="font-bold border-slate-200">
                            log_viewer.txt <History size={16} className="mr-2" />
                        </Button>
                        <Button className="font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                            <Zap size={16} className="ml-2" /> אוטומציה חדשה
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-lg p-6 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <Activity />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider">תהליכים פעילים</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.activeWorkflows}</h3>
                        </div>
                    </Card>

                    <Card className="border-none shadow-lg p-6 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                        <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <Zap />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider">פעולות היום</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.tasksAutomatedToday}</h3>
                        </div>
                    </Card>

                    <Card className="border-none shadow-lg p-6 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500"></div>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <CheckCircle2 />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider">אחוזי הצלחה</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.successRate}%</h3>
                        </div>
                    </Card>

                    <Card className="border-none shadow-lg p-6 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-full w-1 bg-amber-500"></div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            <Clock />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider">ממתינים לאישור</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.pendingApprovals}</h3>
                        </div>
                    </Card>
                </div>

                {/* Main Content Layout */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Workflows List (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-xl bg-white overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                    <span className="bg-slate-100 p-2 rounded-lg"><Settings size={18} /></span>
                                    ספריית תהליכים
                                </h3>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-bold text-slate-800">פעילים</button>
                                    <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">טיוטות</button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {workflows.map(wf => (
                                    <div key={wf.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-bold
                                                ${wf.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}
                                            `}>
                                                {wf.id}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{wf.name}</h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                    <span className="flex items-center gap-1"><Layers size={12} /> {wf.steps} שלבים</span>
                                                    <span className="flex items-center gap-1"><Activity size={12} /> {wf.activeInstances} ראים כעת</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Badge className={
                                                wf.status === 'active'
                                                    ? "bg-emerald-100 text-emerald-700 border-none"
                                                    : "bg-slate-100 text-slate-500 border-none"
                                            }>
                                                {wf.status === 'active' ? 'פעיל' : 'מושהה'}
                                            </Badge>
                                            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-indigo-600">
                                                <Settings size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Live Logs (1/3 width) */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-slate-900 text-white h-[500px] flex flex-col">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-black text-lg flex items-center gap-2">
                                    <span className="animate-pulse text-emerald-400">●</span> Live Logs
                                </h3>
                                <Badge className="bg-white/10 hover:bg-white/20 text-white border-none">Real-time</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-white/20">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-right-2 duration-300">
                                        <div className="mt-1">
                                            {log.status === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
                                            {log.status === 'warning' && <AlertCircle size={14} className="text-amber-400" />}
                                        </div>
                                        <div>
                                            <p className="opacity-90 font-bold">{log.type}</p>
                                            <p className="opacity-60 text-xs mb-1">{log.details}</p>
                                            <p className="opacity-40 text-[10px]">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-center pt-4">
                                    <span className="loading loading-dots loading-xs opacity-30"></span>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Tips */}
                        <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-lg p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-black text-lg mb-2">💡 טיפ אוטומציה</h4>
                                <p className="text-indigo-100 text-sm mb-4">
                                    ניתן להגדיר "טריגר חכם" שמופעל אוטומטית כאשר לקוח משנה סטטוס ל-"בסיכון", ולשלוח לו הודעת וואטסאפ אישית.
                                </p>
                                <Button size="sm" className="bg-white text-indigo-600 font-bold hover:bg-indigo-50 w-full">
                                    הגדר טריגר עכשיו
                                </Button>
                            </div>
                            <Bot className="absolute -bottom-4 -left-4 text-white/10 w-32 h-32 rotate-12" />
                        </Card>
                    </div>

                </div>
            </div>
        </DashboardShell>
    );
}
