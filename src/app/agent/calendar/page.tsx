"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";

export default function CalendarPage() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTasks = async () => {
            setLoading(true);
            try {
                // For now, if no distinct user name, we might fetch all or empty
                // In a real app we'd use user.displayName or user.uid
                // For demo purposes, let's fetch ALL tasks if we assume the agent sees everything, 
                // OR duplicate the admin logic.
                // Let's try to fetch by assignee if possible, otherwise fetch all for demo visibility.

                // Option A:Strict
                // const fetched = user?.displayName ? await firestoreService.getTasksByAssignee(user.displayName) : [];

                // Option B: Permissive (for demo so lists aren't empty)
                const fetched = await firestoreService.getTasks();

                setTasks(fetched);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, [user]);

    // Helpers
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': case 'גבוהה': return "red";
            case 'medium': case 'בינונית': return "amber";
            default: return "slate";
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'completed': return "emerald";
            case 'pending': return "blue";
            default: return "slate";
        }
    };

    // Helper to safely parse dates (handling Firestore Timestamps)
    const parseDate = (dateVal: any): Date => {
        if (!dateVal) return new Date();
        if (dateVal.toDate && typeof dateVal.toDate === 'function') {
            return dateVal.toDate();
        }
        if (dateVal.seconds && typeof dateVal.seconds === 'number') {
            return new Date(dateVal.seconds * 1000);
        }
        return new Date(dateVal);
    };

    // Derived State
    const todaysTasks = tasks.filter(t => {
        const tDate = parseDate(t.date || t.dueDate);
        const today = new Date();
        return tDate.toDateString() === today.toDateString();
    });

    const upcomingTasks = tasks
        .filter(t => parseDate(t.date || t.dueDate) > new Date())
        .sort((a, b) => parseDate(a.date || a.dueDate).getTime() - parseDate(b.date || b.dueDate).getTime())
        .slice(0, 3);

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">יומן ומשימות</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                נהל את הזמן שלך ביעילות. עקוב אחר פגישות, משימות ותזכורות במקום אחד.
                            </p>
                        </div>
                        <Button variant="glass" className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                            + משימה חדשה
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "משימות להיום", value: todaysTasks.length, icon: "📋", color: "from-blue-600 to-indigo-700" },
                        { label: "דחופות", value: tasks.filter(t => t.priority === "high" || t.priority === "גבוהה").length, icon: "🔥", color: "from-red-600 to-rose-700" },
                        { label: "פתוחות", value: tasks.filter(t => t.status === "pending" || t.status === "ממתינה").length, icon: "⚡", color: "from-amber-500 to-orange-600" },
                        { label: "הושלמו", value: tasks.filter(t => t.status === "completed" || t.status === "הושלמה").length, icon: "✅", color: "from-emerald-500 to-emerald-600" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Schedule */}
                    <Card className="lg:col-span-2 border-none shadow-xl bg-white p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-primary">כל המשימות</h2>
                            <div className="flex gap-2">
                                {["day", "week", "month"].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode as any)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === mode
                                            ? 'bg-accent text-white shadow-lg'
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {mode === "day" ? "יום" : mode === "week" ? "שבוע" : "חודש"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {loading ? <p className="text-center text-slate-400">טוען משימות...</p> : tasks.map((task) => (
                                <div key={task.id} className="group">
                                    <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={`h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform`}>
                                                {task.time ? task.time.split(':')[0] : '00'}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{task.time ? task.time.split(':')[1] : '00'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-base font-black text-primary group-hover:text-accent transition-colors">{task.title}</h3>
                                                <Badge className={`bg-${getPriorityColor(task.priority)}-100 text-${getPriorityColor(task.priority)}-600`}>
                                                    {task.priority || 'רגיל'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    📅 {parseDate(task.date || task.dueDate).toLocaleDateString("he-IL")}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    📌 {task.type || 'משימה'}
                                                </span>
                                                <Badge className={`bg-${getStatusColor(task.status)}-100 text-${getStatusColor(task.status)}-600`}>
                                                    {task.status}
                                                </Badge>
                                                {task.client && <span>👤 {task.client}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && tasks.length === 0 && <p className="text-center text-slate-400 italic py-8">אין משימות להצגה</p>}
                        </div>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Mini Calendar */}
                        <Card className="border-none shadow-xl bg-white p-6">
                            <h3 className="text-lg font-black text-primary mb-4">לוח שנה</h3>
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="text-center mb-4">
                                    <p className="text-sm font-black text-primary">דצמבר 2024</p>
                                </div>
                                <div className="grid grid-cols-7 gap-2 text-center">
                                    {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((day) => (
                                        <div key={day} className="text-[10px] font-black text-slate-400">{day}</div>
                                    ))}
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <button
                                            key={day}
                                            className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${day === new Date().getDate()
                                                ? 'bg-accent text-white shadow-lg'
                                                : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Upcoming */}
                        <Card className="border-none shadow-xl bg-slate-900 text-white p-6">
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                <span className="text-accent">📅</span> קרוב להגיע
                            </h3>
                            <div className="space-y-3">
                                {upcomingTasks.map((task, i) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-accent">{parseDate(task.date || task.dueDate).toLocaleDateString("he-IL")}</span>
                                            <span className="text-xs font-bold text-slate-400">{task.time || '00:00'}</span>
                                        </div>
                                        <p className="text-sm font-bold">{task.title}</p>
                                    </div>
                                ))}
                                {upcomingTasks.length === 0 && <p className="text-xs text-slate-500">אין משימות עתידיות</p>}
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-none shadow-xl bg-gradient-to-br from-accent to-blue-700 text-white p-6">
                            <h3 className="text-lg font-black mb-4">פעולות מהירות</h3>
                            <div className="space-y-2">
                                <Button variant="glass" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white justify-start">
                                    📞 תזמון שיחה
                                </Button>
                                <Button variant="glass" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white justify-start">
                                    📧 שליחת מייל
                                </Button>
                                <Button variant="glass" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white justify-start">
                                    📝 תזכורת חדשה
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
