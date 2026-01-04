"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/base";
import { motion, AnimatePresence } from "framer-motion";

type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationOptions {
    title: string;
    message: string;
    type?: ConfirmationType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
}

interface ConfirmationContextType {
    confirm: (options: ConfirmationOptions) => Promise<boolean>;
    alert: (title: string, message: string, type?: ConfirmationType) => Promise<void>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within ConfirmationProvider');
    }
    return context;
}

const typeConfig = {
    danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        buttonColor: 'bg-amber-600 hover:bg-amber-700',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    },
};

export function ConfirmationProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    }, []);

    const alert = useCallback((title: string, message: string, type: ConfirmationType = 'info'): Promise<void> => {
        return new Promise((resolve) => {
            setOptions({
                title,
                message,
                type,
                confirmText: 'הבנתי',
                cancelText: undefined,
            });
            setResolvePromise(() => () => resolve());
            setIsOpen(true);
        });
    }, []);

    const handleConfirm = async () => {
        if (options?.onConfirm) {
            setIsLoading(true);
            try {
                await options.onConfirm();
            } finally {
                setIsLoading(false);
            }
        }
        setIsOpen(false);
        resolvePromise?.(true);
    };

    const handleCancel = () => {
        options?.onCancel?.();
        setIsOpen(false);
        resolvePromise?.(false);
    };

    const config = typeConfig[options?.type || 'warning'];
    const Icon = config.icon;

    return (
        <ConfirmationContext.Provider value={{ confirm, alert }}>
            {children}
            
            <AnimatePresence>
                {isOpen && options && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCancel}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div 
                                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                                dir="rtl"
                            >
                                {/* Header */}
                                <div className={`p-6 ${config.bgColor} border-b ${config.borderColor}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full bg-white shadow-sm`}>
                                            <Icon className={`w-6 h-6 ${config.iconColor}`} />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {options.title}
                                        </h2>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <p className="text-slate-600 leading-relaxed">
                                        {options.message}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 p-4 bg-slate-50 border-t border-slate-100">
                                    {options.cancelText !== undefined && (
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={isLoading}
                                            className="px-6"
                                        >
                                            {options.cancelText || 'ביטול'}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                        className={`px-6 text-white ${config.buttonColor}`}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                מבצע...
                                            </span>
                                        ) : (
                                            options.confirmText || 'אישור'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </ConfirmationContext.Provider>
    );
}

/**
 * Simple hook for confirmation dialogs without context
 * Falls back to browser confirm if provider not available
 */
export function useSimpleConfirm() {
    const context = useContext(ConfirmationContext);
    
    return useCallback(async (
        message: string,
        options?: { title?: string; type?: ConfirmationType }
    ): Promise<boolean> => {
        if (context) {
            return context.confirm({
                title: options?.title || 'אישור פעולה',
                message,
                type: options?.type || 'warning',
                confirmText: 'אישור',
                cancelText: 'ביטול',
            });
        }
        // Fallback to browser confirm
        return window.confirm(message);
    }, [context]);
}

export default ConfirmationProvider;
