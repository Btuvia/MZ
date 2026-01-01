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
        <div className="flex min-h-screen mesh-gradient font-sans selection:bg-amber-400/30 selection:text-amber-200" dir="rtl">
            {/* Premium Sidebar with Gold/Blue Neon Theme */}
            <aside className="fixed inset-y-4 right-4 z-50 hidden lg:flex flex-col w-72 glass-card rounded-3xl p-6 shadow-2xl transition-all duration-500 border border-amber-500/20">
                {/* Logo Section */}
                <div className="mb-10 flex items-center gap-4 px-2">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-900 font-black text-2xl shadow-xl shadow-amber-500/40 animate-float neon-gold">🛡️</div>
                    <div>
                        <h2 className="text-2xl font-black leading-tight font-display tracking-tight">
                            <span className="text-gradient-gold neon-text-gold">מגן</span>
                            <span className="text-gradient neon-text-blue">זהב</span>
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Insurance CRM</p>
                    </div>
                </div>

                {/* User Profile Badge */}
                <div className="mb-8 px-4 py-3 bg-gradient-to-r from-amber-500/10 to-blue-500/10 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">פרופיל משתמש</p>
                    <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                        <p className="text-sm font-black text-amber-200">{role}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto px-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 group ${isActive
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 shadow-xl shadow-amber-500/30 translate-x-[-4px] neon-gold"
                                    : "text-slate-400 hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-slate-700/80 hover:text-amber-200 hover:shadow-lg hover:translate-x-[-2px] hover:border-amber-500/20"
                                    }`}
                            >
                                <span className={`transition-all duration-300 ${isActive ? "text-slate-900 scale-110" : "text-slate-500 group-hover:text-amber-400 group-hover:scale-110"}`}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 group"
                    >
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
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
                    <div className={`flex items-center justify-between h-20 px-8 transition-all duration-500 ${scrolled ? 'glass-card rounded-3xl shadow-xl border border-amber-500/20' : 'bg-transparent'}`}>
                        <div className="flex items-center gap-4">
                            <div className="lg:hidden h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-900 font-black text-xl shadow-lg shadow-amber-500/40">🛡️</div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user && <NotificationsPanel userId={user.uid} />}

                            <div className="flex items-center gap-3 p-1.5 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-amber-500/30 hover:border-amber-500/50 transition-all">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-black shadow-inner neon-gold">🛡️</div>
                                <div className="hidden sm:block pl-2">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none neon-text-gold">{role}</p>
                                    <p className="text-xs font-bold text-slate-300 mt-1">מגן זהב</p>
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
