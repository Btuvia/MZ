"use client";

import { Plus, Edit2, Trash2, GitBranch, Save, X, ChevronDown, ChevronUp, Layers, Clock, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { handleError, showSuccess } from "@/lib/error-handler";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { TASK_TYPES } from "@/lib/task-constants";
import { TaskType, UserRole } from "@/types";
import { type Workflow, type WorkflowStep } from "@/types/workflow";

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formCategory, setFormCategory] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    const [formSteps, setFormSteps] = useState<Omit<WorkflowStep, 'id'>[]>([]);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        setIsLoading(true);
        try {
            const data = await firestoreService.getWorkflows();
            setWorkflows(data as Workflow[]);
        } catch (error) {
            handleError(error, { context: 'טעינת תהליכים' });
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingWorkflow(null);
        setFormName("");
        setFormDescription("");
        setFormCategory("");
        setFormIsActive(true);
        setFormSteps([
            {
                stepNumber: 1,
                name: "",
                taskType: "task",
                daysToComplete: 1,
                autoCreate: true,
                requiresPreviousCompletion: false,
            }
        ]);
        setIsModalOpen(true);
    };

    const openEditModal = (workflow: Workflow) => {
        setEditingWorkflow(workflow);
        setFormName(workflow.name);
        setFormDescription(workflow.description || "");
        setFormCategory(workflow.category || "");
        setFormIsActive(workflow.isActive);
        setFormSteps(workflow.steps.map(s => ({
            stepNumber: s.stepNumber,
            name: s.name,
            description: s.description,
            taskType: s.taskType,
            daysToComplete: s.daysToComplete,
            assigneeRole: s.assigneeRole,
            autoCreate: s.autoCreate,
            requiresPreviousCompletion: s.requiresPreviousCompletion,
        })));
        setIsModalOpen(true);
    };

    const addStep = () => {
        setFormSteps([...formSteps, {
            stepNumber: formSteps.length + 1,
            name: "",
            taskType: "task",
            daysToComplete: 1,
            autoCreate: true,
            requiresPreviousCompletion: true,
        }]);
    };

    const removeStep = (index: number) => {
        const newSteps = formSteps.filter((_, i) => i !== index);
        // Renumber steps
        setFormSteps(newSteps.map((step, i) => ({ ...step, stepNumber: i + 1 })));
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...formSteps];
        (newSteps[index] as any)[field] = value;
        setFormSteps(newSteps);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            alert("נא להזין שם תהליך");
            return;
        }

        if (formSteps.length === 0) {
            alert("נא להוסיף לפחות שלב אחד");
            return;
        }

        // Validate steps
        for (const step of formSteps) {
            if (!step.name.trim()) {
                alert(`נא להזין שם לשלב ${step.stepNumber}`);
                return;
            }
        }

        const workflowData = {
            name: formName,
            description: formDescription,
            category: formCategory,
            isActive: formIsActive,
            steps: formSteps.map((step, index) => ({
                ...step,
                id: `step_${index + 1}`,
            })),
            estimatedDuration: formSteps.reduce((sum, step) => sum + step.daysToComplete, 0),
        };

        try {
            if (editingWorkflow) {
                await firestoreService.updateWorkflow(editingWorkflow.id, workflowData);
                showSuccess('התהליך עודכן בהצלחה');
            } else {
                await firestoreService.createWorkflow({
                    ...workflowData,
                    createdBy: "admin",
                });
                showSuccess('התהליך נוצר בהצלחה');
            }
            await loadWorkflows();
            setIsModalOpen(false);
        } catch (error) {
            handleError(error, { context: 'שמירת תהליך' });
        }
    };

    const handleDelete = async (workflow: Workflow) => {
        if (confirm(`האם למחוק את התהליך "${workflow.name}"?`)) {
            try {
                await firestoreService.deleteWorkflow(workflow.id);
                showSuccess('התהליך נמחק בהצלחה');
                await loadWorkflows();
            } catch (error) {
                handleError(error, { context: 'מחיקת תהליך' });
            }
        }
    };

    const toggleActive = async (workflow: Workflow) => {
        try {
            await firestoreService.updateWorkflow(workflow.id, {
                isActive: !workflow.isActive
            });
            showSuccess(workflow.isActive ? 'התהליך הושבת' : 'התהליך הופעל');
            await loadWorkflows();
        } catch (error) {
            handleError(error, { context: 'שינוי סטטוס תהליך' });
        }
    };

    const navItems = [
        { label: "ראשי", href: "/admin/dashboard" },
        { label: "הגדרות משימות", href: "/admin/task-settings" },
        { label: "ניהול תהליכים", href: "/admin/workflows" },
    ];

    return (
        <DashboardShell role="אדמין" navItems={navItems as any}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <GitBranch className="text-purple-600" size={32} />
                            ניהול תהליכים
                        </h1>
                        <p className="text-slate-500 mt-1">צור ונהל תהליכי עבודה אוטומטיים</p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        <Plus size={18} />
                        תהליך חדש
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">סה"כ תהליכים</div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{workflows.length}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">תהליכים פעילים</div>
                        <div className="text-2xl font-black text-green-600 mt-1">
                            {workflows.filter(w => w.isActive).length}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">סה"כ שלבים</div>
                        <div className="text-2xl font-black text-blue-600 mt-1">
                            {workflows.reduce((sum, w) => sum + w.steps.length, 0)}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-slate-500">ממוצע שלבים</div>
                        <div className="text-2xl font-black text-purple-600 mt-1">
                            {workflows.length > 0
                                ? Math.round(workflows.reduce((sum, w) => sum + w.steps.length, 0) / workflows.length)
                                : 0
                            }
                        </div>
                    </Card>
                </div>

                {/* Workflows List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <Card className="p-12 text-center text-slate-400">טוען...</Card>
                    ) : workflows.length === 0 ? (
                        <Card className="p-12 text-center">
                            <GitBranch size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 mb-2">אין תהליכים</h3>
                            <p className="text-slate-400 mb-4">צור תהליך עבודה ראשון</p>
                            <Button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-700 text-white">
                                <Plus size={18} className="ml-2" />
                                תהליך חדש
                            </Button>
                        </Card>
                    ) : (
                        workflows.map((workflow) => (
                            <Card key={workflow.id} className="overflow-hidden">
                                {/* Workflow Header */}
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <GitBranch size={24} className="text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 text-lg">{workflow.name}</h3>
                                                {workflow.category ? <Badge variant="outline" className="text-xs">{workflow.category}</Badge> : null}
                                                {!workflow.isActive && (
                                                    <Badge className="bg-slate-100 text-slate-600 text-xs">לא פעיל</Badge>
                                                )}
                                            </div>
                                            {workflow.description ? <p className="text-sm text-slate-500">{workflow.description}</p> : null}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Layers size={14} />
                                                    {workflow.steps.length} שלבים
                                                </span>
                                                {workflow.estimatedDuration ? <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {workflow.estimatedDuration} ימים
                                                    </span> : null}
                                                {workflow.usageCount ? <span className="flex items-center gap-1">
                                                        <Target size={14} />
                                                        {workflow.usageCount} שימושים
                                                    </span> : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setExpandedWorkflow(expandedWorkflow === workflow.id ? null : workflow.id)}
                                            className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                        >
                                            {expandedWorkflow === workflow.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            {expandedWorkflow === workflow.id ? "הסתר" : "הצג"} שלבים
                                        </button>
                                        <button
                                            onClick={() => toggleActive(workflow)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${workflow.isActive
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {workflow.isActive ? "פעיל" : "לא פעיל"}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(workflow)}
                                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(workflow)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Workflow Steps (Expandable) */}
                                {expandedWorkflow === workflow.id && (
                                    <div className="border-t border-slate-200 bg-slate-50 p-6">
                                        <h4 className="font-bold text-slate-700 mb-4">שלבי התהליך</h4>
                                        <div className="space-y-3">
                                            {workflow.steps.map((step, index) => (
                                                <div key={step.id} className="bg-white p-4 rounded-lg border border-slate-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                            {step.stepNumber}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-slate-900">{step.name}</div>
                                                            {step.description ? <div className="text-sm text-slate-500 mt-1">{step.description}</div> : null}
                                                            <div className="flex items-center gap-3 mt-2 text-xs">
                                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                                    {TASK_TYPES.find(t => t.value === step.taskType)?.labelHe || step.taskType}
                                                                </span>
                                                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                                                    {step.daysToComplete} ימים
                                                                </span>
                                                                {step.autoCreate ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                        יצירה אוטומטית
                                                                    </span> : null}
                                                                {step.requiresPreviousCompletion ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                                        דורש השלמת שלב קודם
                                                                    </span> : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>

                {/* Modal */}
                {isModalOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <h2 className="text-2xl font-black text-slate-900">
                                    {editingWorkflow ? "עריכת תהליך" : "תהליך חדש"}
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
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            שם התהליך *
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="לדוגמה: תהליך לקוח חדש"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-300 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            קטגוריה
                                        </label>
                                        <input
                                            type="text"
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value)}
                                            placeholder="לדוגמה: מכירות"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-300 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        תיאור
                                    </label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="תיאור התהליך..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-300 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Steps */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-slate-700">
                                            שלבי התהליך ({formSteps.length})
                                        </label>
                                        <Button
                                            onClick={addStep}
                                            size="sm"
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            <Plus size={16} className="ml-1" />
                                            הוסף שלב
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {formSteps.map((step, index) => (
                                            <div key={index} className="p-4 border-2 border-slate-200 rounded-xl">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {step.stepNumber}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={step.name}
                                                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                                                        placeholder="שם השלב"
                                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-300 focus:outline-none font-bold"
                                                    />
                                                    {formSteps.length > 1 && (
                                                        <button
                                                            onClick={() => removeStep(index)}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mr-11">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">סוג משימה</label>
                                                        <select
                                                            value={step.taskType}
                                                            onChange={(e) => updateStep(index, 'taskType', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                                        >
                                                            {TASK_TYPES.map(type => (
                                                                <option key={type.value} value={type.value}>
                                                                    {type.labelHe}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1">ימים לביצוע (SLA)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={step.daysToComplete}
                                                            onChange={(e) => updateStep(index, 'daysToComplete', parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 mt-3 mr-11">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={step.autoCreate}
                                                            onChange={(e) => updateStep(index, 'autoCreate', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-slate-700">יצירה אוטומטית</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={step.requiresPreviousCompletion}
                                                            onChange={(e) => updateStep(index, 'requiresPreviousCompletion', e.target.checked)}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-slate-700">דורש השלמת שלב קודם</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Active */}
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formIsActive}
                                        onChange={(e) => setFormIsActive(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-bold text-slate-900">תהליך פעיל</span>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-200 flex gap-3 sticky bottom-0 bg-white">
                                <Button
                                    onClick={handleSave}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Save size={18} className="ml-2" />
                                    שמור תהליך
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
                    </div> : null}
            </div>
        </DashboardShell>
    );
}
