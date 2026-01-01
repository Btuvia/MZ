import {
    collection,
    addDoc,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { LeadStatus, TaskStatus, LeadSource } from "@/types/statuses";

/**
 * Seed default data for the CRM system
 * This should be run once during initial setup
 */

// Default Lead Statuses (Hebrew)
const defaultLeadStatuses: Omit<LeadStatus, 'id' | 'createdAt'>[] = [
    {
        name: 'new',
        nameHe: 'חדש',
        color: '#3B82F6', // blue
        icon: '✨',
        orderIndex: 1,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'in_progress',
        nameHe: 'בטיפול',
        color: '#8B5CF6', // purple
        icon: '🔄',
        orderIndex: 2,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'waiting_response',
        nameHe: 'ממתין לתשובה',
        color: '#F59E0B', // amber
        icon: '⏳',
        orderIndex: 3,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'meeting_scheduled',
        nameHe: 'נקבע פגישה',
        color: '#10B981', // green
        icon: '📅',
        orderIndex: 4,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'proposal_sent',
        nameHe: 'הצעה נשלחה',
        color: '#06B6D4', // cyan
        icon: '📧',
        orderIndex: 5,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'closed_won',
        nameHe: 'נסגר בהצלחה',
        color: '#22C55E', // green-500
        icon: '✅',
        orderIndex: 6,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'closed_lost',
        nameHe: 'נסגר ללא עסקה',
        color: '#EF4444', // red
        icon: '❌',
        orderIndex: 7,
        isActive: true,
        isSystem: true,
    },
    {
        name: 'not_relevant',
        nameHe: 'לא רלוונטי',
        color: '#6B7280', // gray
        icon: '🚫',
        orderIndex: 8,
        isActive: true,
        isSystem: false,
    },
];

// Default Task Statuses (Hebrew)
const defaultTaskStatuses: Omit<TaskStatus, 'id' | 'createdAt'>[] = [
    {
        name: 'pending',
        nameHe: 'ממתין',
        color: '#F59E0B', // amber
        icon: '⏸️',
        isFinal: false,
        slaHours: 24,
    },
    {
        name: 'in_progress',
        nameHe: 'בטיפול',
        color: '#3B82F6', // blue
        icon: '🔄',
        isFinal: false,
        slaHours: 48,
    },
    {
        name: 'completed',
        nameHe: 'הושלם',
        color: '#22C55E', // green
        icon: '✅',
        isFinal: true,
    },
    {
        name: 'overdue',
        nameHe: 'באיחור',
        color: '#EF4444', // red
        icon: '⚠️',
        isFinal: false,
    },
    {
        name: 'transferred',
        nameHe: 'הועבר',
        color: '#8B5CF6', // purple
        icon: '🔀',
        isFinal: false,
        slaHours: 24,
    },
    {
        name: 'cancelled',
        nameHe: 'בוטל',
        color: '#6B7280', // gray
        icon: '🚫',
        isFinal: true,
    },
];

// Default Lead Sources (Hebrew)
const defaultLeadSources: Omit<LeadSource, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'facebook',
        nameHe: 'פייסבוק',
        description: 'לידים ממודעות פייסבוק',
        icon: '📘',
        color: '#1877F2',
        isActive: true,
        trackingCode: 'FB',
    },
    {
        name: 'email',
        nameHe: 'אימייל',
        description: 'לידים מקמפיינים במייל',
        icon: '📧',
        color: '#EA4335',
        isActive: true,
        trackingCode: 'EM',
    },
    {
        name: 'lead_online',
        nameHe: 'ליד און ליין',
        description: 'לידים מאתר ליד און ליין',
        icon: '🌐',
        color: '#10B981',
        isActive: true,
        trackingCode: 'LOL',
    },
    {
        name: 'phone',
        nameHe: 'טלפון',
        description: 'לידים שהגיעו בטלפון',
        icon: '📞',
        color: '#8B5CF6',
        isActive: true,
        trackingCode: 'PH',
    },
    {
        name: 'referral',
        nameHe: 'המלצה',
        description: 'לידים מהמלצות לקוחות',
        icon: '🤝',
        color: '#F59E0B',
        isActive: true,
        trackingCode: 'REF',
    },
    {
        name: 'website',
        nameHe: 'אתר אינטרנט',
        description: 'לידים מהאתר',
        icon: '💻',
        color: '#06B6D4',
        isActive: true,
        trackingCode: 'WEB',
    },
    {
        name: 'google_ads',
        nameHe: 'Google Ads',
        description: 'לידים ממודעות גוגל',
        icon: '🎯',
        color: '#4285F4',
        isActive: true,
        trackingCode: 'GA',
    },
    {
        name: 'event',
        nameHe: 'אירוע',
        description: 'לידים מאירועים ותערוכות',
        icon: '🎪',
        color: '#EC4899',
        isActive: true,
        trackingCode: 'EVT',
    },
];

/**
 * Seed lead statuses into Firestore
 */
export async function seedLeadStatuses() {
    const statusesRef = collection(db, "lead_statuses");
    const results = [];

    for (const status of defaultLeadStatuses) {
        const docRef = await addDoc(statusesRef, {
            ...status,
            createdAt: Timestamp.now(),
        });
        results.push({ id: docRef.id, ...status });
    }

    return results;
}

/**
 * Seed task statuses into Firestore
 */
export async function seedTaskStatuses() {
    const statusesRef = collection(db, "task_statuses");
    const results = [];

    for (const status of defaultTaskStatuses) {
        const docRef = await addDoc(statusesRef, {
            ...status,
            createdAt: Timestamp.now(),
        });
        results.push({ id: docRef.id, ...status });
    }

    return results;
}

/**
 * Seed lead sources into Firestore
 */
export async function seedLeadSources() {
    const sourcesRef = collection(db, "lead_sources");
    const results = [];

    for (const source of defaultLeadSources) {
        const docRef = await addDoc(sourcesRef, {
            ...source,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        results.push({ id: docRef.id, ...source });
    }

    return results;
}

/**
 * Seed all default data
 */
export async function seedAllData() {
    try {
        console.log('🌱 Starting data seeding...');

        const leadStatuses = await seedLeadStatuses();
        console.log(`✅ Created ${leadStatuses.length} lead statuses`);

        const taskStatuses = await seedTaskStatuses();
        console.log(`✅ Created ${taskStatuses.length} task statuses`);

        const leadSources = await seedLeadSources();
        console.log(`✅ Created ${leadSources.length} lead sources`);

        console.log('🎉 Data seeding completed successfully!');

        return {
            leadStatuses,
            taskStatuses,
            leadSources,
        };
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    }
}
