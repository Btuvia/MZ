/**
 * Reminders Cron API
 * 
 * This endpoint checks for pending reminders and marks them as sent.
 * The actual notification is handled by the client-side useReminders hook.
 * Should be called by a cron job every minute for cleanup.
 */

import { NextResponse } from "next/server";
import { firestoreService } from "@/lib/firebase/firestore-service";

export async function GET(request: Request) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all pending reminders that are due
        const pendingReminders = await firestoreService.getPendingReminders();
        
        // For now, just return the count - actual notifications handled client-side
        return NextResponse.json({
            success: true,
            pendingCount: pendingReminders.length,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Reminders cron error:", error);
        return NextResponse.json(
            { error: "Failed to process reminders" },
            { status: 500 }
        );
    }
}
