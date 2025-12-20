"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Gift, Heart, Send, Coins, Lock, Unlock, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function ReferralPage() {
    const { user } = useAuth();
    const [viewState, setViewState] = useState<"intro" | "form">("intro");
    const [isLoading, setIsLoading] = useState(false);
    const [clientCoins, setClientCoins] = useState(0); // Mock starting balance

    // Mock user fetching/coins loading
    useEffect(() => {
        // In a real app, we would fetch the client's actual coin balance here
        // const fetchCoins = async () => { ... }
        setClientCoins(150); // Example: Client already has some coins
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
            // 1. Create the lead
            await firestoreService.addLead({
                firstName: formData.contactName.split(" ")[0],
                lastName: formData.contactName.split(" ").slice(1).join(" ") || "",
                phone: formData.phone,
                email: "", // Not provided in simplified form
                status: "New",
                source: "Referral",
                interestedIn: formData.product,
                referredBy: user?.uid || "unknown_client", // Link to current user
                createdAt: new Date(),
                notes: `System: Referral from client. Call back at: ${formData.callTime}`
            });

            // 2. Feedback
            toast.success("ההפניה התקבלה בהצלחה! 75 מטבעות יחכו לך לאחר הסגירה.");

            // 3. Reset
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
        <div className="max-w-4xl mx-auto p-6">
            <AnimatePresence mode="wait">
                {viewState === "intro" ? (
                    <IntroView onComplete={handleIntroComplete} />
                ) : (
                    <div className="space-y-8">
                        <CoinsDashboard currentCoins={clientCoins} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

    // Initial "Heart Hand" Animation Sequence
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowExplanation(true);
        }, 2500); // Show explanation after animation
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-50 to-white opacity-50" />

            {!showExplanation ? (
                <div className="relative z-10 scale-150">
                    {/* "Heart Hands" Animation Simulation */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="relative"
                    >
                        {/* Left Hand */}
                        <motion.div
                            className="absolute -left-12 top-0 text-primary"
                            initial={{ x: -50, rotate: -45, opacity: 0 }}
                            animate={{ x: -18, rotate: -15, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <span className="text-6xl">🤏</span> {/* Placeholder emoji for hand shape */}
                        </motion.div>

                        {/* Right Hand */}
                        <motion.div
                            className="absolute -right-12 top-0 text-primary scale-x-[-1]"
                            initial={{ x: 50, rotate: -45, opacity: 0 }}
                            animate={{ x: 18, rotate: -15, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            <span className="text-6xl">🤏</span>
                        </motion.div>

                        {/* The Heart & Logo appearing in middle */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.2, type: "spring" }}
                            className="w-20 h-20 bg-gradient-to-tr from-accent to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200 z-20 mx-auto"
                        >
                            <Heart className="w-10 h-10 text-white fill-current animate-pulse" />
                        </motion.div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="mt-12 text-2xl font-black text-slate-800 font-display"
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
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 mb-4">
                        <Coins className="w-10 h-10" />
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 font-display">הכירו את MagenCoins!</h2>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-right space-y-4 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">1</div>
                            <p className="text-slate-600 font-medium">המליצו לחבר על השירותים שלנו</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">2</div>
                            <p className="text-slate-600 font-medium">ברגע שהחבר מצטרף למשפחה...</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">3</div>
                            <p className="text-slate-800 font-bold">אתם מקבלים 75 מטבעות!</p>
                        </div>
                        <div className="pt-2 border-t mt-4">
                            <p className="text-center font-bold text-accent">
                                צברתם 225 מטבעות? <br />
                                <span className="text-sm font-normal text-slate-500">חנות המתנות הסודית נפתחת עבורכם! 🎁</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onComplete}
                        className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        תודה על העדכון, בואו נתחיל!
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}

function CoinsDashboard({ currentCoins }: { currentCoins: number }) {
    const TARGET = 225;
    const progress = Math.min((currentCoins / TARGET) * 100, 100);

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-right">
                    <h2 className="text-2xl font-black mb-1 font-display opacity-90">הארנק שלי</h2>
                    <p className="text-slate-400 text-sm">הדרך למתנה הבאה שלך</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-4xl font-black font-mono tracking-tight text-yellow-400">{currentCoins}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">MagenCoins</span>
                    </div>
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center border border-yellow-500/50">
                        <Coins className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8 relative pt-6">
                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    <span>0</span>
                    <span>{TARGET} (Goal)</span>
                </div>
                <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 rounded-full relative"
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>
                {progress >= 100 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                    >
                        🎉 מגיע לך מתנה!
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function ReferralForm({ formData, setFormData, onSubmit, isLoading }: any) {
    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                הפניית חבר חדש
            </h3>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">שם החבר/ה</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="ישראל ישראלי"
                        value={formData.contactName}
                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">טלפון</label>
                    <input
                        type="tel"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        placeholder="050-0000000"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">במה הם מתעניינים?</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        value={formData.product}
                        onChange={e => setFormData({ ...formData, product: e.target.value })}
                    >
                        <option value="insurance">ביטוח (רכב/דירה)</option>
                        <option value="platinum">מועדון פלטינום</option>
                        <option value="pension">פנסיה ופיננסים</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">מתי נוח להם לדבר?</label>
                    <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="time"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            value={formData.callTime}
                            onChange={e => setFormData({ ...formData, callTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isLoading ? <span className="animate-spin">⌛</span> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
                        שלח לטיפול וצבור מטבעות
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">
                        * המטבעות יתעדכנו לאחר שהחבר יבצע רכישה
                    </p>
                </div>
            </form>
        </div>
    );
}

function SecretGiftList({ currentCoins }: { currentCoins: number }) {
    const isUnlocked = currentCoins >= 225;

    const GIFTS = [
        { name: "שובר לארוחת בוקר זוגית", cost: 225 },
        { name: "כרטיס לסרט VIP", cost: 300 },
        { name: "סטייק בייקבוק יוקרתי", cost: 450 },
    ];

    return (
        <div className={`rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-500
            ${isUnlocked ? "bg-gradient-to-b from-white to-amber-50" : "bg-slate-50"}`}
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Gift className={`w-5 h-5 ${isUnlocked ? "text-accent" : "text-slate-400"}`} />
                    חנות המתנות הסודית
                </h3>
                {isUnlocked ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> פתוח
                    </span>
                ) : (
                    <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> נעול
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {GIFTS.map((gift, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all
                        ${isUnlocked
                            ? "bg-white border-amber-100 shadow-sm hover:shadow-md cursor-pointer"
                            : "bg-slate-100 border-transparent opacity-60 blur-[1px] select-none"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                ${isUnlocked ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-400"}`}
                            >
                                <Gift className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{gift.name}</p>
                                <p className="text-xs text-slate-500">{gift.cost} מטבעות</p>
                            </div>
                        </div>
                        {isUnlocked && (
                            <button className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800">
                                הזמן
                            </button>
                        )}
                    </div>
                ))}

                {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center md:pt-20 bg-slate-50/50 backdrop-blur-[1px] text-center p-6 z-10">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <Lock className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-slate-600 mb-1">החנות עדיין נעולה</p>
                        <p className="text-sm text-slate-500 max-w-[200px]">
                            הגיעו ל-225 מטבעות כדי לחשוף את ההטבות המיוחדות שלנו
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
