import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const Card = ({ children, title, className = "", ...props }: CardProps) => {
    return (
        <div className={`glass rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 ${className}`} {...props}>
            {title && (
                <h3 className="mb-4 text-lg font-black text-primary flex items-center gap-2">
                    <div className="h-1.5 w-4 bg-accent rounded-full"></div>
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = "",
    ...props
}: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-slate-800 rounded-2xl",
        secondary: "bg-accent text-white shadow-lg shadow-accent/25 hover:bg-blue-600 rounded-2xl",
        outline: "border-2 border-slate-200 text-slate-600 hover:border-accent hover:text-accent rounded-2xl bg-white/50 backdrop-blur-sm",
        ghost: "text-slate-500 hover:bg-slate-100/50 hover:text-primary rounded-xl",
        glass: "glass-dark text-white rounded-2xl hover:bg-slate-800/90"
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
};

export const Badge = ({ children, variant = 'primary', className = "" }: { children: React.ReactNode, variant?: 'primary' | 'success' | 'warning' | 'error' | 'outline', className?: string }) => {
    const styles = {
        primary: "bg-accent/10 text-accent",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        error: "bg-error/10 text-error",
        outline: "bg-transparent border border-slate-200 text-slate-500"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
};
