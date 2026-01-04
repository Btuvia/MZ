import React, { memo } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    className?: string;
    variant?: 'default' | 'gold' | 'blue' | 'premium';
}

export const Card = memo(function Card({ children, title, className = "", variant = 'default', ...props }: CardProps) {
    const variantStyles = {
        default: 'glass-card',
        gold: 'glass-card border-amber-500/30 shadow-gold',
        blue: 'glass-card border-blue-500/30 shadow-blue',
        premium: 'glass-card border-amber-500/20 hover:border-amber-500/40 hover:shadow-gold'
    };

    return (
        <div className={`${variantStyles[variant]} rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className}`} {...props}>
            {title ? <h3 className="mb-4 text-lg font-black text-amber-100 flex items-center gap-2">
                    <div className="h-1.5 w-4 bg-gradient-to-r from-amber-500 to-blue-500 rounded-full" />
                    {title}
                </h3> : null}
            {children}
        </div>
    );
});

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'gold' | 'blue' | 'premium';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = memo(function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-gradient-to-r from-slate-800 to-slate-900 text-amber-100 shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-amber-500/20 rounded-2xl border border-amber-500/20 hover:border-amber-500/40",
        secondary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 rounded-2xl",
        outline: "border-2 border-amber-500/30 text-amber-200 hover:border-amber-500/60 hover:bg-amber-500/10 rounded-2xl backdrop-blur-sm",
        ghost: "text-slate-400 hover:bg-slate-800/50 hover:text-amber-200 rounded-xl",
        glass: "glass-dark text-amber-100 rounded-2xl hover:bg-slate-800/90 border border-amber-500/20",
        gold: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 rounded-2xl font-black",
        blue: "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 rounded-2xl font-black",
        premium: "bg-gradient-to-r from-amber-500 via-amber-400 to-blue-500 text-slate-900 shadow-lg shadow-amber-500/30 hover:shadow-xl rounded-2xl font-black"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
});

export const Badge = memo(function Badge({ children, variant = 'primary', className = "" }: { children: React.ReactNode, variant?: 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'gold' | 'blue', className?: string }) {
    const styles = {
        primary: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
        warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        error: "bg-red-500/20 text-red-300 border border-red-500/30",
        outline: "bg-transparent border border-slate-600 text-slate-400",
        gold: "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20",
        blue: "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
});
