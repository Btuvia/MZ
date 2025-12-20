"use client";

import { Card, Button } from "./base";

interface ReferralModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerName: string;
}

export default function ReferralModal({ isOpen, onClose, partnerName }: ReferralModalProps) {
    if (!isOpen) return null;

    const referralLink = "https://id-preview--0d08bd6f-1d88-4a24-87ae-71578e9c8580.vercel.app/referral/levi";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" dir="rtl">
            <Card className="max-w-md w-full rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 bg-white/95 border-none">
                <header className="bg-slate-700 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="h-16 w-16 bg-white rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl border border-white/30">🛡️</div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter">קוד הפניה</h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">עבור לי שותף</p>
                    </div>
                </header>

                <div className="p-10 text-center space-y-8">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border border-amber-100 flex flex-col items-center gap-4 group">
                        <div className="relative group-hover:scale-105 transition-transform duration-500">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${referralLink}`}
                                alt="QR Code"
                                className="h-48 w-48 rounded-2xl grayscale group-hover:grayscale-0 transition-all shadow-lg border-8 border-white"
                            />
                            <div className="absolute inset-0 border-2 border-amber-400/30 rounded-2xl pointer-events-none translate-x-2 translate-y-2"></div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-black text-primary italic">מגן זהב</h4>
                            <p className="text-[10px] text-slate-400 font-bold">סוכנות ביטוח ופיננסים</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1 text-right">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">קישור להפניה:</label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={referralLink}
                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-500 outline-none"
                                />
                                <Button className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black px-6 rounded-xl shadow-lg shadow-indigo-500/10">העתק</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button onClick={onClose} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-black py-4 rounded-2xl">סגור</Button>
                            <Button className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black py-4 rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                📥 הורד QR
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
