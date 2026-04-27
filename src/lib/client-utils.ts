
import { type Client, type Policy } from "@/types";

export type ClientRating = 'A+' | 'A' | 'B' | 'C';

/**
 * Calculates the total monthly premium for a client
 */
export function calculateTotalMonthlyPremium(client: Client): number {
    if (!client.policies || !Array.isArray(client.policies)) return 0;
    return client.policies.reduce((sum, policy) => {
        // Only count active policies for premium calculation
        if (policy.status === 'active' || policy.status === 'פעיל') {
            return sum + (Number(policy.premium) || 0);
        }
        return sum;
    }, 0);
}

/**
 * Determines the client rating based on total monthly premium
 * Logic:
 * - A+: > 600 NIS
 * - A: 301 - 600 NIS
 * - B: 101 - 300 NIS
 * - C: <= 100 NIS
 */
export function getClientRating(client: Client): ClientRating {
    const totalPremium = calculateTotalMonthlyPremium(client);
    
    if (totalPremium > 600) return 'A+';
    if (totalPremium > 300) return 'A';
    if (totalPremium > 100) return 'B';
    return 'C';
}

/**
 * Returns the color associated with a client rating
 */
export function getRatingColor(rating: ClientRating): string {
    switch (rating) {
        case 'A+': return 'text-amber-400 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
        case 'A': return 'text-amber-500 border-amber-500';
        case 'B': return 'text-blue-400 border-blue-400';
        case 'C': return 'text-slate-400 border-slate-400';
        default: return 'text-slate-500 border-slate-500';
    }
}
