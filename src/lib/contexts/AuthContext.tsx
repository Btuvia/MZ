"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { useRouter } from "next/navigation";
import { googleCalendarService, CalendarSyncStatus } from "@/lib/services/google-calendar-service";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { UserRole } from "@/types";

interface AuthContextType {
    user: User | null;
    role: UserRole | null;
    loading: boolean;
    signOut: () => Promise<void>;
    demoLogin: (role: string) => void;
    // Calendar integration
    calendarStatus: CalendarSyncStatus | null;
    calendarSyncing: boolean;
    syncCalendar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
    demoLogin: () => { },
    // Calendar integration
    calendarStatus: null,
    calendarSyncing: false,
    syncCalendar: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(() => {
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem("crm_role") as UserRole | null;
    });
    const [loading, setLoading] = useState(true);
    const [calendarStatus, setCalendarStatus] = useState<CalendarSyncStatus | null>(null);
    const [calendarSyncing, setCalendarSyncing] = useState(false);
    const router = useRouter();

    /**
     * Sync calendar for admin/agent users
     */
    const syncCalendar = useCallback(async () => {
        if (!googleCalendarService.isConnected()) {
            console.log('📅 Calendar not connected - skipping sync');
            return;
        }

        setCalendarSyncing(true);
        try {
            const result = await googleCalendarService.performInitialSync();
            setCalendarStatus(googleCalendarService.getSyncStatus());
            
            if (result.success) {
                console.log(`✅ Calendar synced: ${result.events.length} events loaded`);
            } else {
                console.warn('⚠️ Calendar sync warning:', result.error);
            }
        } catch (error) {
            console.error('❌ Calendar sync error:', error);
        } finally {
            setCalendarSyncing(false);
        }
    }, []);

    /**
     * Auto-sync calendar on login for admin/agent roles
     */
    const performAutoCalendarSync = useCallback(async (userRole: string) => {
        // Only sync for admin and agent roles
        if (userRole !== 'admin' && userRole !== 'agent') {
            return;
        }

        // Check if calendar is connected
        if (!googleCalendarService.isConnected()) {
            console.log(`📅 Calendar not connected for ${userRole} - auto-sync skipped`);
            setCalendarStatus({
                isConnected: false,
                lastSync: null,
                syncError: null,
                eventsCount: 0
            });
            return;
        }

        console.log(`📅 Auto-syncing calendar for ${userRole}...`);
        await syncCalendar();
    }, [syncCalendar]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                // For demo users, infer role from UID
                if (user.uid?.startsWith("demo-")) {
                    const inferredRole = user.uid.slice("demo-".length) as UserRole;
                    setRole(inferredRole);
                    if (typeof window !== "undefined") {
                        window.localStorage.setItem("crm_role", inferredRole);
                    }
                    // Auto-sync calendar for admin/agent
                    await performAutoCalendarSync(inferredRole);
                } else {
                    // For real users, fetch role from Firestore (SECURE)
                    try {
                        const userRole = await firestoreService.getUserRole(user.uid);
                        if (userRole) {
                            setRole(userRole);
                            if (typeof window !== "undefined") {
                                window.localStorage.setItem("crm_role", userRole);
                            }
                            // Auto-sync calendar for admin/agent
                            await performAutoCalendarSync(userRole);
                        }
                    } catch (error) {
                        console.error("Error fetching user role:", error);
                    }
                }
            } else {
                // User logged out
                setRole(null);
                if (typeof window !== "undefined") {
                    window.localStorage.removeItem("crm_role");
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [performAutoCalendarSync]);

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setRole(null);
        if (typeof window !== "undefined") window.localStorage.removeItem("crm_role");
        router.push("/login");
    };

    const demoLogin = (role: string) => {
        const validRole = role as UserRole;
        const fakeUser = {
            uid: `demo-${role}`,
            email: `${role}@demo.com`,
            displayName: `Demo ${role}`,
            emailVerified: true,
            isAnonymous: false,
        } as unknown as User;

        setUser(fakeUser);
        setRole(validRole);
        if (typeof window !== "undefined") window.localStorage.setItem("crm_role", validRole);

        // Auto-sync calendar for admin/agent
        performAutoCalendarSync(validRole);

        if (validRole === 'admin' || validRole === 'manager') router.push('/admin/dashboard');
        else if (validRole === 'agent') router.push('/agent/dashboard');
        else router.push('/client/dashboard');
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            role, 
            loading, 
            signOut, 
            demoLogin,
            calendarStatus,
            calendarSyncing,
            syncCalendar
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
