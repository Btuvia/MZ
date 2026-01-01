"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClientsListPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        const loadClients = async () => {
            const data = await firestoreService.getClients();
            setClients(data);
            setLoading(false);
        };
        loadClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.idNumber?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm("האם למחוק לקוח זה?")) {
            await firestoreService.deleteClient(id);
            setClients(clients.filter(c => c.id !== id));
        }
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">ניהול לקוחות</h1>
                            <p className="text-sm font-medium text-white/80">כל התיקים והמבוטחים במקום אחד</p>
                        </div>
                        <Link href="/admin/clients/new">
                            <Button className="bg-white !text-indigo-600 hover:bg-indigo-50 font-black shadow-lg border-none gap-2">
                                <UserPlus size={18} /> לקוח חדש
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="חפש לקוח לפי שם, ת.ז או אימייל..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </Card>

                {/* List */}
                <Card className="border-none shadow-xl bg-white overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">טוען נתונים...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">שם מלא</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ת.ז</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-black text-primary">{client.name}</div>
                                                <div className="text-xs text-slate-400">{client.email} | {client.phone}</div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-slate-600">{client.idNumber}</td>
                                            <td className="px-6 py-5">
                                                <Badge className={client.status === 'פעיל' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}>
                                                    {client.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/clients/${client.id}`}>
                                                    <Button size="sm" variant="outline"><Edit2 size={14} /></Button>
                                                </Link>
                                                <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-100" onClick={() => handleDelete(client.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-slate-400 italic">לא נמצאו לקוחות</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

            </div>
        </DashboardShell>
    );
}
