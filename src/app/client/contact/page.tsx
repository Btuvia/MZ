"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        subject: "",
        message: "",
        priority: "רגיל",
        category: "שאלה כללית"
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ subject: "", message: "", priority: "רגיל", category: "שאלה כללית" });
        }, 3000);
    };

    const agentInfo = {
        name: "רועי כהן",
        title: "סוכן ביטוח מוסמך",
        phone: "054-123-4567",
        email: "roei.cohen@insurcrm.co.il",
        whatsapp: "972541234567",
        availability: "א׳-ה׳ 9:00-18:00",
        responseTime: "תוך 2 שעות",
        image: "👨‍💼"
    };

    const contactMethods = [
        {
            icon: "📞",
            title: "שיחת טלפון",
            description: "התקשר ישירות לסוכן שלך",
            action: "התקשר עכשיו",
            color: "from-blue-600 to-indigo-700",
            link: `tel:${agentInfo.phone}`
        },
        {
            icon: "💬",
            title: "וואטסאפ",
            description: "שלח הודעה מהירה בוואטסאפ",
            action: "פתח וואטסאפ",
            color: "from-success to-emerald-600",
            link: `https://wa.me/${agentInfo.whatsapp}`
        },
        {
            icon: "✉️",
            title: "דואר אלקטרוני",
            description: "שלח מייל מפורט",
            action: "שלח מייל",
            color: "from-purple-600 to-indigo-700",
            link: `mailto:${agentInfo.email}`
        },
        {
            icon: "📅",
            title: "קביעת פגישה",
            description: "קבע פגישת ייעוץ אישית",
            action: "קבע פגישה",
            color: "from-amber-500 to-orange-600",
            link: "#schedule"
        }
    ];

    const faq = [
        {
            question: "כיצד אני מגיש תביעה?",
            answer: "ניתן להגיש תביעה דרך המערכת, בטלפון לסוכן, או ישירות לחברת הביטוח. הסוכן שלך ילווה אותך בכל התהליך."
        },
        {
            question: "מתי מתבצע חידוש הפוליסה?",
            answer: "הפוליסה מתחדשת אוטומטית בתאריך החידוש. תקבל תזכורת חודש לפני החידוש."
        },
        {
            question: "איך אני משנה פרטים אישיים?",
            answer: "ניתן לעדכן פרטים אישיים דרך הסוכן שלך או בטלפון לחברת הביטוח."
        },
        {
            question: "מה זמן התגובה לפניות?",
            answer: "הסוכן שלך מתחייב לחזור אליך תוך 2 שעות בימי עבודה."
        }
    ];

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">צור קשר</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            הסוכן שלך כאן בשבילך. יש לך שאלה? צריך עזרה? רוצה לעדכן משהו? אנחנו זמינים עבורך.
                        </p>
                    </div>
                </div>

                {/* Agent Info Card */}
                <Card className="border-none shadow-2xl bg-white overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-accent to-blue-600"></div>
                    <div className="p-8">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-4xl shadow-xl">
                                {agentInfo.image}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-primary">{agentInfo.name}</h2>
                                <p className="text-sm font-bold text-slate-400 mt-1">{agentInfo.title}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <Badge className="bg-success/10 text-success border-success/20">
                                        זמין עכשיו
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-400">{agentInfo.availability}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                    📞
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">טלפון</p>
                                    <p className="text-sm font-bold text-primary">{agentInfo.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                    ✉️
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">אימייל</p>
                                    <p className="text-sm font-bold text-primary">{agentInfo.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    ⏱️
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">זמן תגובה</p>
                                    <p className="text-sm font-bold text-primary">{agentInfo.responseTime}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Contact Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {contactMethods.map((method, i) => (
                        <a
                            key={i}
                            href={method.link}
                            target={method.link.startsWith('http') ? '_blank' : undefined}
                            rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="block"
                        >
                            <Card className={`border-none p-6 text-white bg-gradient-to-br ${method.color} shadow-xl hover:shadow-2xl transition-all cursor-pointer group h-full`}>
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{method.icon}</div>
                                <h3 className="text-lg font-black mb-2">{method.title}</h3>
                                <p className="text-sm text-white/80 mb-4 font-medium">{method.description}</p>
                                <div className="flex items-center gap-2 text-sm font-black">
                                    {method.action}
                                    <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
                                </div>
                            </Card>
                        </a>
                    ))}
                </div>

                {/* Contact Form */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 border-none shadow-xl bg-white p-8">
                        <h2 className="text-2xl font-black text-primary mb-6">שלח הודעה</h2>
                        {submitted ? (
                            <div className="p-12 text-center animate-in zoom-in-95 duration-500">
                                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center text-success text-4xl mx-auto mb-4 animate-bounce">
                                    ✓
                                </div>
                                <h3 className="text-xl font-black text-primary mb-2">ההודעה נשלחה בהצלחה!</h3>
                                <p className="text-sm text-slate-500 font-medium">הסוכן שלך יחזור אליך בהקדם</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">קטגוריה</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        >
                                            <option>שאלה כללית</option>
                                            <option>תביעה</option>
                                            <option>עדכון פרטים</option>
                                            <option>ייעוץ</option>
                                            <option>תלונה</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">עדיפות</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        >
                                            <option>רגיל</option>
                                            <option>גבוה</option>
                                            <option>דחוף</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">נושא</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="למשל: שאלה לגבי פוליסת הבריאות"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2">הודעה</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="כתוב את הפנייה שלך כאן..."
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-medium text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                                        required
                                    />
                                </div>

                                <Button type="submit" variant="secondary" className="w-full py-4 shadow-xl shadow-accent/20">
                                    שלח הודעה
                                </Button>
                            </form>
                        )}
                    </Card>

                    {/* FAQ */}
                    <Card className="border-none shadow-xl bg-slate-900 text-white p-8">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                            <span className="text-accent">❓</span> שאלות נפוצות
                        </h3>
                        <div className="space-y-4">
                            {faq.map((item, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                                    <h4 className="text-sm font-black mb-2">{item.question}</h4>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Emergency Contact */}
                <Card className="border-2 border-error/20 bg-error/5 p-8">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-error/20 flex items-center justify-center text-error text-xl">
                            🚨
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-error mb-2">מקרה חירום?</h3>
                            <p className="text-sm text-slate-600 font-medium mb-4">
                                במקרה של תאונה או מצב חירום, התקשר מיד למוקד החירום של חברת הביטוח:
                            </p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="border-error text-error hover:bg-error hover:text-white">
                                    מוקד הראל: *2700
                                </Button>
                                <Button variant="outline" className="border-error text-error hover:bg-error hover:text-white">
                                    מוקד הפניקס: *6226
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
