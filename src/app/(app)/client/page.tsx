"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Phone, Lock } from "lucide-react";
import { Button } from "@/components/ui/base";

export default function ClientLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 9) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setStep("otp");
        }, 1500);
    };

    const handleVerifyCode = async () => {
        setIsLoading(true);
        // Simulate verification
        setTimeout(() => {
            // Set mock login session
            localStorage.setItem("current_client_id", phone);
            router.push("/client/dashboard");
        }, 1500);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }

        // Auto-submit on fill
        if (newOtp.every(d => d) && index === 5) {
            setTimeout(handleVerifyCode, 300);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-lg">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black mb-1 font-display">מגן זהב - אזור אישי</h1>
                    <p className="text-slate-400 text-sm font-medium">התיק הביטוחי שלך במקום אחד</p>
                </div>

                <div className="p-8">
                    {step === "phone" ? (
                        <motion.form
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onSubmit={handleSendCode}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 mr-1">מספר טלפון נייד</label>
                                <div className="relative">
                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="050-0000000"
                                        className="w-full bg-slate-50 border border-slate-200 text-primary text-lg font-bold py-3 pr-12 pl-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left group-hover:bg-white"
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl text-lg font-black shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? <span className="animate-spin">⏳</span> : "שלח לי קוד כניסה 👈"}
                            </Button>

                            <p className="text-center text-[10px] text-slate-400 mt-4">
                                בלחיצה על אישור אני מסכים ל<Link href="/terms" className="underline decoration-slate-300">תנאי השימוש</Link>
                            </p>
                        </motion.form>
                    ) : (
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">הקוד נשלח ל-{phone}</h3>
                                <button onClick={() => setStep("phone")} className="text-xs text-indigo-500 font-bold mt-1">שינוי מספר?</button>
                            </div>

                            <div className="flex justify-center gap-2" dir="ltr">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        className="w-12 h-14 text-center text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <Button
                                onClick={handleVerifyCode}
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl text-lg font-black shadow-lg shadow-indigo-500/20 mt-4"
                            >
                                {isLoading ? <span className="animate-spin">⏳</span> : "כניסה למערכת 🚀"}
                            </Button>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-6 text-center">
                <p className="text-[10px] text-slate-400 font-medium">מאובטח ברמת בנקאות ע"י Magen Zahav Security</p>
            </div>
        </div>
    );
}
