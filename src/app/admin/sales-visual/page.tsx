"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { 
    TrendingUp, TrendingDown, DollarSign, Users, Target, Award,
    ArrowUpRight, ArrowDownRight, Calendar, Filter, RefreshCw,
    ChevronDown, MoreVertical, Eye, Phone, Mail, Clock, Zap,
    PieChart, BarChart3, Activity, Briefcase, Star, Crown,
    Trophy, Medal, CheckCircle2, XCircle, AlertCircle, Timer,
    ArrowRight, Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { useDeals, useUsers, useCreateDeal } from "@/lib/hooks/useQueryHooks";
import type { Deal as DealType, DealStage } from "@/types";

// Types
interface Deal {
    id: string;
    clientName: string;
    product: string;
    value: number;
    stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
    probability: number;
    agent: string;
    createdAt: string;
    expectedClose: string;
    lastActivity: string;
}

interface AgentStats {
    id: string;
    name: string;
    avatar?: string;
    deals: number;
    closedDeals: number;
    revenue: number;
    target: number;
    conversionRate: number;
    avgDealSize: number;
    trend: 'up' | 'down' | 'stable';
}

interface FunnelStage {
    id: string;
    name: string;
    nameHe: string;
    count: number;
    value: number;
    conversionRate: number;
    color: string;
}

// Map DealStage from types to our local stage format
const mapDealStage = (stage: DealStage): Deal['stage'] => {
    const stageMap: Record<DealStage, Deal['stage']> = {
        'discovery': 'lead',
        'proposal': 'proposal',
        'negotiation': 'negotiation',
        'contract': 'qualified',
        'closed_won': 'closed-won',
        'closed_lost': 'closed-lost'
    };
    return stageMap[stage] || 'lead';
};

export default function SalesVisualPage() {
    const router = useRouter();
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Fetch real data
    const { data: rawDeals = [], isLoading: dealsLoading, refetch: refetchDeals } = useDeals();
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const createDeal = useCreateDeal();

    const isLoading = dealsLoading || usersLoading;

    // Transform deals to our format
    const deals: Deal[] = useMemo(() => {
        return rawDeals.map((deal: DealType) => ({
            id: deal.id,
            clientName: deal.clientName || deal.title || 'לקוח לא ידוע',
            product: deal.title || 'מוצר לא מוגדר',
            value: deal.value || 0,
            stage: mapDealStage(deal.stage),
            probability: deal.probability || 0,
            agent: deal.assignedToName || users.find(u => u.id === deal.assignedTo)?.displayName || 'לא משויך',
            createdAt: deal.createdAt ? new Date(deal.createdAt).toISOString().split('T')[0] : '',
            expectedClose: deal.expectedCloseDate || '',
            lastActivity: deal.updatedAt ? new Date(deal.updatedAt).toISOString().split('T')[0] : ''
        }));
    }, [rawDeals, users]);

    // Calculate agent stats
    const agents: AgentStats[] = useMemo(() => {
        const agentMap = new Map<string, AgentStats>();
        
        deals.forEach(deal => {
            const agentName = deal.agent;
            if (!agentMap.has(agentName)) {
                agentMap.set(agentName, {
                    id: agentName,
                    name: agentName,
                    deals: 0,
                    closedDeals: 0,
                    revenue: 0,
                    target: 200000, // Default target
                    conversionRate: 0,
                    avgDealSize: 0,
                    trend: 'stable'
                });
            }
            const agent = agentMap.get(agentName)!;
            agent.deals++;
            if (deal.stage === 'closed-won') {
                agent.closedDeals++;
                agent.revenue += deal.value;
            }
        });

        return Array.from(agentMap.values()).map(agent => ({
            ...agent,
            conversionRate: agent.deals > 0 ? Math.round((agent.closedDeals / agent.deals) * 100) : 0,
            avgDealSize: agent.closedDeals > 0 ? Math.round(agent.revenue / agent.closedDeals) : 0,
            trend: agent.conversionRate >= 60 ? 'up' : agent.conversionRate >= 40 ? 'stable' : 'down'
        }));
    }, [deals]);

    // Calculate funnel stages
    const funnelStages: FunnelStage[] = useMemo(() => {
        const stages: { id: Deal['stage']; nameHe: string; color: string }[] = [
            { id: 'lead', nameHe: 'ליד חדש', color: '#6366f1' },
            { id: 'qualified', nameHe: 'מוכן', color: '#8b5cf6' },
            { id: 'proposal', nameHe: 'הצעה נשלחה', color: '#a855f7' },
            { id: 'negotiation', nameHe: 'משא ומתן', color: '#f59e0b' },
            { id: 'closed-won', nameHe: 'נסגר בהצלחה', color: '#10b981' },
        ];

        const totalLeads = deals.filter(d => d.stage !== 'closed-lost').length || 1;
        
        return stages.map((stage, i) => {
            const stageDeals = deals.filter(d => d.stage === stage.id);
            const prevStageCount = i > 0 ? stages.slice(0, i).reduce((sum, s) => {
                return sum + deals.filter(d => d.stage === s.id).length;
            }, 0) : totalLeads;
            
            return {
                id: stage.id,
                name: stage.id,
                nameHe: stage.nameHe,
                count: stageDeals.length,
                value: stageDeals.reduce((sum, d) => sum + d.value, 0),
                conversionRate: prevStageCount > 0 ? Math.round((stageDeals.length / prevStageCount) * 100) : 100,
                color: stage.color
            };
        });
    }, [deals]);

    // Summary stats - calculated from real data
    const stats = useMemo(() => {
        const closedWonDeals = deals.filter(d => d.stage === 'closed-won');
        const pipelineDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));
        const activeDeals = deals.filter(d => d.stage !== 'closed-lost');
        
        return {
            totalDeals: deals.length,
            totalValue: deals.reduce((sum, d) => sum + d.value, 0),
            closedWon: closedWonDeals.length,
            closedValue: closedWonDeals.reduce((sum, d) => sum + d.value, 0),
            avgDealSize: closedWonDeals.length > 0 
                ? Math.round(closedWonDeals.reduce((sum, d) => sum + d.value, 0) / closedWonDeals.length) 
                : 0,
            conversionRate: activeDeals.length > 0 
                ? Math.round((closedWonDeals.length / activeDeals.length) * 100) 
                : 0,
            pipelineValue: pipelineDeals.reduce((sum, d) => sum + d.value, 0),
            forecastValue: pipelineDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)
        };
    }, [deals]);

    // Stage config
    const getStageConfig = (stage: Deal['stage']) => {
        const configs = {
            'lead': { label: 'ליד חדש', color: 'indigo', icon: Users },
            'qualified': { label: 'מוכן', color: 'purple', icon: CheckCircle2 },
            'proposal': { label: 'הצעה נשלחה', color: 'violet', icon: Mail },
            'negotiation': { label: 'משא ומתן', color: 'amber', icon: Phone },
            'closed-won': { label: 'נסגר ✓', color: 'emerald', icon: Trophy },
            'closed-lost': { label: 'אבוד', color: 'red', icon: XCircle },
        };
        return configs[stage];
    };

    // Handle deal click - navigate to client or lead
    const handleDealClick = (deal: Deal) => {
        // Could navigate to deal detail or client page
        router.push(`/admin/sales`);
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-amber-500/30 transition-all group"
                        >
                            <ArrowRight size={20} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                                <Briefcase className="text-amber-400" />
                                תצוגת מכירות
                            </h1>
                            <p className="text-slate-400 mt-1">ניתוח ויזואלי של ביצועי המכירות</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range */}
                        <div className="flex glass-card border border-amber-500/20 rounded-xl p-1">
                            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        dateRange === range
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'text-slate-400 hover:text-amber-400'
                                    }`}
                                >
                                    {range === 'week' ? 'שבוע' : 
                                     range === 'month' ? 'חודש' : 
                                     range === 'quarter' ? 'רבעון' : 'שנה'}
                                </button>
                            ))}
                        </div>

                        <Button variant="outline" onClick={() => refetchDeals()}>
                            <RefreshCw size={16} className="ml-2" />
                            רענן
                        </Button>

                        <Button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Plus size={16} className="ml-2" />
                            עסקה חדשה
                        </Button>
                    </div>
                </div>

                {/* Empty State */}
                {!isLoading && deals.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <Briefcase size={32} className="text-amber-400" />
                        </div>
                        <h3 className="text-xl font-black text-amber-100 mb-2">אין עסקאות עדיין</h3>
                        <p className="text-slate-400 mb-6">התחל להוסיף עסקאות כדי לראות את הנתונים כאן</p>
                        <Button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Plus size={16} className="ml-2" />
                            צור עסקה ראשונה
                        </Button>
                    </Card>
                ) : isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={40} className="animate-spin text-amber-400" />
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'עסקאות פתוחות', value: stats.totalDeals - stats.closedWon, icon: Briefcase, color: 'blue', change: '+5', up: true },
                                { label: 'נסגרו בהצלחה', value: stats.closedWon, icon: Trophy, color: 'emerald', subValue: `₪${(stats.closedValue / 1000).toFixed(0)}K`, change: '+12%', up: true },
                                { label: 'שווי Pipeline', value: `₪${(stats.pipelineValue / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'amber', change: '+8%', up: true },
                                { label: 'תחזית', value: `₪${(stats.forecastValue / 1000).toFixed(0)}K`, icon: Target, color: 'purple', subLabel: 'משוקלל', change: '-3%', up: false },
                            ].map((kpi, i) => {
                                const Icon = kpi.icon;
                                return (
                                    <motion.div
                                        key={kpi.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Card className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-500/20 flex items-center justify-center`}>
                                                    <Icon size={24} className={`text-${kpi.color}-400`} />
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-bold ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                    {kpi.change}
                                                </div>
                                            </div>
                                            <div className="text-2xl font-black text-amber-100">{kpi.value}</div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-sm text-slate-500">{kpi.label}</span>
                                                {kpi.subValue && <span className="text-sm font-bold text-slate-400">{kpi.subValue}</span>}
                                                {kpi.subLabel && <span className="text-xs text-slate-500">{kpi.subLabel}</span>}
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Sales Funnel */}
                            <div className="lg:col-span-2">
                                <Card className="p-6">
                                    <h3 className="text-lg font-black text-amber-100 mb-6 flex items-center gap-2">
                                        <PieChart size={20} className="text-amber-400" />
                                        משפך מכירות
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {funnelStages.map((stage, i) => {
                                            const widthPercent = 100 - (i * 15);
                                            const prevStage = funnelStages[i - 1];
                                            
                                            return (
                                                <motion.div
                                                    key={stage.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="relative"
                                                >
                                                    <div 
                                                        className="relative h-16 rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
                                                        style={{ 
                                                            width: `${widthPercent}%`,
                                                            marginRight: 'auto',
                                                            marginLeft: 'auto'
                                                        }}
                                                    >
                                                        <div 
                                                            className="absolute inset-0 opacity-20"
                                                            style={{ backgroundColor: stage.color }}
                                                        />
                                                        <div 
                                                            className="absolute inset-0 border-2 rounded-xl"
                                                            style={{ borderColor: stage.color }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-between px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div 
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{ backgroundColor: stage.color }}
                                                                />
                                                                <span className="font-bold text-slate-200">{stage.nameHe}</span>
                                                            </div>
                                                            <div className="flex items-center gap-6 text-sm">
                                                                <div className="text-center">
                                                                    <div className="font-black text-amber-100">{stage.count}</div>
                                                                    <div className="text-xs text-slate-500">עסקאות</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="font-black text-amber-100">₪{(stage.value / 1000).toFixed(0)}K</div>
                                                                    <div className="text-xs text-slate-500">שווי</div>
                                                                </div>
                                                                {i > 0 && (
                                                                    <div className="text-center">
                                                                        <div className="font-black text-emerald-400">{stage.conversionRate}%</div>
                                                                        <div className="text-xs text-slate-500">המרה</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {i < funnelStages.length - 1 && (
                                                        <div className="flex justify-center my-1">
                                                            <ChevronDown size={20} className="text-slate-600" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Funnel Summary */}
                                    <div className="mt-6 pt-6 border-t border-slate-700/50 grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-black text-amber-400">{stats.conversionRate}%</div>
                                            <div className="text-xs text-slate-500">יחס המרה כולל</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-emerald-400">₪{stats.avgDealSize.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">ממוצע לעסקה</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-blue-400">12</div>
                                            <div className="text-xs text-slate-500">ימים ממוצע לסגירה</div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Agent Leaderboard */}
                            <Card className="p-6">
                                <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                                    <Award size={20} className="text-amber-400" />
                                    דירוג סוכנים
                                </h3>
                                <div className="space-y-3">
                                    {agents.sort((a, b) => b.revenue - a.revenue).map((agent, i) => {
                                        const targetProgress = Math.min((agent.revenue / agent.target) * 100, 100);
                                        return (
                                            <motion.div
                                                key={agent.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="glass-card p-4 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                                                        i === 0 ? 'bg-amber-500 text-slate-900' :
                                                        i === 1 ? 'bg-slate-400 text-slate-900' :
                                                        i === 2 ? 'bg-orange-700 text-white' :
                                                        'bg-slate-700 text-slate-400'
                                                    }`}>
                                                        {i === 0 ? <Crown size={16} /> : i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-200">{agent.name}</span>
                                                            {agent.trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
                                                            {agent.trend === 'down' && <TrendingDown size={14} className="text-red-400" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {agent.closedDeals} סגירות • {agent.conversionRate}% המרה
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-black text-amber-400">₪{(agent.revenue / 1000).toFixed(0)}K</div>
                                                        <div className="text-xs text-slate-500">מתוך ₪{(agent.target / 1000).toFixed(0)}K</div>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all ${
                                                            targetProgress >= 100 ? 'bg-emerald-500' :
                                                            targetProgress >= 75 ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${targetProgress}%` }}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Pipeline by Stage */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-amber-100 flex items-center gap-2">
                                    <Activity size={20} className="text-amber-400" />
                                    עסקאות לפי שלב
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span>{deals.length} עסקאות</span>
                                    <span>•</span>
                                    <span>₪{(stats.totalValue / 1000).toFixed(0)}K שווי כולל</span>
                                </div>
                            </div>

                            {/* Stage Pipeline Visualization */}
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won'] as const).map((stage) => {
                                    const stageConfig = getStageConfig(stage);
                                    const stageDeals = deals.filter(d => d.stage === stage);
                                    const StageIcon = stageConfig.icon;
                                    
                                    return (
                                        <div key={stage} className="flex-shrink-0 w-64">
                                            {/* Stage Header */}
                                            <div className={`p-3 rounded-t-xl bg-${stageConfig.color}-500/10 border border-b-0 border-${stageConfig.color}-500/20`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <StageIcon size={16} className={`text-${stageConfig.color}-400`} />
                                                        <span className="font-bold text-slate-200 text-sm">{stageConfig.label}</span>
                                                    </div>
                                                    <Badge className={`bg-${stageConfig.color}-500/20 text-${stageConfig.color}-400 border-${stageConfig.color}-500/30`}>
                                                        {stageDeals.length}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    ₪{(stageDeals.reduce((sum, d) => sum + d.value, 0) / 1000).toFixed(0)}K
                                                </div>
                                            </div>

                                            {/* Deals List */}
                                            <div className={`min-h-[200px] p-2 space-y-2 glass-card rounded-b-xl border border-t-0 border-${stageConfig.color}-500/20`}>
                                                {stageDeals.slice(0, 3).map((deal) => (
                                                    <div 
                                                        key={deal.id}
                                                        className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <span className="font-bold text-slate-200 text-sm">{deal.clientName}</span>
                                                            <span className="text-xs text-slate-500">{deal.probability}%</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mb-2">{deal.product}</div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-black text-amber-400 text-sm">₪{deal.value.toLocaleString()}</span>
                                                            <span className="text-xs text-slate-600">{deal.agent}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {stageDeals.length > 3 && (
                                                    <div className="text-center py-2 text-xs text-slate-500">
                                                        +{stageDeals.length - 3} עסקאות נוספות
                                                    </div>
                                                )}
                                                {stageDeals.length === 0 && (
                                                    <div className="text-center py-8 text-slate-600 text-sm">
                                                        אין עסקאות
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Monthly Trend Chart */}
                        <Card className="p-6">
                            <h3 className="text-lg font-black text-amber-100 mb-6 flex items-center gap-2">
                                <BarChart3 size={20} className="text-amber-400" />
                                מגמת מכירות חודשית
                            </h3>
                            
                            <div className="h-64 flex items-end gap-4">
                                {[
                                    { month: 'יולי', value: 185000, target: 200000 },
                                    { month: 'אוג׳', value: 210000, target: 200000 },
                                    { month: 'ספט׳', value: 195000, target: 220000 },
                                    { month: 'אוק׳', value: 245000, target: 220000 },
                                    { month: 'נוב׳', value: 280000, target: 250000 },
                                    { month: 'דצמ׳', value: 320000, target: 280000 },
                                    { month: 'ינו׳', value: 120500, target: 300000, current: true },
                                ].map((data, i) => {
                                    const maxValue = 350000;
                                    const valueHeight = (data.value / maxValue) * 100;
                                    const targetHeight = (data.target / maxValue) * 100;
                                    
                                    return (
                                        <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="relative w-full h-48 flex items-end justify-center gap-1">
                                                {/* Target bar */}
                                                <div 
                                                    className="w-4 bg-slate-700/50 rounded-t-lg transition-all"
                                                    style={{ height: `${targetHeight}%` }}
                                                />
                                                {/* Value bar */}
                                                <motion.div 
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${valueHeight}%` }}
                                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                                    className={`w-4 rounded-t-lg ${
                                                        data.value >= data.target 
                                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' 
                                                            : data.current 
                                                                ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                                                                : 'bg-gradient-to-t from-blue-600 to-blue-400'
                                                    }`}
                                                />
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-xs font-bold ${data.current ? 'text-amber-400' : 'text-slate-400'}`}>
                                                    {data.month}
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    ₪{(data.value / 1000).toFixed(0)}K
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                                    <span className="text-xs text-slate-400">מכירות בפועל</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-slate-700"></div>
                                    <span className="text-xs text-slate-400">יעד</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-emerald-500"></div>
                                    <span className="text-xs text-slate-400">עמד ביעד</span>
                                </div>
                            </div>
                        </Card>

                        {/* Hot Deals */}
                        <Card className="p-6">
                            <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                                <Zap size={20} className="text-amber-400" />
                                עסקאות חמות
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {deals
                                    .filter(d => d.probability >= 50 && !['closed-won', 'closed-lost'].includes(d.stage))
                                    .sort((a, b) => b.value * b.probability - a.value * a.probability)
                                    .slice(0, 6)
                                    .map((deal) => {
                                        const stageConfig = getStageConfig(deal.stage);
                                        return (
                                            <div 
                                                key={deal.id} 
                                                onClick={() => handleDealClick(deal)}
                                                className="glass-card p-4 rounded-xl hover:border-amber-500/40 border border-transparent transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <div className="font-bold text-slate-200">{deal.clientName}</div>
                                                        <div className="text-xs text-slate-500">{deal.product}</div>
                                                    </div>
                                                    <Badge className={`bg-${stageConfig.color}-500/20 text-${stageConfig.color}-400 text-xs`}>
                                                        {stageConfig.label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xl font-black text-amber-400">₪{deal.value.toLocaleString()}</span>
                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            deal.probability >= 75 ? 'bg-emerald-500' :
                                                            deal.probability >= 50 ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                        }`} />
                                                        <span className="text-sm text-slate-400">{deal.probability}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Timer size={12} />
                                                        סגירה: {deal.expectedClose || 'לא נקבע'}
                                                    </span>
                                                    <span>{deal.agent}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {deals.filter(d => d.probability >= 50 && !['closed-won', 'closed-lost'].includes(d.stage)).length === 0 && (
                                    <div className="col-span-full text-center py-8 text-slate-500">
                                        אין עסקאות חמות כרגע
                                    </div>
                                )}
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </DashboardShell>
    );
}
