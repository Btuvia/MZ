"use client";

import { type QueryDocumentSnapshot } from "firebase/firestore";
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
import { NeonCard, NeonButton, NeonInput } from "@/components/ui/neon-form";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { handleError, showSuccess } from "@/lib/error-handler";
import { firestoreService, PaginatedResult } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { type Client } from "@/types";

export default function ClientsListPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const router = useRouter();

    const pagination = usePagination({ initialPageSize: 25 });

    // Load total count once
    useEffect(() => {
        const loadCount = async () => {
            try {
                const count = await firestoreService.getClientsCount();
                setTotalCount(count);
            } catch (error) {
                handleError(error, { context: 'ספירת לקוחות', silent: true });
            }
        };
        loadCount();
    }, []);

    // Load clients with pagination
    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            const result = await firestoreService.getClientsPaginated({
                pageSize: pagination.pageSize,
                lastDoc: pagination.currentPage === 1 ? null : pagination.lastDoc,
                orderByField: 'createdAt',
                orderDirection: 'desc'
            });
            
            setClients(result.data);
            setHasMore(result.hasMore);
            
            if (result.lastDoc) {
                pagination.setLastDoc(result.lastDoc);
            }
        } catch (error) {
            handleError(error, { context: 'טעינת לקוחות' });
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Filter clients locally (for current page)
    const filteredClients = searchTerm
        ? clients.filter(client =>
            client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.nationalId?.includes(searchTerm) ||
            client.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : clients;

    const handleDelete = async (id: string) => {
        if (confirm("האם למחוק לקוח זה?")) {
            try {
                await firestoreService.deleteClient(id);
                setClients(clients.filter(c => c.id !== id));
                setTotalCount(prev => prev - 1);
                showSuccess('הלקוח נמחק בהצלחה');
            } catch (error) {
                handleError(error, { context: 'מחיקת לקוח' });
            }
        }
    };

    const handlePageChange = (page: number) => {
        if (page > pagination.currentPage) {
            pagination.goToNextPage(pagination.lastDoc as QueryDocumentSnapshot);
        } else if (page < pagination.currentPage) {
            pagination.goToPrevPage();
        } else if (page === 1) {
            pagination.reset();
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        pagination.setPageSize(newSize);
    };

    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header - Neon Premium */}
                <div className="relative group p-10 rounded-[3rem] overflow-hidden border border-slate-800 bg-[#0d1326] shadow-2xl">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter flex items-center gap-4">
                                <span className="text-amber-500">💎</span> ניהול לקוחות
                            </h1>
                            <p className="text-slate-500 font-bold mt-3 text-lg">ניהול תיקי לקוחות בסטנדרט זהב</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/admin/clients/new">
                                <NeonButton size="lg" className="px-12! shadow-xl shadow-amber-500/20">
                                    <UserPlus size={20} className="ml-2" /> לקוח חדש
                                </NeonButton>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search & Stats Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                                <Search className="text-amber-500 group-focus-within:scale-110 transition-transform" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="חפש לקוח לפי שם, ת.ז או אימייל..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-20 pr-16 pl-8 rounded-[2rem] bg-[#0d1326] border-2 border-slate-800/80 text-white font-bold text-lg focus:border-amber-500 outline-none transition-all duration-300 shadow-2xl placeholder:text-slate-700"
                            />
                        </div>
                    </div>
                    <NeonCard className="p-6! flex items-center justify-between border-slate-800/50">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">סה"כ לקוחות</p>
                            <p className="text-3xl font-black text-white italic">{totalCount}</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-2xl shadow-inner">👥</div>
                    </NeonCard>
                </div>

                {/* Clients Table - Neon Glass */}
                <NeonCard className="p-0! border-slate-800/50 overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-amber-500" size={32} />
                            <span>טוען נתונים...</span>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/50">
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">מבוטח / לקוח</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">תעודת זהות</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">סטטוס</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-slate-800/30 transition-all group cursor-pointer" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-amber-500 shadow-lg group-hover:scale-110 transition-transform italic text-lg">
                                                            {client.name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-white group-hover:text-amber-500 transition-colors text-lg italic">{client.name}</div>
                                                            <div className="text-xs text-slate-500 font-bold">{client.email} | {client.phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 font-mono font-black text-slate-400 group-hover:text-slate-200 transition-colors text-lg">{client.nationalId}</td>
                                                <td className="px-10 py-6 text-center">
                                                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        client.status === 'active' 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                                                            : 'bg-slate-900 text-slate-500 border-slate-800'
                                                    }`}>
                                                        {client.status === 'active' ? '● פעיל' : client.status || 'לא מוגדר'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <Link href={`/admin/clients/${client.id}`} onClick={e => e.stopPropagation()}>
                                                            <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-all shadow-xl">
                                                                <Edit2 size={18} />
                                                            </button>
                                                        </Link>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                                                            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500 transition-all shadow-xl"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-slate-500 italic">לא נמצאו לקוחות</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalCount > 0 && (
                                <div className="border-t border-slate-700/50 bg-slate-800/30">
                                    <Pagination
                                        currentPage={pagination.currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalCount}
                                        pageSize={pagination.pageSize}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={handlePageSizeChange}
                                        hasMore={hasMore}
                                        loading={loading}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </NeonCard>
            </div>
        </DashboardShell>
    );
}
