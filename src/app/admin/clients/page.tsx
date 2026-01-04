"use client";

import { type QueryDocumentSnapshot } from "firebase/firestore";
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
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

                {/* Header */}
                <div className="glass-card bg-gradient-to-r from-blue-900/50 via-slate-900/50 to-amber-900/50 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-amber-500/20 neon-gold">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4 text-gradient-gold neon-text-gold">ניהול לקוחות</h1>
                            <p className="text-sm font-medium text-slate-400">כל התיקים והמבוטחים במקום אחד</p>
                        </div>
                        <Link href="/admin/clients/new">
                            <Button variant="gold" className="font-black shadow-lg border-none gap-2">
                                <UserPlus size={18} /> לקוח חדש
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search */}
                <Card className="border-amber-500/20 p-6">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
                        <input
                            type="text"
                            placeholder="חפש לקוח לפי שם, ת.ז או אימייל..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-6 pr-12 py-4 rounded-2xl glass-card border border-amber-500/20 font-bold text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 placeholder-slate-500"
                        />
                    </div>
                </Card>

                {/* List */}
                <Card className="border-amber-500/20 overflow-hidden min-h-[400px] p-0">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-amber-500" size={32} />
                            <span>טוען נתונים...</span>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-800/50">
                                        <tr className="border-b border-slate-700/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">שם מלא</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">ת.ז</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">סטטוס</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-amber-400/70 uppercase tracking-widest">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredClients.map((client) => (
                                            <tr key={client.id} className="hover:bg-amber-500/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-slate-200">{client.name}</div>
                                                    <div className="text-xs text-slate-500">{client.email} | {client.phone}</div>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-slate-400">{client.nationalId}</td>
                                                <td className="px-6 py-5">
                                                    <Badge variant={client.status === 'active' ? 'success' : 'outline'}>
                                                        {client.status === 'active' ? 'פעיל' : client.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/admin/clients/${client.id}`}>
                                                        <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400"><Edit2 size={14} /></Button>
                                                    </Link>
                                                    <Button size="sm" variant="outline" className="text-red-400 hover:bg-red-500/10 border-red-500/30" onClick={() => handleDelete(client.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
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
                </Card>

            </div>
        </DashboardShell>
    );
}
