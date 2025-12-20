"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { Plus, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Trash2, User, MoreVertical, ListChecks, CheckSquare, AlertCircle, ArrowRightCircle } from "lucide-react";
import { SmartTaskModal } from "@/components/SmartTaskModal";
import { firestoreService } from "@/lib/firebase/firestore-service";

type TaskPriority = "low" | "medium" | "high";
type TaskType = "meeting" | "call" | "task" | "email";
type TaskStatus = "pending" | "completed" | "overdue" | "transferred";

interface Task {
    id: string;
    title: string;
    description?: string;
    date: string; // ISO date string YYYY-MM-DD
    time: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    client?: string;
    clientId?: string;
    assignee?: string;
    subtasks?: { id: string, title: string, completed: boolean }[];
    completed: boolean; // Keeping for backward compatibility, mapped to status
}

export default function CalendarPage() {
    // --- State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [view, setView] = useState<"month" | "week" | "day">("month");
    const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    // --- Effects ---
    // --- Effects ---
    useEffect(() => {
        const loadTasks = async () => {
            try {
                const fetchedTasks = await firestoreService.getTasks();
                // Ensure proper typing and defaults
                const startTasks = fetchedTasks.map((t: any) => ({
                    ...t,
                    status: t.status || (t.completed ? "completed" : "pending"),
                    subtasks: t.subtasks || [],
                    assignee: t.assignee || "admin"
                }));
                // @ts-ignore
                setTasks(startTasks);
            } catch (error) {
                console.error("Failed to load tasks from Firestore", error);
            }
        };

        loadTasks();
    }, []);

    // --- Helpers ---
    function getFormattedDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthNames = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];

    const dayNames = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

    // Automatically check for overdue tasks
    useEffect(() => {
        const checkOverdue = () => {
            const now = new Date();
            const todayStr = getFormattedDate(now);
            const nowTime = now.getHours() * 60 + now.getMinutes();

            setTasks(prev => prev.map(t => {
                if (t.status === 'completed' || t.status === 'transferred') return t;

                const taskDate = new Date(t.date);
                if (t.date < todayStr) return { ...t, status: 'overdue' };
                if (t.date === todayStr) {
                    const [hours, minutes] = t.time.split(':').map(Number);
                    const taskTime = hours * 60 + minutes;
                    if (taskTime < nowTime) return { ...t, status: 'overdue' };
                }
                return t;
            }));
        };
        const interval = setInterval(checkOverdue, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);


    // --- Handlers ---
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleSaveTask = async (task: Task) => {
        try {
            // Check if it's an update or new
            if (task.id && tasks.some(t => t.id === task.id)) {
                await firestoreService.updateTask(task.id, task);
                setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            } else {
                const newId = await firestoreService.addTask(task);
                setTasks(prev => [...prev, { ...task, id: newId }]);
            }
        } catch (e) {
            console.error("Error saving task:", e);
            alert("שגיאה בשמירת המשימה");
        }
        setEditingTask(undefined);
    };

    const toggleTaskStatus = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
        const updatedTask = { ...task, status: newStatus, completed: newStatus === 'completed' };

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

        try {
            await firestoreService.updateTask(taskId, { status: newStatus, completed: newStatus === 'completed' });
        } catch (e) {
            console.error("Error toggling status:", e);
            // Revert on error
            setTasks(prev => prev.map(t => t.id === taskId ? task : t));
        }
    };

    const deleteTask = async (taskId: string) => {
        if (confirm("האם למחוק משימה זו?")) {
            // Optimistic update
            const oldTasks = [...tasks];
            setTasks(prev => prev.filter(t => t.id !== taskId));

            try {
                await firestoreService.deleteTask(taskId);
            } catch (e) {
                console.error("Error deleting task:", e);
                setTasks(oldTasks);
            }
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    }

    const openNewModal = () => {
        setEditingTask(undefined);
        setIsTaskModalOpen(true);
    }

    // --- Render Logic ---
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Filtering Logic
    const filteredTasks = tasks.filter(t => {
        if (filterStatus === 'all') return true;
        return t.status === filterStatus;
    });

    const selectedDateString = getFormattedDate(selectedDate);
    const selectedDateTasks = filteredTasks.filter(t => t.date === selectedDateString);

    // Generate calendar grid
    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/30 border border-slate-100/50"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = getFormattedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        const dayTasks = filteredTasks.filter(t => t.date === dateStr);
        const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
        const hasOverdue = dayTasks.some(t => t.status === 'overdue');

        calendarDays.push(
            <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 border border-slate-100 p-2 cursor-pointer transition-all hover:bg-indigo-50/50 relative group
                    ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset z-10' : 'bg-white'}
                    ${isToday ? 'bg-blue-50/50' : ''}
                `}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                        {day}
                    </span>
                    <div className="flex gap-1">
                        {hasOverdue && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="משימות באיחור"></span>}
                        {dayTasks.length > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1 h-5 bg-indigo-100 text-indigo-700 border-indigo-200">
                                {dayTasks.length}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="mt-2 space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((task, i) => (
                        <div key={i} className={`text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 ${task.status === 'completed' ? 'bg-slate-100 text-slate-400 border-slate-300 line-through' :
                            task.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-500' :
                                task.type === 'meeting' ? 'bg-purple-50 border-purple-500 text-purple-700' :
                                    'bg-blue-50 border-blue-500 text-blue-700'
                            }`}>
                            {task.time} {task.title}
                        </div>
                    ))}
                    {dayTasks.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-bold px-1">+ עוד {dayTasks.length - 2}</div>
                    )}
                </div>

                {/* Quick Add Button on Hover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day);
                        openNewModal();
                    }}
                    className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-full p-1 shadow-lg hover:scale-110"
                >
                    <Plus size={14} />
                </button>
            </div>
        );
    }

    const navItems = [
        { label: "ראשי (לוח בקרה)", href: "/admin/dashboard", icon: <User size={18} /> },
        { label: "יומן ומשימות", href: "/admin/calendar", icon: <CalendarIcon size={18} /> },
    ];

    return (
        <DashboardShell role="מנהל" navItems={navItems as any}>
            <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col" dir="rtl">

                {/* Header */}
                <header className="flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-primary font-display flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">ניהול לו"ז ומשימות שוטפות</p>
                    </div>

                    <div className="flex gap-4">
                        {/* Status Filter */}
                        <div className="flex bg-white/50 backdrop-blur rounded-xl p-1 border border-slate-200">
                            {[
                                { id: "all", label: "הכל", icon: null },
                                { id: "pending", label: "בטיפול", icon: <Circle size={12} className="text-blue-500" /> },
                                { id: "overdue", label: "בחריגה", icon: <AlertCircle size={12} className="text-red-500" /> },
                                { id: "completed", label: "הושלם", icon: <CheckCircle2 size={12} className="text-emerald-500" /> },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setFilterStatus(s.id as any)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filterStatus === s.id ? 'bg-white shadow-sm text-indigo-900 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {s.icon}{s.label}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={openNewModal}
                            className="shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-6"
                        >
                            <Plus size={18} strokeWidth={3} />
                            משימה חדשה
                        </Button>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">

                    {/* Main Calendar Grid */}
                    <Card className="lg:col-span-3 border-none shadow-xl bg-white/80 backdrop-blur-sm flex flex-col overflow-hidden">
                        {/* Month Nav */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>היום</Button>
                                <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                                    <button onClick={handlePrevMonth} className="px-3 py-1 hover:bg-slate-50 border-l border-slate-200 transition-colors"><ChevronRight size={18} /></button>
                                    <button onClick={handleNextMonth} className="px-3 py-1 hover:bg-slate-50 transition-colors"><ChevronLeft size={18} /></button>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-slate-400">
                                {selectedDate.toLocaleDateString("he-IL", { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                            {dayNames.map((day, i) => (
                                <div key={i} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{day}</div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
                            {calendarDays}
                        </div>
                    </Card>

                    {/* Side Panel: Selected Date Tasks */}
                    <Card className="border-none shadow-xl bg-white flex flex-col overflow-hidden h-full">
                        <div className="p-6 bg-slate-900 text-white shrink-0 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full"></div>
                            <h3 className="text-xl font-black relative z-10 flex items-center gap-2">
                                משימות
                                {filterStatus !== 'all' && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{filterStatus === 'pending' ? 'בטיפול' : filterStatus === 'overdue' ? 'באיחור' : 'הושלמו'}</span>}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium relative z-10 flex items-center gap-2 mt-1">
                                <CalendarIcon size={14} />
                                {selectedDate.toLocaleDateString("he-IL", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {selectedDateTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl">☕</div>
                                    <p className="font-bold text-sm">אין משימות תואמות ליום זה</p>
                                    <Button variant="ghost" size="sm" onClick={openNewModal} className="text-indigo-600">צור משימה ראשונה</Button>
                                </div>
                            ) : (
                                selectedDateTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`group p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer
                                            ${task.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-70' :
                                                task.status === 'overdue' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}
                                        `}
                                        onClick={() => openEditModal(task)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id); }}
                                                    className={`transition-colors ${task.status === 'completed' ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'}`}
                                                >
                                                    {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </button>

                                                {/* Status Badge */}
                                                <Badge className={`text-[10px] px-1.5 py-0
                                                    ${task.status === 'overdue' ? 'bg-red-100 text-red-600 border-red-200' :
                                                        task.status === 'transferred' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                                                            task.priority === 'high' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                                'bg-slate-100 text-slate-500 border-slate-200'}
                                                `}>
                                                    {task.status === 'overdue' ? 'חריגה!' :
                                                        task.status === 'transferred' ? 'הועבר' :
                                                            task.priority === 'high' ? 'דחוף' : task.priority === 'medium' ? 'רגיל' : 'נמוך'}
                                                </Badge>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <h4 className={`font-bold text-sm mb-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>

                                        {/* Description Snippet */}
                                        {task.description && <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{task.description}</p>}

                                        {/* Subtasks Progress */}
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md mb-2 w-fit">
                                                <ListChecks size={12} />
                                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} תת-משימות
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100/50">
                                            <span className={`flex items-center gap-1 font-mono ${task.status === 'overdue' ? 'text-red-500 font-bold' : ''}`}>
                                                <Clock size={12} /> {task.time}
                                            </span>
                                            {task.client && <span className="flex items-center gap-1"><User size={12} /> {task.client}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Smart Task Modal */}
                <SmartTaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSave={handleSaveTask}
                    initialDate={selectedDate}
                    existingTask={editingTask}
                />
            </div>
        </DashboardShell>
    );
}

