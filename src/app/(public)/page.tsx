"use client";

import Link from "next/link";
import { Button, Badge } from "@/components/ui/base";

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-gradient overflow-hidden selection:bg-accent/20 selection:text-accent font-sans" dir="rtl">
      {/* Premium Navbar */}
      <nav className="fixed top-6 left-1/2 mt-[-20px] translate-x-[-50%] z-50 w-[90%] max-w-7xl glass rounded-[2rem] px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-accent/20 animate-float">M</div>
          <h2 className="text-xl font-black text-primary font-display tracking-tight">Insur<span className="text-accent">CRM</span></h2>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link href="#features" className="text-xs font-black text-slate-500 hover:text-accent uppercase tracking-widest transition-colors">יתרונות</Link>
          <Link href="#ai" className="text-xs font-black text-slate-500 hover:text-accent uppercase tracking-widest transition-colors">כלי AI</Link>
          <Link href="#security" className="text-xs font-black text-slate-500 hover:text-accent uppercase tracking-widest transition-colors">אבטחה</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-black text-primary uppercase tracking-widest hover:text-accent transition-colors">התחברות</Link>
          <Button variant="secondary" size="sm" className="shadow-xl shadow-accent/20">נסה חינם</Button>
        </div>
      </nav>

      <main className="relative z-10 pt-48 pb-20 px-6">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Badge variant="primary">The Future of Insurance Management</Badge>
            <h1 className="text-6xl md:text-8xl font-black text-primary mt-8 mb-8 tracking-tighter leading-[0.9] italic">
              ניהול סוכנות <br />
              <span className="text-gradient">ברמה עולמית</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12">
              מערכת ה-CRM המהירה, החכמה והיפה ביותר עבור סוכני ביטוח ופנסיה.
              משלבת בינה מלאכותית מתקדמת לניתוח פוליסות וייצור תובנות בזמן אמת.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login">
                <Button variant="secondary" size="lg" className="px-12 py-7 text-lg shadow-2xl shadow-accent/30 tracking-tighter hover:scale-105 active:scale-95 transition-all">
                  התחל עכשיו
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-12 py-7 text-lg border-white shadow-xl hover:bg-white/80 transition-all backdrop-blur-xl">
                תיאום דמו
              </Button>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="mt-32 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">
            <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] w-[120%] h-[120%] bg-accent/10 rounded-full blur-[120px] -z-10"></div>
            <div className="glass rounded-[3rem] p-4 shadow-[0_50px_100px_-20px_rgba(31,41,55,0.25)] relative group cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-[500px] w-full bg-slate-50 rounded-[2.5rem] flex items-center justify-center p-12 relative overflow-hidden">
                {/* Mock Dashboard UI Elements */}
                <div className="absolute top-10 right-10 w-60 h-40 glass shadow-2xl rounded-3xl animate-float p-6">
                  <div className="h-2 w-12 bg-accent/20 rounded-full mb-4"></div>
                  <div className="h-8 w-32 bg-primary/20 rounded-full"></div>
                </div>
                <div className="absolute bottom-10 left-10 w-80 h-32 glass shadow-2xl rounded-3xl animate-float p-6" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/20"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                      <div className="h-2 w-12 bg-slate-100 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-20 w-20 rounded-3xl bg-accent flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-accent/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-primary tracking-tighter">Visual Intelligence Dashboard</h3>
                  <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">AI Powered Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Minimalist */}
        <section id="features" className="max-w-7xl mx-auto mt-60 grid md:grid-cols-3 gap-12">
          {[
            { title: "סריקת מסמכים חכמה", desc: "סורק מבוסס AI המנתח קבצי PDF והר הביטוח באופן אוטומטי.", icon: "📑" },
            { title: "חיזוי נטישה (Churn)", desc: "זיהוי לקוחות בסיכון לפני שהם עוזבים בעזרת מודלים מתקדמים.", icon: "🧠" },
            { title: "מערכת Kanban ייעודית", desc: "ניהול תהליכי מכירה בינלאומיים המותאמים לשוק הביטוח הישראלי.", icon: "🚀" },
          ].map((f, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="text-4xl mb-6 group-hover:scale-125 transition-transform duration-500 inline-block">{f.icon}</div>
              <h3 className="text-xl font-black text-primary mb-4 tracking-tight italic">{f.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="py-20 text-center border-t border-slate-100 mt-20">
        <div className="flex items-center justify-center gap-3 mb-8 opacity-40">
          <div className="h-8 w-8 rounded-lg bg-slate-400 flex items-center justify-center text-white font-black">M</div>
          <h2 className="text-lg font-black text-slate-400 font-display">InsurCRM</h2>
        </div>
        <p className="text-xs font-black text-slate-300 uppercase tracking-[0.5em]">Global Standards. Local Trust.</p>
      </footer>
    </div>
  );
}
