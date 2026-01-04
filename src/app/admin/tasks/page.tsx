"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
    CheckSquare, Plus, Search, Calendar, Clock, 
    AlertTriangle, User, MoreVertical,
    Trash2, Edit3, Eye, Timer, RefreshCw,
    ListTodo, Columns3, CheckCircle2, Circle,
    AlertCircle, Hourglass, X, Flag
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useUsers } from "@/lib/hooks/useQueryHooks";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import type { Task, TaskStatus, TaskPriority, TaskType } from "@/types";

// View modes
type ViewMode = 'kanban' | 'list';

interface Column {
    id: string;
    title: string;
    status: TaskStatus;
    color: string;
    icon: React.ReactNode;
}

export default function TaskCenterPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Firebase Hooks
    const { data: tasks = [], isLoading, refetch } = useTasks();
    const { data: users = [] } = useUsers();
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        type: "task" as TaskType,
        assignedTo: "",
        assignedToName: "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        clientName: "",
        notes: ""
    });

    // Columns configuration
    const columns: Column[] = [
        { id: 'pending', title: 'ממתין', status: 'pending', color: 'slate', icon: <Circle size={16} /> },
        { id: 'in_progress', title: 'בעבודה', status: 'in_progress', color: 'amber', icon: <Timer size={16} /> },
        { id: 'completed', title: 'הושלם', status: 'completed', color: 'emerald', icon: <CheckCircle2 size={16} /> },
    ];

    // Filter tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                task.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
            const matchesAssignee = filterAssignee === 'all' || task.assignedTo === filterAssignee;
            return matchesSearch && matchesPriority && matchesAssignee;
        });
    }, [tasks, searchQuery, filterPriority, filterAssignee]);

    // Get tasks by column
    const getTasksByStatus = (status: TaskStatus) => {
        return filteredTasks.filter(task => task.status === status);
    };

    // Handle drag and drop
    const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
        try {
            await updateTask.mutateAsync({
                id: taskId,
                data: { status: newStatus, completed: newStatus === 'completed' }
            });
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    // Priority config
    const getPriorityConfig = (priority: TaskPriority) => {
        switch (priority) {
            case 'urgent': return { color: 'red', label: 'דחוף', icon: <AlertTriangle size={12} /> };
            case 'high': return { color: 'orange', label: 'גבוה', icon: <Flag size={12} /> };
            case 'medium': return { color: 'amber', label: 'בינוני', icon: <Flag size={12} /> };
            case 'low': return { color: 'slate', label: 'נמוך', icon: <Flag size={12} /> };
            default: return { color: 'slate', label: 'רגיל', icon: <Flag size={12} /> };
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed' || t.completed).length,
        highPriority: tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
    }), [tasks]);

    const handleAddTask = async () => {
        if (!newTask.title) {
            toast.error("אנא הזן כותרת למשימה");
            return;
        }

        try {
            await createTask.mutateAsync({
                title: newTask.title,
                description: newTask.description || "",
                status: newTask.status,
                priority: newTask.priority,
                type: newTask.type,
                assignedTo: newTask.assignedTo || "",
                assignedToName: newTask.assignedToName || "",
                date: newTask.date,
                time: newTask.time,
                clientName: newTask.clientName || "",
                notes: newTask.notes || "",
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: "admin",
                createdByName: "מנהל"
            } as Omit<Task, 'id'>);

            setShowNewTaskModal(false);
            resetForm();
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask) return;

        try {
            await updateTask.mutateAsync({
                id: editingTask.id,
                data: {
                    title: newTask.title,
                    description: newTask.description,
                    status: newTask.status,
                    priority: newTask.priority,
                    type: newTask.type,
                    assignedTo: newTask.assignedTo,
                    assignedToName: newTask.assignedToName,
                    date: newTask.date,
                    time: newTask.time,
                    clientName: newTask.clientName,
                    notes: newTask.notes,
                    completed: newTask.status === 'completed'
                }
            });

            setEditingTask(null);
            setShowNewTaskModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm("האם למחוק משימה זו?")) return;

        try {
            await deleteTask.mutateAsync(id);
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const resetForm = () => {
        setNewTask({
            title: "",
            description: "",
            status: "pending",
            priority: "medium",
            type: "task",
            assignedTo: "",
            assignedToName: "",
            date: new Date().toISOString().split('T')[0],
            time: "09:00",
            clientName: "",
            notes: ""
        });
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title || "",
            description: task.description || "",
            status: task.status || "pending",
            priority: task.priority || "medium",
            type: task.type || "task",
            assignedTo: task.assignedTo || "",
            assignedToName: task.assignedToName || "",
            date: task.date || new Date().toISOString().split('T')[0],
            time: task.time || "09:00",
            clientName: task.clientName || "",
            notes: task.notes || ""
        });
        setShowNewTaskModal(true);
    };

    // Task Card Component
    const TaskCard = ({ task }: { task: Task }) => {
        const priorityConfig = getPriorityConfig(task.priority);
        
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                draggable
                onDragEnd={(e, info) => {}}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-all cursor-grab active:cursor-grabbing group"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-${priorityConfig.color}-500/20 text-${priorityConfig.color}-400`}>
                        {priorityConfig.icon}
                        {priorityConfig.label}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => openEditModal(task)}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400"
                        >
                            <Edit3 size={14} />
                        </button>
                        <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-amber-100 text-sm mb-2 line-clamp-2">{task.title}</h4>

                {/* Description */}
                {task.description ? <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p> : null}

                {/* Meta */}
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                        {task.date ? <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {task.date}
                            </span> : null}
                        {task.time ? <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {task.time}
                            </span> : null}
                    </div>
                    {task.assignedToName ? <span className="flex items-center gap-1">
                            <User size={10} />
                            {task.assignedToName}
                        </span> : null}
                </div>

                {/* Client */}
                {task.clientName ? <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <span className="text-[10px] text-amber-400/70">לקוח: {task.clientName}</span>
                    </div> : null}
            </motion.div>
        );
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                            <CheckSquare className="text-amber-400" />
                            מרכז משימות
                        </h1>
                        <p className="text-slate-400 mt-1">ניהול ומעקב משימות בזמן אמת</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex glass-card border border-amber-500/20 rounded-xl p-1">
                            {[
                                { mode: 'kanban', icon: Columns3, label: 'קנבן' },
                                { mode: 'list', icon: ListTodo, label: 'רשימה' },
                            ].map(({ mode, icon: Icon, label }) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode as ViewMode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        viewMode === mode
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'text-slate-400 hover:text-amber-400'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <Button 
                            variant="outline"
                            onClick={() => refetch()}
                        >
                            <RefreshCw size={16} className={`ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                            רענן
                        </Button>

                        <Button 
                            onClick={() => {
                                setEditingTask(null);
                                resetForm();
                                setShowNewTaskModal(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Plus size={18} className="ml-2" />
                            משימה חדשה
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: 'סה"כ משימות', value: stats.total, icon: ListTodo, color: 'blue' },
                        { label: 'ממתינות', value: stats.pending, icon: Circle, color: 'slate' },
                        { label: 'בעבודה', value: stats.inProgress, icon: Timer, color: 'amber' },
                        { label: 'הושלמו', value: stats.completed, icon: CheckCircle2, color: 'emerald' },
                        { label: 'עדיפות גבוהה', value: stats.highPriority, icon: AlertTriangle, color: 'red' },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} className="p-3 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                                    <Icon size={18} className={`text-${stat.color}-400`} />
                                </div>
                                <div>
                                    <div className="text-xl font-black text-amber-100">{stat.value}</div>
                                    <div className="text-xs text-slate-500">{stat.label}</div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px] relative">
                            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="חיפוש משימות..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 glass-card border border-amber-500/20 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                            />
                        </div>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-sm text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                        >
                            <option value="all">כל העדיפויות</option>
                            <option value="urgent">דחוף</option>
                            <option value="high">גבוה</option>
                            <option value="medium">בינוני</option>
                            <option value="low">נמוך</option>
                        </select>

                        {/* Assignee Filter */}
                        <select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                            className="px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-sm text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                        >
                            <option value="all">כל הסוכנים</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.displayName}</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={40} className="animate-spin text-amber-400" />
                    </div>
                ) : tasks.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckSquare size={32} className="text-amber-400" />
                        </div>
                        <h3 className="text-xl font-black text-amber-100 mb-2">אין משימות עדיין</h3>
                        <p className="text-slate-400 mb-6">התחל להוסיף משימות כדי לנהל את העבודה שלך</p>
                        <Button 
                            onClick={() => setShowNewTaskModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Plus size={16} className="ml-2" />
                            צור משימה ראשונה
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Kanban View */}
                        {viewMode === 'kanban' && (
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {columns.map((column) => {
                                    const columnTasks = getTasksByStatus(column.status);
                                    return (
                                        <div
                                            key={column.id}
                                            className="flex-shrink-0 w-80"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                const taskId = e.dataTransfer.getData('taskId');
                                                if (taskId) handleDrop(taskId, column.status);
                                            }}
                                        >
                                            {/* Column Header */}
                                            <div className={`flex items-center justify-between p-3 rounded-t-2xl bg-${column.color}-500/10 border border-b-0 border-${column.color}-500/20`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-${column.color}-400`}>
                                                        {column.icon}
                                                    </div>
                                                    <span className="font-bold text-slate-200">{column.title}</span>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {columnTasks.length}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Column Content */}
                                            <div className={`p-3 space-y-3 min-h-[400px] rounded-b-2xl border border-t-0 border-${column.color}-500/20 bg-slate-900/30`}>
                                                <AnimatePresence mode="popLayout">
                                                    {columnTasks.map((task) => (
                                                        <div
                                                            key={task.id}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('taskId', task.id);
                                                            }}
                                                        >
                                                            <TaskCard task={task} />
                                                        </div>
                                                    ))}
                                                </AnimatePresence>
                                                {columnTasks.length === 0 && (
                                                    <div className="text-center py-10 text-slate-600 text-xs">
                                                        אין משימות בעמודה זו
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <Card className="p-0 overflow-hidden">
                                <table className="w-full text-right text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-700/50 bg-slate-800/50 text-amber-400/70 text-[10px] font-black uppercase tracking-[0.15em]">
                                            <th className="px-6 py-4">משימה</th>
                                            <th className="px-4 py-4">עדיפות</th>
                                            <th className="px-4 py-4">סטטוס</th>
                                            <th className="px-4 py-4">תאריך</th>
                                            <th className="px-4 py-4">משויך ל</th>
                                            <th className="px-4 py-4 text-center">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredTasks.map((task) => {
                                            const priorityConfig = getPriorityConfig(task.priority);
                                            return (
                                                <tr key={task.id} className="hover:bg-amber-500/5 group transition-all">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-bold text-slate-200">{task.title}</div>
                                                            {task.description ? <div className="text-xs text-slate-500 truncate max-w-xs">{task.description}</div> : null}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-${priorityConfig.color}-500/20 text-${priorityConfig.color}-400`}>
                                                            {priorityConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleDrop(task.id, e.target.value as TaskStatus)}
                                                            className="text-xs bg-transparent border border-slate-700 rounded-lg px-2 py-1 text-slate-300"
                                                        >
                                                            <option value="pending">ממתין</option>
                                                            <option value="in_progress">בעבודה</option>
                                                            <option value="completed">הושלם</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-400">
                                                        {task.date}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-400">
                                                        {task.assignedToName || "-"}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(task)}
                                                                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400"
                                                            >
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </Card>
                        )}
                    </>
                )}

                {/* Add/Edit Task Modal */}
                {showNewTaskModal ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
                        <Card className="w-full max-w-lg bg-slate-900 border-amber-500/20 p-6 shadow-2xl rounded-3xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-amber-400">
                                    {editingTask ? "✏️ עריכת משימה" : "➕ משימה חדשה"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowNewTaskModal(false);
                                        setEditingTask(null);
                                        resetForm();
                                    }}
                                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">כותרת המשימה *</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="מה צריך לעשות?"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">תיאור</label>
                                    <textarea
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none resize-none"
                                        rows={3}
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        placeholder="פרטים נוספים..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">עדיפות</label>
                                        <select
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                        >
                                            <option value="low">נמוך</option>
                                            <option value="medium">בינוני</option>
                                            <option value="high">גבוה</option>
                                            <option value="urgent">דחוף</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">סטטוס</label>
                                        <select
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newTask.status}
                                            onChange={e => setNewTask({ ...newTask, status: e.target.value as TaskStatus })}
                                        >
                                            <option value="pending">ממתין</option>
                                            <option value="in_progress">בעבודה</option>
                                            <option value="completed">הושלם</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">תאריך</label>
                                        <input
                                            type="date"
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newTask.date}
                                            onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">שעה</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newTask.time}
                                            onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">משויך לסוכן</label>
                                    <select
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                        value={newTask.assignedTo}
                                        onChange={e => {
                                            const user = users.find(u => u.id === e.target.value);
                                            setNewTask({ 
                                                ...newTask, 
                                                assignedTo: e.target.value,
                                                assignedToName: user?.displayName || ""
                                            });
                                        }}
                                    >
                                        <option value="">בחר סוכן</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.displayName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">שם לקוח (אופציונלי)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                        value={newTask.clientName}
                                        onChange={e => setNewTask({ ...newTask, clientName: e.target.value })}
                                        placeholder="שם הלקוח הקשור למשימה"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">הערות</label>
                                    <textarea
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none resize-none"
                                        rows={2}
                                        value={newTask.notes}
                                        onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                                        placeholder="הערות נוספות..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button 
                                        onClick={editingTask ? handleUpdateTask : handleAddTask} 
                                        disabled={createTask.isPending || updateTask.isPending}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl">
                                        {(createTask.isPending || updateTask.isPending) ? "שומר..." : (editingTask ? "עדכן משימה" : "צור משימה")}
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setShowNewTaskModal(false);
                                            setEditingTask(null);
                                            resetForm();
                                        }} 
                                        variant="outline" 
                                        className="flex-1 rounded-xl border-slate-600 text-slate-300">
                                        ביטול
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div> : null}
            </div>
        </DashboardShell>
    );
}
