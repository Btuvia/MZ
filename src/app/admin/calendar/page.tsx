"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { Plus, ChevronRight, ChevronLeft, Calendar as CalendarIcon, List, LayoutGrid } from "lucide-react";
import { SmartTaskModal } from "@/components/SmartTaskModal";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Task, TaskStatus, Employee, SystemUser } from "@/types";
import { TaskSubject } from "@/types/subject";
import { Workflow } from "@/types/workflow";
import { TaskListView } from "@/components/ui/task-list-view";
import { TaskKanbanView } from "@/components/ui/task-kanban-view";
import { AdvancedFilters, TaskFilters } from "@/components/ui/advanced-filters";
import { getTaskStatusMetadata, getTaskTypeMetadata } from "@/lib/task-constants";

export default function CalendarPage() {
    // --- State ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [subjects, setSubjects] = useState<TaskSubject[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [users, setUsers] = useState<Employee[]>([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<"calendar" | "list" | "kanban">("calendar");
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    // Filters
    const [filters, setFilters] = useState<TaskFilters>({
        status: 'all',
        type: 'all',
        priority: 'all',
        subjectId: 'all',
        workflowId: 'all',
        assignedTo: 'all',
        searchTerm: '',
    });

    // --- Effects ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedTasks, fetchedSubjects, fetchedWorkflows, fetchedUsers] = await Promise.all([
                    firestoreService.getTasks(),
                    firestoreService.getSubjects(),
                    firestoreService.getWorkflows(),
                    firestoreService.getUsers(),
                ]);

                setTasks(fetchedTasks.map((t: Task) => ({
                    ...t,
                    status: t.status || (t.completed ? "completed" : "new"),
                    subtasks: t.subtasks || [],
                })) as Task[]);
                setSubjects(fetchedSubjects as TaskSubject[]);
                setWorkflows(fetchedWorkflows as Workflow[]);
                // Map SystemUser to Employee format for calendar display
                setUsers(fetchedUsers.map((u: SystemUser) => ({
                    id: u.id,
                    name: u.displayName,
                    email: u.email,
                    phone: u.phone || '',
                    position: u.role,
                    avatarUrl: u.avatarUrl,
                    activeClientsCount: 0,
                    monthlySales: 0,
                    xp: 0,
                    level: 1,
                    badges: [],
                })) as Employee[]);
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };

        loadData();
    }, []);

    // Auto-check for overdue tasks
    useEffect(() => {
        const checkOverdue = () => {
            const now = new Date();
            const todayStr = getFormattedDate(now);
            const nowTime = now.getHours() * 60 + now.getMinutes();

            setTasks(prev => prev.map(t => {
                if (t.status === 'completed' || t.status === 'transferred') return t;

                if (t.date < todayStr) return { ...t, status: 'overdue' };
                if (t.date === todayStr && t.time) {
                    const [hours, minutes] = t.time.split(':').map(Number);
                    const taskTime = hours * 60 + minutes;
                    if (taskTime < nowTime) return { ...t, status: 'overdue' };
                }
                return t;
            }));
        };
        const interval = setInterval(checkOverdue, 60000);
        return () => clearInterval(interval);
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
        setIsTaskModalOpen(false);
    };

    const toggleTaskStatus = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus: TaskStatus = task.status === 'completed' ? 'new' : 'completed';
        const updatedTask = { ...task, status: newStatus };

        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

        try {
            await firestoreService.updateTask(taskId, { status: newStatus });
        } catch (e) {
            console.error("Error toggling status:", e);
            setTasks(prev => prev.map(t => t.id === taskId ? task : t));
        }
    };

    const deleteTask = async (taskId: string) => {
        if (confirm("האם למחוק משימה זו?")) {
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
    };

    const openNewModal = (status?: TaskStatus) => {
        setEditingTask(status ? { status } as any : undefined);
        setIsTaskModalOpen(true);
    };

    const handleClearFilters = () => {
        setFilters({
            status: 'all',
            type: 'all',
            priority: 'all',
            subjectId: 'all',
            workflowId: 'all',
            assignedTo: 'all',
            searchTerm: '',
        });
    };

    // --- Filtering Logic ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Status filter
            if (filters.status !== 'all' && task.status !== filters.status) return false;

            // Type filter
            if (filters.type !== 'all' && task.type !== filters.type) return false;

            // Priority filter
            if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

            // Subject filter
            if (filters.subjectId !== 'all' && task.subjectId !== filters.subjectId) return false;

            // Workflow filter
            if (filters.workflowId !== 'all' && task.workflowId !== filters.workflowId) return false;

            // Assignee filter
            if (filters.assignedTo !== 'all' && task.assignedTo !== filters.assignedTo) return false;

            // Search filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                return (
                    task.title?.toLowerCase().includes(searchLower) ||
                    task.description?.toLowerCase().includes(searchLower) ||
                    task.clientName?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        });
    }, [tasks, filters]);

    // --- Render Logic ---
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

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
        const isSelected = day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear();
        const isToday = day === new Date().getDate() &&
            currentDate.getMonth() === new Date().getMonth() &&
            currentDate.getFullYear() === new Date().getFullYear();

        calendarDays.push(
            <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 border border-slate-200 p-2 cursor-pointer transition-all hover:bg-indigo-50 ${isSelected ? 'bg-indigo-100 ring-2 ring-indigo-600' : ''
                    } ${isToday ? 'bg-blue-50' : 'bg-white'}`}
            >
                <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                    {day}
                </div>
                <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => {
                        const typeMetadata = getTaskTypeMetadata(task.type);
                        return (
                            <div
                                key={task.id}
                                className="text-[10px] px-1 py-0.5 rounded truncate"
                                style={{ backgroundColor: `${typeMetadata?.color}20`, color: typeMetadata?.color }}
                            >
                                {task.title}
                            </div>
                        );
                    })}
                    {dayTasks.length > 2 && (
                        <div className="text-[10px] text-slate-400">+{dayTasks.length - 2} עוד</div>
                    )}
                </div>
            </div>
        );
    }

    const navItems = [
        { label: "ראשי", href: "/admin/dashboard" },
        { label: "לוח שנה", href: "/admin/calendar" },
    ];

    return (
        <DashboardShell role="אדמין" navItems={navItems as any}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <CalendarIcon className="text-indigo-600" size={32} />
                            ניהול משימות
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {filteredTasks.length} משימות
                            {filters.status !== 'all' || filters.type !== 'all' || filters.searchTerm ? ' (מסוננות)' : ''}
                        </p>
                    </div>
                    <Button
                        onClick={() => openNewModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <Plus size={18} />
                        משימה חדשה
                    </Button>
                </div>

                {/* View Selector & Filters */}
                <div className="flex items-center justify-between gap-4">
                    {/* View Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentView('calendar')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentView === 'calendar'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <CalendarIcon size={18} />
                            לוח שנה
                        </button>
                        <button
                            onClick={() => setCurrentView('list')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentView === 'list'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <List size={18} />
                            רשימה
                        </button>
                        <button
                            onClick={() => setCurrentView('kanban')}
                            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${currentView === 'kanban'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                        >
                            <LayoutGrid size={18} />
                            קנבן
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex-1">
                        <AdvancedFilters
                            filters={filters}
                            subjects={subjects}
                            workflows={workflows}
                            users={users}
                            onChange={setFilters}
                            onClear={handleClearFilters}
                        />
                    </div>
                </div>

                {/* Views */}
                {currentView === 'calendar' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Calendar */}
                        <Card className="lg:col-span-2 p-6">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={handlePrevMonth}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <h2 className="text-xl font-black text-slate-900">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h2>
                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            </div>

                            {/* Day Names */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-sm font-bold text-slate-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays}
                            </div>
                        </Card>

                        {/* Selected Date Tasks */}
                        <Card className="p-6">
                            <h3 className="text-lg font-black text-slate-900 mb-4">
                                משימות ל-{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                            </h3>
                            {selectedDateTasks.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">אין משימות ליום זה</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDateTasks.map(task => {
                                        const statusMetadata = getTaskStatusMetadata(task.status);
                                        const typeMetadata = getTaskTypeMetadata(task.type);
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => openEditModal(task)}
                                                className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border-r-4"
                                                style={{ borderRightColor: typeMetadata?.color }}
                                            >
                                                <div className="font-bold text-slate-900 text-sm mb-1">
                                                    {task.title}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-slate-500">{task.time}</span>
                                                    <span
                                                        className="px-2 py-0.5 rounded-full font-bold"
                                                        style={{
                                                            backgroundColor: statusMetadata?.bgColor,
                                                            color: statusMetadata?.textColor,
                                                        }}
                                                    >
                                                        {statusMetadata?.labelHe}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {currentView === 'list' && (
                    <TaskListView
                        tasks={filteredTasks}
                        onTaskClick={openEditModal}
                        onTaskComplete={toggleTaskStatus}
                        onTaskDelete={deleteTask}
                    />
                )}

                {currentView === 'kanban' && (
                    <TaskKanbanView
                        tasks={filteredTasks}
                        onTaskClick={openEditModal}
                        onStatusChange={(taskId, newStatus) => {
                            const task = tasks.find(t => t.id === taskId);
                            if (task) {
                                firestoreService.updateTask(taskId, { status: newStatus });
                                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
                            }
                        }}
                        onAddTask={(status) => openNewModal(status)}
                    />
                )}

                {/* Task Modal */}
                {isTaskModalOpen && (
                    <SmartTaskModal
                        isOpen={isTaskModalOpen}
                        onClose={() => {
                            setIsTaskModalOpen(false);
                            setEditingTask(undefined);
                        }}
                        onSave={handleSaveTask}
                        initialDate={selectedDate}
                        existingTask={editingTask}
                    />
                )}
            </div>
        </DashboardShell>
    );
}
