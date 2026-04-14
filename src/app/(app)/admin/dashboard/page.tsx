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
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getGeminiStatus } from "@/app/actions/gemini";
import { Card, Button, Badge, Skeleton } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { useAuth } from "@/lib/contexts/AuthContext";
import type {
    Client,
    ClientStatus,
    SalesStatus,
    OperationsStatus,
    AgencyRecord,
    AgencyRequest,
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
    },
    {
        id: "focus",
        title: "מיקוד SLA",
        description: "הדגשת משימות דחופות וסימוני אזהרה.",
        icon: LayoutList,
        statsGrid: "grid grid-cols-1 md:grid-cols-2 gap-5",
        mainGrid: "space-y-6"
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

// METRICS will be calculated inside the component now for dynamism

const SLA_BREAKDOWN = [
    {
        label: "משימות בזמן",
        value: "912",
        detail: "91% מהמשימות עומדות ביעד",
        style: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 shadow-emerald-500/20"
    },
    {
        label: "בסיכון",
        value: "34",
        detail: "אזהרה נשלחה עד 4 שעות לפני היעד",
        style: "border-amber-500/40 bg-amber-500/10 text-amber-100 shadow-amber-500/20"
    },
    {
        label: "חריגה",
        value: "12",
        detail: "חריגה ממוצעת: 1.3 שעות",
        style: "border-red-500/40 bg-red-500/10 text-red-100 shadow-red-500/20"
    }
];

const ALERTS = [
    {
        title: "רישום קריטי ללקוח גולדמן",
        detail: "ה‑SLA יפוג בעוד 3 שעות והמסמכים ממתינים",
        status: "warning",
        time: "לפני 12 דק׳",
        icon: AlertCircle
    },
    {
        title: "חסרה חתימה בפוליסה",
        detail: "בקרת איכות זיהתה חוסר התאמה בתאריך בקובץ PDF",
        status: "warning",
        time: "לפני שעה",
        icon: AlertCircle
    },
    {
        title: "טיפול בתביעה נסגר",
        detail: "אישור סופי נשלח והסטטוס עודכן",
        status: "success",
        time: "לפני שעתיים",
        icon: CheckCircle2
    }
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

const TASKS: DashboardTask[] = [
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
    },
    {
        id: "SLA-1132",
        title: "שליחת פוליסה חתומה",
        assignee: "מאיה בר",
        status: "onTime",
        timeframe: "7d",
        dueInHours: 40,
        queue: "ניירת",
        updated: "לפני יומיים",
        importance: "medium"
    },
    {
        id: "SLA-1198",
        title: "גביית פרמיה ראשונה",
        assignee: "רן אברמוב",
        status: "overdue",
        timeframe: "30d",
        dueInHours: -2,
        queue: "גבייה",
        updated: "לפני 4 שעות",
        importance: "high"
    },
    {
        id: "SLA-1234",
        title: "פולואפ על הצעת בריאות",
        assignee: "דנה שיר",
        status: "atRisk",
        timeframe: "24h",
        dueInHours: 8,
        queue: "מכירות",
        updated: "לפני 26 דק׳",
        importance: "medium"
    },
    {
        id: "SLA-1267",
        title: "עדכון פרטי חשבון לסוכן",
        assignee: "תמר וייס",
        status: "onTime",
        timeframe: "30d",
        dueInHours: 72,
        queue: "תפעול סוכנים",
        updated: "אתמול",
        importance: "medium"
    }
];

const statusBadgeVariant: Record<DashboardTask["status"], "success" | "warning" | "error"> = {
    onTime: "success",
    atRisk: "warning",
    overdue: "error"
};

const statusLabelMap: Record<DashboardTask["status"], string> = {
    onTime: "בזמן",
    atRisk: "בסיכון",
    overdue: "חריגה"
};

type DonutSegment = { label: string; value: number; color: string };

// Donut data now computed from Firestore clients

const alertStyleMap: Record<string, string> = {
    warning: "border-amber-500/40 bg-amber-500/10 shadow-amber-500/30",
    success: "border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/30"
};

const CLAIMS_WATCH = [
    { id: "CL-204", client: "יובל פרץ", type: "בריאות", company: "הראל", status: "awaiting_docs", daysOpen: 5 },
    { id: "CL-219", client: "קרן דיין", type: "רכב", company: "מנורה", status: "sla_risk", daysOpen: 12 },
    { id: "CL-233", client: "דוד לוי", type: "דירה", company: "כלל", status: "approved", daysOpen: 3 },
];

const COLLECTIONS = [
    { id: "COL-81", client: "רונית לוי", amount: 920, status: "overdue", days: 7 },
    { id: "COL-82", client: "מיכאל כהן", amount: 340, status: "pending", days: 3 },
    { id: "COL-83", client: "שחר בר", amount: 1280, status: "overdue", days: 14 },
];

const COMPLIANCE_CHECKLIST = [
    { id: "CMP-1", label: "איסוף הצהרת בריאות חתומה", done: false },
    { id: "CMP-2", label: "אימות תעודת זהות", done: true },
    { id: "CMP-3", label: "טופסי מוטבים (חיים/בריאות)", done: false },
];

const OWNER_ADMIN_EMAIL = "btuvia6580@gmail.com";

const LEAD_QUALITY = [
    { source: "קמפיין פייסבוק", conversion: 21, volume: 48 },
    { source: "מומלץ/חבר מביא חבר", conversion: 38, volume: 16 },
    { source: "אתר אינטרנט", conversion: 14, volume: 33 },
];

const CALL_CENTER = [
    { id: "CC-1", agent: "דנה שיר", client: "מעיין אבני", topic: "חידוש בריאות", duration: "04:12" },
    { id: "CC-2", agent: "אורי לוי", client: "גיא כהן", topic: "תביעה פתוחה", duration: "02:05" },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { user, role } = useAuth();
    const [layoutMode, setLayoutMode] = useState(layoutPresets[0].id);
    const [timeframe, setTimeframe] = useState("7d");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
    const [activeClientsOnly, setActiveClientsOnly] = useState(false);
    const [dashboardClients, setDashboardClients] = useState<Client[]>([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientsError, setClientsError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        newThisWeek: 0,
        complianceRate: 93, // placeholder
        tasksCount: 72
    });
    const [recentClients, setRecentClients] = useState<Client[]>([]);
    const [selectedSegment, setSelectedSegment] = useState<{ title: string; label: string; clients: Client[] } | null>(null);
    const [segmentSearch, setSegmentSearch] = useState("");
    const [donutSearch, setDonutSearch] = useState("");
    const [isExportingReport, setIsExportingReport] = useState(false);
    const [isCreatingRenewalTasks, setIsCreatingRenewalTasks] = useState(false);
    const [isCreatingClaimsTasks, setIsCreatingClaimsTasks] = useState(false);
    const [isSendingCollections, setIsSendingCollections] = useState(false);
    const [isCreatingComplianceTasks, setIsCreatingComplianceTasks] = useState(false);
    const [requestAgencyName, setRequestAgencyName] = useState("");
    const [requestContactName, setRequestContactName] = useState("");
    const [requestContactPhone, setRequestContactPhone] = useState("");
    const [requestNote, setRequestNote] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [agencyNameInput, setAgencyNameInput] = useState("");
    const [agencySeatCountInput, setAgencySeatCountInput] = useState(3);
    const [isCreatingAgency, setIsCreatingAgency] = useState(false);
    const [agencies, setAgencies] = useState<AgencyRecord[]>([]);
    const [agenciesLoading, setAgenciesLoading] = useState(false);
    const [agenciesError, setAgenciesError] = useState<string | null>(null);
    const [pendingRequests, setPendingRequests] = useState<AgencyRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);
    const isOwner = role === "admin" || role === "manager";
    const dir = "rtl";

    const loadAgencies = useCallback(async () => {
        if (!isOwner) return;
        setAgenciesLoading(true);
        setAgenciesError(null);
        try {
            const data = await firestoreService.getAgencies();
            setAgencies(data);
        } catch (error) {
            console.error("Load agencies error", error);
            setAgenciesError("לא הצלחנו לטעון סוכנויות.");
        } finally {
            setAgenciesLoading(false);
        }
    }, [isOwner]);

    const loadRequests = useCallback(async () => {
        if (!isOwner) return;
        setRequestsLoading(true);
        setRequestsError(null);
        try {
            const data = await firestoreService.getAgencyRequests("pending");
            setPendingRequests(data);
        } catch (error) {
            console.error("Load agency requests error", error);
            setRequestsError("לא הצלחנו לטעון בקשות חדשות.");
        } finally {
            setRequestsLoading(false);
        }
    }, [isOwner]);

    const layoutConfig = layoutPresets.find((option) => option.id === layoutMode) ?? layoutPresets[0];
    const timelineLabel = timeframeOptions.find((option) => option.id === timeframe)?.label ?? "7 הימים האחרונים";
    const filteredSegmentClients = useMemo(() => {
        if (!selectedSegment) return [];
        const query = segmentSearch.trim().toLowerCase();
        if (!query) return selectedSegment.clients;
        return selectedSegment.clients.filter((c) => {
            const haystack = [
                c.name,
                c.email,
                c.phone,
                c.status,
                c.source,
                c.salesStatus,
                c.operationsStatus,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [selectedSegment, segmentSearch]);

    const healthSnapshot = useMemo(() => {
        const totalClients = stats.total;
        const activeClients = stats.active;
        const persistency = totalClients ? Math.round((activeClients / totalClients) * 100) : 0;

        const parseDate = (value?: string | Date) => {
            if (!value) return null;
            const date = value instanceof Date ? value : new Date(value);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const now = new Date();
        const thirtyDays = new Date(now);
        thirtyDays.setDate(thirtyDays.getDate() + 30);

        // Calculate renewals only from the loaded recent clients for the copilot widget
        // In a full production app, this would be a specific query
        const renewalCandidates = recentClients.flatMap((client) =>
            (client.policies || [])
                .map((policy) => ({
                    client,
                    policy,
                    renewalDate: parseDate(policy.renewalDate),
                }))
                .filter((item) => item.renewalDate && item.renewalDate >= now && item.renewalDate <= thirtyDays)
        );

        renewalCandidates.sort((a, b) => (a.renewalDate?.getTime() || 0) - (b.renewalDate?.getTime() || 0));

        // For simulation/placeholder of avg lag if not calculated system-wide
        const avgLag = 14; 

        return {
            totalClients,
            activeClients,
            persistency,
            renewalCandidates,
            avgLag,
            lagCount: renewalCandidates.length,
        };
    }, [stats, recentClients]);

    const dynamicMetrics = useMemo(() => [
        {
            label: "סה״כ לקוחות",
            value: stats.total.toLocaleString(),
            delta: `${stats.active} פעילים`,
            icon: Users,
            accent: "text-blue-400"
        },
        {
            label: "עמידה ב‑SLA",
            value: `${stats.complianceRate}%`,
            delta: "+3% מול חודש קודם",
            icon: ShieldCheck,
            accent: "text-emerald-400"
        },
        {
            label: "לקוחות חדשים השבוע",
            value: stats.newThisWeek.toString(),
            delta: "צמיחה אורגנית",
            icon: TrendingUp,
            accent: "text-amber-400"
        },
        {
            label: "תורים פתוחים",
            value: stats.tasksCount.toLocaleString(),
            delta: "ממתינים לטיפול",
            icon: Clock,
            accent: "text-purple-400"
        }
    ], [stats]);

    const filteredTasks = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return TASKS.filter((task) => {
            const matchesStatus = statusFilter === "all" || task.status === statusFilter;
            const matchesTimeframe = timeframe === "all" || task.timeframe === timeframe;
            const matchesSearch =
                !normalizedSearch ||
                [task.title, task.assignee, task.queue].some((value) =>
                    value.toLowerCase().includes(normalizedSearch)
                );

            return matchesStatus && matchesTimeframe && matchesSearch;
        });
    }, [statusFilter, timeframe, searchQuery]);

    const averageResolution = "6.2 hrs";
    const onTimePercent = 93;

    useEffect(() => {
        getGeminiStatus()
            .then((status) => setIsGeminiConfigured(Boolean(status.configured)))
            .catch(() => setIsGeminiConfigured(false));
    }, []);

    useEffect(() => {
        let mounted = true;

        const fetchDashboardData = async () => {
            setClientsLoading(true);
            try {
                // Fetch counts in parallel for performance
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
                    newThisWeek: Math.floor(total * 0.05), // Estimated if we don't have a specific per-week count yet
                    complianceRate: 93,
                    tasksCount: tasksTotal
                });

                setRecentClients(recentResult.data);
                // For components still depending on 'dashboardClients' array
                setDashboardClients(recentResult.data);

            } catch (error) {
                console.error("Dashboard data fetch error:", error);
                if (mounted) setClientsError("שגיאה בטעינת נתוני המערכת");
            } finally {
                if (mounted) setClientsLoading(false);
            }
        };

        fetchDashboardData();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!isOwner) return;
        loadAgencies();
        loadRequests();
    }, [isOwner, loadAgencies, loadRequests]);

    const handleExportReport = () => {
        if (isExportingReport) return;
        setIsExportingReport(true);
        try {
            const rows = [
                ["מדד", "ערך"],
                ["סה״כ לקוחות", String(healthSnapshot.totalClients)],
                ["לקוחות פעילים", String(healthSnapshot.activeClients)],
                ["Persistency %", String(healthSnapshot.persistency)],
                ["Lag פרמיה ראשונה (ימים)", String(healthSnapshot.avgLag)],
                ["חידושים 30 יום", String(healthSnapshot.renewalCandidates.length)],
            ];
            const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/\"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("הדוח ירד בהצלחה.");
        } catch (error) {
            console.error("Export report error", error);
            toast.error("לא הצלחנו להפיק דו״ח.");
        } finally {
            setIsExportingReport(false);
        }
    };

    const handleCreateRenewalTasks = async () => {
        if (isCreatingRenewalTasks) return;
        if (!healthSnapshot.renewalCandidates.length) {
            toast.info("אין חידושים לטיפול.");
            return;
        }
        setIsCreatingRenewalTasks(true);
        try {
            const createdBy = user?.uid || "system";
            for (const item of healthSnapshot.renewalCandidates) {
                const dueDate = item.renewalDate ? item.renewalDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
                await firestoreService.addTask({
                    title: `חידוש פוליסה - ${item.client.name || "לקוח"}`,
                    description: `פוליסה ${item.policy.type} ב-${item.policy.company}.`,
                    type: "call",
                    status: "new",
                    priority: "high",
                    date: dueDate,
                    time: "09:00",
                    assignedTo: createdBy,
                    createdBy,
                    completed: false,
                    clientId: item.client.id,
                    clientName: item.client.name,
                    companyName: item.policy.company,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            toast.success("משימות חידוש נוצרו בהצלחה.");
        } catch (error) {
            console.error("Create renewal tasks error", error);
            toast.error("לא הצלחנו ליצור משימות חידוש.");
        } finally {
            setIsCreatingRenewalTasks(false);
        }
    };

    const handleClaimsFollowup = async () => {
        if (isCreatingClaimsTasks) return;
        setIsCreatingClaimsTasks(true);
        try {
            const createdBy = user?.uid || "system";
            for (const claim of CLAIMS_WATCH.filter((c) => c.status !== "approved")) {
                await firestoreService.addTask({
                    title: `מעקב תביעה - ${claim.client}`,
                    description: `סטטוס תביעה: ${claim.status} • ${claim.type} (${claim.company})`,
                    type: "task",
                    status: "new",
                    priority: "urgent",
                    date: new Date().toISOString().split("T")[0],
                    time: "10:00",
                    assignedTo: createdBy,
                    createdBy,
                    completed: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            toast.success("נוצרו משימות מעקב תביעות.");
        } catch (error) {
            console.error("Claims followup error", error);
            toast.error("לא הצלחנו ליצור משימות תביעה.");
        } finally {
            setIsCreatingClaimsTasks(false);
        }
    };

    const handleCollectionsReminder = async () => {
        if (isSendingCollections) return;
        if (!user?.uid) {
            toast.error("אין משתמש מחובר לשליחת תזכורות.");
            return;
        }
        setIsSendingCollections(true);
        try {
            const now = new Date();
            const nextMorning = new Date(now);
            nextMorning.setDate(nextMorning.getDate() + 1);
            nextMorning.setHours(9, 0, 0, 0);
            for (const item of COLLECTIONS.filter((c) => c.status === "overdue")) {
                await firestoreService.addReminder({
                    userId: user.uid,
                    title: `גבייה מ-${item.client}`,
                    description: `חוב בסך ₪${item.amount.toLocaleString()} • ${item.days} ימים`,
                    reminderTime: nextMorning,
                    status: "pending",
                });
            }
            toast.success("נשלחו תזכורות גבייה למחר בבוקר.");
        } catch (error) {
            console.error("Collections reminder error", error);
            toast.error("לא הצלחנו ליצור תזכורות גבייה.");
        } finally {
            setIsSendingCollections(false);
        }
    };

    const handleRequestAdditionalUsers = async () => {
        if (!requestAgencyName.trim() || !requestContactName.trim()) {
            toast.error("יש למלא שם סוכנות ושם איש קשר.");
            return;
        }
        if (!requestContactPhone.trim()) {
            toast.error("נא לציין טלפון ליצירת קשר.");
            return;
        }
        setIsSubmittingRequest(true);
        try {
            await firestoreService.addAgencyRequest({
                agencyName: requestAgencyName.trim(),
                contactName: requestContactName.trim(),
                contactPhone: requestContactPhone.trim(),
                note: requestNote.trim(),
                requestedBy: user?.uid || undefined,
                requestedByEmail: user?.email || undefined,
            });
            toast.success("בקשה להוספת משתמשים נשלחה בהצלחה.");
            setRequestAgencyName("");
            setRequestContactName("");
            setRequestContactPhone("");
            setRequestNote("");
            if (isOwner) await loadRequests();
        } catch (error) {
            console.error("Agency request error", error);
            toast.error("לא הצלחנו לשלוח את הבקשה, נסו שוב מאוחר יותר.");
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleCreateAgency = async () => {
        const name = agencyNameInput.trim();
        const seats = Number(agencySeatCountInput);
        if (!name) {
            toast.error("יש להזין שם סוכנות.");
            return;
        }
        if (!seats || seats < 1) {
            toast.error("בחרו מספר משתמשים חוקי (לפחות 1).");
            return;
        }
        setIsCreatingAgency(true);
        try {
            await firestoreService.addAgency({
                name,
                seatCount: seats,
                createdBy: user?.uid || undefined,
                createdByEmail: user?.email || undefined,
            });
            toast.success("סוכנות חדשה נוספה.");
            setAgencyNameInput("");
            setAgencySeatCountInput(1);
            await loadAgencies();
        } catch (error) {
            console.error("Create agency error", error);
            toast.error("נכשל שמירת הסוכנות, נסו שוב.");
        } finally {
            setIsCreatingAgency(false);
        }
    };

    const handleComplianceTasks = async () => {
        if (isCreatingComplianceTasks) return;
        setIsCreatingComplianceTasks(true);
        try {
            const createdBy = user?.uid || "system";
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 3);
            for (const item of COMPLIANCE_CHECKLIST.filter((c) => !c.done)) {
                await firestoreService.addTask({
                    title: `חוסר רגולטורי: ${item.label}`,
                    description: "טיפול בחוסר לפי צ׳קליסט חיתום",
                    type: "task",
                    status: "new",
                    priority: "medium",
                    date: dueDate.toISOString().split("T")[0],
                    time: "12:00",
                    assignedTo: createdBy,
                    createdBy,
                    completed: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            toast.success("נוצרו משימות השלמה לצ׳קליסט.");
        } catch (error) {
            console.error("Compliance tasks error", error);
            toast.error("לא הצלחנו ליצור משימות צ׳קליסט.");
        } finally {
            setIsCreatingComplianceTasks(false);
        }
    };

    const donutCards = useMemo(() => {
        const query = donutSearch.trim().toLowerCase();
        const palette = ["#e5005a", "#0b6bff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];
        const list = (activeClientsOnly ? dashboardClients.filter((c) => c.status === "active") : dashboardClients).filter((c) => {
            if (!query) return true;
            const haystack = [
                c.name,
                c.email,
                c.phone,
                c.status,
                c.source,
                c.salesStatus,
                c.operationsStatus,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });
        const aggregate = <K extends keyof Client>(key: K, labelMap?: Record<string, string>): DonutSegment[] => {
            const counts = new Map<string, number>();
            list.forEach((c) => {
                const raw = (c[key] as string) || "לא מוגדר";
                const label = labelMap?.[raw] || raw || "לא מוגדר";
                counts.set(label, (counts.get(label) || 0) + 1);
            });
            return Array.from(counts.entries()).map(([label, value], idx) => ({
                label,
                value,
                color: palette[idx % palette.length],
            }));
        };

        const statusLabel: Record<ClientStatus, string> = {
            active: "פעיל",
            lead: "ליד",
            prospect: "פרוספקט",
            inactive: "לא פעיל",
            churned: "נשר"
        };
        const salesLabel: Record<SalesStatus, string> = {
            new_lead: "ליד חדש",
            contacted: "בוצעה שיחה",
            meeting_scheduled: "פגישה מתוכננת",
            proposal_sent: "הצעת מחיר",
            negotiation: "מו\"מ",
            closed_won: "נסגר",
            closed_lost: "איבדנו"
        };
        const opsLabel: Record<OperationsStatus, string> = {
            sent_to_company: "נשלח לחברה",
            missing_documents: "חוסרים",
            awaiting_first_premium: "ממתין לפרמיה ראשונה",
            archived: "גניזה",
            stopped_by_client: "הופסק ע\"י לקוח",
            stopped_by_company: "הופסק ע\"י חברה",
            active_pension: "פנסיה פעילה",
            needs_signatures: "חסר חתימות",
            needs_medical_info: "חסר מידע רפואי",
            pending_approval: "ממתין לאישור",
            policy_issued: "פוליסה הונפקה",
            policy_rejected: "פוליסה נדחתה",
            clearing_ordered: "הוראת קבע הוזנה"
        };

        const grouped = {
            tier: { id: "tier", title: "לקוחות לפי סיווג (Sales)", segments: aggregate("salesStatus", salesLabel as Record<string, string>), key: "salesStatus" as const, labels: salesLabel },
            ops: { id: "vat", title: "לקוחות לפי מע״מ / תפעול", segments: aggregate("operationsStatus", opsLabel as Record<string, string>), key: "operationsStatus" as const, labels: opsLabel },
            origin: { id: "origin", title: "לקוחות לפי מקור", segments: aggregate("source"), key: "source" as const, labels: {} as Record<string, string> },
            status: { id: "status", title: "לקוחות לפי סטטוס", segments: aggregate("status", statusLabel as Record<string, string>), key: "status" as const, labels: statusLabel },
        };

        // attach clients per segment for drill-down
        const withClients = Object.values(grouped).map((card) => {
            const segmentsWithClients = card.segments.map((seg) => {
                const normalized = (value: string) => value?.toLowerCase?.() || "";
                const filtered = list.filter((c) => {
                    const raw = (c[card.key] as string) || "לא מוגדר";
                    const labels = card.labels as Record<string, string> | undefined;

                    const label = labels?.[raw] || raw || "???? ??????????";
                    return normalized(label) === normalized(seg.label);
                });
                return { ...seg, clients: filtered };
            });
            return { ...card, segments: segmentsWithClients };
        });

        return withClients;
    }, [activeClientsOnly, dashboardClients, donutSearch]);

    return (
        <>
        <DashboardShell role={ADMIN_ROLE} navItems={ADMIN_NAV_ITEMS} dir={dir}>
            <div dir={dir} className="space-y-12 animate-in fade-in duration-1000">
                <section className="glass-card border border-white/5 bg-gradient-to-br from-primary/10 via-surface-strong to-accent/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] p-12 rounded-[3.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-1.5 w-12 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">Operational Intelligence</span>
                            </div>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter">
                                שליטה ותפעול <span className="text-gradient-gold">SLA</span>
                            </h1>
                            <p className="text-slate-400 mt-3 max-w-2xl font-bold leading-relaxed">
                                המערכת מרכזת KPI קריטיים, התרעות בזמן אמת ושליטה מלאה על תהליכי השירות – בניהול כחול-זהב עמוק.
                            </p>
                        </div>

                    {!isGeminiConfigured ? (
                        <div className="w-full glass-card border border-amber-500/30 bg-amber-500/10 text-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-amber-500/20">
                            <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse" />
                            <div className="text-xs font-bold">
                                חסר מפתח Gemini. הוסף GEMINI_API_KEY בקובץ .env.local כדי לאפשר את יכולות ה-AI והאוטומציות.
                            </div>
                        </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                className="text-[11px] tracking-[0.35em] px-4 py-2 rounded-2xl border-amber-500/40 text-amber-200 hover:text-amber-50"
                                onClick={() => router.push("/admin/leads")}
                            >
                                <Layers size={16} className="ml-2" />
                                ניהול לידים
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportReport}
                                disabled={isExportingReport}
                                className="text-[11px] tracking-[0.3em] px-4 py-2"
                            >
                                {isExportingReport ? "מייצא..." : "יצוא דו״ח"}
                            </Button>
                            <Button
                                variant="gold"
                                className="text-[11px] tracking-[0.3em] px-4 py-2 shadow-xl shadow-amber-500/30"
                                onClick={() => router.push("/admin/automation")}
                            >
                                הפעל אוטומציה
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                            <label htmlFor="dashboard-search" className="sr-only">
                                Dashboard search
                            </label>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3">
                                <Search size={18} className="text-slate-500" />
                                <input
                                    id="dashboard-search"
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="חיפוש משימה, סוכן או תור"
                                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end">
                            {layoutPresets.map((option) => {
                                const Icon = option.icon;
                                const active = layoutMode === option.id;

                                return (
                                    <Button
                                        key={option.id}
                                        variant="outline"
                                        className={`flex items-center gap-2 text-[11px] tracking-[0.3em] px-3 py-2 rounded-2xl ${
                                            active
                                                ? "bg-amber-500/15 border-amber-400/50 text-amber-100"
                                                : "border-slate-700 text-slate-300"
                                        }`}
                                        onClick={() => setLayoutMode(option.id)}
                                    >
                                        <Icon size={16} />
                                        {option.title}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-500" />
                            <span>מסננים:</span>
                            <span className="text-xs text-slate-400">{timelineLabel}</span>
                            <span className="text-slate-500">&middot;</span>
                            <span className="text-xs text-slate-400">{layoutConfig.description}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {timeframeOptions.map((range) => (
                                <Button
                                    key={range.id}
                                    variant="outline"
                                    className={`text-[10px] tracking-widest px-3 py-1.5 rounded-xl ${
                                        timeframe === range.id
                                            ? "bg-blue-500/10 border-blue-500/40 text-blue-100"
                                            : "border-slate-700 text-slate-400"
                                    }`}
                                    onClick={() => setTimeframe(range.id)}
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {statusFilters.map((filter) => (
                                <Button
                                    key={filter.id}
                                    variant="outline"
                                    className={`text-[10px] tracking-widest px-3 py-1.5 rounded-xl ${
                                        statusFilter === filter.id
                                            ? "bg-amber-500/10 border-amber-500/40 text-amber-100"
                                            : "border-slate-700 text-slate-400"
                                    }`}
                                    onClick={() => setStatusFilter(filter.id)}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-white flex items-center gap-2">
                                <Users size={18} className="text-amber-300" /> תצוגת לקוחות
                            </h2>
                            <div className="flex items-center gap-3">
                                <input
                                    value={donutSearch}
                                    onChange={(e) => setDonutSearch(e.target.value)}
                                    placeholder="חיפוש מהיר בכל הלקוחות (שם/אימייל/טלפון/סטטוס/מקור)"
                                    className="w-64 bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500"
                                />
                                <label className="flex items-center gap-3 text-sm text-slate-200 cursor-pointer">
                                    <span className="text-xs text-slate-400 font-bold">פעילים בלבד</span>
                                    <input
                                        type="checkbox"
                                        checked={activeClientsOnly}
                                        onChange={(e) => setActiveClientsOnly(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-12 h-7 rounded-full bg-slate-700 peer-checked:bg-emerald-500/60 border border-slate-600 peer-checked:border-emerald-400 transition-colors relative">
                                        <div className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow peer-checked:translate-x-5 transition-transform" />
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientsLoading ? (
                                <>
                                    <Card className="p-8 bg-slate-900/70 border-slate-800 flex flex-col gap-6">
                                        <Skeleton className="h-6 w-32" />
                                        <div className="flex justify-center py-6">
                                            <Skeleton className="h-48 w-48 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3 w-4/5" />
                                    </Card>
                                    <Card className="p-8 bg-slate-900/70 border-slate-800 flex flex-col gap-6">
                                        <Skeleton className="h-6 w-32" />
                                        <div className="flex justify-center py-6">
                                            <Skeleton className="h-48 w-48 rounded-full" />
                                        </div>
                                        <Skeleton className="h-3 w-4/5" />
                                    </Card>
                                </>
                            ) : clientsError ? (
                                <Card className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-100 col-span-2">
                                    {clientsError}
                                </Card>
                            ) : donutCards.map((card) => (
                                <Card key={card.id} className="p-4 bg-slate-900/70 border-slate-800">
                                    <DonutWidget
                                        title={card.title}
                                        segments={card.segments}
                                        onSelect={(segment) =>
                                            setSelectedSegment({
                                                title: card.title,
                                                label: segment.label,
                                                clients: ("clients" in segment && Array.isArray((segment as { clients?: Client[] }).clients))
                                                    ? (segment as { clients?: Client[] }).clients || []
                                                    : [],
                                            })
                                        }
                                    />
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
                            <Card className="p-5 bg-slate-900/60 border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-white">Health-of-Book</h3>
                                    <Badge className="text-[10px] tracking-widest">מדדי בריאות תיק</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                        <p className="text-xs text-slate-400">סה״כ לקוחות</p>
                                        <p className="text-2xl font-black text-white">{stats.total.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                        <p className="text-xs text-slate-400">לקוחות פעילים</p>
                                        <p className="text-2xl font-black text-emerald-300">{stats.active.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                        <p className="text-xs text-slate-400">Persistency</p>
                                        <p className="text-2xl font-black text-amber-300">{healthSnapshot.persistency}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                                        <p className="text-xs text-slate-400">Lag פרמיה ראשונה</p>
                                        <p className="text-2xl font-black text-sky-200">
                                            {healthSnapshot.avgLag} ימים
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-slate-500">
                                    Loss Ratio ו-Renewal Hit-Rate יחושבו לאחר חיבור נתוני תביעות/חידושים.
                                </div>
                            </Card>

                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Renewal Copilot</h3>
                                    <Badge variant="gold" className="italic px-3 py-1">30 DAYS FWD</Badge>
                                </div>
                                {clientsLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5">
                                                <Skeleton className="h-4 w-32 mb-3" />
                                                <Skeleton className="h-2 w-48" />
                                            </div>
                                        ))}
                                    </div>
                                ) : healthSnapshot.renewalCandidates.length ? (
                                    <div className="space-y-4">
                                        {healthSnapshot.renewalCandidates.slice(0, 5).map((item) => (
                                            <div key={`${item.client.id}-${item.policy.id}`} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 hover:bg-white/10 transition-colors group/item">
                                                <p className="text-base font-black text-white italic group-hover:text-primary transition-colors">{item.client.name || "לקוח ללא שם"}</p>
                                                <div className="text-[10px] text-slate-500 mt-2 font-bold tracking-widest flex flex-wrap gap-4 uppercase italic">
                                                    <span>פוליסה: {item.policy.type}</span>
                                                    <span>חידוש: {item.renewalDate?.toLocaleDateString("he-IL")}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic py-10 text-center font-bold">אין חידושים צפויים ב-30 הימים הקרובים.</p>
                                )}
                                <div className="mt-8 flex justify-end">
                                    <Button
                                        size="md"
                                        variant="gold"
                                        onClick={handleCreateRenewalTasks}
                                        disabled={isCreatingRenewalTasks}
                                        className="rounded-2xl shadow-[0_15px_40px_-5px_rgba(245,158,11,0.3)] gap-2 italic"
                                    >
                                        <TrendingUp size={16} />
                                        {isCreatingRenewalTasks ? "יוצר..." : "צור משימות חידוש"}
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Claims Watch</h3>
                                    <Badge variant="error" className="italic">SLA RISK</Badge>
                                </div>
                                <div className="space-y-4">
                                    {CLAIMS_WATCH.map((claim) => (
                                        <div key={claim.id} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="font-black text-white italic">{claim.client}</p>
                                                <Badge variant={claim.status === "approved" ? "success" : "warning"} className="scale-90">
                                                    {claim.status === "approved" ? "אושר" : "בסיכון"}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                                                {claim.type} • {claim.company} • {claim.daysOpen} ימים
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="glass"
                                        onClick={handleClaimsFollowup}
                                        disabled={isCreatingClaimsTasks}
                                        className="rounded-xl border-white/10"
                                    >
                                        {isCreatingClaimsTasks ? "יוצר..." : "צור משימות תביעה"}
                                    </Button>
                                </div>
                            </Card>

                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Payments</h3>
                                    <Badge variant="error" className="italic">OVERDUE</Badge>
                                </div>
                                <div className="space-y-4">
                                    {COLLECTIONS.map((item) => (
                                        <div key={item.id} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="font-black text-white italic">{item.client}</p>
                                                <Badge variant={item.status === "overdue" ? "error" : "warning"} className="scale-90">
                                                    {item.status === "overdue" ? "איחור" : "ממתין"}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                                                ₪{item.amount.toLocaleString()} • {item.days} ימים
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button size="sm" variant="glass" className="rounded-xl border-white/10" onClick={handleCollectionsReminder} disabled={isSendingCollections}>
                                        {isSendingCollections ? "שולח..." : "תזכורת גבייה"}
                                    </Button>
                                </div>
                            </Card>

                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Compliance</h3>
                                    <Badge variant="warning" className="italic">MISSING</Badge>
                                </div>
                                <div className="space-y-4">
                                    {COMPLIANCE_CHECKLIST.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between rounded-[1.5rem] border border-white/5 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                                            <p className="text-slate-300 font-bold text-sm italic">{item.label}</p>
                                            <Badge variant={item.done ? "success" : "warning"} className="scale-90">
                                                {item.done ? "בוצע" : "חסר"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="glass"
                                        className="rounded-xl border-white/10"
                                        onClick={handleComplianceTasks}
                                        disabled={isCreatingComplianceTasks}
                                    >
                                        {isCreatingComplianceTasks ? "יוצר..." : "משימות צ׳קליסט"}
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl group">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Lead Intelligence</h3>
                                    <Badge variant="gold" className="italic">SOURCES</Badge>
                                </div>
                                <div className="space-y-4">
                                    {LEAD_QUALITY.map((item) => (
                                        <div key={item.source} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 flex items-center justify-between hover:bg-white/10 transition-all">
                                            <div>
                                                <p className="font-black text-white italic text-base">{item.source}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">VOLUME: {item.volume}</p>
                                            </div>
                                            <Badge variant="success" className="animation-glow italic">{item.conversion}% CR</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[3rem] shadow-2xl group overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                        <h3 className="text-xl font-black text-white italic tracking-tight">Command Center Live</h3>
                                    </div>
                                    <Badge variant="gold" className="italic">REALTIME</Badge>
                                </div>
                                <div className="space-y-4">
                                    {CALL_CENTER.map((call) => (
                                        <div key={call.id} className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 hover:bg-primary/10 transition-all group/call">
                                            <p className="font-black text-white italic group-hover/call:text-primary mb-1">{call.agent} ↔ {call.client}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                                                {call.topic} • {call.duration}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    </div>
                </section>

                <div className={layoutConfig.statsGrid}>
                    {clientsLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="bg-slate-900/40 border-white/5 p-10 rounded-[2.5rem]">
                                <Skeleton className="h-4 w-24 mb-6" />
                                <Skeleton className="h-10 w-32" />
                                <Skeleton className="h-3 w-40 mt-6" />
                            </Card>
                        ))
                    ) : (
                        dynamicMetrics.map((metric) => (
                            <Card
                                key={metric.label}
                                className="text-right bg-slate-900/40 border-white/5 p-10 hover:scale-[1.05] transition-all duration-500 rounded-[2.5rem] group shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                <div className="flex items-center justify-between mb-8">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.5em] italic ${metric.accent}`}>
                                        {metric.label}
                                    </span>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-primary/10 transition-colors">
                                        <metric.icon size={24} className={metric.accent} />
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-white italic tracking-tighter">{metric.value}</p>
                                <p className="text-xs font-bold text-slate-500 mt-4 italic opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">{metric.delta}</p>
                            </Card>
                        ))
                    )}
                </div>

                <div className={layoutConfig.mainGrid}>
                    <Card
                        title={`SLA - ${timelineLabel}`}
                        className="bg-slate-900/40 border-white/5 rounded-[3rem] p-12 shadow-2xl backdrop-blur-3xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="space-y-10 relative z-10">
                            <div className="flex flex-wrap gap-10 justify-between items-center bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">זמן תגובה ממוצע</p>
                                    <p className="text-5xl font-black text-white italic tracking-tighter">{averageResolution}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-12 bg-primary rounded-full" />
                                        <p className="text-xs font-black text-slate-400">תפוקה כוללת: <span className="text-white italic">1,024 משימות</span></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-12 bg-accent rounded-full" />
                                        <p className="text-xs font-black text-slate-400">יחס עמידה בזמן: <span className="text-white italic">{onTimePercent}%</span></p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-[10px] uppercase text-slate-500 font-black tracking-[0.5em] italic">
                                        רמת SLA נוכחית
                                    </span>
                                    <Badge variant="success" className="italic animation-glow px-4 py-1.5">{onTimePercent}% בתוך היעד</Badge>
                                </div>
                                <div className="h-4 rounded-full bg-slate-800/50 p-1 border border-white/5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                        style={{ width: `${onTimePercent}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {SLA_BREAKDOWN.map((item) => (
                                    <div key={item.label} className={`rounded-[2rem] border p-8 transition-all hover:bg-white/5 group/sla border-white/5 bg-slate-900/40 relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-16 h-1 hover:h-full bg-primary/20 transition-all rounded-full" />
                                        <p className="text-4xl font-black text-white italic tracking-tighter mb-4">{item.value}</p>
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic mb-2">{item.label}</p>
                                        <p className="text-xs font-bold text-slate-400 leading-relaxed italic">{item.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <Card className="bg-slate-900/50 border-slate-800">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white">מצב SLA</h3>
                                <Badge className="px-3 py-1 text-[10px] tracking-widest">
                                    עדכוני מערכת
                                </Badge>
                            </div>
                            <div className="mt-5 space-y-3">
                                {ALERTS.map((alert) => {
                                    const Icon = alert.icon;
                                    return (
                                        <div
                                            key={alert.title}
                                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${alertStyleMap[alert.status]}`}
                                        >
                                            <div className="p-2 rounded-xl bg-slate-900/50">
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-white">{alert.title}</p>
                                                <p className="text-xs text-slate-400">{alert.detail}</p>
                                            </div>
                                            <span className="text-[11px] text-slate-400">{alert.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800">
                            <h3 className="text-lg font-black text-white">התרעות חמות</h3>
                            <p className="text-sm text-slate-400 mt-2">
                                הדגשת התרעות אחרונות הדורשות תשומת לב מיידית.
                            </p>
                            <div className="mt-4 space-y-3">
                                {ALERTS.slice(0, 2).map((alert) => (
                                    <div
                                        key={alert.title}
                                        className="flex items-center justify-between rounded-2xl border border-slate-800 px-4 py-3 bg-slate-900/60"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-white">{alert.title}</p>
                                            <p className="text-xs text-slate-500">{alert.detail}</p>
                                        </div>
                                        <Badge variant={alert.status === "success" ? "success" : "warning"}>
                                            {alert.time}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                <Card
                    title={`תורים פעילים (${filteredTasks.length})`}
                    className="bg-slate-900/40 border-white/5 rounded-[3rem] p-12 shadow-2xl backdrop-blur-3xl group"
                >
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-1.5 w-8 bg-primary rounded-full" />
                                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic">
                                    Live Queue Monitoring
                                </p>
                            </div>
                            <p className="text-lg font-bold text-slate-300 italic">{timelineLabel}</p>
                        </div>
                        <Badge variant="gold" className="text-[11px] tracking-[0.5em] px-6 py-2 uppercase italic shadow-lg shadow-accent/20">
                            {statusFilter === "all" ? "SHOWING ALL" : statusFilters.find((filter) => filter.id === statusFilter)?.label}
                        </Badge>
                    </div>

                    <div className="mt-6 overflow-x-auto no-scrollbar">
                        <table className="min-w-full text-right border-collapse" dir={dir}>
                            <thead>
                                <tr className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 border-b border-white/5 italic">
                                    <th className="px-8 py-6">{t.tableName || "משימה"}</th>
                                    <th className="px-8 py-6">סוכן</th>
                                    <th className="px-8 py-6">סטטוס</th>
                                    <th className="px-8 py-6">SLA</th>
                                    <th className="px-8 py-6">עדכון</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-24 text-center text-slate-600 font-black italic text-xl opacity-30 tracking-widest">
                                            NO MATCHING TASKS
                                        </td>
                                    </tr>
                                )}
                                {filteredTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className="transition-all duration-300 hover:bg-primary/5 group/row"
                                    >
                                        <td className="px-8 py-8 relative">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-0 bg-primary group-hover/row:h-1/2 transition-all duration-500 rounded-l-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                            <p className="text-xl font-black text-white italic group-hover/row:text-primary transition-colors tracking-tight">{task.title}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{task.queue}</p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <p className="font-black text-slate-200 italic">{task.assignee}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic opacity-60">
                                                {task.importance === "high" ? "HIGH PRIORITY" : "MEDIUM"}
                                            </p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <Badge variant={statusBadgeVariant[task.status]} className="scale-110 italic">
                                                {statusLabelMap[task.status]}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-8">
                                            <p className="font-black text-white italic">
                                                {task.dueInHours >= 0
                                                    ? `T-${task.dueInHours}H`
                                                    : `OVERDUE ${Math.abs(task.dueInHours)}H`}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 italic opacity-60">
                                                {task.timeframe === "all"
                                                    ? "HISTORICAL"
                                                    : timeframeOptions.find((option) => option.id === task.timeframe)?.label}
                                            </p>
                                        </td>
                                        <td className="px-8 py-8">
                                            <p className="text-xs font-bold text-slate-500 italic">{task.updated}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <div className={`grid gap-8 ${isOwner ? "lg:grid-cols-2" : ""}`}>
                    <Card className="bg-slate-900/40 border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tight">Provisioning System</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 italic">
                                    REQUEST ADDITIONAL AGENT SEATS
                                </p>
                            </div>
                            <Badge variant="gold" className="italic px-3 py-1">INFRA OPS</Badge>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input
                                    value={requestAgencyName}
                                    onChange={(e) => setRequestAgencyName(e.target.value)}
                                    placeholder="Agency Identifier"
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-primary outline-none transition-all placeholder:text-slate-600 italic"
                                />
                                <input
                                    value={requestContactName}
                                    onChange={(e) => setRequestContactName(e.target.value)}
                                    placeholder="Lead Operator"
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-primary outline-none transition-all placeholder:text-slate-600 italic"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input
                                    value={requestContactPhone}
                                    onChange={(e) => setRequestContactPhone(e.target.value)}
                                    placeholder="Direct Terminal Line"
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-primary outline-none transition-all placeholder:text-slate-600 italic"
                                />
                                <input
                                    value={requestNote}
                                    onChange={(e) => setRequestNote(e.target.value)}
                                    placeholder="Constraints / Notes"
                                    className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-primary outline-none transition-all placeholder:text-slate-600 italic"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button 
                                    className="h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black italic shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] gap-3 px-10"
                                    onClick={handleRequestAdditionalUsers}
                                    disabled={isSubmittingRequest}
                                >
                                    <Zap size={18} className="fill-white" />
                                    {isSubmittingRequest ? "AUTHORIZING..." : "EXECUTE PROVISIONING REQUEST"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                    {isOwner && (
                        <Card className="bg-slate-900/40 border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div>
                                    <h3 className="text-xl font-black text-white italic tracking-tight">Organization Matrix</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 italic">
                                        INITIALIZE NEW AGENCY BRANCH
                                    </p>
                                </div>
                                <Badge variant="gold" className="italic px-3 py-1">ADMIN USER OPS</Badge>
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <input
                                        value={agencyNameInput}
                                        onChange={(e) => setAgencyNameInput(e.target.value)}
                                        placeholder="Agency Entity Name"
                                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-accent outline-none transition-all placeholder:text-slate-600 italic"
                                    />
                                    <input
                                        value={agencySeatCountInput}
                                        onChange={(e) => setAgencySeatCountInput(Math.max(1, Number(e.target.value) || 1))}
                                        type="number"
                                        min={1}
                                        placeholder="Seat Quantity"
                                        className="w-full rounded-2xl border border-white/5 bg-white/5 px-6 py-4 text-sm font-bold text-white focus:border-accent outline-none transition-all placeholder:text-slate-600 italic"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button 
                                        className="h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black italic shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] gap-3 px-10"
                                        onClick={handleCreateAgency}
                                        disabled={isCreatingAgency}
                                    >
                                        <ShieldCheck size={18} />
                                        {isCreatingAgency ? "INITIALIZING..." : "COMMISSION BRANCH"}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="mt-12 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Active Agencies</h4>
                                <div className="space-y-3">
                                    {agenciesLoading ? (
                                        <p className="text-xs text-slate-500 italic animate-pulse">Syncing data...</p>
                                    ) : agencies.length ? (
                                        agencies.map((agency) => (
                                            <div
                                                key={agency.id}
                                                className="flex items-center justify-between rounded-[1.5rem] border border-white/5 bg-white/5 px-6 py-4 text-sm text-white hover:bg-white/10 transition-all font-bold italic"
                                            >
                                                <span>{agency.name}</span>
                                                <Badge variant="glass" className="text-[9px]">{agency.seatCount} SEATS</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-600 italic">No active environments initialized.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-12 space-y-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Pending Provisioning Actions</h4>
                                {requestsLoading ? (
                                    <p className="text-xs text-slate-500 italic animate-pulse">Syncing requests...</p>
                                ) : pendingRequests.length ? (
                                    <div className="space-y-3">
                                        {pendingRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="rounded-[1.5rem] border border-white/5 bg-white/5 p-6 text-sm text-slate-300 relative overflow-hidden group/req"
                                            >
                                                <div className="absolute right-0 top-0 w-1 h-full bg-amber-500/40" />
                                                <p className="font-black text-white italic text-base mb-1">{request.agencyName}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic leading-loose">
                                                    {request.contactName} • {request.contactPhone}
                                                </p>
                                                {request.note ? (
                                                    <p className="text-xs text-slate-400 mt-3 italic bg-black/20 p-3 rounded-xl border border-white/5">Note: {request.note}</p>
                                                ) : null}
                                                <p className="text-[9px] text-slate-600 mt-4 tracking-tighter decoration-accent underline font-black">
                                                    ORIGIN: {request.requestedByEmail || "SYSTEM_AUTO"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 italic">Secure queue empty.</p>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardShell>

        {selectedSegment ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" dir="rtl">
                <div className="w-full max-w-4xl bg-slate-950 border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] p-12 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-1.5 w-8 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em] italic">Intelligence Drill-down</p>
                            </div>
                            <h3 className="text-4xl font-black text-white italic tracking-tighter">
                                {selectedSegment.title} <span className="text-gradient-gold">/ {selectedSegment.label}</span>
                            </h3>
                            <p className="text-sm font-bold text-slate-400 mt-3 italic">
                                Found {filteredSegmentClients.length} matching entities in current matrix.
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedSegment(null)}
                            className="p-3 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            aria-label="סגור"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="flex-1 relative group">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-primary transition-colors" size={18} />
                            <input
                                value={segmentSearch}
                                onChange={(e) => setSegmentSearch(e.target.value)}
                                placeholder="Filter by name, identifier, or source vector..."
                                className="w-full bg-white/5 border border-white/5 rounded-2xl pr-14 pl-6 py-5 text-sm font-bold text-white placeholder:text-slate-600 focus:border-primary outline-none transition-all italic"
                            />
                        </div>
                        <Button
                            variant="glass"
                            onClick={() => setSegmentSearch("")}
                            className="rounded-2xl h-[58px] px-8 border-white/5 font-black italic uppercase text-[10px] tracking-widest"
                        >
                            Reset
                        </Button>
                    </div>

                    <div className="relative z-10">
                        {filteredSegmentClients.length === 0 ? (
                            <div className="py-24 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
                                <p className="text-xl font-black text-slate-700 italic tracking-[0.2em] uppercase">No Data Intercepted</p>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto no-scrollbar rounded-[2rem] border border-white/5 bg-slate-900/40 backdrop-blur-xl">
                                <table className="w-full text-right border-collapse">
                                    <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-20">
                                        <tr className="text-[10px] font-black text-slate-500 border-b border-white/5 uppercase tracking-[0.3em] italic">
                                            <th className="px-8 py-6 text-right">Entity Name</th>
                                            <th className="px-8 py-6 text-right">Communication</th>
                                            <th className="px-8 py-6 text-right">Status</th>
                                            <th className="px-8 py-6 text-right">Source Vector</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {filteredSegmentClients.map((c) => (
                                            <tr key={c.id} className="hover:bg-primary/5 transition-all group/modal-row cursor-default">
                                                <td className="px-8 py-6 font-black text-white italic group-hover/modal-row:text-primary transition-colors">{c.name || "UNIDENTIFIED"}</td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-slate-200 mb-1">{c.email || "-"}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">{c.phone || "-"}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="glass" className="scale-90 italic">{c.status || "IDLE"}</Badge>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-slate-500 italic tracking-widest">{c.source || "UNKNOWN"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end relative z-10 pt-4">
                        <Button variant="glass" className="rounded-xl px-12 py-6 border-white/5 font-black italic uppercase tracking-widest text-xs" onClick={() => setSelectedSegment(null)}>
                            Close Intercept
                        </Button>
                    </div>
                </div>
            </div>
        ) : null}
        </>
    );
}

function DonutWidget({
    title,
    segments,
    onSelect,
}: {
    title: string;
    segments: DonutSegment[];
    onSelect?: (segment: DonutSegment) => void;
}) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (!total) {
        return (
            <div className="flex flex-col items-center justify-center text-slate-500 text-sm min-h-[220px]">
                <p className="font-bold">אין נתונים להצגה</p>
            </div>
        );
    }

    let currentAngle = 0;
    const gradientParts: string[] = [];
    for (const segment of segments) {
        const angle = (segment.value / total) * 360;
        const start = currentAngle;
        const end = currentAngle + angle;
        gradientParts.push(`${segment.color} ${start}deg ${end}deg`);
        currentAngle = end;
    }
    const gradientStops = gradientParts.join(", ");

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 flex flex-col gap-3">
                <h3 className="text-sm font-black text-slate-100">{title}</h3>
                <div className="space-y-2">
                    {segments.map((segment) => {
                        const percent = ((segment.value / total) * 100).toFixed(2);
                        return (
                            <div key={segment.label} className="flex items-center justify-between text-sm text-slate-200">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <span className="font-bold">{segment.label}</span>
                                </div>
                                <span className="text-slate-400 text-xs">
                                    {segment.value} ({percent}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
                    <div className="flex items-center justify-center min-w-[180px]">
                        <div className="relative h-40 w-40">
                            <button
                                type="button"
                                className="absolute inset-0 rounded-full shadow-inner border-4 border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                style={{ background: `conic-gradient(${gradientStops})`, cursor: onSelect ? "pointer" : "default" }}
                                onClick={() => {
                                    if (!onSelect) return;
                                    const largest = segments.reduce((max, seg) => (seg.value > max.value ? seg : max), segments[0]);
                                    onSelect(largest);
                                }}
                                aria-label="פתח רשימת לקוחות לסגמנט הגדול"
                            />
                            <div className="absolute inset-[20%] rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-slate-100">{total}</p>
                                    <p className="text-xs text-slate-400">{"סה\"כ"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
        </div>
    );
}

