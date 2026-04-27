"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    TrendingUp,
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Sparkles,
    History,
    Zap,
    CheckCircle2,
    Users,
    User,
    Award,
    Clock,
    Lock,
    Volume2,
    VolumeX,
    ChevronDown,
    Percent,
    Wallet,
    Key,
    Heart,
    Star,
    BadgeCheck,
    FileCheck,
    HeartHandshake,
    Briefcase,
    GraduationCap,
    Target,
    PhoneCall,
    CircleDollarSign,
    ShieldCheck,
    BookOpen
} from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { NeonCard, NeonButton, NeonInput, NeonSelect, NeonTextarea } from "@/components/ui/neon-form";

// Hyperframes player loaded via useEffect inside component (client-only)

/* ─────────────── Custom Hooks ─────────────── */

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime: number | null = null;
        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, start]);
    return count;
};

const useIntersectionObserver = (callback: () => void, options?: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                callback();
                observer.disconnect();
            }
        }, { threshold: 0.3, ...options });
        observer.observe(el);
        return () => observer.disconnect();
    }, [callback, options]);
    return ref;
};

/* ─────────────── Inline Lead Form Component ─────────────── */

function InlineLeadForm({ headline, subtext, variant = "gold", id }: {
    headline: string;
    subtext: string;
    variant?: "gold" | "blue" | "emerald";
    id?: string;
}) {
    const [form, setForm] = useState({ name: "", phone: "" });
    const [submitted, setSubmitted] = useState(false);

    const colors = {
        gold: { border: "border-amber-500/30", bg: "from-amber-500/5 to-orange-500/5", accent: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-400 text-black", glow: "shadow-[0_0_60px_rgba(245,158,11,0.15)]" },
        blue: { border: "border-blue-500/30", bg: "from-blue-500/5 to-cyan-500/5", accent: "text-blue-400", btn: "bg-blue-500 hover:bg-blue-400 text-white", glow: "shadow-[0_0_60px_rgba(59,130,246,0.15)]" },
        emerald: { border: "border-emerald-500/30", bg: "from-emerald-500/5 to-teal-500/5", accent: "text-emerald-400", btn: "bg-emerald-500 hover:bg-emerald-400 text-black", glow: "shadow-[0_0_60px_rgba(16,185,129,0.15)]" },
    };
    const c = colors[variant];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone) return;
        toast.success("תודה! נציג בכיר יחזור אליך תוך 30 דקות 🎯");
        setSubmitted(true);
        setForm({ name: "", phone: "" });
    };

    return (
        <section id={id} className={`py-16 md:py-20`}>
            <div className={`max-w-4xl mx-auto px-6`}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`relative glass ${c.border} rounded-[2.5rem] p-10 md:p-16 bg-linear-to-br ${c.bg} ${c.glow} overflow-hidden`}
                >
                    {/* Shimmer bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-900">
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="h-full w-full bg-linear-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_20px_#f59e0b]"
                        />
                    </div>

                    <div className="text-center mb-10 space-y-3">
                        <h3 className={`text-3xl md:text-4xl font-black italic tracking-tighter ${c.accent}`}>{headline}</h3>
                        <p className="text-slate-400 font-bold text-sm md:text-base max-w-lg mx-auto">{subtext}</p>
                    </div>

                    {submitted ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
                            <p className="text-xl font-black text-white">הפנייה שלך התקבלה!</p>
                            <p className="text-slate-400 text-sm mt-2">נציג VIP יחזור אליך תוך 30 דקות</p>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-4">
                            <NeonInput
                                placeholder="שם מלא"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                className="flex-1 w-full"
                            />
                            <NeonInput
                                placeholder="טלפון נייד"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                required
                                className="flex-1 w-full"
                            />
                            <button
                                type="submit"
                                className={`${c.btn} px-10 py-4 rounded-2xl font-black text-base whitespace-nowrap transition-all hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto`}
                            >
                                קבל הצעה חינם ←
                            </button>
                        </form>
                    )}

                    <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Lock size={10} /> מאובטח SSL</span>
                        <span className="flex items-center gap-1"><ShieldCheck size={10} /> ללא התחייבות</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> מענה תוך 30 דק׳</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ─────────────── Main Landing Page ─────────────── */

export default function LandingPage() {
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isStatsVisible, setIsStatsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setIsMounted(true);
        // Load Hyperframes player web component (client-only)
        import("@hyperframes/player").catch(() => {});
    }, []);

    const triggerStats = useCallback(() => setIsStatsVisible(true), []);
    const statsRef = useIntersectionObserver(triggerStats);

    const activeClients = useCountUp(12450, 2500, isStatsVisible);
    const moneySaved = useCountUp(480, 3000, isStatsVisible);
    const claimsPaid = useCountUp(98, 2000, isStatsVisible);
    const yearsExperience = useCountUp(22, 1500, isStatsVisible);

    const toggleAudio = () => {
        setIsAudioPlaying(!isAudioPlaying);
        // Future: connect to real ambient audio
    };

    /* ─── SEO-rich structured data ─── */
    const insuranceCompanies = [
        { name: 'הראל', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/d/d4/Harel_Insurance_Logo.svg/1024px-Harel_Insurance_Logo.svg.png' },
        { name: 'מגדל', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/8/86/Migdal_Insurance_logo.svg/1024px-Migdal_Insurance_logo.svg.png' },
        { name: 'הפניקס', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/2/21/The_Phoenix_Insurance_Company_Logo.svg/1024px-The_Phoenix_Insurance_Company_Logo.svg.png' },
        { name: 'כלל', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/b/b5/Clal_Insurance_logo.svg/1024px-Clal_Insurance_logo.svg.png' },
        { name: 'מנורה', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/a/ab/Menora_Mivtachim_logo.svg/1024px-Menora_Mivtachim_logo.svg.png' },
        { name: 'אלטשולר', url: 'https://upload.wikimedia.org/wikipedia/he/thumb/e/e5/Altshuler_Shacham_Logo.svg/1024px-Altshuler_Shacham_Logo.svg.png' }
    ];

    const testimonials = [
        { name: "יוסי כהן", role: "בעל עסק, תל אביב", text: "מגדל זהב חסכו לי ₪340,000 בדמי ניהול מיותרים. ייעוץ פנסיוני מקצועי ברמה אחרת לגמרי.", rating: 5 },
        { name: "מיכל לוי", role: "עצמאית, ירושלים", text: "פתחתי קרן השתלמות והפנסיה שלי סוף סוף מנוהלת נכון. צוות מדהים ושירות VIP אמיתי.", rating: 5 },
        { name: "אברהם דוד", role: "מנהל משאבי אנוש", text: "העברנו 200 עובדים למגדל זהב. דמי ניהול מופחתים, שירות אישי, ותביעות שמטופלות תוך שבוע.", rating: 5 },
    ];

    const insuranceServices = [
        { icon: <Heart size={28} />, title: "ביטוח חיים (ריסק)", desc: "הגנה כלכלית מקסימלית למשפחה שלך במחיר שלא תאמין", keyword: "ביטוח חיים ריסק" },
        { icon: <ShieldCheck size={28} />, title: "אובדן כושר עבודה", desc: "80% מהכנסתך מובטחים אם לא תוכל לעבוד. אל תסתכן.", keyword: "ביטוח אובדן כושר עבודה" },
        { icon: <HeartHandshake size={28} />, title: "ביטוח בריאות פרטי", desc: "גישה לרפואה הפרטית הטובה ביותר, ללא תורים, ללא פשרות", keyword: "ביטוח בריאות פרטי" },
        { icon: <Briefcase size={28} />, title: "ביטוח עסקי ואחריות מקצועית", desc: "הגנה מלאה על העסק שלך מפני תביעות ונזקים בלתי צפויים", keyword: "ביטוח עסקי" },
        { icon: <FileCheck size={28} />, title: "ביטוח משכנתא", desc: "תנאים מועדפים שחוסכים לך אלפי שקלים לאורך חיי ההלוואה", keyword: "ביטוח משכנתא" },
        { icon: <BookOpen size={28} />, title: "בדיקת כפלי ביטוח", desc: "90% מהישראלים משלמים על כפלי ביטוח. בדיקה חינם תוך 48 שעות.", keyword: "בדיקת כפלי ביטוח" },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-500" dir="rtl">
            {isMounted && (
                <>
                    {/* ═══════════════════════ NAVIGATION ═══════════════════════ */}
                    <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-6 py-3 transition-all duration-500">
                        <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-white/5 px-6 md:px-8 py-3 rounded-[2rem] shadow-2xl">
                            <a href="#" className="flex items-center gap-3 group cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-xl italic shadow-gold">Z</div>
                                <h1 className="text-lg md:text-xl font-black text-white italic tracking-tighter">
                                    מגדל <span className="text-amber-500">זהב</span>
                                </h1>
                            </a>

                            <div className="hidden lg:flex items-center gap-6">
                                {[
                                    { label: 'ביטוחים', href: '#insurance' },
                                    { label: 'פנסיה', href: '#pension' },
                                    { label: 'קרן השתלמות', href: '#hishtalmut' },
                                    { label: 'עלינו', href: '#about' },
                                    { label: 'המלצות', href: '#testimonials' },
                                ].map((item) => (
                                    <a key={item.label} href={item.href} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-400 transition-all hover:scale-110">{item.label}</a>
                                ))}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleAudio}
                                    className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-amber-500 hover:scale-110 transition-transform"
                                    title={isAudioPlaying ? "השתק" : "הפעל אווירה"}
                                >
                                    {isAudioPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>
                                <Link href="/login" className="flex px-6 py-2.5 rounded-xl border border-white/10 text-white font-black text-xs hover:bg-white/5 transition-all hover:scale-105 items-center gap-2">
                                    <User size={14} />
                                    אזור אישי
                                </Link>
                                <a href="#lead-main" className="hidden md:flex px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all hover:scale-105 items-center gap-2">
                                    <Zap size={14} />
                                    בדיקה חינם
                                </a>
                            </div>
                        </div>
                    </nav>

                    {/* Audio Visual Feedback */}
                    <AnimatePresence>
                        {isAudioPlaying && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed bottom-8 left-8 z-50 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/20"
                            >
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [4, 14, 4] }}
                                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                                            className="w-1 bg-amber-500 rounded-full"
                                        />
                                    ))}
                                </div>
                                <span className="text-[9px] font-black italic text-amber-400 uppercase tracking-widest">Premium Atmosphere</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <main>
                        {/* ═══════════════════════ HERO ═══════════════════════ */}
                        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden">
                            {/* Background FX */}
                            <div className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                            <div className="absolute bottom-1/4 left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" />
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

                            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                                <div className="space-y-8 text-center lg:text-right">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-flex items-center gap-2 bg-amber-500 px-4 py-1.5 rounded-full"
                                    >
                                        <Sparkles size={14} className="text-black" />
                                        <span className="text-[10px] font-black text-black uppercase tracking-widest">סוכנות ביטוח ופנסיה מובילה | מעל 20 שנה</span>
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white italic tracking-tighter leading-[0.85] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                                    >
                                        בדיקת פנסיה <br />
                                        <span className="glitter-text">חינם</span> <br />
                                        <span className="text-4xl sm:text-5xl md:text-6xl not-italic">שתחסוך לך הון</span>
                                    </motion.h2>

                                    <motion.p
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-lg md:text-xl text-slate-400 font-bold leading-relaxed max-w-xl mx-auto lg:mx-0"
                                    >
                                        גלה כמה כסף אתה מפסיד <span className="text-amber-400">בדמי ניהול מיותרים</span>. ייעוץ פנסיוני מומחה שחוסך ללקוחותינו בממוצע <span className="text-white font-black">₪730,000</span> לאורך חיי החיסכון.
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-2"
                                    >
                                        <a
                                            href="#lead-main"
                                            className="px-10 py-5 text-lg font-black italic rounded-2xl bg-amber-500 text-black shadow-gold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
                                        >
                                            <Zap size={20} />
                                            אני רוצה בדיקה חינם
                                        </a>
                                        <a href="tel:1700505060" className="flex items-center gap-3 text-slate-400 hover:text-amber-400 transition-colors group">
                                            <div className="h-12 w-12 rounded-full border-2 border-amber-500/30 flex items-center justify-center group-hover:border-amber-500 transition-colors">
                                                <PhoneCall size={18} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">חייגו עכשיו</p>
                                                <p className="text-white font-black text-lg" dir="ltr">1-700-50-50-60</p>
                                            </div>
                                        </a>
                                    </motion.div>

                                    {/* Social proof */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.8 }}
                                        className="flex items-center gap-4 justify-center lg:justify-start text-slate-400 pt-2"
                                    >
                                        <div className="flex -space-x-3 space-x-reverse">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="h-9 w-9 rounded-full border-2 border-[#020617] bg-slate-800 overflow-hidden">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=mz${i}`} alt="Avatar" />
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">4,200+ לקוחות מרוצים השנה</span>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Hero Visual — Hyperframes Promo Player */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4, duration: 1.2 }}
                                    className="relative hidden lg:block"
                                >
                                    <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full" />
                                    <div className="relative glass border border-white/10 rounded-[3rem] p-1 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-1000 overflow-hidden">
                                        {/* @ts-expect-error – hyperframes-player is a Web Component */}
                                        <hyperframes-player
                                            src="/compositions/magen-zahav-promo/index.html"
                                            autoplay
                                            loop
                                            muted
                                            style={{
                                                width: "100%",
                                                aspectRatio: "16/9",
                                                borderRadius: "2.5rem",
                                                display: "block",
                                            }}
                                        />
                                        {/* Floating card */}
                                        <div className="absolute -top-8 -right-12 bg-[#0a0e1a] border border-amber-500/30 p-6 rounded-3xl shadow-2xl animate-float z-20">
                                            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-black mb-3 shadow-gold">
                                                <Key size={20} />
                                            </div>
                                            <p className="text-2xl font-black italic text-white leading-none">₪730,000</p>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">חיסכון ממוצע ללקוח</p>
                                        </div>

                                        {/* Second floating badge */}
                                        <div className="absolute -bottom-6 -left-8 bg-emerald-500 p-4 rounded-2xl shadow-lg animate-float z-20" style={{ animationDelay: '1s' }}>
                                            <p className="text-sm font-black text-black flex items-center gap-2">
                                                <CheckCircle2 size={16} />
                                                98% הצלחה בתביעות
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Scroll indicator */}
                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                            >
                                <ChevronDown size={24} className="text-amber-500/50" />
                            </motion.div>
                        </section>


                        {/* ═══════════════════════ PARTNERS / TRUST BAR ═══════════════════════ */}
                        <section className="py-16 bg-slate-900/40 border-y border-white/5">
                            <div className="max-w-7xl mx-auto px-6">
                                <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mb-10 italic">עובדים עם הגופים הפיננסיים המובילים בישראל</p>
                                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 hover:opacity-100 transition-all duration-700 px-4">
                                    {insuranceCompanies.map(company => (
                                        <div key={company.name} className="relative group/logo">
                                            <img
                                                src={company.url}
                                                alt={`${company.name} - שותף ביטוח`}
                                                className="h-8 md:h-10 w-auto object-contain brightness-0 invert opacity-60 group-hover/logo:opacity-100 transition-all duration-500 scale-100 group-hover/logo:scale-110"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mt-10 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                    <span className="flex items-center gap-2"><BadgeCheck size={14} className="text-amber-500" /> רישיון סוכן ביטוח פנסיוני</span>
                                    <span className="flex items-center gap-2"><Lock size={14} className="text-blue-500" /> SSL מאובטח</span>
                                    <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> פיקוח רשות שוק ההון</span>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════ PLATFORM SHOWCASE ═══════════════════════ */}
                        <section className="py-24 md:py-32 relative overflow-hidden">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-16">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block mb-4">Platform Preview</span>
                                    <h3 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-4">
                                        הממשק שעובד <span className="text-amber-500">בשבילך</span>
                                    </h3>
                                    <p className="text-lg text-slate-400 font-bold max-w-2xl mx-auto">
                                        מערכת CRM מתקדמת עם בינה מלאכותית — ניהול לקוחות, פוליסות, תביעות ומשימות במקום אחד
                                    </p>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8 }}
                                    className="relative mx-auto max-w-6xl"
                                >
                                    {/* Glow behind */}
                                    <div className="absolute -inset-4 bg-amber-500/10 blur-[80px] rounded-full" />

                                    {/* Glass frame */}
                                    <div className="relative border border-white/10 rounded-[2rem] p-1.5 shadow-2xl bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                                        {/* Browser chrome */}
                                        <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 rounded-t-[1.5rem] border-b border-white/5">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                            </div>
                                            <div className="flex-1 mx-4">
                                                <div className="bg-slate-800/80 rounded-lg px-4 py-1.5 text-[10px] font-bold text-slate-500 text-center">
                                                    🔒 app.magen-zahav.co.il/dashboard
                                                </div>
                                            </div>
                                        </div>

                                        {/* @ts-expect-error – hyperframes-player is a Web Component */}
                                        <hyperframes-player
                                            src="/compositions/dashboard-showcase/index.html"
                                            autoplay
                                            loop
                                            muted
                                            controls
                                            style={{
                                                width: "100%",
                                                aspectRatio: "16/9",
                                                display: "block",
                                                borderRadius: "0 0 1.5rem 1.5rem",
                                                background: "#0f172a"
                                            }}
                                        />
                                    </div>

                                    {/* Floating badges */}
                                    <div className="absolute -top-6 -right-6 bg-emerald-500 text-black px-5 py-3 rounded-2xl shadow-lg animate-float z-20 hidden md:block">
                                        <p className="text-sm font-black flex items-center gap-2">
                                            <Sparkles size={14} /> מופעל AI
                                        </p>
                                    </div>
                                    <div className="absolute -bottom-4 -left-6 bg-[#0a0e1a] border border-amber-500/30 px-5 py-3 rounded-2xl shadow-lg animate-float z-20 hidden md:block" style={{ animationDelay: '1.5s' }}>
                                        <p className="text-sm font-black text-white flex items-center gap-2">
                                            <Shield size={14} className="text-amber-500" /> גישה מאובטחת
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </section>

                        {/* ═══════════════════════ STATISTICS ═══════════════════════ */}
                        <section className="py-24 md:py-32 relative overflow-hidden" ref={statsRef}>
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-20">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block mb-4">הנתונים מדברים</span>
                                    <h3 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter mb-4 uppercase">המספרים שלנו</h3>
                                    <div className="w-32 h-1.5 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                                    {[
                                        { label: "לקוחות פעילים", value: activeClients.toLocaleString(), suffix: "+", icon: <Users size={28} />, color: "amber" },
                                        { label: "₪ מיליון נחסכו", value: moneySaved, suffix: "M", icon: <CircleDollarSign size={28} />, color: "emerald" },
                                        { label: "הצלחה בתביעות", value: claimsPaid, suffix: "%", icon: <Target size={28} />, color: "blue" },
                                        { label: "שנות ניסיון", value: yearsExperience, suffix: "+", icon: <Award size={28} />, color: "purple" }
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <NeonCard className="p-8 md:p-10 text-center group hover:-translate-y-3 transition-all duration-500 h-full">
                                                <div className={`mx-auto h-14 w-14 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-500 mb-6`}>
                                                    {stat.icon}
                                                </div>
                                                <div className="text-4xl md:text-5xl font-black italic tracking-tighter mb-2 text-white">
                                                    {stat.value}{stat.suffix}
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                                            </NeonCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>


                        {/* ═══════════ FIRST LEAD FORM ═══════════ */}
                        <InlineLeadForm
                            id="lead-main"
                            headline="בדיקת תיק פנסיוני חינם ← תוך 48 שעות"
                            subtext="השאירו שם וטלפון ונציג מומחה יבצע עבורכם בדיקה מקיפה ללא עלות וללא התחייבות"
                            variant="gold"
                        />

                        {/* ═══════════════════════ INSURANCE SERVICES ═══════════════════════ */}
                        <section id="insurance" className="py-24 md:py-32 relative">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-20">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block mb-4">Protection Suite</span>
                                    <h3 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-4">
                                        ביטוח שעובד <span className="text-amber-500">בשבילך</span>
                                    </h3>
                                    <p className="text-lg text-slate-400 font-bold max-w-2xl mx-auto">
                                        השוואת ביטוחים מול כל חברות הביטוח בישראל. אנחנו עובדים בשבילך, לא בשביל חברות הביטוח.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {insuranceServices.map((service, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <div className="premium-glass p-8 rounded-[2rem] h-full group hover:border-amber-500/30 border border-transparent transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                                                    {service.icon}
                                                </div>
                                                <h4 className="text-lg font-black text-white italic mb-3 tracking-tight">{service.title}</h4>
                                                <p className="text-slate-400 font-bold text-sm leading-relaxed mb-4">{service.desc}</p>
                                                <a href="#lead-main" className="text-amber-500 text-xs font-black uppercase tracking-widest hover:text-amber-400 transition-colors flex items-center gap-2">
                                                    קבל הצעת מחיר <ArrowLeft size={12} />
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ═══════════ SECOND LEAD FORM ═══════════ */}
                        <InlineLeadForm
                            headline="בדיקת כפלי ביטוח חינם"
                            subtext="90% מהישראלים משלמים על כפלי ביטוח מיותרים. גלה כמה אתה יכול לחסוך!"
                            variant="blue"
                        />

                        {/* ═══════════════════════ PENSION SECTION ═══════════════════════ */}
                        <section id="pension" className="py-24 md:py-40 relative">
                            <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 md:gap-24">
                                <div className="lg:w-1/2 space-y-10">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block">ייעוץ פנסיוני מקצועי</span>
                                        <h3 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-[0.9]">
                                            פנסיה היא לא חיסכון, <br /> היא <span className="text-amber-500">החירות</span> שלך.
                                        </h3>
                                        <p className="text-slate-400 font-bold leading-relaxed">
                                            רוב האנשים לא יודעים שהם מפסידים <span className="text-white">מאות אלפי שקלים</span> בדמי ניהול מיותרים.
                                            בדיקה פנסיונית מומחה יכולה להציל את העתיד הפיננסי שלך.
                                        </p>
                                    </div>

                                    <div className="space-y-8">
                                        {[
                                            { icon: <Clock size={28} />, title: "כוח הריבית דריבית", text: "כל שקל שנכנס היום לחיסכון שלך שווה פי 8 בגיל הפרישה. המתנה של שנתיים יכולה לעלות בחצי מיליון ₪.", color: "amber" },
                                            { icon: <Shield size={28} />, title: "הגנה מפני סיכוני חיים", text: "קרן הפנסיה היא גם ביטוח אובדן כושר עבודה והגנה כלכלית לשאירים שלך. אל תוותר על זה.", color: "blue" },
                                            { icon: <Wallet size={28} />, title: "הטבות מס בשווי עתק", text: "זיכויים וניכויים במס שמשמעותם אלפי שקלים בשנה. אנחנו נדאג למקסם את כולם.", color: "emerald" },
                                        ].map((item, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="flex gap-6 group">
                                                <div className={`h-14 w-14 shrink-0 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-${item.color}-500 group-hover:shadow-gold transition-all`}>
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-lg font-black text-white italic tracking-tight">{item.title}</h4>
                                                    <p className="text-slate-400 font-bold text-sm leading-relaxed">{item.text}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <a href="#lead-main" className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-amber-500 text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-gold">
                                        <Zap size={18} />
                                        בדוק את הפנסיה שלי עכשיו
                                    </a>
                                </div>

                                {/* Pension visual comparison */}
                                <div className="lg:w-1/2 relative group w-full">
                                    <div className="absolute inset-0 bg-blue-600/10 blur-[150px] rounded-full" />
                                    <NeonCard className="p-0! overflow-hidden relative border-white/10 shadow-2xl">
                                        <div className="bg-linear-to-b from-slate-900 to-black p-8 md:p-12">
                                            <div className="flex items-center justify-between mb-12">
                                                <h4 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter">המצפן הפנסיוני</h4>
                                                <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                {[
                                                    { label: "קצבה עם ייעוץ מקצועי", value: "₪18,400", color: "bg-emerald-500", width: "100%" },
                                                    { label: "קצבה ללא ייעוץ (סטנדרט)", value: "₪11,200", color: "bg-red-500", width: "60%" },
                                                ].map((item, i) => (
                                                    <div key={i} className="space-y-3">
                                                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                                                            <span className={i === 0 ? "text-emerald-400" : "text-slate-500"}>{item.label}</span>
                                                            <span className="text-white text-lg">{item.value}</span>
                                                        </div>
                                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: item.width }}
                                                                viewport={{ once: true }}
                                                                transition={{ duration: 1.5, delay: i * 0.5 }}
                                                                className={`h-full ${item.color} rounded-full`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-12 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                                                <p className="text-amber-500 font-black italic text-xl mb-1">פער של ₪2,400,000 בצבירה</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">על בסיס 30 שנה · דמי ניהול מופחתים · תשואה 4%</p>
                                            </div>
                                        </div>
                                    </NeonCard>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════ KEREN HISHTALMUT ═══════════════════════ */}
                        <section id="hishtalmut" className="py-24 md:py-40 bg-linear-to-b from-[#020617] via-[#050b1a] to-[#020617]">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-16">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="inline-block p-1 rounded-[3rem] bg-linear-to-r from-amber-500 via-orange-500 to-amber-500 mb-8"
                                    >
                                        <div className="bg-[#020617] px-8 py-2.5 rounded-[2.8rem]">
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] italic">הכלי הפיננסי #1 בישראל</span>
                                        </div>
                                    </motion.div>

                                    <h3 className="text-5xl md:text-7xl lg:text-8xl font-black text-white italic tracking-tighter leading-[0.85] mb-8">
                                        קרן השתלמות: <br />
                                        <span className="text-amber-500">פטור מלא ממס</span>
                                    </h3>

                                    <p className="text-lg md:text-xl text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed">
                                        אפיק ההשקעה היחיד בישראל שבו <span className="text-white">הרווחים פטורים לחלוטין ממס רווחי הון (25%)</span> לאחר 6 שנים.
                                        לשכירים ולעצמאים כאחד — הכלי החזק ביותר לבניית הון.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                                    {[
                                        { icon: <Percent size={24} />, title: "פטור מלא ממס", text: "כל שקל של רווח נשאר אצלך. 25% מס שאתה לא משלם.", motto: "הרווח שלך — שלך בלבד" },
                                        { icon: <History size={24} />, title: "נזילות מלאה אחרי 6 שנים", text: "הכסף זמין לכל מטרה, ללא צורך בהוכחת השתלמות.", motto: "חופש פיננסי מוחלט" },
                                        { icon: <CheckCircle2 size={24} />, title: "דמי ניהול VIP", text: "כלקוח מגדל זהב, תנאי המועדון הטובים ביותר בשוק.", motto: "תשואה מקסימלית, עלות מינימלית" },
                                        { icon: <GraduationCap size={24} />, title: "הפקדה עד ₪20,520/שנה", text: "לשכירים — המעסיק מפקיד 7.5%, לעצמאים — הטבת מס מלאה.", motto: "כל שקל שנכנס = הון עתידי" },
                                    ].map((benefit, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 }}
                                            className="relative group"
                                        >
                                            <div className="premium-glass p-8 rounded-[2rem] border border-white/5 h-full transition-all group-hover:border-amber-500/30 group-hover:-translate-y-2 duration-500">
                                                <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 mb-6 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                                                    {benefit.icon}
                                                </div>
                                                <h4 className="text-base font-black text-white italic mb-3">{benefit.title}</h4>
                                                <p className="text-slate-400 font-bold text-sm leading-relaxed">{benefit.text}</p>
                                                <div className="mt-4 py-2 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <span className="text-amber-400 font-black text-[10px] uppercase tracking-widest">{benefit.motto}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="text-center">
                                    <a href="#lead-main" className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-amber-500 text-black font-black text-lg italic hover:scale-105 active:scale-95 transition-all shadow-gold">
                                        <Zap size={22} />
                                        פתח קרן השתלמות עכשיו
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════ THIRD LEAD FORM ═══════════ */}
                        <InlineLeadForm
                            headline="רוצה לפתוח קרן השתלמות?"
                            subtext="השאר פרטים ומומחה קרנות השתלמות יחזור אליך עם ההצעה הטובה ביותר בשוק"
                            variant="emerald"
                        />

                        {/* ═══════════════════════ ABOUT THE AGENCY ═══════════════════════ */}
                        <section id="about" className="py-24 md:py-32 relative overflow-hidden">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="grid lg:grid-cols-2 gap-16 items-center">
                                    <div>
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block mb-4">מי אנחנו</span>
                                        <h3 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter leading-[0.9] mb-6">
                                            הבוטיק <span className="text-amber-500">הפיננסי</span> <br />של ישראל
                                        </h3>
                                        <p className="text-slate-400 font-bold leading-relaxed mb-8 text-lg">
                                            מגדל זהב אינה סוכנות ביטוח רגילה. אנחנו <span className="text-white">בית השקעות בוטיק</span> שמספק ייעוץ פנסיוני וביטוחי בסטנדרט של Private Banking.
                                            הצוות שלנו כולל <span className="text-amber-400">יועצים מוסמכים עם מעל 20 שנות ניסיון</span>, מומחי מס, ואנליסטים פיננסיים שעובדים יחד כדי למקסם את הכסף שלך.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { icon: <BadgeCheck size={20} />, text: "רישיון סוכן פנסיוני" },
                                                { icon: <Users size={20} />, text: "צוות 35+ מומחים" },
                                                { icon: <Award size={20} />, text: "פרס מצוינות 2025" },
                                                { icon: <Lock size={20} />, text: "אבטחת מידע מתקדמת" },
                                            ].map((badge, i) => (
                                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                                                    <div className="text-amber-500">{badge.icon}</div>
                                                    <span className="text-sm font-black text-slate-300">{badge.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 bg-amber-500/10 blur-[100px] rounded-full" />
                                        <div className="relative glass border border-white/10 rounded-[3rem] p-6 shadow-2xl">
                                            <img
                                                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800"
                                                alt="צוות מגדל זהב - ייעוץ פנסיוני מקצועי"
                                                className="rounded-[2.5rem] aspect-[4/3] object-cover w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
                        <section id="testimonials" className="py-24 md:py-32 bg-slate-900/30">
                            <div className="max-w-7xl mx-auto px-6">
                                <div className="text-center mb-20">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic block mb-4">Social Proof</span>
                                    <h3 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter mb-4">מה הלקוחות אומרים</h3>
                                    <div className="w-32 h-1.5 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full" />
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    {testimonials.map((t, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.15 }}
                                        >
                                            <NeonCard className="h-full p-8">
                                                <div className="flex items-center gap-1 mb-4">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-amber-500 fill-amber-500" />)}
                                                </div>
                                                <p className="text-slate-300 font-bold leading-relaxed mb-6 text-sm">&ldquo;{t.text}&rdquo;</p>
                                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                                    <div className="h-10 w-10 rounded-full bg-slate-800 overflow-hidden">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=test${i}`} alt={t.name} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{t.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.role}</p>
                                                    </div>
                                                </div>
                                            </NeonCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════ FULL CONTACT FORM ═══════════════════════ */}
                        <section id="contact" className="py-24 md:py-40 relative">
                            <div className="max-w-4xl mx-auto px-6 relative">
                                <div className="absolute inset-0 bg-linear-to-r from-amber-500/10 to-blue-600/10 blur-[120px] rounded-full" />

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="glass border border-white/10 rounded-[3rem] p-10 md:p-16 relative overflow-hidden"
                                >
                                    {/* Shimmer bar */}
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900">
                                        <motion.div
                                            animate={{ x: ["-100%", "100%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="h-full w-full bg-linear-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_20px_#f59e0b]"
                                        />
                                    </div>

                                    <div className="text-center mb-12 space-y-3">
                                        <h3 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">צרו קשר עם <span className="text-amber-500">מומחה</span></h3>
                                        <p className="text-slate-400 font-bold max-w-lg mx-auto text-sm">מלאו את הפרטים ונציג בכיר יחזור אליכם עם פתרון מותאם אישית</p>
                                    </div>

                                    <form onSubmit={(e) => { e.preventDefault(); toast.success("פנייתך התקבלה בדרגת עדיפות VIP! 🎯 נחזור אליך תוך 30 דקות."); }} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <NeonInput label="שם מלא" placeholder="ישראל ישראלי" required />
                                            <NeonInput label="טלפון נייד" placeholder="054-0000000" type="tel" required />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <NeonInput label="אימייל" placeholder="your@email.com" type="email" />
                                            <NeonSelect label="נושא הפנייה">
                                                <option value="pension">ייעוץ פנסיוני מקיף</option>
                                                <option value="hishtalmut">קרן השתלמות</option>
                                                <option value="insurance">השוואת ביטוחים</option>
                                                <option value="duplicates">בדיקת כפלי ביטוח</option>
                                                <option value="other">נושא אחר</option>
                                            </NeonSelect>
                                        </div>
                                        <NeonTextarea label="הערות נוספות" placeholder="ספרו לנו במה נוכל לעזור..." rows={4} />
                                        <NeonButton type="submit" className="w-full py-6 text-lg italic font-black">
                                            <Zap size={20} />
                                            שלח פנייה דחופה
                                        </NeonButton>

                                        <div className="flex items-center justify-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Lock size={10} /> מאובטח</span>
                                            <span className="flex items-center gap-1"><ShieldCheck size={10} /> ללא התחייבות</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> מענה VIP תוך 30 דק׳</span>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        </section>

                        {/* ═══════════════════════ URGENCY BANNER ═══════════════════════ */}
                        <section className="py-16 relative overflow-hidden">
                            <div className="max-w-5xl mx-auto px-6 text-center">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="bg-linear-to-r from-amber-500 to-orange-500 rounded-[2.5rem] p-12 md:p-16 shadow-gold relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                                    <h3 className="text-3xl md:text-5xl font-black text-black italic tracking-tighter mb-4 relative z-10">
                                        ⏰ כל יום שעובר — אתה מפסיד כסף
                                    </h3>
                                    <p className="text-lg text-black/70 font-bold max-w-2xl mx-auto mb-8 relative z-10">
                                        דמי ניהול גבוהים שוחקים את החיסכון שלך כל רגע. בדיקה של 5 דקות יכולה לחסוך לך מאות אלפי שקלים.
                                    </p>
                                    <a href="#lead-main" className="relative z-10 inline-flex items-center gap-3 px-10 py-5 bg-black text-amber-500 font-black text-lg italic rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                        <Zap size={22} />
                                        התחל בדיקה חינם עכשיו
                                    </a>
                                </motion.div>
                            </div>
                        </section>
                    </main>

                    {/* ═══════════════════════ FOOTER ═══════════════════════ */}
                    <footer className="relative py-24 border-t border-slate-900 overflow-hidden bg-black">
                        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                        <div className="max-w-7xl mx-auto px-6">
                            <div className="grid md:grid-cols-4 gap-12 mb-16">
                                <div className="md:col-span-1">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-black italic text-2xl shadow-gold">Z</div>
                                        <h2 className="text-2xl font-black text-white italic tracking-tighter">
                                            מגדל <span className="text-amber-500">זהב</span>
                                        </h2>
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">סוכנות ביטוח ופנסיה מובילה. ייעוץ פנסיוני מקצועי, השוואת ביטוחים, וניהול קרנות השתלמות.</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-white italic uppercase tracking-tighter mb-4">שירותים</h4>
                                    {['ייעוץ פנסיוני', 'קרן השתלמות', 'ביטוח חיים', 'ביטוח בריאות', 'בדיקת כפלי ביטוח'].map(s => (
                                        <a key={s} href="#lead-main" className="block text-xs font-bold text-slate-500 hover:text-amber-400 transition-colors">{s}</a>
                                    ))}
                                    <Link href="/login" className="block text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors mt-4">אזור אישי (מנהלים/סוכנים)</Link>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-white italic uppercase tracking-tighter mb-4">צרו קשר</h4>
                                    <div className="space-y-3">
                                        <a href="tel:1700505060" className="flex items-center gap-3 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold">
                                            <Phone size={14} /> 1-700-50-50-60
                                        </a>
                                        <a href="mailto:office@magen-zahav.co.il" className="flex items-center gap-3 text-slate-400 hover:text-amber-500 transition-colors text-sm font-bold">
                                            <Mail size={14} /> office@magen-zahav.co.il
                                        </a>
                                        <div className="flex items-start gap-3 text-slate-400 text-sm font-bold">
                                            <MapPin size={14} className="mt-0.5" /> מגדלי בסר 4, קומה 28, בני ברק
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-white italic uppercase tracking-tighter mb-4">עסקה חדשה</h4>
                                    <a
                                        href="#lead-main"
                                        className="block p-6 border border-white/10 rounded-2xl bg-linear-to-br from-slate-900 to-black hover:border-amber-500/50 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-black text-white italic">התחל עכשיו</span>
                                            <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                                <ArrowLeft size={14} />
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 mt-3 uppercase tracking-widest">ייעוץ חינם ← ללא התחייבות</p>
                                    </a>
                                </div>
                            </div>

                            {/* SEO keywords footer */}
                            <div className="pt-12 border-t border-white/5 space-y-6">
                                <p className="text-[9px] text-slate-700 font-bold leading-relaxed text-center max-w-4xl mx-auto">
                                    מילות מפתח: סוכנות ביטוח, ייעוץ פנסיוני, קרן פנסיה, קרן השתלמות לעצמאים, קרן השתלמות לשכירים, ביטוח חיים ריסק,
                                    ביטוח אובדן כושר עבודה, ביטוח בריאות פרטי, ביטוח משכנתא, השוואת ביטוחים, בדיקת כפלי ביטוח, דמי ניהול פנסיה,
                                    תכנון פרישה, הטבות מס, ביטוח מנהלים, ביטוח עסקי, ביטוח אחריות מקצועית, סוכן ביטוח, סוכנות ביטוח בבני ברק,
                                    השוואת דמי ניהול, פנסיה לעצמאים, חיסכון פנסיוני
                                </p>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Magen Zahav Private Wealth Management © 2026</p>
                                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-600">תקנון</span>
                                        <span className="text-slate-600">נגישות</span>
                                        <span className="text-slate-600">פרטיות</span>
                                        <span className="text-slate-800">Digital Identity by Antigravity AI</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </footer>
                </>
            )}
        </div>
    );
}
