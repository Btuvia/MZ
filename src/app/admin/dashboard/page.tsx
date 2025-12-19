"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card } from "@/components/ui/base";

export default function AdminDashboard() {
    const navItems = [
        { label: "ראשי (לוח בקרה)", href: "/admin/dashboard", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
        { label: "ניהול לקוחות", href: "/admin/clients", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { label: "ניהול לידים", href: "/admin/leads", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg> },
        { label: "ניהול מכירות (Kanban)", href: "/admin/sales", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7v10" /><path d="M12 7v10" /><path d="M17 7v10" /></svg> },
        { label: "יומן ומשימות", href: "/admin/calendar", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
        { label: "אנליטיקס", href: "/admin/analytics", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg> },
        { label: "כלי AI", href: "/admin/ai-tools", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2V4" /><path d="M12 20V22" /><path d="M20.66 7l-1.73 1" /><path d="M5.07 16l-1.73 1" /><path d="M17.32 19l-1 1.73" /><path d="M7.68 3.27l-1 1.73" /><path d="M22 12h-2" /><path d="M4 12H2" /><path d="M20.66 17l-1.73-1" /><path d="M5.07 8l-1.73-1" /><path d="M17.32 5l-1-1.73" /><path d="M7.68 20.73l-1-1.73" /><circle cx="12" cy="12" r="3" /></svg> },
        { label: "מרכז הדרכה", href: "/admin/training", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg> },
        { label: "שותפים", href: "/admin/partners", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { label: "ניהול סוכנות", href: "/admin/agency", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
        { label: "ניהול משתמשים", href: "/admin/users", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    ];

    return (
        <DashboardShell role="מנהל" navItems={navItems}>
            <div className="space-y-8 animate-in fade-in duration-700">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-primary">סקירה כללית</h2>
                        <p className="text-slate-500">נתוני הסוכנות בזמן אמת</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-border text-sm font-bold text-primary hover:bg-slate-50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            ייצוא דוחות
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-accent rounded-xl text-sm font-bold text-white shadow-lg shadow-accent/20 hover:bg-blue-700 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            הוספת סוכן
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="hover:translate-y-[-2px] transition-transform">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">סה״כ לקוחות</p>
                        <p className="text-3xl font-black text-primary">1,284</p>
                    </Card>

                    <Card className="hover:translate-y-[-2px] transition-transform">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </div>
                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">+8%</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">עמלות (ש״ח)</p>
                        <p className="text-3xl font-black text-primary">₪420,500</p>
                    </Card>

                    <Card className="hover:translate-y-[-2px] transition-transform">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">ממוצע</span>
                        </div>
                        <p className="text-sm font-bold text-slate-400">זמן טיפול (SLA)</p>
                        <p className="text-3xl font-black text-primary">2.4 ימים</p>
                    </Card>

                    <Card className="hover:translate-y-[-2px] transition-transform text-white bg-accent border-none shadow-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-white/20 text-white rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">LIVE</span>
                        </div>
                        <p className="text-sm font-bold text-blue-100">דירוג איכות נתונים</p>
                        <p className="text-3xl font-black">94%</p>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card title="פעילות סוכנים אחרונה" className="lg:col-span-2 border-none shadow-md">
                        <div className="space-y-6 mt-2">
                            {[
                                { name: "מיכל כהן", action: "הפיקה פוליסת בריאות חדשה - הראל", time: "לפני 12 דק׳", img: "M" },
                                { name: "דניאל לוי", action: "סגר עסקת פנסיה גדולה (ניוד)", time: "לפני 45 דק׳", img: "D" },
                                { name: "שי גבאי", action: "עדכן פרטי מוטבים ללקוח", time: "לפני שעה", img: "S" },
                                { name: "רונית אשכנזי", action: "הזמינה מסלקה ל-3 לידים חדשים", time: "לפני שעתיים", img: "R" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-5 last:border-0 last:pb-0 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-slate-600 border border-slate-100 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-300">
                                            {item.img}
                                        </div>
                                        <div>
                                            <p className="font-bold text-primary group-hover:text-accent transition-colors">{item.name}</p>
                                            <p className="text-sm text-slate-500">{item.action}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <Card className="bg-primary border-none text-white shadow-xl shadow-primary/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z" /></svg>
                                </div>
                                <h3 className="font-bold">AI Insights</h3>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                מערכת ה-AI זיהתה פוטנציאל לחיסכון של 15% בדמי הניהול עבור 12 לקוחות פנסיה פעילים החודש.
                            </p>
                            <button className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10">
                                הפק דו״ח המלצות
                            </button>
                        </Card>

                        <Card title="התראות מערכת" className="border-none shadow-md">
                            <ul className="space-y-4">
                                <li className="flex gap-4 p-3 bg-error/5 rounded-xl border border-error/10">
                                    <div className="h-5 w-5 rounded-full bg-error text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">!</div>
                                    <div>
                                        <p className="text-sm font-bold text-error">4 פוליסות בעיכוב</p>
                                        <p className="text-xs text-slate-500">ממתינות לאישור חברה מעל 7 ימים</p>
                                    </div>
                                </li>
                                <li className="flex gap-4 p-3 bg-accent/5 rounded-xl border border-accent/10">
                                    <div className="h-5 w-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">i</div>
                                    <div>
                                        <p className="text-sm font-bold text-accent">עדכון מחשבון הנחות</p>
                                        <p className="text-xs text-slate-500">קובץ תעריפי מנורה עודכן בהצלחה</p>
                                    </div>
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
