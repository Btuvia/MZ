import React, { memo } from 'react';
import { Card } from './base';

interface NeonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave?: () => void;
    saveLabel?: string;
    isSaving?: boolean;
    maxWidth?: string;
}

export const NeonModal = memo(function NeonModal({
    isOpen,
    onClose,
    title,
    children,
    onSave,
    saveLabel = "שמור ועדכן",
    isSaving = false,
    maxWidth = "max-w-lg"
}: NeonModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 transition-all duration-500" dir="rtl">
            <Card className={`relative w-full ${maxWidth} bg-[#0a0e1a] border border-slate-800/50 p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[3rem] animate-in zoom-in-95 duration-300 overflow-visible group`}>
                {/* Neon Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-amber-600 via-orange-500 to-amber-600 shadow-[0_4px_20px_rgba(245,158,11,0.5)]" />
                
                {/* Glowing Orbs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/20 transition-all duration-1000" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

                <h3 className="text-4xl font-black italic tracking-tighter text-amber-400 mb-10 text-right drop-shadow-lg">
                    {title}
                </h3>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto px-2 custom-scrollbar">
                    {children}
                </div>

                <div className="pt-8 flex items-center justify-between gap-6">
                    {onSave && (
                        <button 
                            onClick={onSave} 
                            disabled={isSaving}
                            className="flex-1 bg-slate-900 border-2 border-amber-500/30 text-amber-200 font-black rounded-2xl py-5 text-lg hover:border-amber-500 hover:text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] disabled:opacity-50">
                            {isSaving ? "מעבד..." : saveLabel}
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="px-8 py-2 text-slate-400 font-bold hover:text-white transition-all underline decoration-slate-800 underline-offset-8 decoration-2 hover:decoration-amber-500">
                        ביטול
                    </button>
                </div>
            </Card>
        </div>
    );
});

export const NeonInput = memo(function NeonInput({ 
    label, 
    ...props 
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="space-y-2">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mr-1">{label}</label>}
            <input
                {...props}
                className={`w-full bg-[#0d1326] border-2 border-slate-800/80 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-white placeholder-slate-700 focus:border-amber-500 outline-none transition-all duration-300 shadow-inner ${props.className || ''}`}
            />
        </div>
    );
});

export const NeonSelect = memo(function NeonSelect({ 
    label, 
    children, 
    ...props 
}: { label?: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="space-y-2">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mr-1">{label}</label>}
            <div className="relative">
                <select
                    {...props}
                    className={`w-full bg-[#0d1326] border-2 border-slate-800/80 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-white appearance-none focus:border-amber-500 outline-none transition-all duration-300 shadow-inner cursor-pointer ${props.className || ''}`}
                >
                    {children}
                </select>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
            </div>
        </div>
    );
});

export const NeonTextarea = memo(function NeonTextarea({ 
    label, 
    ...props 
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <div className="space-y-2">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mr-1">{label}</label>}
            <textarea
                {...props}
                className={`w-full bg-[#0d1326] border-2 border-slate-800/80 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-white placeholder-slate-700 focus:border-amber-500 outline-none transition-all duration-300 shadow-inner resize-none ${props.className || ''}`}
            />
        </div>
    );
});

export const NeonCard = memo(function NeonCard({ 
    title, 
    children, 
    className = "",
    action
}: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
    return (
        <Card className={`relative bg-[#0a0e1a] border border-slate-800/50 p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden group ${className}`}>
            {/* Neon Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-amber-600 via-orange-500 to-amber-600 shadow-[0_2px_15px_rgba(245,158,11,0.3)]" />
            
            {/* Glowing Orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/10 transition-all duration-1000" />
            
            {(title || action) && (
                <div className="flex items-center justify-between mb-6">
                    {action && <div className="shrink-0">{action}</div>}
                    {title && (
                        <h4 className="text-2xl font-black italic tracking-tighter text-amber-400 text-right drop-shadow-md">
                            {title}
                        </h4>
                    )}
                </div>
            )}
            
            <div className="relative z-10 space-y-6">
                {children}
            </div>
        </Card>
    );
});


export const NeonButton = memo(function NeonButton({ 
    children, 
    variant = 'primary',
    size = 'md',
    ...props 
}: { 
    children: React.ReactNode; 
    variant?: 'primary' | 'secondary' | 'blue'; 
    size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const baseStyles = variant === 'primary' 
        ? "bg-slate-900 border-2 border-amber-500/30 text-amber-200 hover:border-amber-500 hover:text-white hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
        : variant === 'blue'
        ? "bg-slate-900 border-2 border-blue-500/30 text-blue-300 hover:border-blue-500 hover:text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
        : "bg-slate-900 border-2 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white";

    const sizeStyles = {
        sm: "px-4 py-2 text-[10px] rounded-xl",
        md: "px-8 py-4 text-sm rounded-2xl",
        lg: "px-10 py-5 text-lg rounded-[2rem]"
    };

    return (
        <button
            {...props}
            className={`font-black transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${baseStyles} ${sizeStyles[size]} ${props.className || ''}`}
        >
            {children}
        </button>
    );
});
