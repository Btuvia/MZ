"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    DollarSign,
    Building2,
    Users,
    Wallet,
    ArrowDownRight,
    PieChart,
    Download,
    Calculator,
    Info,
    Lock,
    X,
    Save,
    RotateCcw,
    FileText,
    TrendingUp
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { CommissionCalculator, type DealData, type ProductType, type AgentSalaryMix } from "@/lib/commissions/calculator";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

interface ExtendedDealData extends DealData {
    agentName?: string;
    clientName?: string;
    clientId?: string;
    // שדות מיוחדים למכירות פלטינום
    platinumOneTime?: number;
    platinumMonthly?: number;
    platinumProductName?: string;
}

// Commission Formula Config interface
interface FormulaConfig {
    insuranceHeikefMultiplier: number;
    insuranceNifraimPercentage: number;
    pensionTzviraRate: number;
    kerenTzviraRate: number;
    pensionNiudMultiplier: number;
}

const DEFAULT_FORMULAS: FormulaConfig = {
    insuranceHeikefMultiplier: 9.7,
    insuranceNifraimPercentage: 0.23,
    pensionTzviraRate: 3000,
    kerenTzviraRate: 7000,
    pensionNiudMultiplier: 0.008,
};

export default function AdminFinancePage() {
    const [deals, setDeals] = useState<ExtendedDealData[]>([]);
    const [showFormulaModal, setShowFormulaModal] = useState(false);
    const [formulas, setFormulas] = useState<FormulaConfig>(DEFAULT_FORMULAS);
    const [editingFormulas, setEditingFormulas] = useState<FormulaConfig>(DEFAULT_FORMULAS);
    const { user, role } = useAuth();
    
    // תמהילי שכר סוכנים (בדרך כלל יגיעו מ-Firebase)
    const [agentSalaryMixes] = useState<AgentSalaryMix[]>([
        {
            userId: 'agent1',
            agentName: 'רועי כהן',
            basePercentage: 40,
            heikefPercentage: 40,
            nifraaimPercentage: 40,
            tzviraPercentage: 35,
            niudPercentage: 35
        },
        {
            userId: 'agent2',
            agentName: 'שרה לוי',
            basePercentage: 35,
            heikefPercentage: 35,
            nifraaimPercentage: 35,
            tzviraPercentage: 30,
            niudPercentage: 30
        }
    ]);

    // בדיקה האם המשתמש הוא אדמין
    const isAdmin = role === 'admin' || role === 'manager';

    // פונקציות המרה
    const mapPolicyTypeToProductType = (type: string): ProductType => {
        if (!type) return 'life';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('חיים') || lowerType.includes('ריסק')) return 'life';
        if (lowerType.includes('בריאות') || lowerType.includes('סיעודי')) return 'health';
        if (lowerType.includes('קרן השתלמות')) return 'keren_hishtalmut';
        if (lowerType.includes('פנסיה') || lowerType.includes('גמל')) return 'pension';
        if (lowerType.includes('רכב') || lowerType.includes('דירה') || lowerType.includes('אלמנטרי')) return 'elementary';
        return 'life';
    };

    const mapInsuranceProductType = (type: string): ProductType => {
        if (!type) return 'life';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('חיים') || lowerType.includes('ריסק')) return 'life';
        if (lowerType.includes('בריאות') || lowerType.includes('סיעודי')) return 'health';
        if (lowerType.includes('רכב') || lowerType.includes('דירה')) return 'elementary';
        return 'life';
    };

    const loadDeals = useCallback(async () => {
        try {
            const fetchedClients = await firestoreService.getClients();
            
            const allDeals: ExtendedDealData[] = [];
            
            fetchedClients.forEach((client: any) => {
                // פוליסות רגילות - רק אלה עם סטטוס "פוליסה הופקה"
                if (client.policies && Array.isArray(client.policies)) {
                    client.policies.forEach((policy: any) => {
                        const deal: ExtendedDealData = {
                            id: policy.id || `${client.id}-${Date.now()}`,
                            productType: mapPolicyTypeToProductType(policy.type),
                            company: policy.company || 'לא ידוע',
                            monthlyPremium: parseFloat(policy.premium?.replace(/[^\d.-]/g, '')) || 0,
                            startDate: policy.startDate ? new Date(policy.startDate) : new Date(),
                            status: policy.status === 'פעיל' ? 'active' : (policy.status === 'ממתין' ? 'pending' : 'cancelled'),
                            opsStatus: policy.opsStatus || client.opsStatus || 'policy_issued', // ברירת מחדל לפוליסות קיימות
                            agentName: client.salesRepresentative || 'לא משויך',
                            clientName: client.name,
                            clientId: client.id
                        };
                        allDeals.push(deal);
                    });
                }
                
                // מכירות פנסיוניות
                if (client.pensionSales && Array.isArray(client.pensionSales)) {
                    client.pensionSales.forEach((pension: any) => {
                        const deal: ExtendedDealData = {
                            id: pension.id || `pension-${client.id}-${Date.now()}`,
                            productType: pension.productType === 'קרן השתלמות' ? 'keren_hishtalmut' : 
                                         pension.isTransfer ? 'pension_transfer' : 'pension',
                            company: pension.company || 'לא ידוע',
                            salary: parseFloat(pension.avgSalary) || 0,
                            accumulatedAmount: parseFloat(pension.accumulatedAmount) || 0,
                            startDate: pension.joinDate ? new Date(pension.joinDate) : new Date(),
                            status: 'active',
                            opsStatus: pension.opsStatus || client.opsStatus || 'policy_issued',
                            agentName: client.salesRepresentative || 'לא משויך',
                            clientName: client.name,
                            clientId: client.id
                        };
                        allDeals.push(deal);
                    });
                }
                
                // מכירות ביטוח
                if (client.insuranceSales && Array.isArray(client.insuranceSales)) {
                    client.insuranceSales.forEach((ins: any) => {
                        const deal: ExtendedDealData = {
                            id: ins.id || `ins-${client.id}-${Date.now()}`,
                            productType: mapInsuranceProductType(ins.productType || ins.product),
                            company: ins.company || 'לא ידוע',
                            monthlyPremium: parseFloat(ins.premium?.replace(/[^\d.-]/g, '')) || 0,
                            startDate: new Date(),
                            status: 'active',
                            opsStatus: ins.opsStatus || client.opsStatus || 'policy_issued',
                            agentName: client.salesRepresentative || 'לא משויך',
                            clientName: client.name,
                            clientId: client.id
                        };
                        allDeals.push(deal);
                    });
                }

                // מכירות פלטינום - עמלות מיוחדות
                if (client.platinumSales && Array.isArray(client.platinumSales)) {
                    client.platinumSales.forEach((platinum: any) => {
                        const isDental = platinum.productName === 'פלטינום דנטל';
                        const monthlyPremium = parseFloat(platinum.monthlyPremium) || 0;
                        
                        // עמלת פלטינום: חד פעמית = פרמיה × 3, נפרעים = 45% (או 30% לדנטל)
                        const deal: ExtendedDealData = {
                            id: platinum.id || `platinum-${client.id}-${Date.now()}`,
                            productType: 'platinum_service',
                            company: 'פלטינום',
                            monthlyPremium: monthlyPremium,
                            startDate: platinum.saleDate ? new Date(platinum.saleDate) : new Date(),
                            status: 'active',
                            opsStatus: 'policy_issued', // פלטינום תמיד מופק אוטומטית
                            agentName: client.salesRepresentative || 'לא משויך',
                            clientName: client.name,
                            clientId: client.id,
                            // שדות מיוחדים לפלטינום
                            platinumOneTime: monthlyPremium * 3,
                            platinumMonthly: monthlyPremium * (isDental ? 0.30 : 0.45),
                            platinumProductName: platinum.productName
                        };
                        allDeals.push(deal);
                    });
                }
            });

            setDeals(allDeals);
        } catch (error) {
            console.error("Failed to load deals", error);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadDeals();
        }, 0);
        return () => clearTimeout(timeout);
    }, [loadDeals]);

    // --- Calculations ---
    const calculations = deals.map(deal => ({
        deal,
        result: CommissionCalculator.calculate(deal)
    }));

    // סינון עסקאות עם עמלות בפועל (רק פוליסות שהופקו)
    const activeCalculations = calculations.filter(c => c.result.totalOneTime > 0 || c.result.totalMonthly > 0);

    // חישובים לאדמין (כל העמלות)
    const totalHeikef = activeCalculations.reduce((acc, curr) => acc + curr.result.heikefCommission, 0);
    const totalNifraim = activeCalculations.reduce((acc, curr) => acc + curr.result.nifraaimCommission, 0);
    const totalTzvira = activeCalculations.reduce((acc, curr) => acc + curr.result.tzviraCommission, 0);
    const totalNiud = activeCalculations.reduce((acc, curr) => acc + curr.result.niudCommission, 0);
    const totalOneTime = totalHeikef + totalTzvira + totalNiud;
    const totalMonthly = totalNifraim;
    const totalClawback = activeCalculations.reduce((acc, curr) => acc + curr.result.clawbackAmount, 0);
    const netCommission = totalOneTime - totalClawback;

    // חישוב עמלות לפי סוכן (לסוכן הנוכחי אם לא אדמין)
    const getAgentCommissions = (agentName: string) => {
        const agentMix = agentSalaryMixes.find(m => m.agentName === agentName) || {
            userId: '',
            agentName,
            basePercentage: 30,
            heikefPercentage: 30,
            nifraaimPercentage: 30,
            tzviraPercentage: 30,
            niudPercentage: 30
        };

        const agentDeals = activeCalculations.filter(c => c.deal.agentName === agentName);
        const agentTotal = {
            heikef: 0,
            nifraim: 0,
            tzvira: 0,
            niud: 0,
            total: 0
        };

        agentDeals.forEach(({ result }) => {
            const agentResult = CommissionCalculator.calculateAgentCommission(result, agentMix);
            agentTotal.heikef += agentResult.heikefCommission;
            agentTotal.nifraim += agentResult.nifraaimCommission;
            agentTotal.tzvira += agentResult.tzviraCommission;
            agentTotal.niud += agentResult.niudCommission;
            agentTotal.total += agentResult.totalOneTime;
        });

        return agentTotal;
    };

    // Aggregations
    const companyStats: Record<string, { total: number; count: number }> = {};
    const agentStats: Record<string, { total: number; deals: number }> = {};
    const productStats: Record<string, number> = {};

    activeCalculations.forEach(calc => {
        const net = calc.result.totalOneTime - calc.result.clawbackAmount;

        // Company
        if (!companyStats[calc.deal.company]) {
            companyStats[calc.deal.company] = { total: 0, count: 0 };
        }
        companyStats[calc.deal.company].total += net;
        companyStats[calc.deal.company].count += 1;

        // Agent
        const agent = calc.deal.agentName || "לא משויך";
        if (!agentStats[agent]) {
            agentStats[agent] = { total: 0, deals: 0 };
        }
        agentStats[agent].total += net;
        agentStats[agent].deals += 1;

        // Product
        const prod = calc.deal.productType;
        productStats[prod] = (productStats[prod] || 0) + net;
    });

    const maxCompanyVal = Math.max(...Object.values(companyStats).map(c => c.total), 1);
    const maxAgentVal = Math.max(...Object.values(agentStats).map(a => a.total), 1);

    // --- Export CSV ---
    const handleExportCSV = () => {
        const headers = ['לקוח', 'סוכן', 'מוצר', 'חברה', 'עמלת היקף', 'נפרעים', 'צבירה', 'ניוד', 'סה"כ'];
        const rows = activeCalculations.map(({ deal, result }) => [
            deal.clientName || '-',
            deal.agentName || '-',
            deal.productType,
            deal.company,
            result.heikefCommission.toFixed(2),
            result.nifraaimCommission.toFixed(2),
            result.tzviraCommission.toFixed(2),
            result.niudCommission.toFixed(2),
            result.totalOneTime.toFixed(2),
        ]);

        const bom = '\uFEFF';
        const csvContent = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `commission_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('הדוח יוצא בהצלחה!');
    };

    // --- Save Formula Config ---
    const handleSaveFormulas = () => {
        setFormulas(editingFormulas);
        setShowFormulaModal(false);
        toast.success('נוסחאות החישוב עודכנו בהצלחה!');
    };

    const handleResetFormulas = () => {
        setEditingFormulas(DEFAULT_FORMULAS);
    };

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-500 pb-20" dir="rtl">

                {/* Header Hero */}
                <div className="bg-linear-to-r from-slate-900 via-amber-900/20 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-amber-500/20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-amber-500/20 rounded-lg text-amber-400 backdrop-blur-md">
                                    <Wallet size={24} />
                                </span>
                                <h1 className="text-3xl font-black font-display">
                                    {isAdmin ? 'ניהול עמלות וביצועים' : 'העמלות שלי'}
                                </h1>
                                {isAdmin ? <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                        <Lock size={12} className="ml-1" />
                                        תצוגה מוגבלת
                                    </Badge> : null}
                            </div>
                            <p className="text-slate-400 font-medium max-w-xl">
                                {isAdmin 
                                    ? 'מעקב מתקדם אחר עמלות היקף, נפרעים, צבירה וניוד בזמן אמת.'
                                    : 'צפה בעמלות שלך לפי תמהיל השכר המוגדר.'
                                }
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setEditingFormulas(formulas);
                                    setShowFormulaModal(true);
                                }}
                            >
                                <Calculator size={16} className="ml-2" />
                                נוסחאות חישוב
                            </Button>
                            {isAdmin ? <Button variant="gold" onClick={handleExportCSV}>
                                    <Download size={16} className="ml-2" />
                                    ייצוא דוח
                                </Button> : null}
                        </div>
                    </div>

                    {/* Quick Stats Row inside Hero - Different for Admin vs Agent */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
                        {isAdmin ? (
                            <>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">סה״כ עמלות היקף</p>
                                    <h3 className="text-3xl font-black font-mono text-amber-400">₪{totalHeikef.toLocaleString()}</h3>
                                    <p className="text-slate-500 text-xs mt-2">פרמיה × {formulas.insuranceHeikefMultiplier}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">עמלות נפרעים (חודשי)</p>
                                    <h3 className="text-3xl font-black font-mono text-blue-400">₪{totalNifraim.toLocaleString()}</h3>
                                    <p className="text-slate-500 text-xs mt-2">{(formulas.insuranceNifraimPercentage * 100).toFixed(0)}% מהפרמיה • שנתי: ₪{(totalNifraim * 12).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">עמלות צבירה + ניוד</p>
                                    <h3 className="text-3xl font-black font-mono text-emerald-400">₪{(totalTzvira + totalNiud).toLocaleString()}</h3>
                                    <p className="text-slate-500 text-xs mt-2">פנסיה: ₪{totalTzvira.toLocaleString()} | ניוד: ₪{totalNiud.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">סה״כ נטו</p>
                                    <h3 className="text-3xl font-black font-mono text-white">₪{netCommission.toLocaleString()}</h3>
                                    {totalClawback > 0 && (
                                        <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                                            <ArrowDownRight size={12} />
                                            החזרים: ₪{totalClawback.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            // תצוגה לסוכן - רק העמלות שלו לפי תמהיל
                            <>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 col-span-2">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">העמלות שלי החודש</p>
                                    <h3 className="text-4xl font-black font-mono text-amber-400">
                                        ₪{getAgentCommissions(user?.displayName || 'סוכן').total.toLocaleString()}
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-2">לפי תמהיל השכר שלך</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">עסקאות פעילות</p>
                                    <h3 className="text-3xl font-black font-mono text-blue-400">
                                        {activeCalculations.filter(c => c.deal.agentName === user?.displayName).length}
                                    </h3>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">נפרעים חודשי</p>
                                    <h3 className="text-3xl font-black font-mono text-emerald-400">
                                        ₪{getAgentCommissions(user?.displayName || 'סוכן').nifraim.toLocaleString()}
                                    </h3>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Formula Info Card - DARK THEME */}
                {isAdmin ? <Card className="border border-amber-500/20 p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                                <Info size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-lg text-amber-100 mb-2">נוסחאות חישוב עמלות</h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="glass-card p-4 rounded-xl border border-amber-500/20">
                                        <p className="font-bold text-amber-400 mb-1">🛡️ עמלת היקף (ביטוח)</p>
                                        <p className="text-slate-300 font-mono text-xs">פרמיה חודשית × {formulas.insuranceHeikefMultiplier}</p>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-blue-500/20">
                                        <p className="font-bold text-blue-400 mb-1">💰 עמלת נפרעים</p>
                                        <p className="text-slate-300 font-mono text-xs">{(formulas.insuranceNifraimPercentage * 100).toFixed(0)}% מהפרמיה החודשית</p>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-emerald-500/20">
                                        <p className="font-bold text-emerald-400 mb-1">📊 עמלת צבירה פנסיה</p>
                                        <p className="text-slate-300 font-mono text-xs">₪{formulas.pensionTzviraRate.toLocaleString()} לכל מיליון ₪</p>
                                    </div>
                                    <div className="glass-card p-4 rounded-xl border border-purple-500/20">
                                        <p className="font-bold text-purple-400 mb-1">🎓 קרן השתלמות</p>
                                        <p className="text-slate-300 font-mono text-xs">₪{formulas.kerenTzviraRate.toLocaleString()} לכל מיליון ₪</p>
                                    </div>
                                </div>
                                <div className="mt-3 glass-card p-4 rounded-xl border border-cyan-500/20 inline-block">
                                    <p className="font-bold text-cyan-400 mb-1">🔄 עמלת ניוד פנסיה</p>
                                    <p className="text-slate-300 font-mono text-xs">משכורת × 12 × {formulas.pensionNiudMultiplier}</p>
                                </div>
                                <p className="text-xs text-amber-500 mt-3 font-medium">
                                    ⚡ חישוב העמלות מתבצע אוטומטית כאשר סטטוס התפעול משתנה ל&quot;פוליסה הופקה&quot;
                                </p>
                            </div>
                        </div>
                    </Card> : null}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Production Pipeline Chart */}
                    <Card className="lg:col-span-3 p-8 border-t-4! border-t-amber-500 shadow-xl relative overflow-hidden bg-slate-900/50 backdrop-blur-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-amber-500 rounded-xl text-black">
                                        <TrendingUp size={24} />
                                    </div>
                                    מעקב תפוקה וגבייה (Expected vs Actual)
                                </h3>
                                <p className="text-slate-500 font-bold text-sm mt-1">השוואה בין עסקאות בתהליך לבין עמלות שהתקבלו בפועל</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="text-xs font-black text-slate-400 uppercase">צפי עמלות</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <span className="text-xs font-black text-slate-400 uppercase">הופק בפועל</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                            {/* Visual Chart Bars */}
                            <div className="space-y-8">
                                {[
                                    { month: 'ינואר', expected: 85000, actual: 42000 },
                                    { month: 'פברואר', expected: 92000, actual: 68000 },
                                    { month: 'מרץ', expected: 124000, actual: 95000 },
                                    { month: 'אפריל (נוכחי)', expected: 156000, actual: 48000 }
                                ].map((data, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-black text-white">{data.month}</span>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-slate-500 uppercase block">שיעור גבייה</span>
                                                <span className="text-xs font-mono text-amber-400 font-black">{Math.round((data.actual / data.expected) * 100)}%</span>
                                            </div>
                                        </div>
                                        <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(data.expected / 160000) * 100}%` }}
                                                className="absolute inset-y-0 right-0 bg-slate-800 rounded-full"
                                            />
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(data.actual / 160000) * 100}%` }}
                                                className="absolute inset-y-0 right-0 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex flex-col justify-center items-center text-center">
                                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">עסקאות במעקב (Pending)</div>
                                    <div className="text-3xl font-black text-white font-mono italic">₪284,500</div>
                                    <p className="text-slate-500 text-[10px] mt-2 font-bold">צפי כניסה: 30-60 יום</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center items-center text-center">
                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">הסדרים סגורים (Settled)</div>
                                    <div className="text-3xl font-black text-white font-mono italic">₪142,300</div>
                                    <p className="text-slate-500 text-[10px] mt-2 font-bold">החודש הנוכחי</p>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center col-span-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">יעד חודשי סוכנות</div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 mb-4 overflow-hidden max-w-[200px]">
                                        <div className="h-full w-3/4 bg-blue-500" />
                                    </div>
                                    <div className="text-xl font-black text-white">75% מהיעד הושג</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Company Performance Bar Chart */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-lg text-amber-100 flex items-center gap-2">
                                    <span className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><Building2 size={18} /></span>
                                    ביצועים לפי חברת ביטוח
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(companyStats).length > 0 ? (
                                    Object.entries(companyStats)
                                        .sort(([, a], [, b]) => b.total - a.total)
                                        .slice(0, 6)
                                        .map(([company, data], i) => (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-slate-300 flex items-center gap-2">
                                                        {company}
                                                        <span className="text-xs text-slate-500 font-normal">({data.count} פוליסות)</span>
                                                    </span>
                                                    <span className="text-amber-100 font-mono">₪{data.total.toLocaleString()}</span>
                                                </div>
                                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(data.total / maxCompanyVal) * 100}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className={`h-full rounded-full ${i === 0 ? "bg-amber-500" :
                                                                i === 1 ? "bg-amber-400" :
                                                                    "bg-amber-600"
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <Building2 size={32} className="mx-auto mb-2 text-slate-600" />
                                        <p className="font-bold text-slate-400">אין נתונים להצגה</p>
                                        <p className="text-xs">הוסף פוליסות ללקוחות כדי לראות את הביצועים</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Transactions Table */}
                        <Card className="overflow-hidden p-0">
                            <div className="p-6 border-b border-amber-500/10 flex justify-between items-center">
                                <h3 className="font-black text-lg text-amber-100 flex items-center gap-2">
                                    <span className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><DollarSign size={18} /></span>
                                    פירוט עמלות לפי עסקה
                                    {!isAdmin ? <Badge className="bg-amber-500/20 text-amber-300 text-xs">העסקאות שלי</Badge> : null}
                                </h3>
                                <Button variant="ghost" size="sm">צפה בהכל</Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-800/80 text-amber-400/70 font-bold uppercase text-xs border-b border-amber-500/10">
                                        <tr>
                                            <th className="p-4">לקוח</th>
                                            {isAdmin ? <th className="p-4">סוכן</th> : null}
                                            <th className="p-4">מוצר</th>
                                            <th className="p-4">חברה</th>
                                            <th className="p-4 text-amber-400">עמלת היקף</th>
                                            <th className="p-4 text-blue-400">נפרעים</th>
                                            <th className="p-4 text-emerald-400">סה״כ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {activeCalculations.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle size={32} className="text-slate-600" />
                                                        <p className="font-bold text-slate-400">אין עמלות להצגה</p>
                                                        <p className="text-xs">עמלות יחושבו כאשר סטטוס התפעול ישתנה ל&quot;פוליסה הופקה&quot;</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            activeCalculations
                                                .filter(c => isAdmin || c.deal.agentName === user?.displayName)
                                                .slice(0, 15)
                                                .map(({ deal, result }, i) => (
                                                <tr key={i} className="hover:bg-amber-500/5 transition-colors">
                                                    <td className="p-4 font-bold text-slate-200">
                                                        {deal.clientName || '—'}
                                                    </td>
                                                    {isAdmin ? <td className="p-4 text-slate-400">
                                                            {deal.agentName || '—'}
                                                        </td> : null}
                                                    <td className="p-4">
                                                        <Badge variant="outline" className="text-slate-300 font-medium">
                                                            {deal.productType === 'life' && '❤️ חיים'}
                                                            {deal.productType === 'health' && '🏥 בריאות'}
                                                            {deal.productType === 'pension' && '💰 פנסיה'}
                                                            {deal.productType === 'keren_hishtalmut' && '🎓 קרן השתלמות'}
                                                            {deal.productType === 'pension_transfer' && '🔄 ניוד'}
                                                            {deal.productType === 'elementary' && '🚗 אלמנטרי'}
                                                            {deal.productType === 'finance' && '📈 פיננסים'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-slate-400 font-medium">{deal.company}</td>
                                                    <td className="p-4 font-bold font-mono text-amber-400">
                                                        ₪{result.heikefCommission.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 font-bold font-mono text-blue-400">
                                                        ₪{result.nifraaimCommission.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 font-black font-mono text-emerald-400">
                                                        ₪{result.totalOneTime.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        {/* Top Agents Leaderboard - Admin Only */}
                        {isAdmin ? <Card className="border-none shadow-xl bg-linear-to-b from-slate-900 to-slate-800 text-white p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                                <h3 className="font-black text-lg mb-6 flex items-center gap-2 relative z-10">
                                    <span className="bg-white/10 p-2 rounded-lg text-amber-400"><Users size={18} /></span>
                                    מובילים במכירות
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    {Object.entries(agentStats).length > 0 ? (
                                        Object.entries(agentStats)
                                            .sort(([, a], [, b]) => b.total - a.total)
                                            .map(([agent, data], i) => (
                                                <div key={i} className="flex items-center gap-4 group">
                                                    <div className={`
                                                    h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-black text-sm border-2
                                                    ${i === 0 ? "bg-amber-400 text-amber-900 border-amber-300 shadow-lg shadow-amber-500/20 scale-110" :
                                                            i === 1 ? "bg-slate-300 text-slate-800 border-slate-200" :
                                                                "bg-amber-700/50 text-amber-100 border-amber-800"}
                                                `}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate text-white group-hover:text-amber-300 transition-colors">
                                                            {agent}
                                                            <span className="text-slate-500 text-xs font-normal mr-2">({data.deals} עסקאות)</span>
                                                        </p>
                                                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(data.total / maxAgentVal) * 100}%` }}
                                                                className="h-full bg-linear-to-r from-amber-500 to-amber-400"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="font-mono text-sm font-bold text-amber-400">₪{data.total.toLocaleString()}</p>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-400">
                                            <Users size={28} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">אין נתונים על סוכנים</p>
                                        </div>
                                    )}
                                </div>
                            </Card> : null}

                        {/* Commission Breakdown by Type */}
                        <Card className="p-6">
                            <h3 className="font-black text-lg text-amber-100 mb-6 flex items-center gap-2">
                                <span className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><PieChart size={18} /></span>
                                פילוח לפי סוג עמלה
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-amber-500/20">
                                    <span className="flex items-center gap-2 text-amber-400 font-bold">
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        עמלת היקף
                                    </span>
                                    <span className="font-black font-mono text-amber-400">₪{(isAdmin ? totalHeikef : getAgentCommissions(user?.displayName || '').heikef).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-blue-500/20">
                                    <span className="flex items-center gap-2 text-blue-400 font-bold">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        נפרעים (חודשי)
                                    </span>
                                    <span className="font-black font-mono text-blue-400">₪{(isAdmin ? totalNifraim : getAgentCommissions(user?.displayName || '').nifraim).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-emerald-500/20">
                                    <span className="flex items-center gap-2 text-emerald-400 font-bold">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        צבירה (פנסיה/קה״ש)
                                    </span>
                                    <span className="font-black font-mono text-emerald-400">₪{(isAdmin ? totalTzvira : getAgentCommissions(user?.displayName || '').tzvira).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-purple-500/20">
                                    <span className="flex items-center gap-2 text-purple-400 font-bold">
                                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                                        ניוד פנסיה
                                    </span>
                                    <span className="font-black font-mono text-purple-400">₪{(isAdmin ? totalNiud : getAgentCommissions(user?.displayName || '').niud).toLocaleString()}</span>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-amber-500/10">
                                <div className="flex items-center justify-between">
                                    <span className="font-black text-amber-100">סה״כ חד פעמי</span>
                                    <span className="font-black font-mono text-2xl text-white">
                                        ₪{(isAdmin ? totalOneTime : getAgentCommissions(user?.displayName || '').total).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ═══════════════════════ FORMULA CONFIGURATION MODAL ═══════════════════════ */}
                <AnimatePresence>
                    {showFormulaModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card border border-amber-500/20 rounded-3xl w-full max-w-2xl shadow-2xl"
                            >
                                {/* Modal Header */}
                                <div className="p-6 border-b border-amber-500/20 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-black text-amber-100 flex items-center gap-3">
                                            <Calculator size={24} className="text-amber-400" />
                                            הגדרת נוסחאות חישוב
                                        </h2>
                                        <p className="text-slate-400 text-xs font-bold mt-1">עדכן את ערכי הנוסחאות לסוכנות שלך</p>
                                    </div>
                                    <button onClick={() => setShowFormulaModal(false)} className="p-2 hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-red-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-8 space-y-6">
                                    {[
                                        {
                                            label: '🛡️ מכפיל עמלת היקף (ביטוח)',
                                            key: 'insuranceHeikefMultiplier' as const,
                                            description: 'פרמיה חודשית × ערך זה',
                                            step: 0.1,
                                            color: 'amber',
                                        },
                                        {
                                            label: '💰 אחוז עמלת נפרעים',
                                            key: 'insuranceNifraimPercentage' as const,
                                            description: 'אחוז מהפרמיה החודשית (0.23 = 23%)',
                                            step: 0.01,
                                            color: 'blue',
                                        },
                                        {
                                            label: '📊 עמלת צבירה פנסיה (₪ למיליון)',
                                            key: 'pensionTzviraRate' as const,
                                            description: 'על כל 1,000,000 ₪ צבירה',
                                            step: 100,
                                            color: 'emerald',
                                        },
                                        {
                                            label: '🎓 עמלת צבירה קרן השתלמות (₪ למיליון)',
                                            key: 'kerenTzviraRate' as const,
                                            description: 'על כל 1,000,000 ₪ צבירה',
                                            step: 100,
                                            color: 'purple',
                                        },
                                        {
                                            label: '🔄 מכפיל ניוד פנסיה',
                                            key: 'pensionNiudMultiplier' as const,
                                            description: 'משכורת × 12 × ערך זה',
                                            step: 0.001,
                                            color: 'cyan',
                                        },
                                    ].map((field) => (
                                        <div key={field.key} className={`glass-card border border-${field.color}-500/20 rounded-2xl p-4`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className={`font-bold text-${field.color}-400 text-sm`}>{field.label}</label>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    ברירת מחדל: {DEFAULT_FORMULAS[field.key]}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-3">{field.description}</p>
                                            <input
                                                type="number"
                                                step={field.step}
                                                value={editingFormulas[field.key]}
                                                onChange={(e) => setEditingFormulas(prev => ({
                                                    ...prev,
                                                    [field.key]: parseFloat(e.target.value) || 0
                                                }))}
                                                className="w-full glass-card border border-amber-500/20 rounded-xl px-4 py-3 font-bold font-mono text-lg text-amber-100 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 outline-none bg-transparent"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-amber-500/20 flex justify-between items-center">
                                    <Button variant="ghost" onClick={handleResetFormulas} className="text-slate-400 hover:text-amber-400">
                                        <RotateCcw size={14} className="ml-2" />
                                        איפוס לברירת מחדל
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" onClick={() => setShowFormulaModal(false)} className="text-slate-400">
                                            ביטול
                                        </Button>
                                        <Button variant="gold" onClick={handleSaveFormulas}>
                                            <Save size={16} className="ml-2" />
                                            שמור נוסחאות
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardShell>
    );
}
