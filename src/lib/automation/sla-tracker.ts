import { firestoreService } from "@/lib/firebase/firestore-service";
import { type Task } from "@/types";
import { sendNotification } from "./notifications";

/**
 * SLA Tracker Service
 * Monitors task deadlines and sends alerts
 */

export interface SLAReport {
    totalTasks: number;
    onTime: number;
    overdue: number;
    atRisk: number; // Within warning threshold
    averageCompletionTime: number; // in hours
}

/**
 * Calculate SLA deadline for a task
 */
export function calculateSLADeadline(task: Task): Date {
    const startDate = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
    const deadline = new Date(startDate);

    const daysToComplete = task.daysToComplete || 1;
    deadline.setDate(deadline.getDate() + daysToComplete);

    return deadline;
}

/**
 * Calculate remaining time until deadline
 */
export function calculateRemainingTime(task: Task): {
    hours: number;
    isOverdue: boolean;
    isAtRisk: boolean;
} {
    const deadline = calculateSLADeadline(task);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));

    return {
        hours,
        isOverdue: hours < 0,
        isAtRisk: hours > 0 && hours <= 4, // 4 hours warning
    };
}

/**
 * Format remaining time for display
 */
export function formatRemainingTime(task: Task): string {
    const { hours, isOverdue } = calculateRemainingTime(task);

    if (isOverdue) {
        return `באיחור ${Math.abs(hours)} שעות`;
    }

    if (hours < 24) {
        return `${hours} שעות נותרו`;
    }

    const days = Math.floor(hours / 24);
    return `${days} ימים נותרו`;
}

/**
 * Check all tasks for SLA violations
 */
export async function checkOverdueTasks(): Promise<Task[]> {
    try {
        const tasks = await firestoreService.getTasks();
        const overdueTasks: Task[] = [];

        for (const task of tasks) {
            // Skip completed, cancelled, or already overdue tasks
            if (['completed', 'cancelled', 'overdue'].includes(task.status)) {
                continue;
            }

            const { isOverdue } = calculateRemainingTime(task);

            if (isOverdue) {
                // Update task status to overdue
                await firestoreService.updateTask(task.id, { status: 'overdue' });

                // Send notification
                if (task.assignedTo) {
                    await sendNotification(task.assignedTo, {
                        type: 'task_overdue',
                        title: 'משימה באיחור',
                        message: `המשימה "${task.title}" חרגה מזמן ה-SLA`,
                        taskId: task.id,
                    });
                }

                overdueTasks.push({ ...task, status: 'overdue' });
            }
        }

        return overdueTasks;
    } catch (error) {
        console.error("Failed to check overdue tasks:", error);
        return [];
    }
}

// Track sent warnings to prevent duplicates (in-memory cache, resets on server restart)
// For production, use Redis or Firestore to persist this
const sentWarnings = new Set<string>();

/**
 * Check if a warning was already sent for this task
 */
function wasWarningSent(taskId: string): boolean {
    return sentWarnings.has(taskId);
}

/**
 * Mark warning as sent
 */
function markWarningSent(taskId: string): void {
    sentWarnings.add(taskId);
    
    // Auto-cleanup after 24 hours to allow re-sending if still at risk
    setTimeout(() => {
        sentWarnings.delete(taskId);
    }, 24 * 60 * 60 * 1000);
}

/**
 * Clear warning tracking (useful for testing)
 */
export function clearWarningCache(): void {
    sentWarnings.clear();
}

/**
 * Check tasks approaching SLA deadline and send warnings
 */
export async function checkSLAWarnings(): Promise<Task[]> {
    try {
        const tasks = await firestoreService.getTasks();
        const atRiskTasks: Task[] = [];

        for (const task of tasks) {
            // Skip completed, cancelled, or overdue tasks
            if (['completed', 'cancelled', 'overdue'].includes(task.status)) {
                continue;
            }

            const { isAtRisk, hours } = calculateRemainingTime(task);

            if (isAtRisk) {
                // Only send notification if we haven't sent one already
                if (task.assignedTo && !wasWarningSent(task.id)) {
                    await sendNotification(task.assignedTo, {
                        type: 'sla_warning',
                        title: 'אזהרת SLA',
                        message: `המשימה "${task.title}" תסתיים בעוד ${hours} שעות`,
                        taskId: task.id,
                    });
                    markWarningSent(task.id);
                }

                atRiskTasks.push(task);
            }
        }

        return atRiskTasks;
    } catch (error) {
        console.error("Failed to check SLA warnings:", error);
        return [];
    }
}

/**
 * Run SLA checks (call this periodically)
 */
export async function runSLAChecks(): Promise<void> {
    console.log("Running SLA checks...");

    const [overdue, atRisk] = await Promise.all([
        checkOverdueTasks(),
        checkSLAWarnings(),
    ]);

    console.log(`SLA Check Results: ${overdue.length} overdue, ${atRisk.length} at risk`);
}

/**
 * Get SLA report for a date range
 */
export async function getSLAReport(
    startDate: Date,
    endDate: Date
): Promise<SLAReport> {
    try {
        const tasks = await firestoreService.getTasks();

        // Filter tasks in date range
        const tasksInRange = tasks.filter(task => {
            const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
            return createdAt >= startDate && createdAt <= endDate;
        });

        const totalTasks = tasksInRange.length;
        let onTime = 0;
        let overdue = 0;
        let atRisk = 0;
        let totalCompletionTime = 0;
        let completedCount = 0;

        for (const task of tasksInRange) {
            if (task.status === 'completed') {
                onTime++;

                // Calculate completion time
                const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
                const completedAt = task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt);
                const completionTimeHours = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                totalCompletionTime += completionTimeHours;
                completedCount++;
            } else if (task.status === 'overdue') {
                overdue++;
            } else {
                const { isAtRisk } = calculateRemainingTime(task);
                if (isAtRisk) {
                    atRisk++;
                }
            }
        }

        return {
            totalTasks,
            onTime,
            overdue,
            atRisk,
            averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0,
        };
    } catch (error) {
        console.error("Failed to generate SLA report:", error);
        return {
            totalTasks: 0,
            onTime: 0,
            overdue: 0,
            atRisk: 0,
            averageCompletionTime: 0,
        };
    }
}

/**
 * @deprecated Use API route /api/cron/sla-check instead
 * This function uses setInterval which doesn't work properly in Next.js serverless environment.
 * 
 * For production, set up a Cron job (Vercel Cron, GitHub Actions, etc.) 
 * that calls: POST /api/cron/sla-check
 */
export function initializeSLAMonitoring(): void {
    console.warn(
        "⚠️ initializeSLAMonitoring is deprecated. " +
        "Use /api/cron/sla-check API route with external cron service instead."
    );
    
    // Only run once on initialization, don't use setInterval
    runSLAChecks();
}
