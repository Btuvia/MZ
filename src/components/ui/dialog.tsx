"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    return (
        <AnimatePresence>
            {open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                    />

                    {/* Content Wrapper to handle positioning and z-index above backdrop */}
                    <div className="z-50 w-full max-w-lg">
                        {children}
                    </div>
                </div> : null}
        </AnimatePresence>
    );
};

export const DialogContent = ({ children, className = "", dir }: { children: React.ReactNode, className?: string, dir?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={`relative glass-card border border-amber-500/20 rounded-3xl shadow-2xl overflow-hidden ${className}`}
            dir={dir}
        >
            {children}
        </motion.div>
    );
};

export const DialogHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
        <div className={`px-6 py-4 border-b border-amber-500/20 ${className}`}>
            {children}
        </div>
    );
};

export const DialogTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
        <h2 className={`text-xl font-bold text-amber-100 ${className}`}>
            {children}
        </h2>
    );
};
