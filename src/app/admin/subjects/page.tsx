"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { Plus, Edit2, Trash2, Tag, Save, X, AlertCircle, CheckCircle2, Palette } from "lucide-react";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { TaskSubject } from "@/types/subject";
import { DEFAULT_SUBJECTS } from "@/types/subject";

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<TaskSubject[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<TaskSubject | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formColor, setFormColor] = useState("#3b82f6");
    const [formRelatedToPolicy, setFormRelatedToPolicy] = useState(false);
    const [formIsFutureLead, setFormIsFutureLead] = useState(false);
    const [formDefaultWorkflowId, setFormDefaultWorkflowId] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [subjectsData, workflowsData] = await Promise.all([
                firestoreService.getSubjects(),
                firestoreService.getWorkflows()
            ]);
            setSubjects(subjectsData as TaskSubject[]);
            setWorkflows(workflowsData);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const initializeDefaultSubjects = async () => {
        if (confirm("האם להוסיף את הנושאים ברירת המחדל? (7 נושאים)")) {
            try {
                for (const subject of DEFAULT_SUBJECTS) {
                    await firestoreService.createSubject({
                        ...subject,
                        createdBy: "admin",
                    });
                }
                await loadData();
                alert("נושאים ברירת מחדל נוספו בהצלחה!");
            } catch (error) {
                console.error("Failed to initialize subjects:", error);
                alert("שגיאה בהוספת נושאים");
            }
        }
    };

    const openCreateModal = () => {
        setEditingSubject(null);
        setFormName("");
        setFormDescription("");
        setFormColor("#3b82f6");
        setFormRelatedToPolicy(false);
        setFormIsFutureLead(false);
        setFormDefaultWorkflowId("");
        setFormIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (subject: TaskSubject) => {
        setEditingSubject(subject);
        setFormName(subject.name);
        setFormDescription(subject.description || "");
        setFormColor(subject.color || "#3b82f6");
        setFormRelatedToPolicy(subject.relatedToPolicy);
        setFormIsFutureLead(subject.isFutureLead);
        setFormDefaultWorkflowId(subject.defaultWorkflowId || "");
        setFormIsActive(subject.isActive);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            alert("נא להזין שם נושא");
            return;
        }

        const subjectData = {
            name: formName,
            description: formDescription,
            color: formColor,
            relatedToPolicy: formRelatedToPolicy,
            isFutureLead: formIsFutureLead,
            defaultWorkflowId: formDefaultWorkflowId || undefined,
            isActive: formIsActive,
            isSystem: false,
        };

        try {
            if (editingSubject) {
                await firestoreService.updateSubject(editingSubject.id, subjectData);
            } else {
                await firestoreService.createSubject({
                    ...subjectData,
                    createdBy: "admin",
                });
            }
            await loadData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save subject:", error);
            alert("שגיאה בשמירת הנושא");
        }
    };

    const handleDelete = async (subject: TaskSubject) => {
        if (subject.isSystem) {
            alert("לא ניתן למחוק נושא מערכת");
            return;
        }

        if (confirm(`האם למחוק את הנושא "${subject.name}"?`)) {
            try {
                await firestoreService.deleteSubject(subject.id);
                await loadData();
            } catch (error) {
                console.error("Failed to delete subject:", error);
                alert("שגיאה במחיקת הנושא");
            }
        }
    };

    const toggleActive = async (subject: TaskSubject) => {
        try {
            await firestoreService.updateSubject(subject.id, {
                isActive: !subject.isActive
            });
            await loadData();
        } catch (error) {
            console.error("Failed to toggle subject:", error);
        }
    };

    const navItems = [
        { label: "ראשי", href: "/admin/dashboard" },
        { label: "הגדרות משימות", href: "/admin/task-settings" },
        { label: "ניהול נושאים", href: "/admin/subjects" },
    ];

    const predefinedColors = [
        "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
        "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6",
        "#6366f1", "#f97316", "#84cc16", "#a855f7"
    ];

    return (
        <DashboardShell role="אדמין" navItems={navItems as any}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Tag className="text-indigo-600" size={32} />
                            ניהול נושאים
                        </h1>
                        <p className="text-slate-500 mt-1">נהל קטגוריות ונושאים למשימות</p>
                    </div>
                    <div className="flex gap-3">
                        {subjects.length === 0 && (
                            <Button
                                onClick={initializeDefaultSubjects}
                                variant="outline"
                                className="gap-2"
                            >
                                <CheckCircle2 size={18} />
                                הוסף נושאים ברירת מחדל
                            </Button>
                        )}
                        <Button
                            onClick={openCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                        >
                            <Plus size={18} />
                            נושא חדש
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">סה"כ נושאים</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{subjects.length}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">נושאים פעילים</div>
                        <div className="text-2xl font-black text-green-600 mt-1">
                            {subjects.filter(s => s.isActive).length}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">קשורים לפוליסה</div>
                        <div className="text-2xl font-black text-blue-600 mt-1">
                            {subjects.filter(s => s.relatedToPolicy).length}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">לידים עתידיים</div>
                        <div className="text-2xl font-black text-purple-600 mt-1">
                            {subjects.filter(s => s.isFutureLead).length}
                        </div>
                    </Card>
                </div>

                {/* Subjects List */}
                <Card className="overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400">טוען...</div>
                    ) : subjects.length === 0 ? (
                        <div className="p-12 text-center">
                            <Tag size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 mb-2">אין נושאים</h3>
                            <p className="text-slate-400 mb-4">התחל על ידי הוספת נושאים ברירת מחדל או צור נושא חדש</p>
                            <Button onClick={initializeDefaultSubjects} variant="outline">
                                הוסף נושאים ברירת מחדל
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {subjects.map((subject) => (
                                <div
                                    key={subject.id}
                                    className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Color Indicator */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${subject.color}20` }}
                                        >
                                            <Tag size={24} style={{ color: subject.color }} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900">{subject.name}</h3>
                                                {subject.isSystem && (
                                                    <Badge variant="outline" className="text-xs">מערכת</Badge>
                                                )}
                                                {!subject.isActive && (
                                                    <Badge className="bg-slate-100 text-slate-600 text-xs">לא פעיל</Badge>
                                                )}
                                            </div>
                                            {subject.description && (
                                                <p className="text-sm text-slate-500">{subject.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2">
                                                {subject.relatedToPolicy && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                        📋 קשור לפוליסה
                                                    </span>
                                                )}
                                                {subject.isFutureLead && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        🎯 לקוח עתידי
                                                    </span>
                                                )}
                                                {subject.defaultWorkflowId && (
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                        🔄 תהליך ברירת מחדל
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(subject)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${subject.isActive
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {subject.isActive ? "פעיל" : "לא פעיל"}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(subject)}
                                            className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        {!subject.isSystem && (
                                            <button
                                                onClick={() => handleDelete(subject)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {editingSubject ? "עריכת נושא" : "נושא חדש"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        שם הנושא *
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="לדוגמה: לקוח חדש"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-300 focus:outline-none"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        תיאור
                                    </label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="תיאור קצר של הנושא..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-300 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        צבע
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {predefinedColors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setFormColor(color)}
                                                className={`w-10 h-10 rounded-lg transition-all ${formColor === color ? "ring-2 ring-offset-2 ring-indigo-600 scale-110" : ""
                                                    }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={formColor}
                                            onChange={(e) => setFormColor(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Flags */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formRelatedToPolicy}
                                            onChange={(e) => setFormRelatedToPolicy(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                        <div>
                                            <div className="font-bold text-slate-900">קשור לפוליסה</div>
                                            <div className="text-xs text-slate-500">משימות הקשורות להפקת פוליסה</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formIsFutureLead}
                                            onChange={(e) => setFormIsFutureLead(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                        <div>
                                            <div className="font-bold text-slate-900">לקוח עתידי</div>
                                            <div className="text-xs text-slate-500">ליד פוטנציאלי</div>
                                        </div>
                                    </label>
                                </div>

                                {/* Default Workflow */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        תהליך ברירת מחדל
                                    </label>
                                    <select
                                        value={formDefaultWorkflowId}
                                        onChange={(e) => setFormDefaultWorkflowId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-300 focus:outline-none"
                                    >
                                        <option value="">ללא תהליך</option>
                                        {workflows.map((workflow) => (
                                            <option key={workflow.id} value={workflow.id}>
                                                {workflow.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Active */}
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formIsActive}
                                        onChange={(e) => setFormIsActive(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-bold text-slate-900">נושא פעיל</span>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <Button
                                    onClick={handleSave}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Save size={18} className="ml-2" />
                                    שמור
                                </Button>
                                <Button
                                    onClick={() => setIsModalOpen(false)}
                                    variant="outline"
                                    className="px-8"
                                >
                                    ביטול
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
