"use client";

import {
    Users,
    ShieldCheck,
    TrendingUp,
    Clock,
    AlertCircle,
    CheckCircle2,
    LayoutDashboard,
    LayoutList,
    Search,
    Filter,
    Layers,
    Loader2,
    X,
    Zap,
    ArrowUpRight,
    Sparkles,
    MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getGeminiStatus } from "@/app/actions/gemini";
import StatsOverview from "@/components/admin/dashboard/StatsOverview";
import { Card, Button, Badge, Skeleton } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import type {
    Client,
    ClientStatus,
    SalesStatus,
    OperationsStatus,
    AgencyRecord,
    AgencyRequest,
    Task,
    ActivityLogEntry
} from "@/types";

const ADMIN_ROLE = "מנהל";

const layoutPresets = [
    {
        id: "immersive",
        title: "פריסת שליטה",
        description: "תצוגה רחבה של KPI יחד עם SLA ותצפית צוות.",
        icon: LayoutDashboard,
        statsGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5",
        mainGrid: "grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6"
    }
];

const timeframeOptions = [
    { id: "all", label: "כל התקופות" },
    { id: "24h", label: "24 שעות אחרונות" },
    { id: "7d", label: "7 הימים האחרונים" },
    { id: "30d", label: "30 הימים האחרונים" }
];

const statusFilters = [
    { id: "all", label: "הכול" },
    { id: "onTime", label: "בזמן" },
    { id: "atRisk", label: "בסיכון" },
    { id: "overdue", label: "חריגה" }
];

interface DashboardTask {
    id: string;
    title: string;
    assignee: string;
    status: "onTime" | "atRisk" | "overdue";
    timeframe: "24h" | "7d" | "30d" | "all";
    dueInHours: number;
    queue: string;
    updated: string;
    importance: "high" | "medium";
}

const mockTasks: DashboardTask[] = [
    {
        id: "SLA-1024",
        title: "בדיקת מסמכים ללקוח פרימיום",
        assignee: "נועה כהן",
        status: "onTime",
        timeframe: "24h",
        dueInHours: 6,
        queue: "בדיקות מסמכים",
        updated: "עודכן לפני 18 דק׳",
        importance: "high"
    },
    {
        id: "SLA-1087",
        title: "שיחת המשך עם לקוח חידוש רכב",
        assignee: "אורי לוי",
        status: "atRisk",
        timeframe: "24h",
        dueInHours: 2,
        queue: "שיחות יוצאות",
        updated: "לפני שעה",
        importance: "high"
    }
];

const statusLabelMap: Record<DashboardTask["status"], string> = {
    onTime: "בזמן",
    atRisk: "בסיכון",
    overdue: "חריגה"
};

const CLAIMS_WATCH = [
    { id: "CL-204", client: "יובל פרץ", type: "בריאות", company: "הראל", status: "awaiting_docs", daysOpen: 5 },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { user, role } = useAuth();
    const [timeframe, setTimeframe] = useState("7d");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dashboardClients, setDashboardClients] = useState<Client[]>([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        newThisWeek: 0,
        complianceRate: 93,
        tasksCount: 0
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leads, setLeads] = useState<Client[]>([]);
    const [agencyRequests, setAgencyRequests] = useState<AgencyRequest[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
    const [recentClients, setRecentClients] = useState<Client[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<{ title: string; label: string; clients: Client[] } | null>(null);
    const [donutSearch, setDonutSearch] = useState("");
    const [isExportingReport, setIsExportingReport] = useState(false);
    
    const isOwner = role === "admin" || role === "manager";
    const dir = "rtl";

    useEffect(() => {
        let mounted = true;
        const fetchDashboardData = async () => {
            setClientsLoading(true);
            try {
                const [total, active, recentResult, tasksTotal] = await Promise.all([
                    firestoreService.getClientsCount(),
                    firestoreService.getClientsCountByStatus("active"),
                    firestoreService.getClientsPaginated({ pageSize: 12 }),
                    firestoreService.getTasksCount()
                ]);

                if (!mounted) return;

                setStats({
                    total,
                    active,
                    newThisWeek: Math.floor(total * 0.05),
                    complianceRate: 93,
                    tasksCount: tasksTotal
                });

                setRecentClients(recentResult.data);
                setDashboardClients(recentResult.data);
            } catch (error) {
                console.error("Dashboard data fetch error:", error);
                if (mounted) toast.error("שגיאה בטעינת נתוני המערכת");
            } finally {
                if (mounted) setClientsLoading(false);
            }
        };

        fetchDashboardData();
        return () => { mounted = false; };
    }, []);

    const handleExportReport = () => {
        if (isExportingReport) return;
        setIsExportingReport(true);
        toast.success("מפיק דוח ביצועים...");
        setTimeout(() => setIsExportingReport(false), 2000);
    };

    const handleCreateRenewalTasks = () => toast.info("מפעיל סוכן AI לחידושים...");
    const handleClaimsFollowup = () => toast.info("בודק סטטוס תביעות...");
    const handleCollectionsReminder = () => toast.info("שולח תזכורות גבייה...");
    const handleComplianceTasks = () => toast.info("מנתח חוסרי רגולציה...");

    const filteredTasks = useMemo(() => {
        return mockTasks.filter(t => statusFilter === "all" || t.status === statusFilter);
    }, [statusFilter]);

    const donutCards = [
        { title: "סטטוס לקוחות", label: "לקוחות", segments: [
            { label: "פעילים", value: 45, color: "#10b981" },
            { label: "לידים", value: 20, color: "#3b82f6" },
            { label: "פרוספקט", value: 15, color: "#f59e0b" }
        ]},
        { title: "מקורות לידים", label: "לידים", segments: [
            { label: "פייסבוק", value: 30, color: "#e5005a" },
            { label: "אתר", value: 25, color: "#0b6bff" },
            { label: "מומלצים", value: 12, color: "#8b5cf6" }
        ]},
        { title: "סוגי מוצרים", label: "פוליסות", segments: [
            { label: "בריאות", value: 40, color: "#ef4444" },
            { label: "חיים", value: 25, color: "#14b8a6" },
            { label: "רכב", value: 35, color: "#f97316" }
        ]}
    ];

    if (clientsLoading) {
        return (
            <DashboardShell role={ADMIN_ROLE} navItems={ADMIN_NAV_ITEMS}>
                <div className="space-y-8 p-8">
                    <Skeleton className="h-12 w-64 bg-slate-200" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl bg-slate-100" />)}
                    </div>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role={ADMIN_ROLE} navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 p-8">

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-2">
                             מרכז שליטה פרימיום <Zap size={14} className="text-amber-500 fill-amber-500" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none italic">
                            שלום, {user?.displayName || "מנהל מערכת"}
                        </h1>
                        <p className="text-slate-400 font-medium">המערכת מעודכנת. הנה תמונת מצב של העסק שלך נכון להיום.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 text-slate-600 font-bold px-6 h-12 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                            onClick={handleExportReport}
                            disabled={isExportingReport}
                        >
                            {isExportingReport ? <Loader2 className="animate-spin h-4 w-4" /> : <TrendingUp size={18} />}
                            ייצוא דוח ביצועים
                        </Button>
                        <Button className="bg-slate-900 hover:bg-black text-white px-8 h-12 rounded-2xl shadow-xl font-black transition-all group border-none">
                             יצירת קמפיין חדש
                             <ArrowUpRight size={18} className="mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                    </div>
                </div>

                {/* STATS */}
                <StatsOverview 
                    totalClients={stats.total}
                    activeLeads={stats.active}
                    pendingTasks={stats.tasksCount}
                    complianceAlerts={3}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* INTELLIGENCE */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="border-none shadow-2xl bg-white/5 backdrop-blur-xl overflow-hidden rounded-[2.5rem] border border-white/10">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <Layers size={20} className="text-amber-500" />
                                        ניתוח תיק חכם (AI Intelligence)
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20">
                                    <input type="text" placeholder="חיפוש..." className="bg-transparent border-none focus:ring-0 text-sm font-medium w-32 text-white placeholder:text-slate-400" value={donutSearch} onChange={e => setDonutSearch(e.target.value)} />
                                    <Search size={14} className="text-amber-500" />
                                </div>
                            </div>
                            
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {donutCards.map((card, i) => (
                                    <div key={i} className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedSegment({ title: card.title, label: card.label, clients: recentClients })}>
                                        <div className="relative h-40 w-40 mb-6 group-hover:scale-110 transition-transform duration-700">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-3xl font-black text-white drop-shadow-lg">{card.segments.reduce((acc, s) => acc + s.value, 0)}</span>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{card.label}</span>
                                            </div>
                                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                {card.segments.map((seg, idx) => {
                                                    const total = card.segments.reduce((acc, s) => acc + s.value, 0);
                                                    const startAngle = card.segments.slice(0, idx).reduce((acc, s) => acc + (s.value / total) * 360, 0);
                                                    const endAngle = (seg.value / total) * 360;
                                                    return <circle key={idx} cx="50" cy="50" r="40" fill="transparent" stroke={seg.color} strokeWidth="10" strokeDasharray={`${(endAngle / 360) * 251.2} 251.2`} strokeDashoffset={`-${(startAngle / 360) * 251.2}`} className="transition-all duration-1000 ease-out" />;
                                                })}
                                            </svg>
                                        </div>
                                        <h4 className="font-black text-slate-200 text-lg">{card.title}</h4>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* QUEUE */}
                        <Card className="border-none shadow-xl bg-slate-900 rounded-[2.5rem] overflow-hidden text-white p-8">
                            <h2 className="text-2xl font-black flex items-center gap-3 mb-8">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                תור פעולות דחוף
                            </h2>
                            <div className="space-y-4">
                                {filteredTasks.map(task => (
                                    <div key={task.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`h-12 w-1.5 rounded-full ${task.status === 'onTime' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <div>
                                                <h4 className="font-bold text-lg">{task.title}</h4>
                                                <p className="text-xs text-slate-400 mt-1">{task.assignee} • {task.queue}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xl font-black font-mono">-{task.dueInHours}h</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* WATCHLIST */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border-none shadow-indigo-500/30 shadow-2xl">
                            <Sparkles size={120} className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-150 group-hover:rotate-12 transition-all duration-1000 ease-in-out" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2 italic">
                                    <Sparkles size={24} className="text-amber-400 fill-amber-400/20" />
                                    תובנות בינה מלאכותית
                                </h3>
                                <div className="bg-white/10 rounded-[2rem] p-6 border border-white/20 backdrop-blur-xl shadow-inner">
                                    <p className="text-sm font-black mb-3 text-indigo-100 uppercase tracking-widest">פוטנציאל חידוש</p>
                                    <p className="text-base font-medium text-white/90 leading-relaxed">זיהיתי 12 לקוחות שתוקף הפוליסה שלהם מסתיים. כדאי לפעול כעת כדי להבטיח את שימורם.</p>
                                    <button className="mt-6 w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black text-sm transition-all transform hover:scale-[1.02] shadow-xl shadow-amber-500/20" onClick={handleCreateRenewalTasks}>
                                        צור משימות שימור עכשיו
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
                            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Clock size={18} className="text-amber-500" />
                                מעקב תפעולי
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="h-10 w-10 bg-rose-500/20 rounded-xl shadow-sm flex items-center justify-center text-rose-500 font-black">!</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">תביעות</p>
                                        <p className="text-sm font-bold text-white">4 תביעות בהשהיה</p>
                                        <button className="text-[10px] text-amber-500 font-black mt-2" onClick={handleClaimsFollowup}>הפעלת מעקב &rarr;</button>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="h-10 w-10 bg-amber-500/20 rounded-xl shadow-sm flex items-center justify-center text-amber-500 font-black">₪</div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">גבייה</p>
                                        <p className="text-sm font-bold text-white">חובות פתוחים</p>
                                        <button className="text-[10px] text-amber-500 font-black mt-2" onClick={handleCollectionsReminder}>שליחת תזכורות &rarr;</button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* MODAL */}
                {selectedSegment ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setSelectedSegment(null)} />
                        <Card className="w-full max-w-4xl max-h-[80vh] bg-white relative z-10 shadow-3xl overflow-hidden rounded-[3rem] flex flex-col border-none">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-3xl font-black">{selectedSegment.title}</h3>
                                <button onClick={() => setSelectedSegment(null)} className="h-10 w-10 rounded-xl bg-white shadow-lg flex items-center justify-center"><X size={20} /></button>
                            </div>
                            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedSegment.clients.map(client => (
                                    <div key={client.id} className="p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all flex items-center justify-between cursor-pointer" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center font-black rounded-lg">{client.name?.[0]}</div>
                                            <p className="font-black text-slate-800">{client.name}</p>
                                        </div>
                                        <ArrowUpRight size={18} className="text-slate-400" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div> : null}

            </div>
        </DashboardShell>
    );
}
