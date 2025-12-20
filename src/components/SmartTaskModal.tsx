"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "@/components/ui/base";
import { Calendar as CalendarIcon, Clock, X, User, CheckCircle2, AlertTriangle, Sparkles, BrainCircuit, Search } from "lucide-react";

interface SmartTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: any) => void;
    initialDate: Date;
    existingTask?: any;
}

export function SmartTaskModal({ isOpen, onClose, onSave, initialDate, existingTask }: SmartTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("10:00");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [isLinkedToClient, setIsLinkedToClient] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [selectedClient, setSelectedClient] = useState<{ id: string, name: string } | null>(null);
    const [assignee, setAssignee] = useState("admin"); // Default to admin
    const [subtasks, setSubtasks] = useState<{ id: string, title: string, completed: boolean }[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showClientResults, setShowClientResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (existingTask) {
                setTitle(existingTask.title);
                setDescription(existingTask.description || "");
                setDate(existingTask.date);
                setTime(existingTask.time);
                setPriority(existingTask.priority);
                setIsLinkedToClient(!!existingTask.client);
                setSelectedClient(existingTask.client ? { id: existingTask.clientId, name: existingTask.client } : null);
                setAssignee(existingTask.assignee || "admin");
                setSubtasks(existingTask.subtasks || []);
            } else {
                // Reset form for new task
                setTitle("");
                setDescription("");
                setDate(initialDate.toISOString().split('T')[0]);
                setTime("10:00");
                setPriority("medium");
                setIsLinkedToClient(false);
                setSelectedClient(null);
                setAssignee("admin");
                setSubtasks([]);
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

    const handleSave = () => {
        onSave({
            id: existingTask?.id || Date.now().toString(),
            title,
            description,
            date,
            time,
            priority,
            client: selectedClient?.name,
            clientId: selectedClient?.id,
            assignee,
            subtasks,
            completed: existingTask?.completed || false,
            type: "task" // Defaulting to task type for now
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 font-display flex items-center gap-2">
                            {existingTask ? "עריכת משימה" : "משימה חדשה"}
                            <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">2.0</span>
                        </h2>
                        <p className="text-slate-400 text-xs font-bold mt-1">ניהול מתקדם עם AI ו-SLA</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">

                    {/* Title & Description */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">נושא המשימה</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="לדוגמה: הכנת תיק לקוח לפגישה..."
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">פירוט (תיאור)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* AI Breakdown */}
                    <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2">
                                <BrainCircuit size={16} className="text-indigo-500" />
                                פירוק משימה חכם (AI)
                            </h4>
                            <Button
                                size="sm"
                                className="bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 text-xs gap-2"
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
                                    <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm animate-in slide-in-from-right-4 fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="h-4 w-4 rounded border border-slate-300 bg-slate-50"></div>
                                        <span className="text-sm font-bold text-slate-700">{st.title}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-indigo-400/80 italic text-center py-2">ה-AI שלנו מוכן לעזור לך לתכנן את המשימה...</p>
                        )}
                    </div>

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Time & Date */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">מועד לביצוע</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative w-24">
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-2 py-3 font-bold text-sm text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">אחראי משימה</label>
                                <select
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">שיוך ללקוח</label>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        onClick={() => setIsLinkedToClient(true)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${isLinkedToClient ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'}`}
                                    >כן</button>
                                    <button
                                        onClick={() => { setIsLinkedToClient(false); setSelectedClient(null); }}
                                        className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${!isLinkedToClient ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'}`}
                                    >לא</button>
                                </div>

                                {isLinkedToClient && (
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={selectedClient ? selectedClient.name : "הקלד שם לקוח..."}
                                            value={selectedClient ? selectedClient.name : clientSearchTerm}
                                            onChange={(e) => {
                                                if (selectedClient) setSelectedClient(null); // Clear selection on edit
                                                setClientSearchTerm(e.target.value);
                                            }}
                                            className="w-full bg-white border-2 border-indigo-100 rounded-xl pl-4 pr-10 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-900 placeholder:text-indigo-300"
                                        />

                                        {/* Dropdown Results */}
                                        {showClientResults && !selectedClient && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-40 overflow-y-auto z-10">
                                                {searchResults.length > 0 ? searchResults.map(client => (
                                                    <div
                                                        key={client.id}
                                                        onClick={() => {
                                                            setSelectedClient(client);
                                                            setClientSearchTerm("");
                                                            setShowClientResults(false);
                                                        }}
                                                        className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 text-sm font-bold text-slate-700"
                                                    >
                                                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">👤</div>
                                                        {client.name}
                                                    </div>
                                                )) : (
                                                    <div className="p-3 text-xs text-slate-400 text-center">לא נמצאו לקוחות</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">דחיפות (Priority)</label>
                                <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                                    {(["low", "medium", "high"] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 text-[10px] font-black py-2 rounded-lg transition-all ${priority === p
                                                ? (p === 'high' ? 'bg-red-500 text-white shadow-md shadow-red-200' : p === 'medium' ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-blue-500 text-white shadow-md shadow-blue-200')
                                                : 'text-slate-400 hover:bg-white'
                                                }`}
                                        >
                                            {p === 'high' ? 'דחוף' : p === 'medium' ? 'רגיל' : 'נמוך'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl flex justify-between items-center shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-500" />
                        SLA יחושב אוטומטית משעת היעד
                    </p>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-700">ביטול</Button>
                        <Button onClick={handleSave} className="bg-indigo-600 text-white shadow-xl shadow-indigo-200 font-black px-8">שמור משימה</Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
