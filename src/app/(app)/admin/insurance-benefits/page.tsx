"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
    Scale, Sparkles, Zap, Shield, Heart, Car, Home, 
    ArrowRight, Check, X, Search, Info, TrendingUp,
    Gift, MessageSquare, Plus, Brain, LayoutGrid
} from "lucide-react";
import { useState, useMemo } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

interface BenefitRule {
    id: string;
    company: string;
    productType: string;
    advantage: string;
    discount: string;
    status: 'active' | 'upcoming' | 'expired';
    aiRating: number;
    details: string[];
}

export default function BenefitsPage() {
    const [selectedCategory, setSelectedCategory] = useState("הכל");
    const [searchQuery, setSearchQuery] = useState("");
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    const categories = [
        { id: "הכל", name: "הכל", icon: LayoutGrid },
        { id: "בריאות", name: "ביטוח בריאות", icon: Heart },
        { id: "חיים", name: "ביטוח חיים", icon: Shield },
        { id: "רכב", name: "ביטוח רכב", icon: Car },
        { id: "דירה", name: "ביטוח דירה", icon: Home },
        { id: "פנסיה", name: "פנסיה וחיסכון", icon: Zap },
    ];

    const benefits: BenefitRule[] = [
        {
            id: "1",
            company: "הראל",
            productType: "בריאות",
            advantage: "כיסוי תרופות מחוץ לסל ללא תקרה",
            discount: "25% למצטרפים חדשים",
            status: 'active',
            aiRating: 4.8,
            details: ["ללא השתתפות עצמית", "כולל בדיקות גנטיות", "ליווי VIP"]
        },
        {
            id: "2",
            company: "הפניקס",
            productType: "רכב",
            advantage: "ביטול השתתפות עצמית במוסכי הסדר",
            discount: "15% הנחת קילומטראז'",
            status: 'active',
            aiRating: 4.5,
            details: ["רכב חלופי עד הבית", "כיסוי פנסים ומראות", "שירות מהיר בוואטסאפ"]
        },
        {
            id: "3",
            company: "מנורה",
            productType: "חיים",
            advantage: "מסלול ריסק מוזל למקצועות חופשיים",
            discount: "30% ל-3 שנים ראשונות",
            status: 'active',
            aiRating: 4.2,
            details: ["חיתום רפואי מקוצר", "הטבה למשפחות עם ילדים", "צבירת נקודות לחיסכון"]
        },
        {
            id: "4",
            company: "איילון",
            productType: "דירה",
            advantage: "הרחבה למכשירי חשמל ביתיים כלולה",
            discount: "חודשיים מתנה בשנה הראשונה",
            status: 'active',
            aiRating: 4.0,
            details: ["כיסוי נזקי צנרת מורחב", "תיקון מהיר ללא השתתפות", "הגנה על תכשיטים"]
        },
        {
            id: "5",
            company: "מגדל",
            productType: "פנסיה",
            advantage: "דמי ניהול מובטחים לכל תקופת החיסכון",
            discount: "הטבה של 0.1% בהפקדה",
            status: 'upcoming',
            aiRating: 4.7,
            details: ["ניהול השקעות אקטיבי", "מסלול מותאם גיל", "ייעוץ פרישה כלול"]
        }
    ];

    const filteredBenefits = useMemo(() => {
        return benefits.filter(b => {
            const matchesCategory = selectedCategory === "הכל" || b.productType === selectedCategory;
            const matchesSearch = b.company.includes(searchQuery) || b.advantage.includes(searchQuery);
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const handleAiAnalysis = () => {
        setIsAiAnalyzing(true);
        setTimeout(() => setIsAiAnalyzing(false), 3000);
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-10 animate-in fade-in duration-1000 pb-20" dir="rtl">
                {/* Header Section */}
                <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-12 text-white border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -ml-20 -mb-20" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                        <div className="text-center lg:text-right space-y-4">
                            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-2">
                                <Sparkles size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">AI Powered Insights</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none">
                                יתרונות <span className="bg-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">והנחות</span>
                            </h1>
                            <p className="text-slate-400 text-lg font-medium max-w-2xl">
                                מרכז המידע החכם להשוואת תנאים, הנחות מיוחדות ויתרונות תחרותיים של כל חברות הביטוח.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 min-w-[280px]">
                            <Button 
                                onClick={handleAiAnalysis}
                                disabled={isAiAnalyzing}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 border-none px-8 py-6 rounded-2xl text-lg font-black shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 group transition-all"
                            >
                                <Brain size={24} className={isAiAnalyzing ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                                {isAiAnalyzing ? "מנתח נתונים..." : "ניתוח יתרונות AI"}
                            </Button>
                            <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white hover:bg-white/5 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                                <Plus size={18} /> הוסף יתרון חדש
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Categories & Search */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full lg:w-auto">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs transition-all whitespace-nowrap border ${
                                        selectedCategory === cat.id
                                            ? 'bg-amber-500 text-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                                            : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:text-amber-400 hover:border-amber-400/30'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="relative w-full lg:w-[400px]">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                        <input
                            type="text"
                            placeholder="חיפוש חברה, יתרון או הנחה..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all placeholder:text-slate-700"
                        />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left: Benefits List */}
                    <div className="xl:col-span-2 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredBenefits.map((benefit, index) => (
                                <motion.div
                                    key={benefit.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-0 border-slate-800 bg-slate-950/50 overflow-hidden hover:border-amber-500/30 transition-all group">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Company Flag */}
                                            <div className="md:w-48 bg-slate-900 flex flex-col items-center justify-center p-8 border-l border-slate-800 group-hover:bg-slate-800/50 transition-colors">
                                                <div className="text-4xl mb-3">{getCompanyLogo(benefit.company)}</div>
                                                <h4 className="text-xl font-black text-white">{benefit.company}</h4>
                                                <Badge className="mt-2 bg-amber-500/10 text-amber-500 border-amber-500/20">{benefit.productType}</Badge>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 p-8 space-y-6">
                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                                                            {benefit.advantage}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                                            <Gift size={16} />
                                                            {benefit.discount}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-black uppercase text-slate-500 mb-1">AI Score</div>
                                                            <div className="flex gap-1 text-amber-500">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Sparkles key={i} size={14} className={i < Math.floor(benefit.aiRating) ? 'fill-amber-500' : 'opacity-20'} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-white font-black">
                                                            {benefit.aiRating}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {benefit.details.map((detail, dIndex) => (
                                                        <div key={dIndex} className="flex items-center gap-2 text-sm font-medium text-slate-400">
                                                            <Check size={14} className="text-amber-500" />
                                                            {detail}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                                                    <Button variant="outline" size="sm" className="border-slate-800 text-slate-400 hover:text-white">שימוש בשיחה</Button>
                                                    <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-white border-none">פרטים נוספים</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {filteredBenefits.length === 0 && (
                            <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                                <Search size={48} className="mx-auto text-slate-700 mb-4" />
                                <p className="text-slate-500 font-bold">לא נמצאו תוצאות לחיפוש שלך</p>
                            </div>
                        )}
                    </div>

                    {/* Right: AI Analysis Panel */}
                    <div className="space-y-8">
                        {/* Current Best Deal */}
                        <Card className="p-10 border-none bg-linear-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white shadow-2xl relative overflow-hidden group rounded-[2.5rem] shadow-indigo-500/20">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                <TrendingUp size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                    המלצה חמה מה-AI
                                </div>
                                <div>
                                    <h5 className="text-lg font-bold text-indigo-100 mb-1">ההצעה המשתלמת ביותר כיום:</h5>
                                    <h3 className="text-4xl font-black italic tracking-tighter">הראל - בריאות פרימיום</h3>
                                </div>
                                <div className="p-6 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/10 shadow-inner">
                                    <p className="text-base font-medium leading-relaxed italic opacity-90">
                                        "ניתוח ה-AI מראה כי שילוב של הנחת ה-25% יחד עם כיסוי התרופות ללא תקרה של הראל מעניק כיום את יחס העלות-תועלת הגבוה ביותר בשוק למשפחות."
                                    </p>
                                </div>
                                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 border-none font-black py-5 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02]">כלי עזר למכירה</Button>
                            </div>
                        </Card>

                        {/* Recent Market Changes */}
                        <Card className="p-8 border-slate-800 bg-slate-950/80 shadow-xl">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                <Zap className="text-amber-500" />
                                עדכוני שוק אחרונים
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { time: "לפני שעה", text: "הפניקס עדכנו את מחירון ביטוח הרכב.", type: "price" },
                                    { time: "הבוקר", text: "מגדל השיקו מסלול פנסיה חדש לעובדי הייטק.", type: "product" },
                                    { time: "אתמול", text: "הנחת ה-30% של מנורה הוארכה עד סוף החודש.", type: "promo" }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="h-10 w-1 shrink-0 bg-slate-800 rounded-full" />
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold mb-1">{item.time}</p>
                                            <p className="text-sm text-slate-300 font-medium">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Quick AI Quote */}
                        <Card className="p-8 border-slate-800 bg-amber-500/5 relative overflow-hidden group">
                           <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                           <h3 className="text-xl font-black text-amber-500 mb-4 flex items-center gap-3">
                                <MessageSquare size={20} />
                                שאל את ה-AI על יתרון
                           </h3>
                           <div className="space-y-4 relative z-10">
                               <textarea 
                                    placeholder="דוגמה: מהו היתרון המרכזי של הפניקס מול הראל בביטוח בריאות?"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-medium text-slate-300 outline-none focus:ring-1 focus:ring-amber-500 h-24 resize-none"
                               />
                               <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black">נתח עכשיו</Button>
                           </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

// Helpers
function getCompanyLogo(company: string) {
    switch (company) {
        case 'הראל': return '🏛️';
        case 'הפניקס': return '🔥';
        case 'מנורה': return '💡';
        case 'איילון': return '🦌';
        case 'מגדל': return '🏢';
        default: return '🛡️';
    }
}
