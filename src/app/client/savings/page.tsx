"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useState, useEffect } from "react";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function SavingsPage() {
    const [selectedPension, setSelectedPension] = useState<number | null>(null);
    const { user } = useAuth(); // Assuming AuthContext provides 'user'
    const [pensionAccounts, setPensionAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!user?.uid) return;
            setLoading(true);
            try {
                const data = await firestoreService.getFinancialProducts(user.uid);
                if (data.length > 0) {
                    setPensionAccounts(data);
                } else {
                    // Start with empty, or optionally offer to create demo data
                    setPensionAccounts([]);
                }
            } catch (error) {
                console.error("Error fetching financial products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [user?.uid]);

    const handleCreateDemoData = async () => {
        if (!user?.uid) return;
        setLoading(true);
        const demoProducts = [
            {
                clientId: user.uid,
                name: "קרן פנסיה - מבטחים (הדגמה)",
                type: "קרן פנסיה",
                accountNumber: "DEMO-2024-001",
                balance: "₪285,400",
                monthlyDeposit: "₪1,200",
                employerContribution: "₪800",
                returns: "+5.2%",
                riskLevel: "בינוני-גבוה",
                icon: "👨‍👩‍👧‍👦",
                color: "from-blue-600 to-indigo-700",
                details: {
                    startDate: "01/03/2018",
                    managementFees: "0.52%",
                    savingsFees: "0.05%",
                    allocation: [
                        { name: "מניות", percentage: 60, color: "bg-blue-500" },
                        { name: "אג״ח", percentage: 30, color: "bg-emerald-500" },
                        { name: "מזומן", percentage: 10, color: "bg-amber-500" }
                    ]
                }
            },
            {
                clientId: user.uid, // Important: link to current user
                name: "ביטוח מנהלים - הפניקס (הדגמה)",
                type: "ביטוח מנהלים",
                accountNumber: "DEMO-2024-002",
                balance: "₪142,830",
                monthlyDeposit: "₪650",
                employerContribution: "₪450",
                returns: "+4.8%",
                riskLevel: "בינוני",
                icon: "💼",
                color: "from-emerald-600 to-teal-700",
                details: {
                    startDate: "15/06/2020",
                    managementFees: "0.48%",
                    savingsFees: "0.04%",
                    allocation: [
                        { name: "מניות", percentage: 50, color: "bg-blue-500" },
                        { name: "אג״ח", percentage: 40, color: "bg-emerald-500" },
                        { name: "מזומן", percentage: 10, color: "bg-amber-500" }
                    ]
                }
            }
        ];

        for (const p of demoProducts) {
            await firestoreService.addFinancialProduct(p);
        }

        // Refresh
        const data = await firestoreService.getFinancialProducts(user.uid);
        setPensionAccounts(data);
        setLoading(false);
    };

    const totalBalance = pensionAccounts.reduce((sum, acc) => {
        // Handle both number and string with '₪'
        const val = typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance?.replace(/[₪,]/g, '') || '0');
        return sum + val;
    }, 0);

    const totalMonthlyDeposit = pensionAccounts.reduce((sum, acc) => {
        const val = typeof acc.monthlyDeposit === 'number' ? acc.monthlyDeposit : parseFloat(acc.monthlyDeposit?.replace(/[₪,]/g, '') || '0');
        return sum + val;
    }, 0);

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">החיסכון הפנסיוני שלי</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            מעקב אחר כל חשבונות החיסכון והפנסיה שלך. צפייה בתשואות, הפקדות ומסלולי השקעה.
                        </p>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none p-8 text-white bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl relative overflow-hidden group col-span-1 md:col-span-2">
                        <div className="absolute -right-8 -bottom-8 text-white/5 text-9xl font-black group-hover:scale-125 transition-transform duration-700">💎</div>
                        <div className="relative z-10">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70 mb-3">סך צבירה כולל</p>
                            <h2 className="text-6xl font-black tracking-tighter font-display mb-4">₪{totalBalance.toLocaleString()}</h2>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-success/30 text-white border-success/30 px-4 py-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
                                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                        <polyline points="16 7 22 7 22 13" />
                                    </svg>
                                    תשואה ממוצעת: +5.4%
                                </Badge>
                                <span className="text-xs text-white/60 font-bold">עודכן: היום</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none p-8 text-white bg-gradient-to-br from-emerald-600 to-teal-700 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">📈</div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">הפקדה חודשית</p>
                            <h4 className="text-4xl font-black tracking-tighter font-display mb-2">₪{totalMonthlyDeposit.toLocaleString()}</h4>
                            <p className="text-xs text-white/60 font-bold">עובד + מעביד</p>
                        </div>
                    </Card>
                </div>

                {/* Pension Accounts */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p>טוען נתונים...</p>
                        </div>
                    ) : pensionAccounts.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <div className="text-4xl mb-4">📭</div>
                            <h3 className="text-lg font-black text-slate-700 mb-2">טרם הוזנו מוצרים פנסיוניים</h3>
                            <p className="text-slate-500 mb-6">הסוכן עדיין לא הזין את תיק הביטוח שלך.</p>
                            <Button onClick={handleCreateDemoData} disabled={loading}>
                                צור נתוני דמה לבדיקה
                            </Button>
                        </div>
                    ) : (
                        pensionAccounts.map((account) => (
                            <Card key={account.id} className="border-none shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all">
                                <div className={`h-2 w-full bg-gradient-to-r ${account.color}`}></div>
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${account.color} flex items-center justify-center text-3xl shadow-lg`}>
                                                {account.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-primary">{account.name}</h3>
                                                <p className="text-sm font-bold text-slate-400 mt-1">{account.type} • {account.accountNumber}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-600 border-slate-200 px-4 py-2">
                                            סיכון: {account.riskLevel}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">יתרה נוכחית</p>
                                            <p className="text-2xl font-black text-primary tracking-tighter">{account.balance}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">הפקדה חודשית</p>
                                            <p className="text-lg font-bold text-primary">{account.monthlyDeposit}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תרומת מעביד</p>
                                            <p className="text-lg font-bold text-primary">{account.employerContribution}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תשואה שנתית</p>
                                            <p className="text-lg font-bold text-success">{account.returns}</p>
                                        </div>
                                    </div>

                                    {selectedPension === account.id && (
                                        <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">תאריך פתיחה</p>
                                                    <p className="text-sm font-bold text-primary">{account.details.startDate}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">דמי ניהול</p>
                                                    <p className="text-sm font-bold text-primary">{account.details.managementFees}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">דמי חיסכון</p>
                                                    <p className="text-sm font-bold text-primary">{account.details.savingsFees}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-black text-primary mb-4 flex items-center gap-2">
                                                    <span className="text-accent">📊</span> חלוקת נכסים
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="space-y-3">
                                                        {account.details?.allocation?.map((asset: any, i: number) => (
                                                            <div key={i}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-bold text-slate-600">{asset.name}</span>
                                                                    <span className="text-sm font-black text-primary">{asset.percentage}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${asset.color} rounded-full transition-all duration-500`} style={{ width: `${asset.percentage}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setSelectedPension(selectedPension === account.id ? null : account.id)}
                                        >
                                            {selectedPension === account.id ? "הסתר פרטים" : "הצג פרטים מלאים"}
                                        </Button>
                                        <Button variant="outline" size="sm" className="px-6">
                                            הורד דוח
                                        </Button>
                                        <Button variant="outline" size="sm" className="px-6">
                                            שנה מסלול
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                {/* Recommendations */}
                <Card className="border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1 bg-accent"></div>
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent text-xl animate-pulse">
                            ✨
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black mb-2">המלצה מהסוכן שלך</h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                                שים לב! דמי הניהול בקרן הפנסיה שלך גבוהים יחסית. ניתן לחסוך כ-₪140 בחודש על ידי מעבר לקרן עם דמי ניהול נמוכים יותר.
                            </p>
                            <Button variant="secondary" size="sm" className="shadow-xl shadow-accent/20">
                                קבע פגישת ייעוץ
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
