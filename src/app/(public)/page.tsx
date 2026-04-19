"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
    Shield, 
    TrendingUp, 
    ArrowRight, 
    Phone, 
    Mail, 
    MapPin, 
    Sparkles, 
    History, 
    Zap,
    CheckCircle2,
    Users,
    TrendingDown,
    Crosshair
} from "lucide-react";
import { motion } from "framer-motion";
import { NeonCard, NeonButton, NeonInput, NeonSelect, NeonTextarea } from "@/components/ui/neon-form";
import { toast } from "sonner";

export default function LandingPage() {
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "ייעוץ פנסיוני",
        message: ""
    });

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("פנייתך התקבלה! נציג יחזור אליך בהקדם.");
        setContactForm({ name: "", email: "", phone: "", subject: "ייעוץ פנסיוני", message: "" });
    };

    return (
        <div className="min-h-screen mesh-gradient overflow-hidden selection:bg-accent/20 selection:text-accent" dir="rtl">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            {/* Modern Navbar - Fixed from error trace */}
            <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl px-10 py-6 glass shadow-2xl border border-white/5 rounded-[2.5rem] flex items-center justify-between transition-all duration-500">

                    <div className="flex items-center gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-amber-600 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform italic">Z</div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter">
                            מגדל <span className="text-amber-500">זהב</span>
                        </h1>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#stats" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">סטטיסטיקה</a>
                        <a href="#about" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">למה ביטוח?</a>
                        <a href="#contact" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-colors">צור קשר</a>
                    </div>

                    <Link href="/login" className="px-10 py-4 text-[11px] font-black rounded-2xl bg-amber-500 text-black shadow-xl shadow-amber-500/20 group flex items-center gap-2 hover:scale-105 transition-all">
                        כניסה לאזור האישי שלך
                        <ArrowRight size={14} className="mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </nav>



            <main className="relative z-10 pt-60 pb-20">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 text-center mb-48">
                    <div className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-800 px-6 py-2 rounded-full mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">פלטפורמת הפיננסים היוקרתית בישראל</span>
                    </div>
                    
                    <h2 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter leading-[0.85] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        הבטח את <span className="bg-linear-to-r from-amber-500 via-orange-400 to-amber-600 bg-clip-text text-transparent">העתיד שלך</span> <br />
                        בסטנדרט של <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-12">זהב</span>
                    </h2>
                    
                    <p className="max-w-4xl mx-auto text-xl md:text-2xl text-slate-500 font-bold leading-relaxed mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                        תכנון פנסיוני הוא לא רק חיסכון - הוא החופש שלך בגיל השלישי. <br />
                        מגדל זהב מעמידה לרשותך את כל הכלים המתקדמים בעולם לניהול העושר והביטחון המשפחתי שלך.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
                        <a 
                            href="#contact"
                            className="px-20 py-8 text-xl font-black italic rounded-[2.5rem] bg-slate-900 border-2 border-amber-500/30 text-amber-200 hover:border-amber-500 hover:text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center"
                        >
                            התחל ייעוץ אישי
                        </a>
                        <button className="px-12 py-4 text-xl font-black italic border-b-2 border-slate-800 hover:border-amber-500 hover:text-white transition-all">
                            צפה במצפן הפנסיוני
                        </button>
                    </div>
                </section>

                {/* Stats Section */}
                <section id="stats" className="max-w-7xl mx-auto px-6 mb-56 relative">
                    {/* Glowing Accent */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] bg-blue-600/5 blur-[150px] -z-10" />
                    
                    <div className="text-center mb-24">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 block">Reality Check</span>
                        <h3 className="text-5xl font-black text-white italic tracking-tighter mb-6">מדוע חשוב לתכנן עכשיו?</h3>
                        <div className="w-40 h-1.5 bg-linear-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <NeonCard className="p-12! hover:-translate-y-4 transition-all duration-500 border-slate-800/50 bg-slate-900/20 backdrop-blur-sm group">
                            <div className="h-20 w-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl mb-10 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-[0_0_30px_rgba(245,158,11,0.1)]">📊</div>
                            <h4 className="text-6xl font-black text-amber-500 italic mb-6">95%</h4>
                            <p className="font-extrabold text-slate-400 leading-relaxed text-sm tracking-wide">מהציבור הישראלי משלמים על "כפלי ביטוח" – תשלום כפול על אותו כיסוי בדיוק מבלי לדעת.</p>
                        </NeonCard>
                        
                        <NeonCard className="p-12! hover:-translate-y-4 transition-all duration-500 border-blue-500/20 bg-slate-900/20 backdrop-blur-sm group">
                            <div className="h-20 w-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-4xl mb-10 group-hover:bg-blue-500 group-hover:text-black transition-all shadow-[0_0_30px_rgba(59,130,246,0.1)]">🔄</div>
                            <h4 className="text-6xl font-black text-blue-400 italic mb-6">80%</h4>
                            <p className="font-extrabold text-slate-400 leading-relaxed text-sm tracking-wide">מהתיקים הפנסיוניים בישראל לא עודכנו בהתאם לרפורמות האחרונות, מה שגורם להפסדי ענק.</p>
                        </NeonCard>

                        <NeonCard className="p-12! hover:-translate-y-4 transition-all duration-500 border-emerald-500/20 bg-slate-900/20 backdrop-blur-sm group">
                            <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl mb-10 group-hover:bg-emerald-500 group-hover:text-black transition-all shadow-[0_0_30px_rgba(16,185,129,0.1)]">💰</div>
                            <h4 className="text-6xl font-black text-emerald-400 italic mb-6">0₪</h4>
                            <p className="font-extrabold text-slate-400 leading-relaxed text-sm tracking-wide italic">העלות שלך עבור הבדיקה שלנו. השירות ניתן כשירות מקצועי ללא כל התחייבות כספית מצדך.</p>
                        </NeonCard>
                    </div>
                </section>

                {/* Pension Gap Analysis - The Big Difference */}
                <section className="max-w-7xl mx-auto px-6 mb-56 relative">
                    <div className="text-center mb-20">
                        <h3 className="text-5xl font-black text-white italic tracking-tighter mb-4 uppercase">ההבדל ששווה <span className="text-amber-500">מאות אלפי שקלים</span></h3>
                        <p className="text-slate-500 font-bold">השוואה בין ניהול ברירת מחדל לניהול מומחה לאורך זמן (הערכה מבוססת תשואות שוק)</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Workplace Default */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <NeonCard className="p-10! border-red-500/20 bg-slate-900/40 relative overflow-hidden h-full">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                        <TrendingDown size={24} />
                                    </div>
                                    <h4 className="text-2xl font-black text-white italic uppercase">ניהול ברירת מחדל (מקום עבודה)</h4>
                                </div>
                                <div className="space-y-12">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">צבירה אחרי 20 שנה</span>
                                        <span className="text-3xl font-black text-white italic">₪850,000</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                        <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">צבירה אחרי 30 שנה</span>
                                        <span className="text-4xl font-black text-red-500 italic opacity-50">₪1,450,000</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                                        * מסלול כללי, דמי ניהול ממוצעים, ללא התאמה אישית למצב המשפחתי או סיכון גיל.
                                    </p>
                                </div>
                            </NeonCard>
                        </div>

                        {/* Managed by Magen Zahav */}
                        <div className="relative group translate-y-0 hover:-translate-y-4 transition-transform duration-500">
                            <div className="absolute inset-0 bg-amber-500/10 blur-[100px] opacity-100" />
                            <NeonCard className="p-10! border-amber-500/40 bg-slate-900 relative overflow-hidden h-full shadow-[0_30px_80px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/20">
                                <div className="absolute top-0 right-0 px-6 py-2 bg-amber-500 text-black font-black italic text-[10px] tracking-[0.2em] rounded-bl-2xl uppercase">Expert Management</div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/20">
                                        <TrendingUp size={24} />
                                    </div>
                                    <h4 className="text-2xl font-black text-white italic uppercase">ניהול אישי (באמצעות מגדל זהב)</h4>
                                </div>
                                <div className="space-y-12">
                                    <div className="flex justify-between items-end border-b border-amber-500/10 pb-4">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">צבירה אחרי 20 שנה</span>
                                        <span className="text-3xl font-black text-amber-500 italic">₪1,120,000</span>
                                    </div>
                                    <div className="flex justify-between items-end border-b border-amber-500/10 pb-4">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">צבירה אחרי 30 שנה</span>
                                        <span className="text-5xl font-black text-white italic drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">₪2,180,000</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-sm font-black text-amber-500 leading-relaxed italic">
                                            פער של ₪730,000 המוחזר ישירות אליך!
                                        </p>
                                    </div>
                                </div>
                            </NeonCard>
                        </div>
                    </div>
                </section>

                {/* Holistic Suit Section */}
                <section className="max-w-7xl mx-auto px-6 mb-56">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div className="order-2 md:order-1 relative">
                            <div className="absolute inset-0 bg-blue-600/10 blur-[120px] -z-10" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="h-48 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl grayscale hover:grayscale-0 transition-all cursor-pointer">🧥</div>
                                    <div className="h-64 rounded-[2.5rem] bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex flex-col items-center justify-center p-8 text-center">
                                        <CheckCircle2 className="text-amber-500 mb-4" size={32} />
                                        <p className="text-xs font-black text-white italic uppercase tracking-widest">תפירה אישית של חליפה פנסיונית</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-12">
                                    <div className="h-64 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center p-8 text-center group">
                                        <Users className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                                        <p className="text-xs font-black text-slate-400 italic uppercase tracking-widest leading-relaxed">בדיקת מוטבים - האם מי שרצית באמת רשום?</p>
                                    </div>
                                    <div className="h-48 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl grayscale hover:grayscale-0 transition-all cursor-pointer">✂️</div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 md:order-2 space-y-10">
                            <h3 className="text-6xl font-black text-white italic tracking-tighter leading-[0.9] uppercase">
                                לא רק העלות <br /> אלא <span className="text-amber-500 italic underline decoration-amber-500/20 underline-offset-8">הדיוק.</span>
                            </h3>
                            <div className="space-y-8">
                                <div className="flex gap-6">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black">1</div>
                                    <p className="text-slate-400 font-bold leading-relaxed">אנחנו בודקים את הכיסויים הביטוחיים שלך - רוב הציבור משלם על כיסויים מיותרים בתוך קרן הפנסיה או ביטוח החיים שאין להם צורך בהם.</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black">2</div>
                                    <p className="text-slate-400 font-bold leading-relaxed">וידוא מוטבים: במקרים רבים המוטב המצוין בפוליסה אינו המוטב הנוכחי שהלקוח מעוניין בו. אנחנו דואגים לסנכרן את המציאות עם הניירת.</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black">3</div>
                                    <p className="text-slate-400 font-bold leading-relaxed">תפירת חליפה: התאמה מושלמת של התוכנית הפנסיונית והביטוחית לצרכים המדויקים שלכם, לשקט הנפשי המקסימלי.</p>
                                </div>
                            </div>
                            <div className="pt-6">
                                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/20 font-black italic text-sm">
                                    <Zap size={16} className="animate-pulse" /> השירות ניתן ללא עלות כספית!
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integration Section/Stats Banner */}
                <div className="max-w-7xl mx-auto px-6 mb-56">
                    <div className="bg-linear-to-r from-slate-900 via-[#0a0e1a] to-slate-900 border border-slate-800/80 rounded-[3rem] p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <h4 className="text-4xl font-black text-white italic tracking-tighter mb-4">רוצה לראות את הנתונים שלך?</h4>
                            <p className="text-slate-500 font-bold italic">התחבר לאזור האישי וסנכרן את כל המידע הפיננסי שלך בדקה.</p>
                        </div>
                        <Link 
                            href="/login"
                            className="px-12 py-6 text-lg font-black rounded-2xl bg-amber-500 text-black shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center"
                        >
                            כניסה למערכת
                        </Link>

                    </div>
                </div>

                {/* Contact Section */}
                <section id="contact" className="max-w-7xl mx-auto px-6 mb-40">
                    <div className="grid md:grid-cols-2 gap-24">
                        <div className="space-y-14">
                            <div>
                                <h3 className="text-7xl font-black text-white italic tracking-tighter leading-none mb-8">בניית <br /> <span className="text-amber-500 italic">המבצר הכלכלי</span> שלך</h3>
                                <p className="text-2xl text-slate-500 font-bold leading-relaxed pr-2 border-r-4 border-amber-500/30">
                                    השאירו פרטים עכשיו ונקיים פגישת היכרות שבה ננתח את תיק הביטוח והפנסיה שלכם <span className="text-amber-500">ללא כל עלות או התחייבות מצדכם.</span>
                                </p>
                            </div>
                            
                            <div className="space-y-10">
                                <div className="flex items-center gap-8 group cursor-pointer">
                                    <div className="h-16 w-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all shadow-xl shadow-amber-500/5">
                                        <Phone size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">קו פתוח ללקוחות</p>
                                        <p className="text-2xl font-black text-white hover:text-amber-500 transition-colors">03-900-8800</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 group cursor-pointer">
                                    <div className="h-16 w-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all shadow-xl shadow-blue-500/5">
                                        <Mail size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">פניות ותמיכה</p>
                                        <p className="text-2xl font-black text-white hover:text-blue-500 transition-colors">gold@magen-zahav.co.il</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 group cursor-pointer">
                                    <div className="h-16 w-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-black transition-all shadow-xl shadow-white/5">
                                        <MapPin size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">המטה הראשי</p>
                                        <p className="text-2xl font-black text-white italic">מרכז העסקים שרונה, תל אביב</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                             {/* Floating Elements Around Form */}
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/20 blur-2xl animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-blue-500/20 blur-2xl animate-pulse" />
                            
                            <NeonCard className="p-12! relative z-10 border-slate-800/80 shadow-[0_40px_100px_rgba(0,0,0,1)]">
                                <h4 className="text-4xl font-black text-amber-500 italic tracking-tighter mb-10 text-right uppercase">צרו קשר עכשיו</h4>
                                <form onSubmit={handleContactSubmit} className="space-y-8 text-right">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <NeonInput 
                                            label="שם מלא" 
                                            value={contactForm.name} 
                                            onChange={e => setContactForm({...contactForm, name: e.target.value})} 
                                            placeholder="ישראל ישראלי"
                                            required
                                            className="bg-[#0c1221]"
                                        />
                                        <NeonInput 
                                            label="מספר טלפון" 
                                            value={contactForm.phone} 
                                            onChange={e => setContactForm({...contactForm, phone: e.target.value})} 
                                            placeholder="05XXXXXXXX"
                                            required
                                            className="bg-[#0c1221]"
                                            dir="ltr"
                                        />
                                    </div>
                                    <NeonInput 
                                        label="דואר אלקטרוני" 
                                        type="email"
                                        value={contactForm.email} 
                                        onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                                        placeholder="israel@gmail.com"
                                        required
                                        className="bg-[#0c1221]"
                                        dir="ltr"
                                    />
                                    <NeonSelect 
                                        label="מעוניין בייעוץ בנושא"
                                        value={contactForm.subject}
                                        onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                                        className="bg-[#0c1221]"
                                    >
                                        <option value="ייעוץ פנסיוני">🛡️ תכנון פנסיוני מקיף</option>
                                        <option value="בדיקת ביטוחים">🔬 אופטימיזציה של תיק ביטוח</option>
                                        <option value="ביטוח חיים">👨‍👩‍👦‍👦 הגנה על המשפחה</option>
                                        <option value="ביטוח בריאות">🩺 בריאות וסיעוד פרימיום</option>
                                        <option value="אחר">⚡ שירות אחר</option>
                                    </NeonSelect>
                                    <NeonTextarea 
                                        label="פרטים נוספים" 
                                        rows={4} 
                                        value={contactForm.message}
                                        onChange={e => setContactForm({...contactForm, message: e.target.value})}
                                        placeholder="ספר לנו קצת על הצרכים שלך..."
                                        className="bg-[#0c1221]"
                                    />
                                    <NeonButton type="submit" className="w-full py-8! text-2xl! rounded-![2rem] shadow-[0_20px_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] transition-all">
                                        שליחת בקשה לייעוץ פרימיום
                                    </NeonButton>
                                </form>
                            </NeonCard>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="relative z-10 py-32 border-t border-slate-900 bg-[#020408]/80 backdrop-blur-3xl overflow-hidden mt-20">
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-amber-500/30 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16 mb-24">
                        <div className="flex items-center gap-6 group">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white font-black italic text-2xl group-hover:scale-110 transition-transform">Z</div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">
                                מגדל <span className="text-amber-500">זהב</span>
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-12">
                            {['שירותים', 'אודות', 'בלוג', 'קריירה', 'תקנון'].map((link) => (
                                <a key={link} href="#" className="text-xs font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-colors">{link}</a>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-16 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-8">
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">MAGEN ZAHAV FINANCIAL GROUP © 2026</p>
                        <div className="flex gap-10">
                            <Link href="/login" className="text-[9px] font-black text-amber-500 hover:text-white transition-colors uppercase tracking-widest">Login Portal</Link>
                            <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Designed for High Performance</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
