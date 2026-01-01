"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { toast } from "sonner";
import ImportLeadsModal from "@/components/leads/ImportLeadsModal";
import type { LeadStatus } from "@/types/statuses";

interface Lead {
    id: number;
    name: string;
    phone: string;
    email: string;
    source: string;
    status: string; // This corresponds to status.name or status.id
    statusId?: string; // Ideally we track ID, but for now we might match by name
    date: string;
    interest: string;
}

const INITIAL_LEADS: Lead[] = [
    { id: 1, name: "יוסי כהן", phone: "050-1234567", email: "yosi@gmail.com", source: "פייסבוק", status: "חדש", date: "22/12/2023", interest: "פנסיה" },
    { id: 2, name: "דניאל מזרחי", phone: "052-7654321", email: "daniel@gmail.com", source: "אתר", status: "מעוניין", date: "21/12/2023", interest: "בריאות" },
    { id: 3, name: "רחל לוי", phone: "054-9988776", email: "rachel@gmail.com", source: "המלצה", status: "נקבעה פגישה", date: "20/12/2023", interest: "משכנתא" },
    { id: 4, name: "איתי גל", phone: "053-1122334", email: "itay@gmail.com", source: "גוגל", status: "חדש", date: "19/12/2023", interest: "חיסכון" },
];

export default function LeadsPage() {
    const [search, setSearch] = useState("");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [statuses, setStatuses] = useState<LeadStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);


    // New Lead Form State
    const [newLead, setNewLead] = useState<Partial<Lead>>({
        name: "", phone: "", email: "", source: "פייסבוק", status: "", interest: "כללי"
    });

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Load Statuses from Firestore
            const fetchedStatuses = await firestoreService.getLeadStatuses();
            // Sort by order
            const sortedStatuses = (fetchedStatuses as LeadStatus[]).sort((a, b) => a.orderIndex - b.orderIndex);
            setStatuses(sortedStatuses);

            // Set default status for new lead form
            if (sortedStatuses.length > 0) {
                setNewLead(prev => ({ ...prev, status: sortedStatuses[0].name }));
            }

            // 2. Load Leads (Local storage for demo + real implementation would be Firestore)
            const stored = localStorage.getItem("leads_data");
            if (stored) {
                setLeads(JSON.parse(stored));
            } else {
                setLeads(INITIAL_LEADS);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save Data
    useEffect(() => {
        if (!isLoading && leads.length > 0) {
            localStorage.setItem("leads_data", JSON.stringify(leads));
        }
    }, [leads, isLoading]);

    const handleAddLead = () => {
        if (!newLead.name || !newLead.phone) return;

        const leadToAdd: Lead = {
            id: Date.now(),
            name: newLead.name!,
            phone: newLead.phone!,
            email: newLead.email || "",
            source: newLead.source || "ישיר",
            status: newLead.status || (statuses[0]?.name || "חדש"),
            interest: newLead.interest || "כללי",
            date: new Date().toLocaleDateString("he-IL")
        };

        setLeads(prev => [leadToAdd, ...prev]);
        setShowModal(false);
        setNewLead({
            name: "",
            phone: "",
            email: "",
            source: "פייסבוק",
            status: statuses[0]?.name || "חדש",
            interest: "כללי"
        });
    };

    const convertToClient = (lead: Lead) => {
        if (!confirm(`האם להפוך את הליד ${lead.name} ללקוח פעיל?`)) return;

        // 1. Create Client Object
        const newClient = {
            id: lead.phone.replace(/\D/g, "") || String(Date.now()), // Use phone as ID if valid, else timestamp
            firstName: lead.name.split(" ")[0] || "",
            lastName: lead.name.split(" ").slice(1).join(" ") || "",
            email: lead.email,
            phone: lead.phone,
            status: "active",
            address: "",
            city: "",
            birthDate: "",
            familyStatus: "",
            occupation: "",
            employer: "",
            leadSource: lead.source,
            joinDate: new Date().toISOString().split('T')[0],
            family: [],
            policies: [],
            tasks: [],
            pensionSales: [],
            insuranceSales: [],
            files: []
        };

        // Save client
        localStorage.setItem(`client_${newClient.id}`, JSON.stringify(newClient));

        // Remove from leads
        const updatedLeads = leads.filter(l => l.id !== lead.id);
        setLeads(updatedLeads);
        localStorage.setItem('leads_data', JSON.stringify(updatedLeads));

        // Trigger Email
        // Email trigger can be wired here if/when needed.
    };

    const deleteLead = (id: number) => {
        if (confirm("האם למחוק ליד זה?")) {
            setLeads(prev => prev.filter(l => l.id !== id));
        }
    };

    const filteredLeads = leads.filter(l =>
        l.name.includes(search) || l.phone.includes(search) || l.source.includes(search)
    );

    const getStatusStyle = (statusName: string) => {
        const found = statuses.find(s => s.name === statusName);
        if (found) {
            return {
                backgroundColor: `${found.color}20`, // 20% opacity
                color: found.color,
                borderColor: `${found.color}40`,
            };
        }
        return {
            backgroundColor: '#f1f5f9', // slate-100
            color: '#475569', // slate-600
        };
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6 animate-in fade-in duration-700" dir="rtl">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gradient-gold font-display tracking-tight italic neon-text-gold">ניהול לידים וקמפיינים</h2>
                        <p className="text-slate-500 font-medium">נהל את הלידים הנכנסים ויבא נתונים ממקורות חיצוניים</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="text-[11px] font-black px-4 rounded-xl"
                            onClick={() => setShowImportModal(true)}>
                            📤 יבוא מקובץ Excel
                        </Button>
                        <Button
                            onClick={() => setShowModal(true)}
                            variant="primary"
                            className="text-[11px] font-black px-4 rounded-xl">
                            ➕ הוסף ליד ידני
                        </Button>
                        <Button
                            onClick={() => toast.info("מערכת ניהול הקמפיינים בבנייה")}
                            variant="blue"
                            className="text-[11px] font-black px-4 rounded-xl">
                            🏗️ ניהול קמפיינים
                        </Button>
                    </div>
                </header>

                <div className="flex items-center gap-4 glass-card p-3 rounded-2xl border border-amber-500/20">
                    <select className="glass-card border border-amber-500/20 text-xs font-black text-amber-200 px-4 py-2 rounded-xl outline-none cursor-pointer bg-slate-800/50">
                        <option>כל הקמפיינים</option>
                        <option>פייסבוק - נובמבר</option>
                        <option>גוגל - דצמבר</option>
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

                <Card className="p-0 border-amber-500/20 overflow-hidden rounded-[2rem] min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-800/50 text-amber-400/70 text-[10px] font-black uppercase tracking-[0.15em]">
                                    <th className="px-8 py-6">שם הליד</th>
                                    <th className="px-6 py-6">קמפיין / מקור</th>
                                    <th className="px-6 py-6">פרטי קשר</th>
                                    <th className="px-6 py-6">מוצר עדיף</th>
                                    <th className="px-6 py-6">סטטוס</th>
                                    <th className="px-6 py-6 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredLeads.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center p-10 text-slate-500">לא נמצאו לידים</td></tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-amber-500/5 group transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-amber-500/30 shadow-lg flex items-center justify-center font-black text-amber-300 text-xs">
                                                        {lead.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="font-bold text-slate-200 group-hover:text-amber-200 transition-colors">
                                                        {lead.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <Badge variant="blue" className="text-[10px] font-black px-3 py-1 rounded-lg">
                                                    {lead.source}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-display font-bold text-slate-300 tracking-tight text-right" dir="ltr">{lead.phone}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium">{lead.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-slate-400 text-xs italic">
                                                {lead.interest}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span
                                                    className="inline-flex items-center whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg"
                                                    style={getStatusStyle(lead.status)}
                                                >
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => convertToClient(lead)}
                                                        className="h-8 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-[10px] font-black hover:from-emerald-500 hover:to-emerald-400 transition-colors shadow-lg shadow-emerald-500/30"
                                                        title="הפוך ללקוח">
                                                        המר ללקוח 🔄
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLead(lead.id)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Add Lead Monitor */}
                {
                    showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 text-right" dir="rtl">
                            <Card className="w-full max-w-md bg-white p-6 shadow-2xl rounded-3xl animate-in zoom-in-95">
                                <h3 className="text-xl font-black text-primary mb-6">➕ הוספת ליד חדש</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500">שם מלא</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                            value={newLead.name}
                                            onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500">טלפון</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                            value={newLead.phone}
                                            onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500">אימייל</label>
                                        <input
                                            type="email"
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                            value={newLead.email}
                                            onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500">סטטוס</label>
                                        <select
                                            className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                            value={newLead.status}
                                            onChange={e => setNewLead({ ...newLead, status: e.target.value })}
                                        >
                                            {statuses.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">מקור</label>
                                            <select
                                                className="w-full rounded-xl border-slate-200 text-sm font-bold"
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
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">מוצר מתעניין</label>
                                            <select
                                                className="w-full rounded-xl border-slate-200 text-sm font-bold"
                                                value={newLead.interest}
                                                onChange={e => setNewLead({ ...newLead, interest: e.target.value })}
                                            >
                                                <option>פנסיה</option>
                                                <option>ביטוח חיים</option>
                                                <option>ביטוח בריאות</option>
                                                <option>חסכון / השתלמות</option>
                                                <option>משכנתא</option>
                                                <option>כללי</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <Button onClick={handleAddLead} className="flex-1 bg-primary text-white font-black rounded-xl">שמור ליד</Button>
                                        <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1 rounded-xl">ביטול</Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )
                }
                {showImportModal && (
                    <ImportLeadsModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            loadData(); // Reload leads after import
                            setShowImportModal(false);
                        }}
                    />
                )}
            </div >
        </DashboardShell >
    );
}
