"use client";

import { RefreshCw, Plus, Upload, Megaphone, Trash2, UserCheck, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import CampaignAutomationModal from "@/components/leads/CampaignAutomationModal";
import ImportLeadsModal from "@/components/leads/ImportLeadsModal";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonCard, NeonButton, NeonInput, NeonModal, NeonSelect, NeonTextarea } from "@/components/ui/neon-form";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useLeadStatuses } from "@/lib/hooks/useQueryHooks";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import type { Lead, LeadStatus as LeadStatusType } from "@/types";
import type { LeadStatus } from "@/types/statuses";

export default function LeadsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [showAutomationModal, setShowAutomationModal] = useState(false);

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
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header - Neon Premium */}
                <div className="relative group p-8 rounded-[2rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-white italic font-display tracking-tight flex items-center gap-3">
                                <span className="text-amber-500">⚡</span> ניהול לידים
                            </h2>
                            <p className="text-slate-500 font-bold mt-2">מעקב אחר לידים נכנסים וסנכרון קמפיינים גלובליים</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <NeonButton variant="secondary" onClick={() => refetch()} className="px-6!">
                                <RefreshCw size={16} className={`ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                                רענן
                            </NeonButton>
                            <NeonButton variant="secondary" onClick={() => setShowImportModal(true)} className="px-6!">
                                <Upload size={16} className="ml-2" />
                                יבוא מ-Excel
                            </NeonButton>
                            <NeonButton variant="primary" onClick={() => { setEditingLead(null); resetForm(); setShowModal(true); }} className="px-8!">
                                <Plus size={16} className="ml-2" />
                                הוסף ליד
                            </NeonButton>
                            <NeonButton onClick={() => setShowAutomationModal(true)} variant="secondary" className="px-8! border-blue-500/50! bg-blue-500/10! text-blue-400! hover:bg-blue-500/20!">
                                <Megaphone size={16} className="ml-2" />
                                ניהול קמפיינים
                            </NeonButton>
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Neon Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <NeonCard className="p-6! border-slate-800/50 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">סה"כ לידים</p>
                                <p className="text-3xl font-black text-white italic">{stats.total}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📋</div>
                        </div>
                    </NeonCard>
                    <NeonCard className="p-6! border-slate-800/50 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">חדשים</p>
                                <p className="text-3xl font-black text-blue-400 italic">{stats.newLeads}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
                        </div>
                    </NeonCard>
                    <NeonCard className="p-6! border-slate-800/50 hover:border-purple-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">נוצר קשר</p>
                                <p className="text-3xl font-black text-purple-400 italic">{stats.contacted}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📞</div>
                        </div>
                    </NeonCard>
                    <NeonCard className="p-6! border-slate-800/50 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">מוכשרים</p>
                                <p className="text-3xl font-black text-emerald-400 italic">{stats.qualified}</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎯</div>
                        </div>
                    </NeonCard>
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

                {/* Leads Table - Neon Style */}
                <NeonCard className="p-0! border-slate-800/50 overflow-hidden">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <RefreshCw className="animate-spin text-amber-500" size={40} />
                            <p className="text-slate-500 font-black italic">טוען לידים מהמערכת...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/50">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">שם מלא</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">פרטי התקשרות</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">מקור</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">תאריך יצירה</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">סטטוס</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredLeads.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <Megaphone size={48} className="mb-4" />
                                                    <p className="font-black italic text-lg text-slate-400">לא נמצאו לידים תואמים</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLeads.map((lead) => {
                                            const statusStyle = getStatusStyle(lead.status as LeadStatusType);
                                            return (
                                                <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-500 shadow-lg group-hover:scale-110 transition-transform italic">
                                                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                                                            </div>
                                                            <span className="font-black text-white group-hover:text-amber-500 transition-colors italic">{lead.firstName} {lead.lastName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-300">{lead.phone}</p>
                                                            <p className="text-[10px] font-black text-slate-500">{lead.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter italic">
                                                            {lead.source}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-bold text-slate-500">
                                                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('he-IL') : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span 
                                                            className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                                                            style={{ 
                                                                backgroundColor: `${statusStyle.bg}`, 
                                                                color: statusStyle.text,
                                                                borderColor: `${statusStyle.text}30`
                                                            }}
                                                        >
                                                            {statusStyle.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button 
                                                                onClick={() => openEditModal(lead)}
                                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-all"
                                                            >
                                                                <Edit3 size={16} />
                                                            </button>
                                                            <NeonButton 
                                                                onClick={() => convertToClient(lead)}
                                                                variant="primary" 
                                                                className="py-2! px-4! text-[10px]! rounded-xl!"
                                                            >
                                                                <UserCheck size={14} className="ml-1" />
                                                                המר ללקוח
                                                            </NeonButton>
                                                            <button 
                                                                onClick={() => handleDeleteLead(lead.id)}
                                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
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
                </NeonCard>

                {/* Modals */}
                <NeonModal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setEditingLead(null); resetForm(); }}
                    title={editingLead ? "עריכת ליד" : "הוספת ליד חדש"}
                    onSave={editingLead ? handleUpdateLead : handleAddLead}
                    isSaving={createLead.isPending || updateLead.isPending}
                >
                    <div className="grid grid-cols-2 gap-6">
                        <NeonInput label="שם פרטי *" value={newLead.firstName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLead({ ...newLead, firstName: e.target.value })} />
                        <NeonInput label="שם משפחה" value={newLead.lastName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLead({ ...newLead, lastName: e.target.value })} />
                    </div>
                    <NeonInput label="מספר טלפון *" value={newLead.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLead({ ...newLead, phone: e.target.value })} dir="ltr" />
                    <NeonInput label="אימייל" value={newLead.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLead({ ...newLead, email: e.target.value })} dir="ltr" />
                    <div className="grid grid-cols-2 gap-6">
                        <NeonSelect label="סטטוס" value={newLead.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewLead({ ...newLead, status: e.target.value as LeadStatusType })}>
                            <option value="new">🆕 חדש</option>
                            <option value="contacted">📞 נוצר קשר</option>
                            <option value="qualified">🎯 מוכשר</option>
                            <option value="won">✅ נסגר</option>
                            <option value="lost">❌ אבוד</option>
                        </NeonSelect>
                        <NeonSelect label="מקור הליד" value={newLead.source} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewLead({ ...newLead, source: e.target.value })}>
                            <option value="פייסבוק">🔵 פייסבוק</option>
                            <option value="גוגל">🔴 גוגל Ads</option>
                            <option value="אינסטגרם">🟣 אינסטגרם</option>
                            <option value="טיקטוק">🎵 טיקטוק</option>
                            <option value="לינקדאין">💼 לינקדאין</option>
                            <option value="אתר">🌐 אתר אינטרנט</option>
                            <option value="ישיר">📱 שיחה ישירה</option>
                            <option value="הפנייה">🤝 הפנייה</option>
                            <option value="אחר">❓ אחר</option>
                        </NeonSelect>
                    </div>
                    <NeonTextarea label="הערות" value={newLead.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewLead({ ...newLead, notes: e.target.value })} rows={4} />
                </NeonModal>

                {showImportModal ? <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onSuccess={() => { refetch(); setShowImportModal(false); }} /> : null}
                
                {showAutomationModal ? <CampaignAutomationModal isOpen={showAutomationModal} onClose={() => setShowAutomationModal(false)} /> : null}
            </div>
        </DashboardShell>
    );
}
