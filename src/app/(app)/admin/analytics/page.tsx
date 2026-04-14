"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { Calendar, Download, TrendingUp, TrendingDown, Filter, RefreshCcw, Sparkles, BrainCircuit } from "lucide-react";

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("month");
    const [isExporting, setIsExporting] = useState(false);
    const [hoveredChartItem, setHoveredChartItem] = useState<number | null>(null);

    // Mock Data (Same as before but scalable)
    const dataSets: Record<string, any> = {
        week: {
            summary: "השבוע נצפתה יציבות בהכנסות (₪45k), אך שיעור ההמרה ירד ב-1.2%. מומלץ לבדוק את איכות הלידים שנכנסו מקידום ממומן.",
            kpis: [
                { label: "סה״כ הכנסות", value: "₪45,000", change: "+4.2%", trend: "up", icon: "💰" },
                { label: "לקוחות חדשים", value: "12", change: "+2.5%", trend: "up", icon: "👥" },
                { label: "שיעור המרה", value: "28.5%", change: "-1.2%", trend: "down", icon: "📈" },
                { label: "ערך לקוח ממוצע", value: "₪3,800", change: "+0.5%", trend: "up", icon: "💎" },
            ],
            chart: [
                { label: "ראשון", value: 12, max: 20 },
                { label: "שני", value: 15, max: 20 },
                { label: "שלישי", value: 8, max: 20 },
                { label: "רביעי", value: 18, max: 20 },
                { label: "חמישי", value: 14, max: 20 },
                { label: "שישי", value: 5, max: 20 },
            ]
        },
        month: {
            summary: "חודש חזק מאוד (+18.2%), בעיקר בזכות קמפיין הבריאות. שימו לב: מספר הלקוחות החדשים עלה, אך ערך הלקוח הממוצע ירד מעט. ייתכן שאנו מוכרים מוצרים זולים יותר.",
            kpis: [
                { label: "סה״כ הכנסות", value: "₪2.4M", change: "+18.2%", trend: "up", icon: "💰" },
                { label: "לקוחות חדשים", value: "147", change: "+12.5%", trend: "up", icon: "👥" },
                { label: "שיעור המרה", value: "34.8%", change: "+5.2%", trend: "up", icon: "📈" },
                { label: "ערך לקוח ממוצע", value: "₪16,300", change: "-2.1%", trend: "down", icon: "💎" },
            ],
            chart: [
                { label: "ינואר", value: 85, max: 100 },
                { label: "פברואר", value: 72, max: 100 },
                { label: "מרץ", value: 95, max: 100 },
                { label: "אפריל", value: 88, max: 100 },
                { label: "מאי", value: 100, max: 100 },
                { label: "יוני", value: 78, max: 100 },
            ]
        },
        year: {
            summary: "שנת שיא לסוכנות! צמיחה עקבית של 22% בהכנסות. הנתון המרשים ביותר הוא שיעור השימור (Retention) שעומד על 94%.",
            kpis: [
                { label: "סה״כ הכנסות", value: "₪15.2M", change: "+22.5%", trend: "up", icon: "💰" },
                { label: "לקוחות חדשים", value: "1,250", change: "+15.8%", trend: "up", icon: "👥" },
                { label: "שיעור המרה", value: "31.2%", change: "+3.4%", trend: "up", icon: "📈" },
                { label: "ערך לקוח ממוצע", value: "₪12,100", change: "+1.1%", trend: "up", icon: "💎" },
            ],
            chart: [
                { label: "2020", value: 45, max: 100 },
                { label: "2021", value: 62, max: 100 },
                { label: "2022", value: 78, max: 100 },
                { label: "2023", value: 85, max: 100 },
                { label: "2024", value: 95, max: 100 },
            ]
        }
    };

    const currentData = dataSets[timeRange] || dataSets.month;

    const salesByAgent = [
        { name: "רועי כהן", sales: 42, revenue: "₪685,000", conversion: "38%" },
        { name: "מיכל לוי", sales: 38, revenue: "₪620,000", conversion: "35%" },
        { name: "דני אברהם", sales: 31, revenue: "₪505,000", conversion: "29%" },
        { name: "שרה מזרחי", sales: 28, revenue: "₪458,000", conversion: "32%" },
    ];

    const policyTypes = [
        { type: "ביטוח בריאות", count: 245, percentage: 35, color: "emerald" },
        { type: "פנסיה", count: 189, percentage: 27, color: "blue" },
        { type: "ביטוח חיים", count: 156, percentage: 22, color: "purple" },
        { type: "ביטוח רכב", count: 112, percentage: 16, color: "amber" },
    ];

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            alert("דוח ייוצא בהצלחה ונשלח למייל שלך!");
        }, 1500);
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-primary italic leading-none font-display">אנליטיקה ודוחות</h2>
                        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            תובנות עסקיות בזמן אמת
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Card className="p-1 flex bg-white border-slate-100 shadow-sm rounded-xl">
                            {["week", "month", "year"].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${timeRange === range
                                        ? "bg-slate-900 text-white shadow-lg"
                                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                        }`}
                                >
                                    {range === "week" ? "שבוע" : range === "month" ? "חודש" : "שנה"}
                                </button>
                            ))}
                        </Card>
                        <Button variant="glass" className="gap-2" onClick={() => setTimeRange("month")} title="רענן נתונים">
                            <RefreshCcw size={16} />
                        </Button>
                    </div>
                </div>

                {/* AI Executive Summary - NEW */}
                <div className="relative overflow-hidden rounded-[2.5rem] p-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-2xl">
                    <div className="bg-white rounded-[2.4rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                                <Sparkles size={32} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
                                    AI Executive Summary
                                    <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100">BETA</Badge>
                                </h3>
                                <p className="text-lg font-medium text-slate-600 leading-relaxed max-w-4xl">
                                    "{currentData.summary}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {currentData.kpis.map((kpi: any, i: number) => (
                        <Card key={i} className="border-none shadow-xl bg-white p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className={`absolute top-0 right-0 h-1 w-full bg-gradient-to-l ${kpi.trend === 'up' ? 'from-emerald-500 to-emerald-300' : 'from-red-500 to-red-300'}`}></div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-4xl filter drop-shadow-md">{kpi.icon}</span>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {kpi.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {kpi.change}
                                </div>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <h4 className="text-3xl font-black text-slate-900 font-display">{kpi.value}</h4>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Dynamic Sales Chart */}
                    <Card className="lg:col-span-2 border-none shadow-xl bg-white p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-primary italic font-display flex items-center gap-2">
                                    מגמת מכירות
                                </h3>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {currentData.chart.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className="group relative"
                                    onMouseEnter={() => setHoveredChartItem(i)}
                                    onMouseLeave={() => setHoveredChartItem(null)}
                                >
                                    <div className="flex items-center justify-between mb-2 z-10 relative">
                                        <span className={`text-sm font-black transition-colors ${hoveredChartItem === i ? 'text-indigo-600' : 'text-slate-600'}`}>
                                            {item.label}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shadow-sm">
                                            {item.value} עסקאות
                                        </span>
                                    </div>
                                    <div className="h-4 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-l from-indigo-600 to-blue-400 rounded-full transition-all duration-1000 ease-out group-hover:from-indigo-500 group-hover:to-purple-500 relative"
                                            style={{ width: `${(item.value / item.max) * 100}%` }}
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Policy Distribution */}
                    <Card className="border-none shadow-xl bg-white p-8">
                        <h3 className="text-xl font-black text-primary italic font-display mb-8">התפלגות תיק</h3>
                        <div className="space-y-6">
                            {policyTypes.map((policy, i) => (
                                <div key={i} className="hover:translate-x-1 transition-transform cursor-default">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-3 w-3 rounded-full shadow-sm bg-${policy.color}-500 ring-2 ring-${policy.color}-100`}></div>
                                            <span className="text-sm font-bold text-slate-700">{policy.type}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{policy.count}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-${policy.color}-500 rounded-full shadow-sm`}
                                            style={{ width: `${policy.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between text-sm text-slate-500">
                                <span>סה״כ פוליסות פעילות</span>
                                <span className="font-black text-slate-900">702</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sales by Agent Table */}
                <Card className="border-none shadow-xl bg-white p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-primary italic font-display">ביצועים לפי סוכן</h3>
                        <Button
                            variant="glass"
                            size="sm"
                            className="gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />}
                            {isExporting ? "מייצא..." : "ייצוא לאקסל (CSV)"}
                        </Button>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">דירוג</th>
                                    <th className="px-6 py-4">סוכן</th>
                                    <th className="px-6 py-4">מכירות</th>
                                    <th className="px-6 py-4">הכנסות</th>
                                    <th className="px-6 py-4">המרה</th>
                                    <th className="px-6 py-4">מגמה</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {salesByAgent.map((agent, i) => (
                                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${i === 0 ? 'bg-amber-100 text-amber-700' :
                                                i === 1 ? 'bg-slate-200 text-slate-600' :
                                                    i === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-50 text-slate-400'
                                                }`}>
                                                {i + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                                    {agent.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{agent.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-black text-slate-900">{agent.sales}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-600 font-mono text-sm">{agent.revenue}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs">
                                                {agent.conversion}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-0.5 items-end h-6">
                                                {[...Array(5)].map((_, j) => (
                                                    <div
                                                        key={j}
                                                        className={`w-1.5 rounded-t-sm transition-all duration-500 group-hover:h-full ${j < 3 ? 'bg-indigo-500 h-[60%]' : 'bg-slate-200 h-[30%]'
                                                            }`}
                                                    ></div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}

