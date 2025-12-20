"use client";

import Link from "next/link";
import { Button } from "@/components/ui/base";

export default function NotFound() {
    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 text-center" dir="rtl">
            <div className="glass rounded-[3rem] p-12 max-w-md shadow-2xl">
                <div className="h-20 w-20 rounded-3xl bg-error/10 text-error flex items-center justify-center mx-auto mb-8 animate-float">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h1 className="text-4xl font-black text-primary mb-4 italic leading-none tracking-tighter">404 - דף לא נמצא</h1>
                <p className="text-slate-500 font-medium mb-8">הדף שאותו חיפשת אינו קיים או שטרם מומש בגרסת הפרימיום.</p>
                <Link href="/">
                    <Button variant="secondary" className="w-full py-4 shadow-xl shadow-accent/20 tracking-widest uppercase text-xs">חזרה לדף הבית</Button>
                </Link>
            </div>
        </div>
    );
}
