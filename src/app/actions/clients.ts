'use server';

import { adminDb } from "@/lib/firebase/admin";

export async function createClientAction(data: any) {
    if (!adminDb) {
        throw new Error("Firebase Admin not initialized. Check server logs.");
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
        throw new Error(error.message || "Failed to create client on server.");
    }
}
