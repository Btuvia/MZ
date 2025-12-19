import React from "react";

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export function Card({ children, title, className = "" }: CardProps) {
    return (
        <div className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>
            {title && <h3 className="mb-4 text-lg font-bold text-primary">{title}</h3>}
            {children}
        </div>
    );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/10",
        secondary: "bg-accent text-white hover:bg-blue-700 shadow-lg shadow-accent/10",
        outline: "border border-border bg-white text-primary hover:bg-slate-50",
        ghost: "text-slate-600 hover:bg-slate-100",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
