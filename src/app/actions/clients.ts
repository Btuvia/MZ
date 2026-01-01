'use server';

import { adminDb } from "@/lib/firebase/admin";

export async function createClientAction(data: any) {
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
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { 
            success: false, 
            error: error.message || "שגיאה ביצירת הלקוח"
        };
    }
}
