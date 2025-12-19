import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button } from "@/components/ui/base";

export default function AgentDashboard() {
    const navItems = [
        { label: "דף הבית", href: "/agent/dashboard" },
        { label: "הלקוחות שלי", href: "/agent/clients" },
        { label: "פוליסות בטיפול", href: "/agent/policies" },
        { label: "תיקי פנסיה", href: "/agent/pension" },
        { label: "משימות", href: "/agent/tasks" },
    ];

    return (
        <DashboardShell role="סוכן" navItems={navItems}>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">הפעולות שלי</h2>
                    <Button variant="secondary" size="sm">+ לקוח חדש</Button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-r-4 border-r-accent">
                        <h4 className="text-sm font-medium text-slate-500">משימות להיום</h4>
                        <p className="text-3xl font-bold">8</p>
                    </Card>
                    <Card className="border-r-4 border-r-warning">
                        <h4 className="text-sm font-medium text-slate-500">חידושים קרובים</h4>
                        <p className="text-3xl font-bold">12</p>
                    </Card>
                    <Card className="border-r-4 border-r-success">
                        <h4 className="text-sm font-medium text-slate-500">סגירות החודש</h4>
                        <p className="text-3xl font-bold">₪45,000</p>
                    </Card>
                </div>

                <Card title="רשימת מעקב - לקוחות בטיפול">
                    <table className="w-full text-right text-sm">
                        <thead>
                            <tr className="border-b border-border text-slate-400">
                                <th className="pb-3 font-medium">שם הלקוח</th>
                                <th className="pb-3 font-medium">סוג פעילות</th>
                                <th className="pb-3 font-medium">סטטוס</th>
                                <th className="pb-3 font-medium">פעולה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {[
                                { name: "אברהם כהן", type: "ביטוח בריאות", status: "ממתין לחיתום", color: "text-warning" },
                                { name: "שרה לוי", type: "ניוד פנסיה", status: "בתהליך הצטרפות", color: "text-accent" },
                                { name: "יצחק רחל", type: "ביטוח רכב", status: "הופק - פעיל", color: "text-success" },
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td className="py-4 font-semibold">{row.name}</td>
                                    <td className="py-4 text-slate-600">{row.type}</td>
                                    <td className={`py-4 font-medium ${row.color}`}>{row.status}</td>
                                    <td className="py-4"><Button variant="outline" size="sm">פרטים</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </DashboardShell>
    );
}
