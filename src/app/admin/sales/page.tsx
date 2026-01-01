"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card } from "@/components/ui/base";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { LeadStatus } from "@/types/statuses";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

interface Lead {
    id: number;
    name: string;
    phone: string;
    email: string;
    source: string;
    status: string; // Will store name for now
    date: string;
    interest: string;
}

export default function SalesKanbanPage() {
    const navItems = ADMIN_NAV_ITEMS;

    const [leads, setLeads] = useState<Lead[]>([]);
    const [statuses, setStatuses] = useState<LeadStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Load Statuses
            const fetchedStatuses = await firestoreService.getLeadStatuses();
            const sortedStatuses = (fetchedStatuses as LeadStatus[]).sort((a, b) => a.orderIndex - b.orderIndex);
            setStatuses(sortedStatuses);

            // 2. Load Leads
            const stored = localStorage.getItem("leads_data");
            if (stored) {
                setLeads(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load kanban data", error);
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

    const moveStage = (leadId: number, direction: 'next' | 'prev') => {
        setLeads(prev => prev.map(lead => {
            if (lead.id !== leadId) return lead;

            const currentIndex = statuses.findIndex(c => c.name === lead.status);
            if (currentIndex === -1) return lead;

            let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

            // Bounds check
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= statuses.length) newIndex = statuses.length - 1;

            return { ...lead, status: statuses[newIndex].name };
        }));
    };

    return (
        <DashboardShell role="מנהל" navItems={navItems as any}>
            <div className="space-y-8 h-full flex flex-col overflow-hidden" dir="rtl">
                <header className="flex items-center justify-between shrink-0">
                    <h2 className="text-2xl font-black text-primary italic underline decoration-accent decoration-4">Pipeline מכירות</h2>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white rounded-xl border border-border text-sm font-bold text-primary shadow-sm hover:bg-slate-50">דו"ח סגירות</button>
                        <button className="px-4 py-2 bg-accent rounded-xl text-sm font-bold text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]">+ עסקה חדשה</button>
                    </div>
                </header>

                <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin">
                    <div className="flex gap-6 h-full min-w-max">
                        {statuses.map((status, i) => {
                            const columnLeads = leads.filter(l => l.status === status.name);

                            return (
                                <div key={status.id} className="w-80 flex flex-col gap-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="font-black text-primary text-sm tracking-tight">{status.nameHe || status.name} ({columnLeads.length})</h3>
                                        <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: status.color }}
                                        ></div>
                                    </div>

                                    <div className="flex-1 bg-slate-100/50 rounded-2xl p-4 space-y-4 border border-slate-200/50 border-dashed min-h-[500px]">
                                        {columnLeads.map((lead) => (
                                            <Card
                                                key={lead.id}
                                                className="p-5 shadow-sm hover:shadow-md transition-shadow cursor-grab group bg-white border-l-4"
                                                style={{ borderLeftColor: status.color }}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-black text-accent uppercase bg-accent/5 px-2 py-0.5 rounded-full tracking-widest">{lead.interest}</span>
                                                    <div className="text-[10px] text-slate-400">{lead.date}</div>
                                                </div>
                                                <h4 className="font-black text-primary text-lg leading-tight group-hover:text-accent transition-colors">{lead.name}</h4>
                                                <div className="mt-1 text-xs text-slate-500">{lead.phone}</div>

                                                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => moveStage(lead.id, 'prev')}
                                                        disabled={i === 0}
                                                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                                                        ➡️
                                                    </button>
                                                    <button
                                                        onClick={() => moveStage(lead.id, 'next')}
                                                        disabled={i === statuses.length - 1}
                                                        className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center disabled:opacity-30">
                                                        ⬅️
                                                    </button>
                                                </div>
                                            </Card>
                                        ))}

                                        {columnLeads.length === 0 && (
                                            <div className="text-center py-10 text-slate-300 text-xs font-medium italic">אין לידים בשלב זה</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
