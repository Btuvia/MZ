'use server';

import { adminDb } from "@/lib/firebase/admin";
import type { Client } from "@/types";

export async function createClientAction(data: Partial<Client>) {
    if (!adminDb) {
        console.error("Firebase Admin not initialized");
        return { 
            success: false, 
            error: "Firebase Admin לא מוגדר. נסה להשתמש במצב דמו."
        };
    }

    try {
        const docRef = await adminDb.collection('clients').add({
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return { success: true, id: docRef.id };
    } catch (error: unknown) {
        console.error("Server Action Error:", error);
        const errorMessage = error instanceof Error ? error.message : "שגיאה ביצירת הלקוח";
        return { 
            success: false, 
            error: errorMessage
        };
    }
}
