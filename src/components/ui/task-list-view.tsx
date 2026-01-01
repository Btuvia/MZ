"use client";

import { Task } from "@/types";
import { Card, Badge } from "./base";
import { Clock, User, Tag, GitBranch, CheckCircle2, Circle, Edit2, Trash2, MoreVertical } from "lucide-react";
import { getTaskTypeMetadata, getTaskStatusMetadata, getTaskPriorityMetadata } from "@/lib/task-constants";

// Helper function for date formatting
function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];

    return `${dayName}, ${day} ${month}`;
}

interface TaskListViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onTaskComplete: (taskId: string) => void;
    onTaskDelete: (taskId: string) => void;
}

export function TaskListView({ tasks, onTaskClick, onTaskComplete, onTaskDelete }: TaskListViewProps) {
    // Group tasks by date
    const groupedTasks = tasks.reduce((groups, task) => {
        const date = task.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(task);
        return groups;
    }, {} as Record<string, Task[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedTasks).sort();

    if (tasks.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Circle size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-2">אין משימות</h3>
                <p className="text-slate-400">לא נמצאו משימות בסינון הנוכחי</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {sortedDates.map((date) => {
                const dateTasks = groupedTasks[date];
                const dateObj = new Date(date + 'T00:00:00');
                const isToday = date === new Date().toISOString().split('T')[0];
                const isPast = dateObj < new Date(new Date().toISOString().split('T')[0]);

                return (
                    <div key={date}>
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`text-sm font-bold px-3 py-1 rounded-full ${isToday
                                ? 'bg-indigo-100 text-indigo-700'
                                : isPast
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                {isToday ? 'היום' : formatDate(date)}
                            </div>
                            <div className="text-xs text-slate-400">
                                {dateTasks.length} משימות
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2">
                            {dateTasks.map((task) => {
                                const typeMetadata = getTaskTypeMetadata(task.type);
                                const statusMetadata = getTaskStatusMetadata(task.status);
                                const priorityMetadata = getTaskPriorityMetadata(task.priority);
                                const TypeIcon = typeMetadata?.icon || Circle;

                                return (
                                    <Card
                                        key={task.id}
                                        className="p-4 hover:shadow-md transition-all cursor-pointer border-r-4"
                                        style={{ borderRightColor: priorityMetadata?.color || '#64748b' }}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${typeMetadata?.color}20` }}
                                            >
                                                <TypeIcon size={20} style={{ color: typeMetadata?.color }} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className="font-bold text-slate-900 line-clamp-1">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onTaskComplete(task.id);
                                                            }}
                                                            className="p-1 hover:bg-green-50 rounded text-green-600"
                                                            title="סמן כהושלם"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onTaskDelete(task.id);
                                                            }}
                                                            className="p-1 hover:bg-red-50 rounded text-red-600"
                                                            title="מחק"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                {/* Metadata */}
                                                <div className="flex items-center gap-3 flex-wrap text-xs">
                                                    {/* Time */}
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <Clock size={12} />
                                                        {task.time}
                                                    </span>

                                                    {/* Status */}
                                                    <span
                                                        className="px-2 py-0.5 rounded-full font-bold"
                                                        style={{
                                                            backgroundColor: statusMetadata?.bgColor,
                                                            color: statusMetadata?.textColor,
                                                        }}
                                                    >
                                                        {statusMetadata?.labelHe}
                                                    </span>

                                                    {/* Type */}
                                                    <span className="text-slate-500">
                                                        {typeMetadata?.labelHe}
                                                    </span>

                                                    {/* Client */}
                                                    {task.clientName && (
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            <User size={12} />
                                                            {task.clientName}
                                                        </span>
                                                    )}

                                                    {/* Subject */}
                                                    {task.subjectName && (
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            <Tag size={12} />
                                                            {task.subjectName}
                                                        </span>
                                                    )}

                                                    {/* Workflow */}
                                                    {task.workflowName && (
                                                        <span className="flex items-center gap-1 text-purple-600">
                                                            <GitBranch size={12} />
                                                            {task.workflowName}
                                                        </span>
                                                    )}

                                                    {/* Assignee */}
                                                    {task.assignedTo && task.assignedTo !== 'admin' && (
                                                        <span className="text-slate-500">
                                                            👤 {task.assignedTo}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Subtasks */}
                                                {task.subtasks && task.subtasks.length > 0 && (
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} תתי-משימות הושלמו
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
