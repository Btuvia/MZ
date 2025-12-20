"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/base";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6" dir="rtl">

            <div className="w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-1000">
                <div className="mb-12 text-center flex flex-col items-center">
                    <div className="relative h-24 w-24 mb-6 drop-shadow-2xl animate-float">
                        <Image src="/logo.jpg" fill alt="Magen Zahav Logo" className="object-contain" />
                    </div>
                    <h1 className="text-4xl font-black text-primary font-display tracking-tighter">Magen<span className="text-accent">Zahav</span></h1>
                    <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Magen Zahav Platinum</p>
                </div>

                <div className="glass rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-l from-accent to-blue-400"></div>

                    <h2 className="text-2xl font-black text-primary mb-8 text-center italic">כניסה למערכת</h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2" htmlFor="email">דואר אלקטרוני</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="magen@insurcrm.co.il"
                                className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pr-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest" htmlFor="password">סיסמה</label>
                                <Link href="#" className="text-[10px] font-black text-accent hover:underline uppercase tracking-wider">שכחתי סיסמה</Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-slate-100 outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold tracking-widest"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-black text-center animate-in shake-in">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-5 text-base shadow-2xl shadow-accent/30 tracking-tighter"
                            variant="secondary"
                            disabled={loading}
                        >
                            {loading ? "מתחבר..." : "התחברות לחשבון"}
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">אין לך חשבון? <Link href="#" className="text-accent hover:underline">צור קשר עם מנהל המערכת</Link></p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Built for Champions by Antigravity</p>
                </div>
            </div>
        </div>
    );
}
