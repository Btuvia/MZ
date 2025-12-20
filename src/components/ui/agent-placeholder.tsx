"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card } from "@/components/ui/base";

export default function AgentPlaceholderPage({ title }: { title: string }) {
    const navItems = [
        { label: "ראשי (לוח בקרה)", href: "/agent/dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg> },
        { label: title, href: "#", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
    ];

    return (
        <DashboardShell role="סוכן" navItems={navItems as any}>
            <Card className="p-12 text-center border-dashed border-2 border-slate-200">
                <h2 className="text-2xl font-black text-primary mb-4">{title}</h2>
                <p className="text-slate-400 font-bold italic">המודול נמצא בפיתוח... הישארו מעודכנים!</p>
            </Card>
        </DashboardShell>
    );
}
