"use client";

import { Sparkles } from "lucide-react";
import FocusFeed from "@/components/admin/agent-companion/FocusFeed";
import SmartAlerts from "@/components/admin/agent-companion/SmartAlerts";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

export default function AgentCompanionPage() {
    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6 animate-in fade-in duration-700 min-h-screen p-6 mesh-gradient bg-[#050810]" dir="rtl">

                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white font-display tracking-tight italic">
                            סוכן חכם <span className="text-indigo-400 font-bold">(AI Companion)</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-bold opacity-90 italic">מערכת תומכת החלטה בזמן אמת</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Focus Feed (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <FocusFeed />
                    </div>

                    {/* Right Column: Widgets (1/3) */}
                    <div className="space-y-6">
                        <SmartAlerts />
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
