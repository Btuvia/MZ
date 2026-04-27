"use client";

import { Calendar as CalendarIcon, Clock, X, User, CheckCircle2, AlertTriangle, Sparkles, BrainCircuit, Search, Paperclip, FileText, Timer, Pause } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button, Badge } from "@/components/ui/base";
import { SubjectSelector } from "@/components/ui/subject-selector";
import { TaskTypeSelector } from "@/components/ui/task-type-selector";
import { WorkflowSelector } from "@/components/ui/workflow-selector";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { type TaskType, type TaskPriority } from "@/types";

interface SmartTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    initialDate: Date;
    existingTask?: any;
}

export function SmartTaskModal({ isOpen, onClose, onSave, initialDate, existingTask }: SmartTaskModalProps) {
    // Basic fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("10:00");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [taskType, setTaskType] = useState<TaskType>("task");
    const [location, setLocation] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("11:00");
    const [isReminder, setIsReminder] = useState(false);
    const [estimatedDuration, setEstimatedDuration] = useState<number>(30); // דקות
    const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "urgent">("medium"); // דחיפות

    // Client linking
    const [isLinkedToClient, setIsLinkedToClient] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [selectedClient, setSelectedClient] = useState<{ id: string, name: string } | null>(null);
    const [showClientResults, setShowClientResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Assignment
    const [assignee, setAssignee] = useState("admin");

    // New fields
    const [subjectId, setSubjectId] = useState<string>("");
    const [workflowId, setWorkflowId] = useState<string>("");
    const [idNumber, setIdNumber] = useState("");
    const [employerName, setEmployerName] = useState("");
    const [agentName, setAgentName] = useState("");
    const [notes, setNotes] = useState("");

    // Subtasks
    const [subtasks, setSubtasks] = useState<{ id: string, title: string, completed: boolean }[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Data from Firestore
    const [subjects, setSubjects] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load subjects and workflows
    useEffect(() => {
        const loadData = async () => {
            try {
                const [subjectsData, workflowsData] = await Promise.all([
                    firestoreService.getSubjects(),
                    firestoreService.getWorkflows()
                ]);
                setSubjects(subjectsData);
                setWorkflows(workflowsData);
            } catch (error) {
                console.error("Failed to load data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (existingTask) {
                setTitle(existingTask.title);
                setDescription(existingTask.description || "");
                setDate(existingTask.date);
                setTime(existingTask.time);
                setPriority(existingTask.priority || "medium");
                setTaskType(existingTask.type || "task");
                setIsLinkedToClient(!!existingTask.client);
                setSelectedClient(existingTask.client ? { id: existingTask.clientId, name: existingTask.client } : null);
                setAssignee(existingTask.assignedTo || existingTask.assignee || "admin");
                setSubtasks(existingTask.subtasks || []);
                setSubjectId(existingTask.subjectId || "");
                setWorkflowId(existingTask.workflowId || "");
                setIdNumber(existingTask.idNumber || "");
                setEmployerName(existingTask.employerName || "");
                setAgentName(existingTask.agentName || "");
                setUrgency(existingTask.urgency || "medium");
                setIsReminder(existingTask.isReminder || false);
                setNotes(existingTask.notes || "");
                setLocation(existingTask.location || "");
                setEndDate(existingTask.endDate || existingTask.date || "");
                setEndTime(existingTask.endTime || "11:00");
                setIsReminder(existingTask?.isReminder || false);
                setEstimatedDuration(existingTask?.estimatedDuration || 30);
            } else {
                // Reset form for new task
                setTitle("");
                setDescription("");
                setDate(initialDate.toISOString().split('T')[0]);
                setTime("10:00");
                setPriority("medium");
                setTaskType("task");
                setIsLinkedToClient(false);
                setSelectedClient(null);
                setAssignee("admin");
                setSubtasks([]);
                setSubjectId("");
                setWorkflowId("");
                setIdNumber("");
                setEmployerName("");
                setAgentName("");
                setNotes("");
                setLocation("");
                setEndDate(initialDate.toISOString().split('T')[0]);
                setEndTime("11:00");
                setIsReminder(false);
                setEstimatedDuration(30);
            }
        }
    }, [isOpen, existingTask, initialDate]);

    // Mock search for clients
    useEffect(() => {
        if (clientSearchTerm.length > 1) {
            const results = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("client_")) {
                    const client = JSON.parse(localStorage.getItem(key) || "{}");
                    if (client.firstName && (client.firstName.includes(clientSearchTerm) || client.lastName.includes(clientSearchTerm))) {
                        results.push({ id: client.id, name: `${client.firstName} ${client.lastName}` });
                    }
                }
            }
            setSearchResults(results);
            setShowClientResults(true);
        } else {
            setShowClientResults(false);
        }
    }, [clientSearchTerm]);

    const handleGenerateSubtasks = () => {
        if (!title) return;
        setIsGeneratingAI(true);

        // Simulation of AI generation based on title keywords
        setTimeout(() => {
            const keywords = title.toLowerCase();
            let newSubtasks = [];

            if (keywords.includes("פגישה") || keywords.includes("meeting")) {
                newSubtasks = [
                    "הכנת חומר רקע ונתונים",
                    "אישור הגעה עם הלקוח",
                    "סיכום פגישה ושליחת מייל"
                ];
            } else if (keywords.includes("פנסיה") || keywords.includes("pension")) {
                newSubtasks = [
                    "הוצאת מסלקה פנסיונית עדכנית",
                    "ניתוח דמי ניהול ותשואות",
                    "הכנת הצעה לניוד/שיפור תנאים"
                ];
            } else if (keywords.includes("ביטוח") || keywords.includes("insurance")) {
                newSubtasks = [
                    "בדיקת כפל ביטוחים ב'הר הביטוח'",
                    "איתור חוסרים בתיק הלקוח",
                    "בניית הצעת מחיר מותאמת אישית"
                ];
            } else {
                newSubtasks = [
                    "איסוף נתונים ראשוני",
                    "ביצוע המשימה המרכזית",
                    "בקרת איכות וסיום טיפול"
                ];
            }

            setSubtasks(newSubtasks.map((t, i) => ({ id: Date.now().toString() + i, title: t, completed: false })));
            setIsGeneratingAI(false);
        }, 1500);
    };

    const applyTemplate = (template: string) => {
        setTitle(template);
        if (template === "שיחת מעקב") setTaskType("call");
        if (template === "אין מענה טלפוני") {
            setTaskType("call");
            setDescription("ניסיון התקשרות - לא היה מענה. יש לחזור ללקוח.");
        }
        if (template === "הגשת מסמכים") setTaskType("documentation");
        if (template === "קבלת חתימות") setTaskType("documentation");
        if (template === "תזכורת") setTaskType("task");
    };

    const handleSave = () => {
        if (!title || !date || !time || !endDate || !endTime || !location || !description) {
            toast.error("אנא מלא את כל שדות החובה: כותרת, מועדי התחלה וסיום, מיקום ותיאור");
            return;
        }

        const selectedSubject = subjects.find(s => s.id === subjectId);
        const selectedWorkflow = workflows.find(w => w.id === workflowId);

        onSave({
            id: existingTask?.id || Date.now().toString(),
            title,
            description,
            date,
            time,
            endDate,
            endTime,
            location,
            priority,
            type: taskType,
            status: existingTask?.status || "new",
            client: selectedClient?.name,
            clientName: selectedClient?.name,
            clientId: selectedClient?.id,
            assignedTo: assignee,
            assignee,
            subtasks,
            subjectId,
            subjectName: selectedSubject?.name,
            workflowId,
            workflowName: selectedWorkflow?.name,
            idNumber,
            employerName,
            agentName,
            notes,
            completed: existingTask?.completed || false,
            createdAt: existingTask?.createdAt || new Date(),
            updatedAt: new Date(),
            createdBy: existingTask?.createdBy || "admin",
            isReminder,
            estimatedDuration: Number(estimatedDuration),
            urgency,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4" dir="rtl">
            <div className="glass-card border border-amber-500/20 rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-amber-500/20 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-amber-100 font-display flex items-center gap-2">
                            {existingTask ? "עריכת משימה" : "משימה חדשה"}
                            <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full">3.0</span>
                        </h2>
                        <p className="text-slate-400 text-xs font-bold mt-1">ניהול מתקדם עם AI, תהליכים ונושאים</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-full transition-colors text-slate-400 hover:text-red-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">

                    {/* Quick Templates */}
                    <div>
                        <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">תבניות מהירות</label>
                        <div className="flex flex-wrap gap-2">
                            {["שיחת מעקב", "אין מענה טלפוני", "הגשת מסמכים", "קבלת חתימות", "תזכורת"].map(template => (
                                <button
                                    key={template}
                                    onClick={() => applyTemplate(template)}
                                    className="px-4 py-1.5 rounded-full text-xs font-bold glass-card border border-amber-500/20 text-slate-300 hover:border-amber-500 hover:text-amber-200 transition-all"
                                >
                                    {template}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reminder & Duration Toggle */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="glass-card border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-amber-200 text-sm">הגדר כתזכורת</h4>
                                <p className="text-[10px] text-slate-500 font-bold">המערכת תשלח התראה במועד שנקבע</p>
                            </div>
                            <button
                                onClick={() => setIsReminder(!isReminder)}
                                className={`w-12 h-6 rounded-full transition-all relative ${isReminder ? 'bg-amber-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isReminder ? 'right-7' : 'right-1'}`} />
                            </button>
                        </div>

                        <div className="glass-card border border-amber-500/20 rounded-2xl p-4">
                            <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">זמן מוערך (דקות)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                                    className="w-20 glass-card border-amber-500/20 rounded-xl px-3 py-2 text-sm font-bold text-slate-200 focus:ring-2 focus:ring-amber-500/30 outline-none"
                                />
                                {existingTask && (
                                    <div className="flex-1 flex items-center justify-end gap-2">
                                        <div className="text-right">
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">זמן בפועל</p>
                                            <p className={`text-xs font-mono font-black ${existingTask.timerStatus === 'running' ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                                                {existingTask.totalTimeSpent ? Math.floor(existingTask.totalTimeSpent / 60) : 0} דקות
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">נושא המשימה (חובה)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="לדוגמה: הכנת תיק לקוח לפגישה..."
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-bold text-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">מיקום (חובה)</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="משרד / טלפוני / כתובת..."
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-bold text-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">פירוט (תיאור) (חובה)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="תיאור מפורט של המשימה..."
                                className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-medium text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none transition-all resize-none"
                             />
                        </div>
                    </div>

                    {/* Task Type, Subject, Workflow */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TaskTypeSelector
                            value={taskType}
                            onChange={setTaskType}
                            disabled={isLoading}
                        />

                        <SubjectSelector
                            value={subjectId}
                            onChange={setSubjectId}
                            subjects={subjects}
                            disabled={isLoading}
                        />

                        <WorkflowSelector
                            value={workflowId}
                            onChange={setWorkflowId}
                            workflows={workflows}
                            disabled={isLoading}
                            clientId={selectedClient?.id}
                        />
                    </div>

                    {/* AI Breakdown */}
                    <div className="glass-card border border-amber-500/20 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-amber-200 text-sm flex items-center gap-2">
                                <BrainCircuit size={16} className="text-amber-400" />
                                פירוק משימה חכם (AI)
                            </h4>
                            <Button
                                size="sm"
                                className="glass-card text-amber-400 hover:bg-slate-700/50 border border-amber-500/30 text-xs gap-2"
                                onClick={handleGenerateSubtasks}
                                disabled={isGeneratingAI || !title}
                            >
                                {isGeneratingAI ? <span className="animate-spin">✨</span> : <Sparkles size={12} />}
                                {isGeneratingAI ? "מנתח..." : "פרק למשימות משנה"}
                            </Button>
                        </div>

                        {subtasks.length > 0 ? (
                            <div className="space-y-2">
                                {subtasks.map((st, i) => (
                                    <div key={i} className="flex items-center gap-3 glass-card border border-amber-500/20 p-2 rounded-lg shadow-sm animate-in slide-in-from-right-4 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="h-4 w-4 rounded border border-amber-500/30 bg-slate-700/50" />
                                        <span className="text-sm font-bold text-slate-200">{st.title}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-2">ה-AI שלנו מוכן לעזור לך לתכנן את המשימה...</p>
                        )}
                    </div>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Time & Date */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">מועד התחלה (חובה)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-bold text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                        />
                                    </div>
                                    <div className="relative w-24">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full glass-card border-amber-500/20 rounded-xl px-2 py-3 font-bold text-sm text-slate-200 text-center focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2 italic">🎯 שעת יעד ומועד סיום</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-bold text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                        />
                                    </div>
                                    <div className="relative w-24">
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full glass-card border-amber-500/20 rounded-xl px-2 py-3 font-bold text-sm text-slate-200 text-center focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">אחראי משימה</label>
                                <select
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-3 font-bold text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                >
                                    <option value="admin">מנהל ראשי (אני)</option>
                                    <option value="agent_1">ישראל ישראלי (סוכן)</option>
                                    <option value="agent_2">פלונית אלמונית (מזכירה)</option>
                                </select>
                            </div>
                        </div>

                        {/* Client Linking */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">שיוך ללקוח</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setIsLinkedToClient(true)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${isLinkedToClient ? 'bg-amber-500 text-slate-900 border-amber-500' : 'glass-card text-slate-400 border-amber-500/20 hover:bg-slate-700/50'}`}
                                    >כן</button>
                                    <button
                                        onClick={() => { setIsLinkedToClient(false); setSelectedClient(null); }}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${isLinkedToClient ? 'bg-slate-700 text-slate-200 border-slate-600' : 'glass-card text-slate-400 border-amber-500/20 hover:bg-slate-700/50'}`}
                                    >לא</button>
                                </div>

                                {isLinkedToClient ? <div className="relative">
                                        <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={selectedClient ? selectedClient.name : "הקלד שם לקוח..."}
                                            value={selectedClient ? selectedClient.name : clientSearchTerm}
                                            onChange={(e) => {
                                                if (selectedClient) setSelectedClient(null);
                                                setClientSearchTerm(e.target.value);
                                            }}
                                            className="w-full glass-card border-2 border-amber-500/30 rounded-xl pl-4 pr-10 py-3 font-bold text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none text-slate-200 placeholder:text-slate-500"
                                        />

                                        {showClientResults && !selectedClient ? <div className="absolute top-full left-0 right-0 mt-1 glass-card border border-amber-500/20 rounded-xl shadow-xl max-h-40 overflow-y-auto z-10">
                                                {searchResults.length > 0 ? searchResults.map(client => (
                                                    <div
                                                        key={client.id}
                                                        onClick={() => {
                                                            setSelectedClient(client);
                                                            setClientSearchTerm("");
                                                            setShowClientResults(false);
                                                        }}
                                                        className="p-3 hover:bg-slate-700/50 cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-200"
                                                    >
                                                        <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">👤</div>
                                                        {client.name}
                                                    </div>
                                                )) : (
                                                    <div className="p-3 text-xs text-slate-400 text-center">לא נמצאו לקוחות</div>
                                                )}
                                            </div> : null}
                                    </div> : null}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-amber-200 uppercase tracking-wider mb-2">תיעדוף (Priority)</label>
                                <div className="flex glass-card rounded-xl p-1 border border-amber-500/20 mb-4">
                                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${priority === p
                                                ? (p === 'urgent' ? 'bg-indigo-600 text-white shadow-md' : p === 'high' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : p === 'medium' ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30' : 'bg-blue-500 text-white shadow-md shadow-blue-500/30')
                                                : 'text-slate-400 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            {p === 'urgent' ? 'קריטי' : p === 'high' ? 'גבוה' : p === 'medium' ? 'בינוני' : 'נמוך'}
                                        </button>
                                    ))}
                                </div>

                                <label className="block text-xs font-black text-red-400 uppercase tracking-wider mb-2">דחיפות (Urgency)</label>
                                <div className="flex glass-card rounded-xl p-1 border border-red-500/10">
                                    {(["low", "medium", "high", "urgent"] as const).map((u) => (
                                        <button
                                            key={u}
                                            onClick={() => setUrgency(u)}
                                            className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${urgency === u
                                                ? (u === 'urgent' ? 'bg-red-600 text-white shadow-md' : u === 'high' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : u === 'medium' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-600 text-white shadow-md shadow-slate-500/30')
                                                : 'text-slate-400 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            {u === 'urgent' ? 'דחוף מאוד' : u === 'high' ? 'דחוף' : u === 'medium' ? 'רגיל' : 'לא דחוף'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Fields */}
                    <div className="border-t border-amber-500/20 pt-6">
                        <h3 className="text-sm font-black text-amber-200 mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-amber-400" />
                            שדות נוספים (אופציונלי)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">ת.ז לקוח</label>
                                <input
                                    type="text"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value)}
                                    placeholder="123456789"
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">מעסיק</label>
                                <input
                                    type="text"
                                    value={employerName}
                                    onChange={(e) => setEmployerName(e.target.value)}
                                    placeholder="שם המעסיק"
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">סוכן</label>
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="שם הסוכן"
                                    className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-bold text-slate-300 mb-2">הערות</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="הערות נוספות..."
                                className="w-full glass-card border-amber-500/20 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none resize-none"
                             />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-amber-500/20 bg-slate-800/50 rounded-b-3xl flex justify-between items-center shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-500" />
                        SLA יחושב אוטומטית משעת היעד
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-200">ביטול</Button>
                        <Button variant="gold" size="lg" onClick={handleSave}>שמור משימה</Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
