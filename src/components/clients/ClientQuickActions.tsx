'use client';

import { MessageCircle, Mail, Phone, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { NeonModal, NeonButton } from '@/components/ui/neon-form';

interface ClientQuickActionsProps {
    phone: string;
    email: string;
    clientId: string | number;
    clientName: string;
    variant?: 'horizontal' | 'vertical' | 'grid';
}

export function ClientQuickActions({
    phone,
    email,
    clientId,
    clientName,
    variant = 'horizontal',
}: ClientQuickActionsProps) {
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const handleWhatsApp = () => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleEmail = () => {
        window.location.href = `mailto:${email}`;
    };

    const handleCall = () => {
        window.location.href = `tel:${phone}`;
    };

    const handleQrCopy = () => {
        const referralLink = `${window.location.origin}/referral/${clientId}`;
        navigator.clipboard.writeText(referralLink);
        toast.success('קישור ההפניה הועתק בהצלחה!');
    };

    const containerClasses = {
        horizontal: 'flex gap-3 items-center',
        vertical: 'flex flex-col gap-3',
        grid: 'grid grid-cols-2 gap-3',
    }[variant];

    return (
        <>
            <div className={containerClasses}>
                <button
                    className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-inner transition-all hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:text-emerald-300"
                    onClick={handleWhatsApp}
                    title="שלח וואטצאפ"
                >
                    <MessageCircle
                        size={20}
                        className="transition-transform group-hover:scale-110"
                    />
                </button>
                <button
                    className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-inner transition-all hover:border-indigo-500/40 hover:bg-indigo-500/20 hover:text-indigo-300"
                    onClick={handleEmail}
                    title="שלח מייל"
                >
                    <Mail size={20} className="transition-transform group-hover:scale-110" />
                </button>
                <button
                    className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-inner transition-all hover:border-blue-500/40 hover:bg-blue-500/20 hover:text-blue-300"
                    onClick={handleCall}
                    title="התקשר ללקוח"
                >
                    <Phone size={20} className="transition-transform group-hover:scale-110" />
                </button>
                <button
                    className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-inner transition-all hover:border-amber-500/40 hover:bg-amber-500/20 hover:text-amber-300"
                    onClick={() => setIsQrModalOpen(true)}
                    title="הפק קוד QR"
                >
                    <QrCode size={20} className="transition-transform group-hover:scale-110" />
                </button>
            </div>

            <NeonModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title="⚡ קוד QR להפניה"
                maxWidth="max-w-md"
                hideFooter
            >
                <div className="flex flex-col items-center justify-center space-y-8 py-4">
                    <div className="space-y-3 text-center">
                        <p className="mx-auto max-w-[280px] text-sm leading-relaxed font-bold text-slate-300">
                            הלקוח{' '}
                            <span className="font-black text-amber-400 italic">{clientName}</span>{' '}
                            יכול לשתף קוד זה עם חברים.
                        </p>
                        <div className="inline-block rounded-full border border-slate-800 bg-slate-900 px-4 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                            כל פנייה תשויך אליו אוטומטית כליד רותח!
                        </div>
                    </div>

                    <div className="group relative flex aspect-square w-56 items-center justify-center overflow-hidden rounded-[2.5rem] border-8 border-slate-900 bg-white p-6 shadow-[0_0_50px_-12px_rgba(251,191,36,0.3)]">
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        {/* Simulated QR Code */}
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                            <QrCode size={80} className="mb-3 text-slate-900" />
                            <span className="text-[10px] leading-none font-black tracking-widest text-slate-400 uppercase italic">
                                Scan to Refer
                            </span>
                            <span className="mt-2 rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black text-amber-600">
                                ID: {clientId}
                            </span>
                        </div>
                    </div>

                    <div className="w-full space-y-4 pt-4">
                        <NeonButton onClick={handleQrCopy} className="w-full py-7! text-lg!">
                            העתק קישור הפניה
                        </NeonButton>
                        <NeonButton
                            variant="secondary"
                            onClick={() => setIsQrModalOpen(false)}
                            className="w-full py-4!"
                        >
                            ביטול וחזרה
                        </NeonButton>
                    </div>

                    <p className="text-[9px] font-black tracking-[0.3em] text-slate-600 uppercase italic">
                        Generated by Magen Zahav AI
                    </p>
                </div>
            </NeonModal>
        </>
    );
}
