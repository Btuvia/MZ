"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useState } from "react";
import Link from "next/link";
import { ClientQuickActions } from "@/components/clients/ClientQuickActions";

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("הכל");
    const [sortBy, setSortBy] = useState("שם");

    const clients = [
        { id: 1, name: "שרה אולט בסמוט", idNumber: "329919617", phone: "0534261094", email: "sarabismot@gmail.com", status: "פעיל", policies: 2, totalPremium: "₪350", lastContact: "2024-02-10", avatar: "SA" },
        { id: 2, name: "אברהם כהן", idNumber: "123456789", phone: "052-1234567", email: "avraham@example.com", status: "פעיל", policies: 3, totalPremium: "₪520", lastContact: "2024-02-15", avatar: "AK" },
        { id: 3, name: "רחל לוי", idNumber: "987654321", phone: "050-9876543", email: "rachel@example.com", status: "לא פעיל", policies: 1, totalPremium: "₪180", lastContact: "2023-12-20", avatar: "RL" },
        { id: 4, name: "יוסף מזרחי", idNumber: "456789123", phone: "053-4567891", email: "yosef@example.com", status: "פעיל", policies: 4, totalPremium: "₪680", lastContact: "2024-02-18", avatar: "YM" },
        { id: 5, name: "מרים דוד", idNumber: "789123456", phone: "054-7891234", email: "miriam@example.com", status: "פעיל", policies: 2, totalPremium: "₪420", lastContact: "2024-02-12", avatar: "MD" },
        { id: 6, name: "דוד ישראלי", idNumber: "321654987", phone: "052-3216549", email: "david@example.com", status: "ממתין", policies: 0, totalPremium: "₪0", lastContact: "2024-02-01", avatar: "DY" },
    ];

    const filteredClients = clients
        .filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.phone.includes(searchQuery) ||
                client.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterStatus === "הכל" || client.status === filterStatus;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === "שם") return a.name.localeCompare(b.name);
            if (sortBy === "תאריך") return new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime();
            if (sortBy === "פרמיה") return parseFloat(b.totalPremium.replace(/[₪,]/g, '')) - parseFloat(a.totalPremium.replace(/[₪,]/g, ''));
            return 0;
        });

    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === "פעיל").length,
        inactive: clients.filter(c => c.status === "לא פעיל").length,
        pending: clients.filter(c => c.status === "ממתין").length,
    };

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">הלקוחות שלי</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                ניהול מלא של תיקי הלקוחות שלך. מעקב אחר פוליסות, תקשורת ומשימות.
                            </p>
                        </div>
                        <Button variant="glass" className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
                            + לקוח חדש
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך לקוחות", value: stats.total, icon: "👥", color: "from-blue-600 to-indigo-700" },
                        { label: "לקוחות פעילים", value: stats.active, icon: "✅", color: "from-success to-emerald-600" },
                        { label: "לא פעילים", value: stats.inactive, icon: "⏸️", color: "from-slate-500 to-slate-700" },
                        { label: "ממתינים", value: stats.pending, icon: "⏳", color: "from-amber-500 to-orange-600" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-linear-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Search and Filters */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="חפש לקוח לפי שם, טלפון או אימייל..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                                <option>הכל</option>
                                <option>פעיל</option>
                                <option>לא פעיל</option>
                                <option>ממתין</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                            >
                                <option>שם</option>
                                <option>תאריך</option>
                                <option>פרמיה</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Clients Table */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">לקוח</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פרטי התקשרות</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פוליסות</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פרמיה חודשית</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">קשר אחרון</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-accent to-blue-700 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-110 transition-transform">
                                                    {client.avatar}
                                                </div>
                                                <div>
                                                    <p className="font-black text-primary">{client.name}</p>
                                                    <p className="text-xs font-bold text-slate-400">{client.idNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-600">{client.phone}</p>
                                                <p className="text-xs font-medium text-slate-400">{client.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={
                                                client.status === "פעיל" ? "bg-success/10 text-success border-success/20" :
                                                    client.status === "ממתין" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                        "bg-slate-100 text-slate-600 border-slate-200"
                                            }>
                                                {client.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-primary">{client.policies}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-bold text-primary">{client.totalPremium}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-slate-400">{client.lastContact}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-4">
                                                <ClientQuickActions 
                                                    clientId={client.id}
                                                    clientName={client.name}
                                                    phone={client.phone}
                                                    email={client.email}
                                                />
                                                <Link href={`/admin/clients/${client.id}`}>
                                                    <Button variant="secondary" size="sm" className="px-4 rounded-xl font-bold">
                                                        פתח תיק
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
