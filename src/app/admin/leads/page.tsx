"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { toast } from "sonner";
import ImportLeadsModal from "@/components/leads/ImportLeadsModal";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useLeadStatuses } from "@/lib/hooks/useQueryHooks";
import type { Lead, LeadStatus as LeadStatusType } from "@/types";
import type { LeadStatus } from "@/types/statuses";
import { RefreshCw, Plus, Upload, Megaphone, Trash2, UserCheck, Edit3 } from "lucide-react";

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    // Firebase Hooks
    const { data: leads = [], isLoading, refetch } = useLeads();
    const { data: statusesRaw = [] } = useLeadStatuses();
    const createLead = useCreateLead();
    const updateLead = useUpdateLead();
    const deleteLead = useDeleteLead();

    // Cast statuses to proper type
    const statuses = statusesRaw as LeadStatus[];

    // New Lead Form State
    const [newLead, setNewLead] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        source: "פייסבוק",
        status: "new" as LeadStatusType,
        notes: ""
    });

    const handleAddLead = async () => {
        if (!newLead.firstName || !newLead.phone) {
            toast.error("אנא מלא שם וטלפון");
            return;
        }

        try {
            await createLead.mutateAsync({
                firstName: newLead.firstName,
                lastName: newLead.lastName,
                phone: newLead.phone,
                email: newLead.email || "",
                source: newLead.source || "ישיר",
                status: newLead.status,
                notes: newLead.notes || "",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error adding lead:", error);
        }
    };

    const handleUpdateLead = async () => {
        if (!editingLead) return;

        try {
            await updateLead.mutateAsync({
                id: editingLead.id,
                data: {
                    firstName: newLead.firstName,
                    lastName: newLead.lastName,
                    phone: newLead.phone,
                    email: newLead.email,
                    source: newLead.source,
                    status: newLead.status,
                    notes: newLead.notes
                }
            });

            setEditingLead(null);
            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating lead:", error);
        }
    };

    const resetForm = () => {
        setNewLead({
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            source: "פייסבוק",
            status: "new",
            notes: ""
        });
    };

    const openEditModal = (lead: Lead) => {
        setEditingLead(lead);
        setNewLead({
            firstName: lead.firstName || "",
            lastName: lead.lastName || "",
            phone: lead.phone || "",
            email: lead.email || "",
            source: lead.source || "פייסבוק",
            status: lead.status || "new",
            notes: lead.notes || ""
        });
        setShowModal(true);
    };

    const convertToClient = async (lead: Lead) => {
        const fullName = `${lead.firstName} ${lead.lastName}`.trim();
        if (!confirm(`האם להפוך את הליד ${fullName} ללקוח פעיל?`)) return;

        try {
            await updateLead.mutateAsync({
                id: lead.id,
                data: { status: "won" }
            });

            toast.success(`${fullName} הומר ללקוח בהצלחה!`);
        } catch (error) {
            console.error("Error converting lead:", error);
            toast.error("שגיאה בהמרת הליד");
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm("האם למחוק ליד זה?")) return;

        try {
            await deleteLead.mutateAsync(id);
        } catch (error) {
            console.error("Error deleting lead:", error);
        }
    };

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
            const searchLower = search.toLowerCase();
            return fullName.includes(searchLower) || 
                   l.phone?.includes(search) || 
                   l.source?.toLowerCase().includes(searchLower);
        });
    }, [leads, search]);

    const getStatusStyle = (status: LeadStatusType) => {
        const statusConfig: Record<LeadStatusType, { bg: string; text: string; label: string }> = {
            new: { bg: '#3b82f620', text: '#3b82f6', label: 'חדש' },
            contacted: { bg: '#8b5cf620', text: '#8b5cf6', label: 'נוצר קשר' },
            qualified: { bg: '#f59e0b20', text: '#f59e0b', label: 'מוכשר' },
            proposal: { bg: '#06b6d420', text: '#06b6d4', label: 'הצעה' },
            negotiation: { bg: '#ec489920', text: '#ec4899', label: 'משא ומתן' },
            won: { bg: '#10b98120', text: '#10b981', label: 'נסגר' },
            lost: { bg: '#ef444420', text: '#ef4444', label: 'אבוד' },
        };
        return statusConfig[status] || statusConfig.new;
    };

    // Stats
    const stats = useMemo(() => ({
        total: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified' || l.status === 'proposal').length,
    }), [leads]);

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6 animate-in fade-in duration-700" dir="rtl">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gradient-gold font-display tracking-tight italic neon-text-gold">ניהול לידים</h2>
                        <p className="text-slate-500 font-medium">נהל את הלידים הנכנסים ויבא נתונים ממקורות חיצוניים</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => refetch()}
                            className="text-[11px] font-black px-4 rounded-xl">
                            <RefreshCw size={14} className={`ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                            רענן
                        </Button>
                        <Button
                            variant="outline"
                            className="text-[11px] font-black px-4 rounded-xl"
                            onClick={() => setShowImportModal(true)}>
                            <Upload size={14} className="ml-2" />
                            יבוא מ-Excel
                        </Button>
                        <Button
                            onClick={() => {
                                setEditingLead(null);
                                resetForm();
                                setShowModal(true);
                            }}
                            variant="primary"
                            className="text-[11px] font-black px-4 rounded-xl">
                            <Plus size={14} className="ml-2" />
                            הוסף ליד
                        </Button>
                        <Button
                            onClick={() => toast.info("מערכת ניהול הקמפיינים בבנייה")}
                            variant="blue"
                            className="text-[11px] font-black px-4 rounded-xl">
                            <Megaphone size={14} className="ml-2" />
                            ניהול קמפיינים
                        </Button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-amber-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">סה"כ לידים</p>
                                <p className="text-2xl font-black text-amber-400">{stats.total}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                📋
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-blue-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">חדשים</p>
                                <p className="text-2xl font-black text-blue-400">{stats.newLeads}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                ✨
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">נוצר קשר</p>
                                <p className="text-2xl font-black text-purple-400">{stats.contacted}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                📞
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium">מוכשרים</p>
                                <p className="text-2xl font-black text-emerald-400">{stats.qualified}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                🎯
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-4 glass-card p-3 rounded-2xl border border-amber-500/20">
                    <select className="glass-card border border-amber-500/20 text-xs font-black text-amber-200 px-4 py-2 rounded-xl outline-none cursor-pointer bg-slate-800/50">
                        <option value="">כל הסטטוסים</option>
                        <option value="new">חדש</option>
                        <option value="contacted">נוצר קשר</option>
                        <option value="qualified">מוכשר</option>
                        <option value="proposal">הצעה</option>
                        <option value="negotiation">משא ומתן</option>
                        <option value="won">נסגר</option>
                        <option value="lost">אבוד</option>
                    </select>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="חפש ליד לפי שם, טלפון או מקור..."
                            className="w-full glass-card border border-amber-500/20 text-xs font-bold px-10 py-2 rounded-xl outline-none text-slate-200 placeholder-slate-500 focus:border-amber-500/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 text-xs">🔍</span>
                    </div>
                </div>

                {/* Leads Table */}
                <Card className="p-0 border-amber-500/20 overflow-hidden rounded-[2rem] min-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw size={40} className="animate-spin text-amber-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700/50 bg-slate-800/50 text-amber-400/70 text-[10px] font-black uppercase tracking-[0.15em]">
                                        <th className="px-8 py-6">שם הליד</th>
                                        <th className="px-6 py-6">מקור</th>
                                        <th className="px-6 py-6">פרטי קשר</th>
                                        <th className="px-6 py-6">סטטוס</th>
                                        <th className="px-6 py-6 text-center">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center p-10 text-slate-500">
                                                {leads.length === 0 ? "אין לידים במערכת. הוסף ליד חדש!" : "לא נמצאו לידים תואמים"}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const fullName = `${lead.firstName} ${lead.lastName}`.trim();
                                            const statusStyle = getStatusStyle(lead.status);
                                            return (
                                                <tr key={lead.id} className="hover:bg-amber-500/5 group transition-all">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-amber-500/30 shadow-lg flex items-center justify-center font-black text-amber-300 text-xs">
                                                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                                                            </div>
                                                            <div className="font-bold text-slate-200 group-hover:text-amber-200 transition-colors">
                                                                {fullName || 'לא ידוע'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <Badge variant="blue" className="text-[10px] font-black px-3 py-1 rounded-lg">
                                                            {lead.source || "לא ידוע"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs font-display font-bold text-slate-300 tracking-tight text-right" dir="ltr">{lead.phone}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">{lead.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span
                                                            className="inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg"
                                                            style={{
                                                                backgroundColor: statusStyle.bg,
                                                                color: statusStyle.text
                                                            }}
                                                        >
                                                            {statusStyle.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openEditModal(lead)}
                                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                                                                title="עריכה">
                                                                <Edit3 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => convertToClient(lead)}
                                                                className="h-8 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[10px] font-black hover:from-emerald-500 hover:to-emerald-400 transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-1"
                                                                title="המר ללקוח">
                                                                <UserCheck size={12} />
                                                                המר
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLead(lead.id)}
                                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all"
                                                                title="מחק">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Add/Edit Lead Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
                        <Card className="w-full max-w-md bg-slate-900 border-amber-500/20 p-6 shadow-2xl rounded-3xl animate-in zoom-in-95">
                            <h3 className="text-xl font-black text-amber-400 mb-6">
                                {editingLead ? "✏️ עריכת ליד" : "➕ הוספת ליד חדש"}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">שם פרטי *</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newLead.firstName}
                                            onChange={e => setNewLead({ ...newLead, firstName: e.target.value })}
                                            placeholder="שם פרטי"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">שם משפחה</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newLead.lastName}
                                            onChange={e => setNewLead({ ...newLead, lastName: e.target.value })}
                                            placeholder="שם משפחה"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">טלפון *</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                        value={newLead.phone}
                                        onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                        placeholder="050-0000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">אימייל</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                        value={newLead.email}
                                        onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">סטטוס</label>
                                        <select
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newLead.status}
                                            onChange={e => setNewLead({ ...newLead, status: e.target.value as LeadStatusType })}
                                        >
                                            <option value="new">חדש</option>
                                            <option value="contacted">נוצר קשר</option>
                                            <option value="qualified">מוכשר</option>
                                            <option value="proposal">הצעה</option>
                                            <option value="negotiation">משא ומתן</option>
                                            <option value="won">נסגר</option>
                                            <option value="lost">אבוד</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">מקור</label>
                                        <select
                                            className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none"
                                            value={newLead.source}
                                            onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                                        >
                                            <option>פייסבוק</option>
                                            <option>גוגל</option>
                                            <option>המלצה</option>
                                            <option>אתר</option>
                                            <option>אחר</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400">הערות</label>
                                    <textarea
                                        className="w-full rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 focus:border-amber-500/50 outline-none resize-none"
                                        rows={3}
                                        value={newLead.notes}
                                        onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                                        placeholder="הערות נוספות..."
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button 
                                        onClick={editingLead ? handleUpdateLead : handleAddLead} 
                                        disabled={createLead.isPending || updateLead.isPending}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl">
                                        {(createLead.isPending || updateLead.isPending) ? "שומר..." : (editingLead ? "עדכן ליד" : "שמור ליד")}
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingLead(null);
                                            resetForm();
                                        }} 
                                        variant="outline" 
                                        className="flex-1 rounded-xl border-slate-600 text-slate-300">
                                        ביטול
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Import Modal */}
                {showImportModal && (
                    <ImportLeadsModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            refetch();
                            setShowImportModal(false);
                        }}
                    />
                )}
            </div>
        </DashboardShell>
    );
}
