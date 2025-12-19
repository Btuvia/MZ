"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Temporary mock authentication
        setTimeout(() => {
            if (email === "admin@insurcrm.com" && password === "admin123") {
                router.push("/admin/dashboard");
            } else if (email === "agent@insurcrm.com" && password === "agent123") {
                router.push("/agent/dashboard");
            } else if (email === "client@insurcrm.com" && password === "client123") {
                router.push("/client/dashboard");
            } else {
                setError("אימייל או סיסמה שגויים. נסו שוב.");
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl border border-border">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-primary">Insur<span className="text-accent">CRM</span></h2>
                    <p className="mt-2 text-slate-500">התחברות למערכת הניהול</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">אימייל</label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" colSpan={1} className="block text-sm font-medium text-slate-700">סיסמה</label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-error/10 p-3 text-sm text-error text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? (
                                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                "התחברות למערכת"
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
                    <p>חשבונות לדוגמה:</p>
                    <p>admin@insurcrm.com | admin123</p>
                    <p>agent@insurcrm.com | agent123</p>
                    <p>client@insurcrm.com | client123</p>
                </div>
            </div>
        </div>
    );
}
