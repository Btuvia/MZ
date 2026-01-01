"use client";

import { Task, TaskStatus } from "@/types";
import { Card } from "./base";
import { Plus, Clock, User, Tag } from "lucide-react";
import { getTaskTypeMetadata, getTaskStatusMetadata, getTaskPriorityMetadata, TASK_STATUSES } from "@/lib/task-constants";

interface TaskKanbanViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
    onAddTask: (status: TaskStatus) => void;
}

export function TaskKanbanView({ tasks, onTaskClick, onStatusChange, onAddTask }: TaskKanbanViewProps) {
    // Group tasks by status
    const tasksByStatus = TASK_STATUSES.reduce((groups, status) => {
        groups[status.value] = tasks.filter(t => t.status === status.value);
        return groups;
    }, {} as Record<TaskStatus, Task[]>);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4" dir="rtl">
            {TASK_STATUSES.map((status) => {
                const statusTasks = tasksByStatus[status.value] || [];

                return (
                    <div
                        key={status.value}
                        className="flex-shrink-0 w-80"
                    >
                        {/* Column Header */}
                        <div
                            className="rounded-t-xl p-4 border-b-4"
                            style={{
                                backgroundColor: `${status.color}10`,
                                borderBottomColor: status.color,
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: status.color }}
                                    />
                                    {status.labelHe}
                                </h3>
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{
                                        backgroundColor: status.bgColor,
                                        color: status.textColor,
                                    }}
                                >
                                    {statusTasks.length}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">{status.description}</p>
                        </div>

                        {/* Column Body */}
                        <div className="bg-slate-50 rounded-b-xl p-3 min-h-[500px] space-y-3">
                            {/* Add Task Button */}
                            <button
                                onClick={() => onAddTask(status.value)}
                                className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-white transition-all text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-2 text-sm font-bold"
                            >
                                <Plus size={16} />
                                הוסף משימה
                            </button>

                            {/* Tasks */}
                            {statusTasks.map((task) => {
                                const typeMetadata = getTaskTypeMetadata(task.type);
                                const priorityMetadata = getTaskPriorityMetadata(task.priority);
                                const TypeIcon = typeMetadata?.icon;

                                return (
                                    <Card
                                        key={task.id}
                                        className="p-3 cursor-pointer hover:shadow-lg transition-all border-l-4"
                                        style={{ borderLeftColor: priorityMetadata?.color }}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        {/* Title */}
                                        <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2">
                                            {task.title}
                                        </h4>

                                        {/* Metadata */}
                                        <div className="space-y-2 text-xs">
                                            {/* Type & Time */}
                                            <div className="flex items-center gap-2">
                                                {TypeIcon && (
                                                    <div
                                                        className="w-6 h-6 rounded flex items-center justify-center"
                                                        style={{ backgroundColor: `${typeMetadata.color}20` }}
                                                    >
                                                        <TypeIcon size={12} style={{ color: typeMetadata.color }} />
                                                    </div>
                                                )}
                                                <span className="text-slate-500">{typeMetadata?.labelHe}</span>
                                            </div>

                                            {/* Date & Time */}
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Clock size={12} />
                                                <span>{task.date}</span>
                                                <span>•</span>
                                                <span>{task.time}</span>
                                            </div>

                                            {/* Client */}
                                            {task.clientName && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <User size={12} />
                                                    <span className="truncate">{task.clientName}</span>
                                                </div>
                                            )}

                                            {/* Subject */}
                                            {task.subjectName && (
                                                <div className="flex items-center gap-1">
                                                    <Tag size={12} className="text-indigo-500" />
                                                    <span className="text-indigo-600 truncate">{task.subjectName}</span>
                                                </div>
                                            )}

                                            {/* Priority Badge */}
                                            <div
                                                className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px]"
                                                style={{
                                                    backgroundColor: priorityMetadata?.bgColor,
                                                    color: priorityMetadata?.textColor,
                                                }}
                                            >
                                                {priorityMetadata?.labelHe}
                                            </div>

                                            {/* Subtasks Progress */}
                                            {task.subtasks && task.subtasks.length > 0 && (
                                                <div className="pt-2 border-t border-slate-100">
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                                        <span>תתי-משימות</span>
                                                        <span>
                                                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-1">
                                                        <div
                                                            className="bg-indigo-600 h-1 rounded-full transition-all"
                                                            style={{
                                                                width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}

                            {/* Empty State */}
                            {statusTasks.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    אין משימות
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
