"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { CommissionCalculator, DealData } from "@/lib/commissions/calculator";
import { Card, Button, Badge } from "@/components/ui/base";
import { TrendingUp, AlertCircle, RefreshCw, DollarSign, Building2 } from "lucide-react";

export default function AdminFinancePage() {
    // --- Mock Data for Demonstration ---
    const [mockDeals] = useState<DealData[]>([
        { id: "1", productType: "life", company: "הראל", monthlyPremium: 100, startDate: new Date("2024-01-01"), status: "active" },
        { id: "2", productType: "health", company: "מנורה", monthlyPremium: 250, startDate: new Date("2024-02-01"), status: "active" },
        { id: "3", productType: "pension", company: "הראל", salary: 15000, accumulatedAmount: 1200000, startDate: new Date("2024-03-01"), status: "active" }, // Tzvira eligible
        { id: "4", productType: "pension", company: "מנורה", accumulatedAmount: 800000, startDate: new Date("2024-03-01"), status: "active" }, // Not eligible (<1M)
        { id: "5", productType: "life", company: "הפניקס", monthlyPremium: 200, startDate: new Date("2023-01-01"), status: "cancelled", cancellationDate: new Date("2023-06-01") }, // 6 months active -> 100% clawback
    ]);

    // Calculate Totals Live
    const calculations = mockDeals.map(deal => ({
        deal,
        result: CommissionCalculator.calculate(deal)
    }));

    const totalHeikef = calculations.reduce((acc, curr) => acc + curr.result.oneTimeCommission, 0);
    const totalMonthly = calculations.reduce((acc, curr) => acc + curr.result.monthlyCommission, 0);
    const totalClawback = calculations.reduce((acc, curr) => acc + curr.result.clawbackAmount, 0);
    const netCommission = totalHeikef - totalClawback;

    // Group by Company
    const companyStats: Record<string, number> = {};
    calculations.forEach(calc => {
        const company = calc.deal.company;
        const total = calc.result.oneTimeCommission - calc.result.clawbackAmount;
        companyStats[company] = (companyStats[company] || 0) + total;
    });

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 font-display">ניהול כספים ועמלות</h1>
                        <p className="text-slate-500">דוח ריכוז עמלות, קיזוזים וצפי הכנסות חודשי</p>
                    </div>
                    <Button className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        ייצא דוח לאקסל
                    </Button>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
                        <DollarSign className="absolute -left-4 -bottom-4 text-white/10 w-32 h-32" />
                        <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest mb-1">סה״כ עמלות (נטו)</p>
                        <h3 className="text-4xl font-black font-mono">₪{netCommission.toLocaleString()}</h3>
                        <p className="text-xs text-indigo-100 mt-2 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> אחרי קיזוז ביטולים
                        </p>
                    </Card>

                    <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <RefreshCw className="w-32 h-32 absolute -left-4 -bottom-4 text-white/10" />
                        <p className="text-sm font-bold text-emerald-100 uppercase tracking-widest mb-1">הכנסה חודשית קבועה (נפרעים)</p>
                        <h3 className="text-4xl font-black font-mono">₪{totalMonthly.toLocaleString()}</h3>
                        <p className="text-xs text-emerald-100 mt-2">
                            צפי שנתי: ₪{(totalMonthly * 12).toLocaleString()}
                        </p>
                    </Card>

                    <Card className="p-6 border-none shadow-lg bg-white text-slate-800 relative overflow-hidden">
                        <AlertCircle className="w-32 h-32 absolute -left-4 -bottom-4 text-slate-100" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">קיזוזים וביטולים</p>
                        <h3 className="text-4xl font-black font-mono text-red-500">₪{totalClawback.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-2">
                            עקב פדיון מוקדם
                        </p>
                    </Card>

                    <Card className="p-6 border-none shadow-lg bg-white text-slate-800">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">התפלגות לפי חברה</p>
                        <div className="space-y-3">
                            {Object.entries(companyStats).map(([company, amount], i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 font-bold text-slate-700">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        {company}
                                    </span>
                                    <span className="font-mono font-bold text-primary">₪{amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Detailed Table */}
                <Card className="overflow-hidden border-none shadow-xl bg-white">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-xl text-slate-800">פירוט עסקאות וחישוב עמלה</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4 rounded-tr-xl">מוצר / סטטוס</th>
                                    <th className="p-4">חברה</th>
                                    <th className="p-4">פרטים פיננסיים</th>
                                    <th className="p-4 bg-indigo-50/50 text-indigo-600">עמלת היקף/ניוד</th>
                                    <th className="p-4 bg-emerald-50/50 text-emerald-600">עמלת נפרעים</th>
                                    <th className="p-4 bg-red-50/50 text-red-600 rounded-tl-xl">הערות חישוב</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {calculations.map(({ deal, result }, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-800">
                                                {deal.productType === 'life' && 'ביטוח חיים'}
                                                {deal.productType === 'health' && 'ביטוח בריאות'}
                                                {deal.productType === 'pension' && 'קרן פנסיה'}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {deal.startDate.toLocaleDateString('he-IL')}
                                            </div>
                                            {deal.status === 'cancelled' && (
                                                <Badge className="bg-red-100 text-red-600 mt-2 text-[10px] px-2 py-0.5">בוטל</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 align-top font-medium text-slate-600">
                                            {deal.company}
                                        </td>
                                        <td className="p-4 align-top text-slate-600">
                                            {deal.monthlyPremium && <div>פרמיה: ₪{deal.monthlyPremium}</div>}
                                            {deal.salary && <div>משכורת: ₪{deal.salary.toLocaleString()}</div>}
                                            {deal.accumulatedAmount && <div>צבירה: ₪{deal.accumulatedAmount.toLocaleString()}</div>}
                                        </td>
                                        <td className="p-4 align-top bg-indigo-50/30 font-bold text-indigo-700">
                                            {/* Show net one-time (Original - Clawback) */}
                                            ₪{(result.oneTimeCommission - result.clawbackAmount).toLocaleString()}
                                            {result.clawbackAmount > 0 && (
                                                <div className="text-xs text-red-500 line-through decoration-red-500/50 mt-1">
                                                    (במקור: ₪{result.oneTimeCommission.toLocaleString()})
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 align-top bg-emerald-50/30 font-bold text-emerald-700">
                                            {result.monthlyCommission > 0 ? `₪${result.monthlyCommission}` : '-'}
                                        </td>
                                        <td className="p-4 align-top bg-red-50/10 text-xs text-slate-500 max-w-[250px] leading-relaxed">
                                            <ul className="list-disc list-inside space-y-1">
                                                {result.notes.map((note, idx) => (
                                                    <li key={idx}>{note}</li>
                                                ))}
                                            </ul>
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
