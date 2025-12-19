import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";

export default function ClientDashboard() {
    const navItems = [
        { label: "התיק שלי", href: "/client/dashboard" },
        { label: "פוליסות ביטוח", href: "/client/policies" },
        { label: "חסכונות ופנסיה", href: "/client/savings" },
        { label: "מסמכים ואישורים", href: "/client/documents" },
        { label: "צור קשר עם הסוכן", href: "/client/contact" },
    ];

    return (
        <DashboardShell role="לקוח" navItems={navItems}>
            <div className="space-y-8">
                <header className="rounded-2xl bg-gradient-to-l from-primary to-primary-light p-8 text-white shadow-xl">
                    <h2 className="text-2xl font-bold">התיק הביטוחי שלך מעודכן</h2>
                    <p className="mt-2 text-slate-300">יש לך 4 פוליסות פעילות וקרן פנסיה אחת בניהולנו.</p>
                    <Button variant="secondary" className="mt-6">הורד דוח ריכוז נתונים</Button>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card title="פוליסות ביטוח פעילות">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                                <div>
                                    <p className="font-bold">ביטוח בריאות - "משלים"</p>
                                    <p className="text-xs text-slate-500">חברה: הראל | חידוש: 01/2026</p>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-primary">₪240</p>
                                    <p className="text-[10px] text-slate-400">חודשי</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                                <div>
                                    <p className="font-bold">ביטוח רכב מקיף</p>
                                    <p className="text-xs text-slate-500">חברה: הפניקס | חידוש: 05/2025</p>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-primary">₪3,200</p>
                                    <p className="text-[10px] text-slate-400">שנתי</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="חסכון ופנסיה">
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <div className="mb-4 text-sm font-medium text-slate-500">יתרה מצטברת מוערכת</div>
                            <div className="text-4xl font-black text-accent">₪458,230</div>
                            <div className="mt-2 text-xs text-success">רווחים השנה: +4.2%</div>
                            <Button variant="outline" size="sm" className="mt-6">פירוט מסלולי השקעה</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    );
}
