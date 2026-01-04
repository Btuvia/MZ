/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

import { toast } from "sonner";

// Error types for categorization
export type ErrorType = 
    | 'network'
    | 'auth'
    | 'validation'
    | 'permission'
    | 'not_found'
    | 'server'
    | 'unknown';

// Error messages in Hebrew
const ERROR_MESSAGES: Record<ErrorType, string> = {
    network: 'בעיית תקשורת. בדוק את החיבור לאינטרנט.',
    auth: 'שגיאת אימות. נא להתחבר מחדש.',
    validation: 'הנתונים שהוזנו אינם תקינים.',
    permission: 'אין לך הרשאה לבצע פעולה זו.',
    not_found: 'הפריט המבוקש לא נמצא.',
    server: 'שגיאת שרת. נסה שוב מאוחר יותר.',
    unknown: 'אירעה שגיאה בלתי צפויה.'
};

// Firebase error code mapping
const FIREBASE_ERROR_MAP: Record<string, { type: ErrorType; message: string }> = {
    'auth/invalid-credential': { type: 'auth', message: 'אימייל או סיסמה שגויים' },
    'auth/user-not-found': { type: 'auth', message: 'משתמש לא נמצא' },
    'auth/wrong-password': { type: 'auth', message: 'סיסמה שגויה' },
    'auth/email-already-in-use': { type: 'validation', message: 'האימייל כבר קיים במערכת' },
    'auth/weak-password': { type: 'validation', message: 'הסיסמה חלשה מדי' },
    'auth/too-many-requests': { type: 'auth', message: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.' },
    'auth/network-request-failed': { type: 'network', message: 'בעיית תקשורת. בדוק את החיבור לאינטרנט.' },
    'permission-denied': { type: 'permission', message: 'אין לך הרשאה לבצע פעולה זו' },
    'not-found': { type: 'not_found', message: 'המסמך לא נמצא' },
    'unavailable': { type: 'network', message: 'השירות אינו זמין כרגע' },
    'cancelled': { type: 'unknown', message: 'הפעולה בוטלה' },
    'deadline-exceeded': { type: 'network', message: 'הבקשה ארכה יותר מדי זמן' },
};

interface AppError {
    type: ErrorType;
    message: string;
    originalError?: unknown;
    code?: string;
}

/**
 * Parse any error into a structured AppError
 */
export function parseError(error: unknown): AppError {
    // Handle Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message?: string };
        const mapped = FIREBASE_ERROR_MAP[firebaseError.code];
        
        if (mapped) {
            return {
                type: mapped.type,
                message: mapped.message,
                originalError: error,
                code: firebaseError.code
            };
        }
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            type: 'network',
            message: ERROR_MESSAGES.network,
            originalError: error
        };
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.toLowerCase().includes('network')) {
            return { type: 'network', message: ERROR_MESSAGES.network, originalError: error };
        }
        if (error.message.toLowerCase().includes('permission')) {
            return { type: 'permission', message: ERROR_MESSAGES.permission, originalError: error };
        }
        if (error.message.toLowerCase().includes('not found')) {
            return { type: 'not_found', message: ERROR_MESSAGES.not_found, originalError: error };
        }
        
        return {
            type: 'unknown',
            message: error.message || ERROR_MESSAGES.unknown,
            originalError: error
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            type: 'unknown',
            message: error,
            originalError: error
        };
    }

    // Default unknown error
    return {
        type: 'unknown',
        message: ERROR_MESSAGES.unknown,
        originalError: error
    };
}

/**
 * Handle error with toast notification
 */
export function handleError(
    error: unknown, 
    options?: {
        context?: string;           // What operation was being performed
        silent?: boolean;           // Don't show toast
        logToConsole?: boolean;     // Log to console (default: true in dev)
        customMessage?: string;     // Override the error message
    }
): AppError {
    const { 
        context, 
        silent = false, 
        logToConsole = process.env.NODE_ENV === 'development',
        customMessage 
    } = options || {};

    const parsedError = parseError(error);

    // Log to console in development
    if (logToConsole) {
        console.error(
            `[Error${context ? ` in ${context}` : ''}]:`,
            parsedError.message,
            parsedError.originalError
        );
    }

    // Show toast notification
    if (!silent) {
        const message = customMessage || parsedError.message;
        const contextPrefix = context ? `${context}: ` : '';
        
        toast.error(`${contextPrefix}${message}`, {
            duration: 5000,
            className: 'rtl-toast',
        });
    }

    return parsedError;
}

/**
 * Wrapper for async operations with error handling
 */
export async function tryCatch<T>(
    operation: () => Promise<T>,
    options?: {
        context?: string;
        silent?: boolean;
        fallback?: T;
        onError?: (error: AppError) => void;
    }
): Promise<{ data: T | null; error: AppError | null }> {
    const { context, silent, fallback, onError } = options || {};

    try {
        const data = await operation();
        return { data, error: null };
    } catch (error) {
        const appError = handleError(error, { context, silent });
        
        if (onError) {
            onError(appError);
        }

        return { 
            data: fallback !== undefined ? fallback : null, 
            error: appError 
        };
    }
}

/**
 * Show success toast
 */
export function showSuccess(message: string, description?: string) {
    toast.success(message, {
        description,
        duration: 3000,
        className: 'rtl-toast',
    });
}

/**
 * Show warning toast
 */
export function showWarning(message: string, description?: string) {
    toast.warning(message, {
        description,
        duration: 4000,
        className: 'rtl-toast',
    });
}

/**
 * Show info toast
 */
export function showInfo(message: string, description?: string) {
    toast.info(message, {
        description,
        duration: 3000,
        className: 'rtl-toast',
    });
}

/**
 * Show loading toast that can be updated
 */
export function showLoading(message: string) {
    return toast.loading(message, {
        className: 'rtl-toast',
    });
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(toastId?: string | number) {
    if (toastId) {
        toast.dismiss(toastId);
    } else {
        toast.dismiss();
    }
}

/**
 * Promise-based toast for async operations
 */
export function toastPromise<T>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: unknown) => string);
    }
) {
    return toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: (err) => {
            const parsed = parseError(err);
            return typeof messages.error === 'function' 
                ? messages.error(err) 
                : messages.error || parsed.message;
        },
    });
}

export default {
    handleError,
    parseError,
    tryCatch,
    showSuccess,
    showWarning,
    showInfo,
    showLoading,
    dismissToast,
    toastPromise,
};
