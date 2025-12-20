"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card } from "@/components/ui/base";

export default function ClientPlaceholderPage({ title }: { title: string }) {
    const navItems = [
        { label: "התיק שלי (ראשי)", href: "/client/dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg> },
    ];

    return (
        <DashboardShell role="לקוח" navItems={navItems as any}>
            <Card className="p-12 text-center border-dashed border-2 border-slate-200">
                <h2 className="text-2xl font-black text-primary mb-4">{title}</h2>
                <p className="text-slate-400 font-bold italic">המידע שלך יעודכן בקרוב...</p>
            </Card>
        </DashboardShell>
    );
}
