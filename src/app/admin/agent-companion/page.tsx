"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import DailyBriefing from "@/components/admin/agent-companion/DailyBriefing";
import FocusFeed from "@/components/admin/agent-companion/FocusFeed";
import SmartAlerts from "@/components/admin/agent-companion/SmartAlerts";
import DataChat from "@/components/admin/agent-companion/DataChat";
import { Sparkles } from "lucide-react";

export default function AgentCompanionPage() {
    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6 animate-in fade-in duration-700 bg-slate-50 min-h-screen -m-6 p-6" dir="rtl">

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-display">
                            סוכן חכם (AI Companion)
                        </h1>
                        <p className="text-slate-500 text-sm font-bold opacity-80">מערכת תומכת החלטה בזמן אמת</p>
                    </div>
                </div>

                {/* Top Section: Briefing */}
                <DailyBriefing />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Focus Feed (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        <FocusFeed />
                    </div>

                    {/* Right Column: Widgets (1/3) */}
                    <div className="space-y-6">
                        <SmartAlerts />
                        <DataChat />
                    </div>
                </div>

            </div>
        </DashboardShell>
    );
}
