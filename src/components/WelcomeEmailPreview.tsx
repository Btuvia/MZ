"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/base";

export function WelcomeEmailPreview({ isOpen, onClose, clientName }: { isOpen: boolean, onClose: () => void, clientName: string }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Email Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                        <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-400">New Message: Welcome to Magen Zahav</div>
                </div>

                {/* Email Body */}
                <div className="p-8 space-y-6" dir="rtl">
                    <div className="text-center">
                        <div className="relative h-16 w-16 mx-auto mb-4">
                            <Image src="/logo.jpg" fill alt="Magen Zahav" className="object-contain drop-shadow-lg" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">ברוכים הבאים למשפחת מגן זהב! 🏆</h2>
                    </div>

                    <div className="space-y-4 text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p>שלום {clientName},</p>
                        <p>שמחים שהצטרפת לנבחרת הלקוחות שלנו! מעכשיו, כל עולם הביטוח והפיננסים שלך נמצא במקום אחד, שקוף ונגיש.</p>
                        <p>פתחנו עבורך <strong>איזור אישי מתקדם</strong> בו תוכל:</p>
                        <ul className="list-disc list-inside space-y-1 pr-4 text-sm font-bold text-slate-700">
                            <li>לצפות בכל הפוליסות והכיסויים שלך</li>
                            <li>לראות תמונת מצב פנסיונית מלאה</li>
                            <li>לקבל התראות ותובנות חכמות</li>
                        </ul>
                    </div>

                    <div className="text-center py-4">
                        <Button className="bg-linear-to-r from-amber-400 to-amber-600 text-white font-black px-10 py-4 rounded-xl shadow-lg hover:scale-105 transition-transform">
                            כניסה לאיזור האישי 👈
                        </Button>
                        <p className="text-xs text-slate-400 mt-2 font-mono">שם משתמש: {clientName.split(" ")[0]}@insurcrm  |  סיסמה: ****</p>
                    </div>

                    <div className="text-center border-t border-slate-100 pt-6">
                        <p className="text-xs text-slate-400 font-bold">נשלח אוטומטית ע"י מערכת InsurCRM Platinum 💎</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                    <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-slate-600 font-bold">סגור תצוגה מקדימה</Button>
                </div>
            </div>
        </div>
    );
}
