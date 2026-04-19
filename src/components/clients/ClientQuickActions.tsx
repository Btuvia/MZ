"use client";

import { MessageCircle, Mail, Phone, QrCode } from "lucide-react";
import { Button } from "@/components/ui/base";
import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ClientQuickActionsProps {
    phone: string;
    email: string;
    clientId: string | number;
    clientName: string;
    variant?: "horizontal" | "vertical" | "grid";
}

export function ClientQuickActions({ phone, email, clientId, clientName, variant = "horizontal" }: ClientQuickActionsProps) {
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const handleWhatsApp = () => {
        const cleanPhone = phone.replace(/\D/g, "");
        window.open(`https://wa.me/${cleanPhone}`, "_blank");
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
        toast.success("קישור ההפניה הועתק!");
    };

    const containerClasses = {
        horizontal: "flex gap-2 items-center",
        vertical: "flex flex-col gap-2",
        grid: "grid grid-cols-2 gap-2"
    }[variant];

    return (
        <>
            <div className={containerClasses}>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                    onClick={handleWhatsApp}
                    title="שלח וואטצאפ"
                >
                    <MessageCircle size={18} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                    onClick={handleEmail}
                    title="שלח מייל"
                >
                    <Mail size={18} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                    onClick={handleCall}
                    title="התקשר ללקוח"
                >
                    <Phone size={18} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20"
                    onClick={() => setIsQrModalOpen(true)}
                    title="הפק קוד QR"
                >
                    <QrCode size={18} />
                </Button>
            </div>

            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
                <DialogContent className="bg-slate-900 border-amber-500/20 text-white rounded-[2rem] p-8 max-w-sm" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-amber-400 text-center">קוד QR להפניה</DialogTitle>
                        <DialogDescription className="text-slate-400 text-center font-medium mt-2">
                             הלקוח {clientName} יכול לשתף קוד זה עם חברים. כל פנייה תשויך אליו אוטומטית כליד רותח!
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center space-y-6 mt-6">
                        <div className="p-4 bg-white rounded-3xl shadow-2xl flex items-center justify-center aspect-square w-48 border-4 border-amber-500/20">
                            {/* Simulated QR Code - In a real app we'd use a QR library */}
                            <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center p-4">
                                <QrCode size={64} className="text-slate-900 mb-2" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Scan to Refer</span>
                                <span className="text-[8px] font-bold text-amber-600 mt-1">ID: {clientId}</span>
                            </div>
                        </div>
                        
                        <div className="w-full space-y-3">
                            <Button 
                                onClick={handleQrCopy}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl py-6 shadow-xl shadow-amber-500/20"
                            >
                                העתק קישור הפניה
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={() => setIsQrModalOpen(false)}
                                className="w-full border-slate-700 text-slate-400 rounded-xl"
                            >
                                סגור
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
