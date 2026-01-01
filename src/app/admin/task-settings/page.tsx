"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";
import { Settings, Columns, Tag, GitBranch, ListChecks, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { AVAILABLE_TASK_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from "@/lib/task-constants";

type TabType = "columns" | "subjects" | "workflows" | "statuses";

export default function TaskSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("columns");
    const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
    const [hasChanges, setHasChanges] = useState(false);

    const tabs = [
        { id: "columns" as TabType, label: "עמודות", icon: Columns, description: "התאמת עמודות תצוגה" },
        { id: "subjects" as TabType, label: "נושאים", icon: Tag, description: "ניהול נושאים וקטגוריות" },
        { id: "workflows" as TabType, label: "תהליכים", icon: GitBranch, description: "ניהול תהליכי עבודה" },
        { id: "statuses" as TabType, label: "סטטוסים", icon: ListChecks, description: "ניהול סטטוסי משימות" },
    ];

    const toggleColumn = (columnId: string) => {
        if (selectedColumns.includes(columnId)) {
            setSelectedColumns(selectedColumns.filter(id => id !== columnId));
        } else {
            setSelectedColumns([...selectedColumns, columnId]);
        }
        setHasChanges(true);
    };

    const handleSaveColumns = () => {
        // Save to localStorage or user preferences
        localStorage.setItem("taskColumns", JSON.stringify(selectedColumns));
        setHasChanges(false);
        alert("העמודות נשמרו בהצלחה!");
    };

    const handleResetColumns = () => {
        setSelectedColumns(DEFAULT_VISIBLE_COLUMNS);
        setHasChanges(true);
    };

    const navItems = [
        { label: "ראשי", href: "/admin/dashboard" },
        { label: "הגדרות משימות", href: "/admin/task-settings" },
    ];

    return (
        <DashboardShell role="אדמין" navItems={navItems as any}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Settings className="text-indigo-600" size={32} />
                            הגדרות משימות
                        </h1>
                        <p className="text-slate-500 mt-1">נהל את כל ההגדרות הקשורות למשימות</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-4 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === tab.id
                                            ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="min-h-[500px]">
                    {/* Columns Tab */}
                    {activeTab === "columns" && (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">עמודות תצוגה</h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            בחר אילו עמודות להציג בתצוגת הטבלה של המשימות
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleResetColumns}
                                            variant="outline"
                                            size="sm"
                                        >
                                            איפוס לברירת מחדל
                                        </Button>
                                        {hasChanges && (
                                            <Button
                                                onClick={handleSaveColumns}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                size="sm"
                                            >
                                                <Save size={16} className="ml-2" />
                                                שמור שינויים
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-indigo-900 font-bold">
                                            {selectedColumns.length} מתוך {AVAILABLE_TASK_COLUMNS.length} עמודות נבחרו
                                        </span>
                                        <span className="text-indigo-600">
                                            {AVAILABLE_TASK_COLUMNS.filter(c => c.defaultVisible).length} עמודות ברירת מחדל
                                        </span>
                                    </div>
                                </div>

                                {/* Columns Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {AVAILABLE_TASK_COLUMNS.map((column) => {
                                        const isSelected = selectedColumns.includes(column.id);
                                        const isDefault = column.defaultVisible;

                                        return (
                                            <button
                                                key={column.id}
                                                onClick={() => toggleColumn(column.id)}
                                                className={`p-4 rounded-xl border-2 text-right transition-all ${isSelected
                                                        ? "bg-indigo-50 border-indigo-300 shadow-sm"
                                                        : "bg-white border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Checkbox */}
                                                    <div
                                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                                                ? "bg-indigo-600 border-indigo-600"
                                                                : "bg-white border-slate-300"
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Column Info */}
                                                    <div className="flex-1 text-right">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            {column.labelHe}
                                                            {isDefault && (
                                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                                    ברירת מחדל
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {column.label}
                                                            {column.sortable && " • ניתן למיון"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Info Box */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex gap-3">
                                        <div className="text-blue-600 shrink-0">ℹ️</div>
                                        <div className="text-sm text-blue-900">
                                            <p className="font-bold mb-1">טיפ:</p>
                                            <p>
                                                בחר רק את העמודות החשובות לך כדי לשפר את קריאות הטבלה.
                                                תמיד ניתן לשנות את הבחירה מאוחר יותר.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Subjects Tab */}
                    {activeTab === "subjects" && (
                        <Card className="p-12 text-center">
                            <Tag size={64} className="mx-auto text-indigo-200 mb-4" />
                            <h3 className="text-xl font-black text-slate-900 mb-2">ניהול נושאים</h3>
                            <p className="text-slate-500 mb-6">
                                נהל קטגוריות ונושאים למשימות בעמוד הייעודי
                            </p>
                            <Button
                                onClick={() => router.push("/admin/subjects")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                <Tag size={18} className="ml-2" />
                                עבור לניהול נושאים
                            </Button>
                        </Card>
                    )}

                    {/* Workflows Tab */}
                    {activeTab === "workflows" && (
                        <Card className="p-12 text-center">
                            <GitBranch size={64} className="mx-auto text-purple-200 mb-4" />
                            <h3 className="text-xl font-black text-slate-900 mb-2">ניהול תהליכים</h3>
                            <p className="text-slate-500 mb-6">
                                צור ונהל תהליכי עבודה אוטומטיים בעמוד הייעודי
                            </p>
                            <Button
                                onClick={() => router.push("/admin/workflows")}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <GitBranch size={18} className="ml-2" />
                                עבור לניהול תהליכים
                            </Button>
                        </Card>
                    )}

                    {/* Statuses Tab */}
                    {activeTab === "statuses" && (
                        <Card className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-black text-slate-900">סטטוסי משימות</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    7 סטטוסים קבועים במערכת
                                </p>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { value: "new", label: "חדש", color: "#3b82f6", description: "משימה חדשה שנוצרה" },
                                    { value: "pending", label: "ממתין", color: "#f59e0b", description: "ממתין לפעולה" },
                                    { value: "in_progress", label: "בטיפול", color: "#8b5cf6", description: "המשימה בטיפול כרגע" },
                                    { value: "completed", label: "הושלם", color: "#10b981", description: "המשימה הושלמה בהצלחה" },
                                    { value: "overdue", label: "באיחור", color: "#ef4444", description: "חרג מזמן היעד (SLA)" },
                                    { value: "transferred", label: "הועבר", color: "#ec4899", description: "הועבר למשתמש אחר" },
                                    { value: "cancelled", label: "בוטל", color: "#64748b", description: "המשימה בוטלה" },
                                ].map((status) => (
                                    <div
                                        key={status.value}
                                        className="p-4 bg-white border-2 border-slate-200 rounded-xl flex items-center gap-4"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${status.color}20` }}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: status.color }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-900">{status.label}</div>
                                            <div className="text-sm text-slate-500">{status.description}</div>
                                        </div>
                                        <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
                                            מערכת
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex gap-3">
                                    <div className="text-amber-600 shrink-0">⚠️</div>
                                    <div className="text-sm text-amber-900">
                                        <p className="font-bold mb-1">שים לב:</p>
                                        <p>
                                            הסטטוסים הם חלק ממבנה המערכת ולא ניתן לשנותם.
                                            המערכת משתמשת בהם לאוטומציות ולוגיקה פנימית.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
