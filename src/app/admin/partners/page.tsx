"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { useState, useEffect } from "react";
import { Plus, Search, Phone, Mail, Edit2, Trash2, X } from "lucide-react";

interface Partner {
    id: number;
    name: string;
    logo: string;
    category: string;
    status: string;
    policies: number;
    revenue: string;
    commission: string;
    contact: {
        name: string;
        phone: string;
        email: string;
    };
}

export default function PartnersPage() {
    const [selectedCategory, setSelectedCategory] = useState("הכל");
    const [searchQuery, setSearchQuery] = useState("");
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);

    // Initial Data
    useEffect(() => {
        const savedPartners = localStorage.getItem("crm_partners");
        if (savedPartners) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPartners(JSON.parse(savedPartners));
        } else {
            const initialPartners = [
                {
                    id: 1,
                    name: "הראל חברה לביטוח",
                    logo: "🏢",
                    category: "חברת ביטוח",
                    status: "פעיל",
                    policies: 245,
                    revenue: "₪1.2M",
                    commission: "12%",
                    contact: { name: "יוסי כהן", phone: "03-1234567", email: "yossi@harel.co.il" }
                },
                {
                    id: 2,
                    name: "הפניקס",
                    logo: "🔥",
                    category: "חברת ביטוח",
                    status: "פעיל",
                    policies: 189,
                    revenue: "₪980K",
                    commission: "11.5%",
                    contact: { name: "שרה לוי", phone: "03-7654321", email: "sara@fnx.co.il" }
                },
                {
                    id: 3,
                    name: "מנורה מבטחים",
                    logo: "💡",
                    category: "חברת ביטוח",
                    status: "פעיל",
                    policies: 156,
                    revenue: "₪750K",
                    commission: "10%",
                    contact: { name: "דוד מזרחי", phone: "03-9876543", email: "david@menora.co.il" }
                },
                {
                    id: 6,
                    name: "סוכנות שותפה - צפון",
                    logo: "🤝",
                    category: "סוכנות שותפה",
                    status: "פעיל",
                    policies: 45,
                    revenue: "₪180K",
                    commission: "5%",
                    contact: { name: "אבי כהן", phone: "04-1112233", email: "avi@north-agency.co.il" }
                }
            ];
            setPartners(initialPartners);
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (partners.length > 0) {
            localStorage.setItem("crm_partners", JSON.stringify(partners));
        }
    }, [partners]);

    const categories = ["הכל", "חברת ביטוח", "סוכנות שותפה", "ספק שירותים"];

    const filteredPartners = partners.filter(partner => {
        const matchesCategory = selectedCategory === "הכל" || partner.category === selectedCategory;
        const matchesSearch = partner.name.includes(searchQuery) || partner.contact.name.includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    const stats = {
        total: partners.length,
        insurance: partners.filter(p => p.category === "חברת ביטוח").length,
        agencies: partners.filter(p => p.category === "סוכנות שותפה").length,
        totalRevenue: partners.reduce((sum, p) => sum + parseFloat(p.revenue.replace(/[₪,KM]/g, '')) * (p.revenue.includes('M') ? 1000 : 1), 0)
    };

    const handleSavePartner = () => {
        if (!editingPartner?.name) return;

        if (editingPartner.id) {
            // Update
            setPartners(partners.map(p => p.id === editingPartner.id ? { ...p, ...editingPartner } as Partner : p));
        } else {
            // Create
            const newPartner = {
                ...editingPartner,
                id: Date.now(),
                policies: 0,
                revenue: "₪0",
                status: "פעיל"
            } as Partner;
            setPartners([...partners, newPartner]);
        }
        setIsEditModalOpen(false);
        setEditingPartner(null);
    };

    const handleDeletePartner = (id: number) => {
        if (confirm("האם למחוק שותף זה?")) {
            setPartners(partners.filter(p => p.id !== id));
        }
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700 pb-20" dir="rtl">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">שותפים עסקיים</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                ניהול קשרים עם חברות ביטוח, סוכנויות שותפות, וספקי שירותים
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingPartner({ name: "", category: "חברת ביטוח", commission: "10%", logo: "🏢", contact: { name: "", phone: "", email: "" } });
                                setIsEditModalOpen(true);
                            }}
                            variant="glass"
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white px-8 py-4 h-auto text-lg gap-2"
                        >
                            <Plus size={20} />
                            שותף חדש
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך שותפים", value: stats.total, icon: "🤝", color: "from-blue-600 to-indigo-700" },
                        { label: "חברות ביטוח", value: stats.insurance, icon: "🏢", color: "from-emerald-600 to-teal-700" },
                        { label: "סוכנויות", value: stats.agencies, icon: "💼", color: "from-purple-600 to-indigo-700" },
                        { label: "הכנסות שנתיות", value: `₪${stats.totalRevenue.toFixed(1)}M`, icon: "💰", color: "from-amber-500 to-orange-600" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-3xl md:text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Filters & Search */}
                <Card className="border-none shadow-lg bg-white p-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-none">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === category
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-auto min-w-[300px]">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="חיפוש לפי שם שותף או איש קשר..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border-none rounded-xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </Card>

                {/* Partners List */}
                <div className="grid gap-6">
                    {filteredPartners.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-black text-slate-400">לא נמצאו שותפים</h3>
                        </div>
                    ) : (
                        filteredPartners.map((partner) => (
                            <Card key={partner.id} className="border-none shadow-xl bg-white hover:shadow-2xl transition-all group overflow-hidden">
                                <div className="p-8 relative">
                                    {/* Action Buttons (Absolute) */}
                                    <div className="absolute top-8 left-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingPartner(partner); setIsEditModalOpen(true); }} className="p-2 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeletePartner(partner.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
                                        {/* Logo & Name */}
                                        <div className="flex items-center gap-6 w-full lg:w-auto">
                                            <div className="h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-4xl shadow-lg group-hover:scale-110 transition-transform">
                                                {partner.logo}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-primary">{partner.name}</h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                                                        {partner.category}
                                                    </Badge>
                                                    <Badge className="bg-success/10 text-success border-success/20">
                                                        {partner.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full lg:w-auto flex-1 max-w-3xl bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            <div className="space-y-1 text-center sm:text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פוליסות</p>
                                                <p className="text-2xl font-black text-primary">{partner.policies}</p>
                                            </div>
                                            <div className="space-y-1 text-center sm:text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">הכנסות</p>
                                                <p className="text-2xl font-black text-primary">{partner.revenue}</p>
                                            </div>
                                            <div className="space-y-1 text-center sm:text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">עמלה</p>
                                                <p className="text-2xl font-black text-primary text-emerald-600">{partner.commission}</p>
                                            </div>
                                            <div className="space-y-1 text-center sm:text-right border-r border-slate-200 pr-6 mr-6 hidden sm:block">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">איש קשר</p>
                                                <p className="text-sm font-bold text-primary truncate max-w-[100px]">{partner.contact.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <a href={`tel:${partner.contact.phone}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><Phone size={14} /></a>
                                                    <a href={`mailto:${partner.contact.email}`} className="text-slate-400 hover:text-indigo-600 transition-colors"><Mail size={14} /></a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Edit/Create Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-3xl font-black text-slate-900 font-display mb-8">
                                {editingPartner?.id ? "עריכת פרטי שותף" : "הוספת שותף חדש"}
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest border-b pb-2">פרטים כלליים</h4>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">שם השותף</label>
                                        <input
                                            type="text"
                                            placeholder="לדוגמה: הראל חברה לביטוח"
                                            value={editingPartner?.name || ""}
                                            onChange={(e) => setEditingPartner(prev => ({ ...prev!, name: e.target.value }))}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">קטגוריה</label>
                                            <select
                                                value={editingPartner?.category || "חברת ביטוח"}
                                                onChange={(e) => setEditingPartner(prev => ({ ...prev!, category: e.target.value }))}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                {categories.filter(c => c !== "הכל").map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">עמלה %</label>
                                            <input
                                                type="text"
                                                placeholder="10%"
                                                value={editingPartner?.commission || ""}
                                                onChange={(e) => setEditingPartner(prev => ({ ...prev!, commission: e.target.value }))}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">אייקון / לוגו (אימוג'י)</label>
                                        <div className="flex gap-2">
                                            {["🏢", "🔥", "💡", "🏰", "🛡️", "🤝", "⚖️", "👨‍🏫"].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setEditingPartner(prev => ({ ...prev!, logo: emoji }))}
                                                    className={`h-10 w-10 text-xl rounded-xl flex items-center justify-center transition-all ${editingPartner?.logo === emoji ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100'}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest border-b pb-2">איש קשר ראשי</h4>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">שם מלא</label>
                                        <input
                                            type="text"
                                            placeholder="ישראל ישראלי"
                                            value={editingPartner?.contact?.name || ""}
                                            onChange={(e) => setEditingPartner(prev => ({ ...prev!, contact: { ...prev!.contact!, name: e.target.value } }))}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">טלפון</label>
                                        <input
                                            type="tel"
                                            placeholder="050-0000000"
                                            value={editingPartner?.contact?.phone || ""}
                                            onChange={(e) => setEditingPartner(prev => ({ ...prev!, contact: { ...prev!.contact!, phone: e.target.value } }))}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">אימייל</label>
                                        <input
                                            type="email"
                                            placeholder="email@company.com"
                                            value={editingPartner?.contact?.email || ""}
                                            onChange={(e) => setEditingPartner(prev => ({ ...prev!, contact: { ...prev!.contact!, email: e.target.value } }))}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10 pt-6 border-t border-slate-100">
                                <Button onClick={() => setIsEditModalOpen(false)} variant="ghost" className="flex-1">ביטול</Button>
                                <Button onClick={handleSavePartner} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 py-4 h-auto text-lg">
                                    {editingPartner?.id ? "שמור שינויים" : "צור שותף חדש"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}

