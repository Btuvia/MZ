
import { Card } from "@/components/ui/base";
import { Users, Target, Clock, AlertCircle, ArrowUpRight } from "lucide-react";

interface StatsOverviewProps {
    totalClients: number;
    activeLeads: number;
    pendingTasks: number;
    complianceAlerts: number;
}

export default function StatsOverview({ totalClients, activeLeads, pendingTasks, complianceAlerts }: StatsOverviewProps) {
    const stats = [
        { 
            label: "לקוחות פעילים", 
            value: totalClients, 
            icon: <Users size={24} />, 
            color: "from-blue-600 to-indigo-700", 
            shadow: "shadow-blue-500/20",
            trend: "+12%"
        },
        { 
            label: "לידים חמים", 
            value: activeLeads, 
            icon: <Target size={24} />, 
            color: "from-emerald-500 to-teal-600", 
            shadow: "shadow-emerald-500/20",
            trend: "+5%"
        },
        { 
            label: "משימות לביצוע", 
            value: pendingTasks, 
            icon: <Clock size={24} />, 
            color: "from-amber-500 to-orange-600", 
            shadow: "shadow-amber-500/20",
            trend: "-2%"
        },
        { 
            label: "התראות רגולציה", 
            value: complianceAlerts, 
            icon: <AlertCircle size={24} />, 
            color: "from-rose-500 to-red-600", 
            shadow: "shadow-rose-500/20",
            trend: "0%"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <Card 
                    key={i} 
                    className={`border-none p-6 text-white bg-linear-to-br ${stat.color} shadow-xl ${stat.shadow} relative overflow-hidden group hover:scale-[1.03] transition-all duration-300 cursor-default`}
                >
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                {stat.icon}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                <ArrowUpRight size={10} />
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-white/70 font-bold text-xs uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-4xl font-black font-display tracking-tighter">{stat.value.toLocaleString()}</h3>
                        </div>
                        
                        {/* Status / Detail */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
                                <span className="text-[10px] font-bold text-white/50">
                                    {i === 0 ? "סנכרון פעיל (LIVE)" : i === 3 ? "נדרשת תשומת לב" : "תקין"}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
