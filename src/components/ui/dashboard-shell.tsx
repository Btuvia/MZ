"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { NotificationsPanel } from "./notifications-panel";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "מנהל" | "סוכן" | "לקוח" | "אדמין";
    navItems?: NavItem[];
}

export default function DashboardShell({ children, role, navItems = [] }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="flex min-h-screen mesh-gradient font-sans selection:bg-accent/20 selection:text-accent" dir="rtl">
            {/* Premium Sidebar */}
            <aside className="fixed inset-y-4 right-4 z-50 hidden lg:flex flex-col w-72 glass rounded-3xl p-6 shadow-2xl transition-all duration-500">
                <div className="mb-10 flex items-center gap-4 px-2">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-accent/20 animate-float">M</div>
                    <div>
                        <h2 className="text-xl font-black text-primary leading-tight font-display tracking-tight">Magen<span className="text-accent">Zahav</span></h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Platinum Edition</p>
                    </div>
                </div>

                <div className="mb-8 px-4 py-3 bg-white/40 rounded-2xl border border-white/40 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">User Profile</p>
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                        <p className="text-sm font-black text-primary">{role}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group ${isActive
                                    ? "bg-primary text-white shadow-xl shadow-primary/10 translate-x-[-4px]"
                                    : "text-slate-500 hover:bg-white/60 hover:text-primary hover:shadow-md hover:translate-x-[-2px]"
                                    }`}
                            >
                                <span className={`transition-all duration-300 ${isActive ? "text-accent scale-110" : "text-slate-400 group-hover:text-accent group-hover:scale-110"}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-6 pt-6 border-t border-slate-200/50">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-error transition-all hover:bg-error/5 group"
                    >
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-error/10 text-error group-hover:bg-error group-hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </div>
                        התנתקות
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pr-0 lg:pr-80">
                {/* Floating Header */}
                <header className={`sticky top-4 left-4 right-4 z-40 transition-all duration-500 ${scrolled ? 'mx-4' : 'mx-0'}`}>
                    <div className={`flex items-center justify-between h-20 px-8 transition-all duration-500 ${scrolled ? 'glass rounded-3xl shadow-xl' : 'bg-transparent'}`}>
                        <div className="flex items-center gap-4">
                            <div className="lg:hidden h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg">M</div>
                            <h1 className="text-xl font-black text-primary font-display">
                                {pathname.split('/').pop() === 'dashboard' ? 'Overview' : pathname.split('/').pop()}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {user && <NotificationsPanel userId={user.uid} />}

                            <div className="flex items-center gap-3 p-1.5 glass-dark rounded-2xl shadow-xl border-none">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-accent to-blue-400 flex items-center justify-center text-white font-black shadow-inner">M</div>
                                <div className="hidden sm:block pl-2">
                                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest leading-none">Admin</p>
                                    <p className="text-xs font-bold text-white mt-1">Magen Zahav</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Overlay */}
                <main className="flex-1 p-4 lg:p-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
