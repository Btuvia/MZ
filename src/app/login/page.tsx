"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/base";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const { demoLogin } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect is handled by the AuthContext or we can do it here. 
            // Determining role/destination usually requires checking a user profile in Firestore.
            // For now, we'll default to admin dashboard as requested in the mock, 
            // or we could check the email domain/pattern if we want to keep some simple logic.

            if (email.includes("admin")) {
                router.push("/admin/dashboard");
            } else if (email.includes("agent")) {
                router.push("/agent/dashboard");
            } else {
                router.push("/client/dashboard");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = "שגיאה בהתחברות";
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = "אימייל או סיסמה שגויים";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "יותר מדי ניסיונות התחברות, נסה שוב מאוחר יותר";
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            toast.error("נא להזין אימייל בשדה למעלה כדי לשלוח איפוס סיסמה");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());
            toast.success("נשלח מייל לאיפוס סיסמה (אם האימייל קיים במערכת)");
        } catch (err: unknown) {
            const code = (err as FirebaseError | undefined)?.code;
            if (code === "auth/invalid-email") {
                toast.error("אימייל לא תקין");
                return;
            }
            toast.error("לא ניתן לשלוח איפוס סיסמה כרגע");
        }
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6" dir="rtl">

            <div className="w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-1000">
                <div className="mb-12 text-center flex flex-col items-center">
                    <div className="relative h-24 w-24 mb-6 drop-shadow-2xl animate-float neon-gold">
                        <Image src="/logo.jpg" fill alt="Magen Zahav Logo" className="object-contain rounded-2xl" />
                    </div>
                    <h1 className="text-4xl font-black font-display tracking-tighter">
                        <span className="text-gradient-gold neon-text-gold">Magen</span>
                        <span className="text-gradient neon-text-blue">Zahav</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Magen Zahav Platinum</p>
                </div>

                <div className="glass-card rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group border border-amber-500/20">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-l from-amber-500 via-amber-400 to-blue-500"></div>

                    <h2 className="text-2xl font-black text-amber-100 mb-8 text-center italic neon-text-gold">כניסה למערכת</h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pr-2" htmlFor="email">דואר אלקטרוני</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="magen@insurcrm.co.il"
                                className="w-full px-6 py-4 rounded-2xl glass-card border border-amber-500/20 outline-none focus:bg-slate-800/80 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-slate-200 placeholder-slate-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pr-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest" htmlFor="password">סיסמה</label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-black text-amber-400 hover:underline uppercase tracking-wider"
                                >
                                    שכחתי סיסמה
                                </button>
                            </div>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-6 py-4 rounded-2xl glass-card border border-amber-500/20 outline-none focus:bg-slate-800/80 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold tracking-widest text-slate-200 placeholder-slate-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black text-center animate-in shake-in">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-5 text-base tracking-tighter"
                            variant="gold"
                            disabled={loading}
                        >
                            {loading ? "מתחבר..." : "התחברות לחשבון"}
                        </Button>

                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => demoLogin("admin")}
                                className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold transition-all border border-amber-500/30"
                            >
                                מנהל (דמו)
                            </button>
                            <button
                                type="button"
                                onClick={() => demoLogin("agent")}
                                className="py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-[10px] font-bold transition-all border border-blue-500/30"
                            >
                                סוכן (דמו)
                            </button>
                            <button
                                type="button"
                                onClick={() => demoLogin("client")}
                                className="py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-xl text-[10px] font-bold transition-all border border-slate-600/50"
                            >
                                לקוח (דמו)
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-700/50 text-center">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            אין לך חשבון?{" "}
                            {supportEmail ? (
                                <a href={`mailto:${supportEmail}`} className="text-amber-400 hover:underline">
                                    צור קשר עם מנהל המערכת
                                </a>
                            ) : (
                                <span className="text-amber-400">צור קשר עם מנהל המערכת</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Built for Champions by Antigravity</p>
                </div>
            </div>
        </div>
    );
}
