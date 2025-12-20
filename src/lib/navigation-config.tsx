import { LucideIcon, Home, Users, BarChart3, Calendar, Layers, ShieldCheck, UserCircle, Briefcase, Sparkles, GraduationCap, FileText, Settings, HelpCircle, MessageSquare, Wallet, Zap, Gift } from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
    { label: "לוח בקרה", href: "/admin/dashboard", icon: <Home size={18} /> },
    { label: "ניהול לקוחות", href: "/admin/clients", icon: <Users size={18} /> },
    { label: "סוכנים וצוותים", href: "/admin/users", icon: <UserCircle size={18} /> },
    { label: "ניהול לידים", href: "/admin/leads", icon: <Layers size={18} /> },
    { label: "תהליכי מכירה", href: "/admin/sales", icon: <Briefcase size={18} /> },
    { label: "יומן פעילות", href: "/admin/calendar", icon: <Calendar size={18} /> },
    { label: "אנליטיקס ודוחות", href: "/admin/analytics", icon: <BarChart3 size={18} /> },
    { label: "מרכז תקשורת", href: "/admin/communication", icon: <MessageSquare size={18} /> },
    { label: "ניתוח מסמכים (AI)", href: "/admin/ai-analysis", icon: <FileText size={18} /> },
    { label: "ניהול מבצעים", href: "/admin/campaigns", icon: <Zap size={18} /> },
    { label: "כלי AI", href: "/admin/ai-tools", icon: <Sparkles size={18} /> },
    { label: "ניהול סוכנות", href: "/admin/agency", icon: <ShieldCheck size={18} /> },
];

export const AGENT_NAV_ITEMS: NavItem[] = [
    { label: "ראשי (לוח בקרה)", href: "/agent/dashboard", icon: <Home size={18} /> },
    { label: "הלקוחות שלי", href: "/agent/clients", icon: <Users size={18} /> },
    { label: "ניהול לידים", href: "/agent/leads", icon: <Layers size={18} /> },
    { label: "ניהול מכירות (Kanban)", href: "/agent/sales", icon: <Briefcase size={18} /> },
    { label: "יומן ומשימות", href: "/agent/calendar", icon: <Calendar size={18} /> },
    { label: "כלי AI", href: "/agent/ai-tools", icon: <Sparkles size={18} /> },
    { label: "מרכז הדרכה", href: "/agent/training", icon: <GraduationCap size={18} /> },
];

export const CLIENT_NAV_ITEMS: NavItem[] = [
    { label: "איזור אישי", href: "/client/dashboard", icon: <Home size={18} /> },
    { label: "הפוליסות שלי", href: "/client/policies", icon: <ShieldCheck size={18} /> },
    { label: "חסכונות ופנסיה", href: "/client/savings", icon: <Wallet size={18} /> },
    { label: "מסמכים ואישורים", href: "/client/documents", icon: <FileText size={18} /> },
    { label: "חבר מביא חבר", href: "/client/referral", icon: <Gift size={18} /> },
    { label: "צור קשר", href: "/client/contact", icon: <MessageSquare size={18} /> },
];
