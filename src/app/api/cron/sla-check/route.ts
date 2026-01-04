import { type NextRequest, NextResponse } from "next/server";
import { runSLAChecks } from "@/lib/automation/sla-tracker";

/**
 * API Route for SLA Checks
 * 
 * Use this with a Cron service (Vercel Cron, GitHub Actions, etc.)
 * 
 * Vercel Cron example - add to vercel.json:
 * crons: [{ path: "/api/cron/sla-check", schedule: "every 5 minutes" }]
 * 
 * Security: Add CRON_SECRET to .env.local and verify it
 */

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "לא מורשה" },
                { status: 401 }
            );
        }

        // Run SLA checks
        await runSLAChecks();

        return NextResponse.json({
            success: true,
            message: "בדיקות SLA הושלמו בהצלחה",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("SLA Check Error:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: "שגיאה בבדיקות SLA" 
            },
            { status: 500 }
        );
    }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
    return POST(request);
}
