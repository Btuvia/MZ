"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "מנהל" | "סוכן" | "לקוח";
    navItems: NavItem[];
}

export default function DashboardShell({ children, role, navItems }: DashboardLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir="rtl">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 border-l border-border bg-white p-6 shadow-sm z-10 shrink-0">
                <div className="mb-10 flex items-center gap-3 px-2">
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-white font-black text-xl shadow-lg shadow-accent/20">M</div>
                    <div>
                        <h2 className="text-xl font-black text-primary leading-tight tracking-tight">Insur<span className="text-accent">CRM</span></h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Magen Zahav</p>
                    </div>
                </div>

                <div className="mb-6 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">פרופיל נוכחי</p>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                        <p className="text-sm font-bold text-primary">{role}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${isActive
                                        ? "bg-accent text-white shadow-lg shadow-accent/25"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                                    }`}
                            >
                                <span className={`transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-accent"}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-6 pt-6 border-t border-border">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error transition-all hover:bg-error/5 group"
                    >
                        <svg
                            className="transition-transform group-hover:rotate-12"
                            xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        התנתקות
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-20 border-b border-border bg-white px-8 lg:px-12 flex items-center justify-between shrink-0 z-0">
                    <div className="flex items-center gap-6">
                        <div className="lg:hidden h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-white font-black text-xs shadow-md">M</div>
                        <h1 className="text-xl font-bold text-primary hidden sm:block">לוח בקרה</h1>
                        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span>{new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-accent hover:bg-accent/5 transition-colors border border-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        </button>
                        <div className="flex items-center gap-3 pl-2 pr-1 py-1 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-bold text-primary leading-none">מנהל מערכת</p>
                                <p className="text-[10px] text-slate-400 mt-1">magen@insurcrm.co.il</p>
                            </div>
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                    M
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-white"></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50/50 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
