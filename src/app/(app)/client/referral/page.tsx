"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Gift, Heart, Send, Coins, Lock, Unlock, UserPlus, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { NeonCard, NeonInput, NeonSelect, NeonButton } from "@/components/ui/neon-form";

export default function ReferralPage() {
    const { user } = useAuth();
    const [viewState, setViewState] = useState<"intro" | "form">("intro");
    const [isLoading, setIsLoading] = useState(false);
    const [clientCoins, setClientCoins] = useState(0);

    useEffect(() => {
        setClientCoins(150);
    }, []);

    const [formData, setFormData] = useState({
        contactName: "",
        phone: "",
        product: "pension",
        callTime: "",
    });

    const handleIntroComplete = () => {
        setViewState("form");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await firestoreService.addLead({
                firstName: formData.contactName.split(" ")[0],
                lastName: formData.contactName.split(" ").slice(1).join(" ") || "",
                phone: formData.phone,
                email: "",
                status: "new",
                source: "Referral",
                interestedIn: formData.product,
                referredBy: user?.uid || "unknown_client",
                createdAt: new Date(),
                notes: `System: Referral from client. Call back at: ${formData.callTime}`
            } as any);

            toast.success("ההפניה התקבלה בהצלחה! 75 מטבעות יחכו לך לאחר הסגירה.");
            setFormData({
                contactName: "",
                phone: "",
                product: "pension",
                callTime: "",
            });

        } catch (error) {
            console.error("Referral failed:", error);
            toast.error("משהו השתבש. אנא נסה שנית.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6" dir="rtl">
            <AnimatePresence mode="wait">
                {viewState === "intro" ? (
                    <IntroView onComplete={handleIntroComplete} />
                ) : (
                    <div className="space-y-8">
                        <CoinsDashboard currentCoins={clientCoins} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <ReferralForm
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                            />
                            <SecretGiftList currentCoins={clientCoins} />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

function IntroView({ onComplete }: { onComplete: () => void }) {
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowExplanation(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-slate-950/80 rounded-[2.5rem] shadow-2xl border border-amber-500/30 relative overflow-hidden backdrop-blur-xl"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-linear-to-b from-amber-500/10 to-transparent opacity-50" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl opacity-30" />

            {!showExplanation ? (
                <div className="relative z-10 scale-150">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="relative"
                    >
                        {/* Left Hand */}
                        <motion.div
                            className="absolute -left-12 top-0"
                            initial={{ x: -50, rotate: -45, opacity: 0 }}
                            animate={{ x: -18, rotate: -15, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <span className="text-6xl">🤏</span>
                        </motion.div>

                        {/* Right Hand */}
                        <motion.div
                            className="absolute -right-12 top-0 scale-x-[-1]"
                            initial={{ x: 50, rotate: -45, opacity: 0 }}
                            animate={{ x: 18, rotate: -15, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <span className="text-6xl">🤏</span>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.2, type: "spring" }}
                            className="w-20 h-20 bg-linear-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 z-20 mx-auto"
                        >
                            <Heart className="w-10 h-10 text-slate-900 fill-current animate-pulse" />
                        </motion.div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="mt-12 text-2xl font-black text-amber-200 font-display italic tracking-tight"
                    >
                        מגן זהב אוהבים אותך!
                    </motion.h2>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-md space-y-6"
                >
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-4 border border-amber-500/30">
                        <Coins className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-white font-display italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">הכירו את MagenCoins!</h2>

                    <div className="bg-slate-950/60 backdrop-blur-md rounded-[2rem] p-8 text-right space-y-6 border border-amber-500/20 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-200 font-black border border-amber-500/30">1</div>
                            <p className="text-slate-300 font-bold">המליצו לחבר על השירותים שלנו</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-200 font-black border border-amber-500/30">2</div>
                            <p className="text-slate-300 font-bold">ברגע שהחבר מצטרף למשפחה...</p>
                        </div>
                        <div className="flex items-center gap-4 translate-x-2">
                            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30">3</div>
                            <p className="text-white text-lg font-black italic drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">אתם מקבלים 75 מטבעות!</p>
                        </div>
                        <div className="pt-6 border-t border-white/10 mt-4">
                            <p className="text-center font-black text-amber-400 italic">
                                צברתם 225 מטבעות? <br />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">חנות המתנות הסודית נפתחת</span>
                            </p>
                        </div>
                    </div>

                    <NeonButton
                        onClick={onComplete}
                        className="w-full text-lg py-6"
                    >
                        תודה על העדכון, בואו נתחיל!
                    </NeonButton>
                </motion.div>
            )}
        </motion.div>
    );
}

function CoinsDashboard({ currentCoins }: { currentCoins: number }) {
    const TARGET = 225;
    const progress = Math.min((currentCoins / TARGET) * 100, 100);

    return (
        <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden border border-amber-500/30 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-30" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-right">
                    <h2 className="text-3xl font-black mb-2 font-display italic tracking-tighter text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">הארנק שלי</h2>
                    <p className="text-slate-400 font-bold text-sm">הדרך למתנה הבאה שלך מתחילה כאן</p>
                </div>

                <div className="flex items-center gap-6 bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-inner">
                    <div className="text-right">
                        <span className="block text-5xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-linear-to-t from-amber-600 to-amber-200">{currentCoins}</span>
                        <span className="text-[10px] text-amber-400/60 font-black uppercase tracking-widest block -mt-1">MagenCoins Balance</span>
                    </div>
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                        <Coins className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-12 relative pt-6">
                <div className="flex justify-between text-[10px] font-black text-amber-400/60 mb-3 uppercase tracking-[0.2em]">
                    <span>נקודת התחלה</span>
                    <span>יעד: {TARGET} מטבעות</span>
                </div>
                <div className="h-6 bg-slate-900 border border-white/5 rounded-full overflow-hidden backdrop-blur-sm p-1 shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-linear-to-r from-amber-600 via-amber-400 to-orange-400 rounded-full relative group"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>
                {progress >= 100 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-6 py-2 rounded-full text-xs font-black shadow-[0_0_25px_rgba(251,191,36,0.5)] z-20"
                    >
                        🎉 מזל טוב! החנות פתוחה עבורך
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function ReferralForm({ formData, setFormData, onSubmit, isLoading }: any) {
    return (
        <NeonCard className="p-8 md:p-10">
            <h3 className="text-2xl font-black text-amber-200 mb-8 flex items-center gap-3 italic drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                <UserPlus className="w-6 h-6 text-amber-400" />
                הפניית חבר חדש
            </h3>

            <form onSubmit={onSubmit} className="space-y-6">
                <NeonInput
                    label="שם החבר/ה"
                    required
                    placeholder="ישראל ישראלי"
                    value={formData.contactName}
                    onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                />

                <NeonInput
                    label="טלפון"
                    type="tel"
                    required
                    placeholder="050-0000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />

                <NeonSelect
                    label="במה הם מתעניינים?"
                    value={formData.product}
                    onChange={e => setFormData({ ...formData, product: e.target.value })}
                >
                    <option value="insurance" className="bg-slate-900 border-none">ביטוח (רכב/דירה)</option>
                    <option value="platinum" className="bg-slate-900 border-none">מועדון פלטינום</option>
                    <option value="pension" className="bg-slate-900 border-none">פנסיה ופיננסים</option>
                </NeonSelect>

                <div className="relative">
                    <NeonInput
                        label="מתי נוח להם לדבר?"
                        type="time"
                        required
                        value={formData.callTime}
                        onChange={e => setFormData({ ...formData, callTime: e.target.value })}
                    />
                    <Clock className="w-4 h-4 text-amber-400/50 absolute left-4 bottom-4" />
                </div>

                <div className="pt-6">
                    <NeonButton
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 text-base"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⌛</motion.span>
                                שולח...
                            </span>
                        ) : (
                            <span className="flex items-center gap-3">
                                <Send className="w-4 h-4" />
                                שלח לטיפול וצבור מטבעות
                            </span>
                        )}
                    </NeonButton>
                    <p className="text-center text-[10px] text-slate-500 mt-4 font-bold uppercase tracking-widest">
                        * המטבעות יתעדכנו לאחר שהחבר יבצע רכישה
                    </p>
                </div>
            </form>
        </NeonCard>
    );
}

function SecretGiftList({ currentCoins }: { currentCoins: number }) {
    const isUnlocked = currentCoins >= 225;

    const GIFTS = [
        { name: "שובר לארוחת בוקר זוגית", cost: 225, icon: "🍳" },
        { name: "כרטיס לסרט VIP", cost: 300, icon: "🎬" },
        { name: "סטייק בייקבוק יוקרתי", cost: 450, icon: "🥩" },
    ];

    return (
        <div className={`rounded-[2.5rem] p-8 md:p-10 border transition-all duration-700 relative overflow-hidden h-full flex flex-col
            ${isUnlocked 
                ? "bg-slate-950/80 border-amber-500/30 shadow-[0_0_40px_rgba(251,191,36,0.1)]" 
                : "bg-slate-900/40 border-white/5"}`}
        >
            <div className="flex items-center justify-between mb-10 relative z-10">
                <h3 className={`text-2xl font-black flex items-center gap-3 italic drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]
                    ${isUnlocked ? "text-amber-200" : "text-slate-500"}`}
                >
                    <Gift className={`w-6 h-6 ${isUnlocked ? "text-amber-400" : "text-slate-600"}`} />
                    חנות המתנות
                </h3>
                {isUnlocked ? (
                    <span className="bg-amber-500/20 text-amber-200 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-amber-500/30 uppercase tracking-widest">
                        <Unlock className="w-3 h-3" /> UNLOCKED
                    </span>
                ) : (
                    <span className="bg-slate-800/80 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-slate-700 uppercase tracking-widest">
                        <Lock className="w-3 h-3" /> LOCKED
                    </span>
                )}
            </div>

            <div className="space-y-6 relative z-10 flex-1">
                {GIFTS.map((gift, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={isUnlocked ? { scale: 1.02, x: -5 } : {}}
                        className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-500
                        ${isUnlocked
                            ? "bg-white/5 border-amber-500/20 hover:border-amber-400 shadow-sm backdrop-blur-md"
                            : "bg-slate-900/30 border-transparent opacity-40 blur-[0.5px] select-none"
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner
                                ${isUnlocked ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-600"}`}
                            >
                                {gift.icon}
                            </div>
                            <div>
                                <p className={`font-black italic ${isUnlocked ? "text-white" : "text-slate-500"}`}>{gift.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Coins size={10} className="text-amber-500/70" />
                                    <p className="text-[11px] font-black text-amber-500/70 uppercase tracking-tighter">{gift.cost} MagenCoins</p>
                                </div>
                            </div>
                        </div>
                        {isUnlocked && (
                            <button className="bg-amber-500 text-slate-950 text-[10px] font-black px-5 py-2 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 uppercase">
                                הזמן עכשיו
                            </button>
                        )}
                    </motion.div>
                ))}

                {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                        <div className="w-20 h-20 bg-slate-800/80 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-600 border border-slate-700/50 shadow-2xl">
                            <Lock className="w-10 h-10" />
                        </div>
                        <p className="font-black text-slate-400 text-lg italic mb-2">החנות עדיין נעולה</p>
                        <p className="text-xs text-slate-600 max-w-[220px] font-bold leading-relaxed">
                            הגיעו ל-225 מטבעות <br />כדי לחשוף את ההטבות המיוחדות שלנו
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
