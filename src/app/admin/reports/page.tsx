"use client";

import { useState, useMemo } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { 
    BarChart3, TrendingUp, TrendingDown, Users, FileText, Download, 
    Calendar, Filter, RefreshCw, PieChart, Activity, Target, 
    DollarSign, UserCheck, Clock, AlertTriangle, ChevronDown,
    FileSpreadsheet, FileDown, ArrowUpRight, ArrowDownRight,
    Building2, Phone, Mail, Zap, Award, Shield, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useClients, useLeads, useDeals, useUsers, useTasks, useCampaigns } from "@/lib/hooks/useQueryHooks";
import { Deal, Lead, Client, Task, SystemUser } from "@/types";

// Types
interface SalesData {
    period: string;
    pension: number;
    insurance: number;
    total: number;
    deals: number;
}

interface AgentPerformance {
    id: string;
    name: string;
    leads: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    tasks: number;
    tasksCompleted: number;
    trend: 'up' | 'down' | 'stable';
}

interface LeadSource {
    source: string;
    leads: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    color: string;
}

// Report Types
type ReportType = 'overview' | 'sales' | 'agents' | 'renewals' | 'leads' | 'campaigns';

// Hebrew months
const hebrewMonths = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportType>('overview');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
    const [isExporting, setIsExporting] = useState(false);

    // Firebase data
    const { data: clients = [], isLoading: loadingClients } = useClients();
    const { data: leads = [], isLoading: loadingLeads } = useLeads();
    const { data: deals = [], isLoading: loadingDeals } = useDeals();
    const { data: users = [], isLoading: loadingUsers } = useUsers();
    const { data: tasks = [], isLoading: loadingTasks } = useTasks();
    const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns();

    const isLoading = loadingClients || loadingLeads || loadingDeals || loadingUsers || loadingTasks || loadingCampaigns;

    // Filter data by date range
    const filterByDateRange = (date: Date | undefined) => {
        if (!date) return false;
        const now = new Date();
        const itemDate = new Date(date);
        
        switch (dateRange) {
            case 'today':
                return itemDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return itemDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return itemDate >= monthAgo;
            case 'quarter':
                const quarterAgo = new Date(now);
                quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                return itemDate >= quarterAgo;
            case 'year':
                const yearAgo = new Date(now);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return itemDate >= yearAgo;
            default:
                return true;
        }
    };

    // Filtered data
    const filteredDeals = useMemo(() => 
        deals.filter(d => filterByDateRange(d.createdAt)),
    [deals, dateRange]);

    const filteredLeads = useMemo(() =>
        leads.filter(l => filterByDateRange(l.createdAt)),
    [leads, dateRange]);

    const filteredTasks = useMemo(() =>
        tasks.filter(t => filterByDateRange(t.createdAt)),
    [tasks, dateRange]);

    // Calculate sales data by month
    const salesData = useMemo((): SalesData[] => {
        const monthlyData: Record<string, SalesData> = {};
        
        filteredDeals.forEach(deal => {
            if (!deal.createdAt) return;
            const date = new Date(deal.createdAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthName = hebrewMonths[date.getMonth()];
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    period: monthName,
                    pension: 0,
                    insurance: 0,
                    total: 0,
                    deals: 0
                };
            }
            
            const value = deal.value || 0;
            monthlyData[monthKey].total += value;
            monthlyData[monthKey].deals += 1;
            
            // Categorize by deal title/stage
            const title = (deal.title || '').toLowerCase();
            if (title.includes('פנסיה') || title.includes('pension')) {
                monthlyData[monthKey].pension += value;
            } else {
                monthlyData[monthKey].insurance += value;
            }
        });
        
        return Object.values(monthlyData).slice(-12);
    }, [filteredDeals]);

    // Calculate agent performance
    const agentPerformance = useMemo((): AgentPerformance[] => {
        const agents = users.filter(u => u.role === 'agent' || u.role === 'admin');
        
        return agents.map(agent => {
            const agentLeads = filteredLeads.filter(l => l.assignedTo === agent.id);
            const agentDeals = filteredDeals.filter(d => d.assignedTo === agent.id);
            const agentTasks = filteredTasks.filter(t => t.assignedTo === agent.id);
            const completedTasks = agentTasks.filter(t => t.status === 'completed');
            
            const conversions = agentDeals.length;
            const conversionRate = agentLeads.length > 0 
                ? Math.round((conversions / agentLeads.length) * 100) 
                : 0;
            const revenue = agentDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            
            const trend: 'up' | 'down' | 'stable' = conversionRate > 30 ? 'up' : conversionRate < 20 ? 'down' : 'stable';
            
            return {
                id: agent.id!,
                name: agent.displayName || agent.email || 'Unknown',
                leads: agentLeads.length,
                conversions,
                conversionRate,
                revenue,
                tasks: agentTasks.length,
                tasksCompleted: completedTasks.length,
                trend
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [users, filteredLeads, filteredDeals, filteredTasks]);

    // Calculate lead sources
    const leadSources = useMemo((): LeadSource[] => {
        const sourceMap: Record<string, { leads: number; conversions: number; revenue: number }> = {};
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];
        
        filteredLeads.forEach(lead => {
            const source = lead.source || 'לא ידוע';
            if (!sourceMap[source]) {
                sourceMap[source] = { leads: 0, conversions: 0, revenue: 0 };
            }
            sourceMap[source].leads += 1;
            
            // Check if lead converted (has associated deal)
            const leadDeal = filteredDeals.find(d => d.leadId === lead.id);
            if (leadDeal) {
                sourceMap[source].conversions += 1;
                sourceMap[source].revenue += leadDeal.value || 0;
            }
        });
        
        return Object.entries(sourceMap).map(([source, data], i) => ({
            source,
            ...data,
            conversionRate: data.leads > 0 ? Math.round((data.conversions / data.leads) * 100 * 10) / 10 : 0,
            color: colors[i % colors.length]
        }));
    }, [filteredLeads, filteredDeals]);

    // Policy renewals (from clients with policies)
    const policyRenewals = useMemo(() => {
        return clients
            .filter(c => c.policies && c.policies.length > 0)
            .flatMap(client => 
                (client.policies || []).map((policy: { renewalDate?: string; type?: string; company?: string; premium?: number }) => {
                    const endDate = policy.renewalDate ? new Date(policy.renewalDate) : null;
                    const daysLeft = endDate 
                        ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : 999;
                    
                    return {
                        id: `${client.id}-${policy.company}`,
                        clientName: client.name,
                        policyType: policy.type || 'ביטוח',
                        company: policy.company || 'לא ידוע',
                        expiryDate: endDate?.toISOString().split('T')[0] || '',
                        premium: policy.premium || 0,
                        daysLeft,
                        status: daysLeft < 14 ? 'urgent' : daysLeft < 30 ? 'warning' : 'ok'
                    };
                })
            )
            .filter(r => r.daysLeft > 0 && r.daysLeft < 90)
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [clients]);

    // Summary stats
    const summaryStats = useMemo(() => {
        const totalRevenue = filteredDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const totalDeals = filteredDeals.length;
        const totalLeads = filteredLeads.length;
        const convertedLeads = filteredLeads.filter(l => l.status === 'won').length;
        
        return {
            totalRevenue,
            totalDeals,
            avgDealSize: totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0,
            conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 : 0,
            newLeads: totalLeads,
            activePolicies: clients.reduce((sum, c) => sum + (c.policies?.length || 0), 0),
            pendingRenewals: policyRenewals.filter(r => r.status !== 'ok').length,
            tasksCompleted: filteredTasks.filter(t => t.status === 'completed').length
        };
    }, [filteredDeals, filteredLeads, clients, policyRenewals, filteredTasks]);

    // Campaign data formatted
    const campaignData = useMemo(() => {
        return campaigns.map(c => {
            const campaignDeals = filteredDeals.filter(d => d.title?.toLowerCase().includes(c.company.toLowerCase()));
            const revenue = campaignDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            
            return {
                id: c.id,
                name: `קמפיין ${c.company} - ${c.productType}`,
                type: c.productType,
                spent: c.minPremium || 0,
                leads: campaignDeals.length * 3, // Estimate
                conversions: campaignDeals.length,
                revenue,
                roi: c.minPremium > 0 ? Math.round((revenue / c.minPremium) * 100) : 0,
                status: new Date(c.endDate) > new Date() ? 'active' : 'completed'
            };
        });
    }, [campaigns, filteredDeals]);

    // Export functions
    const handleExportExcel = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        if (activeReport === 'sales') {
            csvContent += "חודש,פנסיה,ביטוח,סה\"כ,עסקאות\n";
            salesData.forEach(d => {
                csvContent += `${d.period},${d.pension},${d.insurance},${d.total},${d.deals}\n`;
            });
        } else {
            csvContent += `דוח ${activeReport}\n`;
            csvContent += `תאריך יצירה: ${new Date().toLocaleDateString('he-IL')}\n`;
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${activeReport}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsExporting(false);
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('ייצוא PDF יהיה זמין בקרוב');
        setIsExporting(false);
    };

    // Report tabs
    const reportTabs = [
        { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
        { id: 'sales', label: 'דוח מכירות', icon: DollarSign },
        { id: 'agents', label: 'ביצועי סוכנים', icon: Users },
        { id: 'renewals', label: 'חידושי פוליסות', icon: RefreshCw },
        { id: 'leads', label: 'ניתוח לידים', icon: Target },
        { id: 'campaigns', label: 'קמפיינים', icon: Zap },
    ];

    if (isLoading) {
        return (
            <DashboardShell role="מנהל">
                <div className="flex items-center justify-center h-[calc(100vh-140px)]">
                    <div className="text-center">
                        <Loader2 size={40} className="animate-spin text-amber-400 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">טוען נתוני דוחות...</p>
                    </div>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="מנהל">
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                            <BarChart3 className="text-amber-400" />
                            מרכז דוחות
                        </h1>
                        <p className="text-slate-400 mt-1">ניתוח מעמיק של ביצועי הסוכנות - נתונים אמיתיים</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Range Selector */}
                        <div className="flex glass-card border border-amber-500/20 rounded-xl p-1">
                            {(['today', 'week', 'month', 'quarter', 'year'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        dateRange === range
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'text-slate-400 hover:text-amber-400'
                                    }`}
                                >
                                    {range === 'today' ? 'היום' : 
                                     range === 'week' ? 'שבוע' : 
                                     range === 'month' ? 'חודש' : 
                                     range === 'quarter' ? 'רבעון' : 'שנה'}
                                </button>
                            ))}
                        </div>

                        {/* Export Buttons */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                            <FileSpreadsheet size={16} className="ml-2" />
                            Excel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            <FileDown size={16} className="ml-2" />
                            PDF
                        </Button>
                    </div>
                </div>

                {/* Report Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {reportTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveReport(tab.id as ReportType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                    activeReport === tab.id
                                        ? 'bg-amber-500 text-slate-900'
                                        : 'glass-card border border-amber-500/20 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Report Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeReport}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeReport === 'overview' && (
                            <OverviewReport 
                                summaryStats={summaryStats}
                                salesData={salesData}
                                agentPerformance={agentPerformance}
                                leadSources={leadSources}
                            />
                        )}

                        {activeReport === 'sales' && (
                            <SalesReport salesData={salesData} />
                        )}

                        {activeReport === 'agents' && (
                            <AgentsReport agents={agentPerformance} />
                        )}

                        {activeReport === 'renewals' && (
                            <RenewalsReport renewals={policyRenewals} />
                        )}

                        {activeReport === 'leads' && (
                            <LeadsReport leadSources={leadSources} />
                        )}

                        {activeReport === 'campaigns' && (
                            <CampaignsReport campaigns={campaignData} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </DashboardShell>
    );
}

// ==================== Overview Report ====================
function OverviewReport({ summaryStats, salesData, agentPerformance, leadSources }: {
    summaryStats: {
        totalRevenue: number;
        totalDeals: number;
        avgDealSize: number;
        conversionRate: number;
        newLeads: number;
        activePolicies: number;
        pendingRenewals: number;
        tasksCompleted: number;
    };
    salesData: SalesData[];
    agentPerformance: AgentPerformance[];
    leadSources: LeadSource[];
}) {
    const statCards = [
        { label: 'הכנסות כוללות', value: `₪${(summaryStats.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'amber' },
        { label: 'עסקאות', value: summaryStats.totalDeals.toString(), icon: FileText, color: 'blue' },
        { label: 'לידים חדשים', value: summaryStats.newLeads.toString(), icon: Users, color: 'emerald' },
        { label: 'יחס המרה', value: `${summaryStats.conversionRate}%`, icon: Target, color: 'purple' },
        { label: 'פוליסות פעילות', value: summaryStats.activePolicies.toLocaleString(), icon: Shield, color: 'cyan' },
        { label: 'חידושים ממתינים', value: summaryStats.pendingRenewals.toString(), icon: AlertTriangle, color: 'red' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="p-4 text-center">
                                <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${stat.color}-500/20`}>
                                    <Icon size={20} className={`text-${stat.color}-400`} />
                                </div>
                                <div className="text-2xl font-black text-amber-100">{stat.value}</div>
                                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-amber-400" />
                        מגמת מכירות
                    </h3>
                    {salesData.length > 0 ? (
                        <>
                            <div className="h-64 flex items-end gap-2">
                                {salesData.slice(-6).map((data) => {
                                    const maxTotal = Math.max(...salesData.map(d => d.total), 1);
                                    return (
                                        <div key={data.period} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full flex flex-col gap-1" style={{ height: '200px' }}>
                                                <div 
                                                    className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all hover:from-amber-400 hover:to-amber-300"
                                                    style={{ height: `${(data.pension / maxTotal) * 100}%`, marginTop: 'auto' }}
                                                    title={`פנסיה: ₪${data.pension.toLocaleString()}`}
                                                />
                                                <div 
                                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-b-lg transition-all hover:from-blue-400 hover:to-blue-300"
                                                    style={{ height: `${(data.insurance / maxTotal) * 100}%` }}
                                                    title={`ביטוח: ₪${data.insurance.toLocaleString()}`}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 font-bold">{data.period}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                                    <span className="text-xs text-slate-400">פנסיה</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                                    <span className="text-xs text-slate-400">ביטוח</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            <p>אין נתוני מכירות לתקופה זו</p>
                        </div>
                    )}
                </Card>

                {/* Lead Sources */}
                <Card className="p-6">
                    <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                        <PieChart size={20} className="text-amber-400" />
                        מקורות לידים
                    </h3>
                    {leadSources.length > 0 ? (
                        <div className="space-y-3">
                            {leadSources.map((source) => {
                                const totalLeads = leadSources.reduce((sum, s) => sum + s.leads, 0) || 1;
                                const percentage = (source.leads / totalLeads) * 100;
                                return (
                                    <div key={source.source} className="flex items-center gap-3">
                                        <div className="w-20 text-xs text-slate-300 font-bold truncate">{source.source}</div>
                                        <div className="flex-1 h-6 glass-card rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${percentage}%`, backgroundColor: source.color }}
                                            />
                                        </div>
                                        <div className="w-16 text-left">
                                            <span className="text-sm font-black text-slate-200">{source.leads}</span>
                                            <span className="text-xs text-slate-500 mr-1">({percentage.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400">
                            <p>אין נתוני מקורות לידים</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Top Agents */}
            <Card className="p-6">
                <h3 className="text-lg font-black text-amber-100 mb-4 flex items-center gap-2">
                    <Award size={20} className="text-amber-400" />
                    סוכנים מובילים
                </h3>
                {agentPerformance.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                        {agentPerformance.slice(0, 3).map((agent, i) => (
                            <div 
                                key={agent.id}
                                className={`p-4 rounded-2xl border ${
                                    i === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                                    i === 1 ? 'bg-slate-500/10 border-slate-500/30' :
                                    'bg-orange-900/10 border-orange-900/30'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${
                                        i === 0 ? 'bg-amber-500 text-slate-900' :
                                        i === 1 ? 'bg-slate-400 text-slate-900' :
                                        'bg-orange-700 text-white'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-200">{agent.name}</div>
                                        <div className="text-xs text-slate-400">יחס המרה: {agent.conversionRate}%</div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">הכנסות:</span>
                                    <span className="font-black text-amber-400">₪{agent.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-8">
                        <p>אין נתוני סוכנים</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ==================== Sales Report ====================
function SalesReport({ salesData }: { salesData: SalesData[] }) {
    const totalPension = salesData.reduce((sum, d) => sum + d.pension, 0);
    const totalInsurance = salesData.reduce((sum, d) => sum + d.insurance, 0);
    const totalDeals = salesData.reduce((sum, d) => sum + d.deals, 0);
    const avgMonthly = salesData.length > 0 ? (totalPension + totalInsurance) / salesData.length : 0;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-slate-400">סה"כ פנסיה</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">₪{totalPension.toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-slate-400">סה"כ ביטוח</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">₪{totalInsurance.toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-slate-400">עסקאות</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{totalDeals}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-slate-400">ממוצע חודשי</div>
                    <div className="text-2xl font-black text-purple-400 mt-1">₪{Math.round(avgMonthly).toLocaleString()}</div>
                </Card>
            </div>

            {/* Sales Table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-amber-500/20">
                    <h3 className="font-black text-amber-100">פירוט מכירות חודשי</h3>
                </div>
                {salesData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">חודש</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">פנסיה</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">ביטוח</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">סה"כ</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">עסקאות</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">ממוצע לעסקה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesData.map((data) => (
                                    <tr key={data.period} className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-bold text-slate-200">{data.period}</td>
                                        <td className="p-4 text-amber-400 font-bold">₪{data.pension.toLocaleString()}</td>
                                        <td className="p-4 text-blue-400 font-bold">₪{data.insurance.toLocaleString()}</td>
                                        <td className="p-4 text-emerald-400 font-black">₪{data.total.toLocaleString()}</td>
                                        <td className="p-4 text-slate-300">{data.deals}</td>
                                        <td className="p-4 text-slate-400">₪{data.deals > 0 ? Math.round(data.total / data.deals).toLocaleString() : 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-800/80">
                                <tr>
                                    <td className="p-4 font-black text-amber-100">סה"כ</td>
                                    <td className="p-4 text-amber-400 font-black">₪{totalPension.toLocaleString()}</td>
                                    <td className="p-4 text-blue-400 font-black">₪{totalInsurance.toLocaleString()}</td>
                                    <td className="p-4 text-emerald-400 font-black">₪{(totalPension + totalInsurance).toLocaleString()}</td>
                                    <td className="p-4 text-slate-200 font-black">{totalDeals}</td>
                                    <td className="p-4 text-slate-300 font-bold">₪{totalDeals > 0 ? Math.round((totalPension + totalInsurance) / totalDeals).toLocaleString() : 0}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-12">
                        <p>אין נתוני מכירות לתקופה זו</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ==================== Agents Report ====================
function AgentsReport({ agents }: { agents: AgentPerformance[] }) {
    return (
        <div className="space-y-6">
            {agents.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent, i) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl font-black text-slate-900">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-black text-amber-100 flex items-center gap-2">
                                            {agent.name}
                                            {i === 0 && <span className="text-amber-400">🏆</span>}
                                        </div>
                                        <div className={`text-xs font-bold flex items-center gap-1 ${
                                            agent.trend === 'up' ? 'text-emerald-400' : 
                                            agent.trend === 'down' ? 'text-red-400' : 'text-slate-400'
                                        }`}>
                                            {agent.trend === 'up' ? <TrendingUp size={12} /> : 
                                             agent.trend === 'down' ? <TrendingDown size={12} /> : <Activity size={12} />}
                                            {agent.trend === 'up' ? 'במגמת עלייה' : 
                                             agent.trend === 'down' ? 'במגמת ירידה' : 'יציב'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="glass-card p-2 rounded-lg text-center">
                                        <div className="text-amber-400 font-black">₪{agent.revenue.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">הכנסות</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg text-center">
                                        <div className="text-emerald-400 font-black">{agent.conversionRate}%</div>
                                        <div className="text-xs text-slate-500">המרה</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg text-center">
                                        <div className="text-blue-400 font-black">{agent.leads}</div>
                                        <div className="text-xs text-slate-500">לידים</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg text-center">
                                        <div className="text-purple-400 font-black">{agent.conversions}</div>
                                        <div className="text-xs text-slate-500">המרות</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">משימות שהושלמו</span>
                                        <span className="text-slate-200 font-bold">{agent.tasksCompleted}/{agent.tasks}</span>
                                    </div>
                                    <div className="h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                                            style={{ width: `${agent.tasks > 0 ? (agent.tasksCompleted / agent.tasks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Users className="mx-auto mb-4 text-slate-500" size={48} />
                    <p className="text-slate-400">אין נתוני סוכנים להצגה</p>
                </Card>
            )}
        </div>
    );
}

// ==================== Renewals Report ====================
function RenewalsReport({ renewals }: { renewals: Array<{
    id: string;
    clientName: string;
    policyType: string;
    company: string;
    expiryDate: string;
    premium: number;
    daysLeft: number;
    status: string;
}> }) {
    const urgentCount = renewals.filter(r => r.status === 'urgent').length;
    const warningCount = renewals.filter(r => r.status === 'warning').length;
    const totalPremium = renewals.reduce((sum, r) => sum + r.premium, 0);

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-r-4 border-red-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-red-400">{urgentCount}</div>
                            <div className="text-xs text-slate-400">דחופים (פחות מ-14 יום)</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-r-4 border-amber-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Clock className="text-amber-400" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-amber-400">{warningCount}</div>
                            <div className="text-xs text-slate-400">בקרוב (14-30 יום)</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 border-r-4 border-emerald-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-emerald-400">₪{totalPremium.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">סה"כ פרמיות לחידוש</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Renewals List */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-amber-500/20">
                    <h3 className="font-black text-amber-100">פוליסות לחידוש</h3>
                </div>
                {renewals.length > 0 ? (
                    <div className="divide-y divide-slate-700/50">
                        {renewals.map((renewal) => (
                            <div 
                                key={renewal.id}
                                className={`p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors ${
                                    renewal.status === 'urgent' ? 'bg-red-500/5' : ''
                                }`}
                            >
                                <div className={`w-2 h-12 rounded-full ${
                                    renewal.status === 'urgent' ? 'bg-red-500' :
                                    renewal.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                
                                <div className="flex-1">
                                    <div className="font-bold text-slate-200">{renewal.clientName}</div>
                                    <div className="text-xs text-slate-400">{renewal.policyType} • {renewal.company}</div>
                                </div>

                                <div className="text-center">
                                    <div className="text-sm font-bold text-slate-200">₪{renewal.premium}</div>
                                    <div className="text-xs text-slate-500">פרמיה חודשית</div>
                                </div>

                                <div className="text-center">
                                    <div className={`text-sm font-black ${
                                        renewal.status === 'urgent' ? 'text-red-400' :
                                        renewal.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>
                                        {renewal.daysLeft} ימים
                                    </div>
                                    <div className="text-xs text-slate-500">{renewal.expiryDate}</div>
                                </div>

                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={`${
                                        renewal.status === 'urgent' 
                                            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' 
                                            : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    }`}
                                >
                                    <Phone size={14} className="ml-1" />
                                    התקשר
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-12">
                        <RefreshCw className="mx-auto mb-4 opacity-50" size={48} />
                        <p>אין פוליסות לחידוש בתקופה הקרובה</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ==================== Leads Report ====================
function LeadsReport({ leadSources }: { leadSources: LeadSource[] }) {
    const totalLeads = leadSources.reduce((sum, s) => sum + s.leads, 0);
    const totalConversions = leadSources.reduce((sum, s) => sum + s.conversions, 0);
    const totalRevenue = leadSources.reduce((sum, s) => sum + s.revenue, 0);

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-amber-400">{totalLeads}</div>
                    <div className="text-xs text-slate-400 mt-1">סה"כ לידים</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-emerald-400">{totalConversions}</div>
                    <div className="text-xs text-slate-400 mt-1">המרות</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-blue-400">{totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0}%</div>
                    <div className="text-xs text-slate-400 mt-1">יחס המרה ממוצע</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-purple-400">₪{(totalRevenue / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-slate-400 mt-1">הכנסות מלידים</div>
                </Card>
            </div>

            {/* Sources Table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-amber-500/20">
                    <h3 className="font-black text-amber-100">ניתוח לפי מקור</h3>
                </div>
                {leadSources.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">מקור</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">לידים</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">המרות</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">יחס המרה</th>
                                    <th className="text-right p-4 text-xs font-black text-slate-400 uppercase">הכנסות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leadSources.map((source) => (
                                    <tr key={source.source} className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                                                <span className="font-bold text-slate-200">{source.source}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300 font-bold">{source.leads}</td>
                                        <td className="p-4 text-emerald-400 font-bold">{source.conversions}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-700/50 rounded-full max-w-20 overflow-hidden">
                                                    <div 
                                                        className="h-full rounded-full"
                                                        style={{ width: `${source.conversionRate}%`, backgroundColor: source.color }}
                                                    />
                                                </div>
                                                <span className="font-black text-slate-200">{source.conversionRate}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-amber-400 font-black">₪{source.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-12">
                        <Target className="mx-auto mb-4 opacity-50" size={48} />
                        <p>אין נתוני מקורות לידים</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ==================== Campaigns Report ====================
function CampaignsReport({ campaigns }: { campaigns: Array<{
    id: string;
    name: string;
    type: string;
    spent: number;
    leads: number;
    conversions: number;
    revenue: number;
    roi: number;
    status: string;
}> }) {
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
    const avgROI = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-red-400">₪{totalSpent.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">סה"כ הוצאות</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-emerald-400">₪{totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">הכנסות מקמפיינים</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-amber-400">{avgROI.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-1">ROI ממוצע</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-3xl font-black text-blue-400">{campaigns.filter(c => c.status === 'active').length}</div>
                    <div className="text-xs text-slate-400 mt-1">קמפיינים פעילים</div>
                </Card>
            </div>

            {/* Campaigns List */}
            {campaigns.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-4">
                    {campaigns.map((campaign, i) => (
                        <motion.div
                            key={campaign.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="font-black text-amber-100">{campaign.name}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-full glass-card">{campaign.type}</span>
                                        </div>
                                    </div>
                                    <Badge className={`${
                                        campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                    }`}>
                                        {campaign.status === 'active' ? 'פעיל' : 
                                         campaign.status === 'paused' ? 'מושהה' : 'הסתיים'}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-4 gap-3 text-center">
                                    <div className="glass-card p-2 rounded-lg">
                                        <div className="text-xs text-slate-500">מינימום</div>
                                        <div className="font-black text-slate-300">₪{campaign.spent.toLocaleString()}</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg">
                                        <div className="text-xs text-slate-500">לידים</div>
                                        <div className="font-black text-blue-400">{campaign.leads}</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg">
                                        <div className="text-xs text-slate-500">המרות</div>
                                        <div className="font-black text-emerald-400">{campaign.conversions}</div>
                                    </div>
                                    <div className="glass-card p-2 rounded-lg">
                                        <div className="text-xs text-slate-500">הכנסות</div>
                                        <div className="font-black text-amber-400">₪{(campaign.revenue / 1000).toFixed(0)}K</div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">ROI</span>
                                        <div className={`text-lg font-black ${
                                            campaign.roi > 1000 ? 'text-emerald-400' :
                                            campaign.roi > 500 ? 'text-amber-400' : 'text-slate-400'
                                        }`}>
                                            {campaign.roi}%
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                campaign.roi > 1000 ? 'bg-emerald-500' :
                                                campaign.roi > 500 ? 'bg-amber-500' : 'bg-slate-500'
                                            }`}
                                            style={{ width: `${Math.min(campaign.roi / 50, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Zap className="mx-auto mb-4 text-slate-500" size={48} />
                    <p className="text-slate-400">אין קמפיינים להצגה</p>
                    <p className="text-xs text-slate-500 mt-2">צור קמפיין חדש בדף הקמפיינים</p>
                </Card>
            )}
        </div>
    );
}
