"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
    demoLogin: (role: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
    demoLogin: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem("crm_role");
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // Best-effort role inference for demo users.
            if (user?.uid?.startsWith("demo-")) {
                const inferredRole = user.uid.slice("demo-".length);
                setRole(inferredRole);
                if (typeof window !== "undefined") window.localStorage.setItem("crm_role", inferredRole);
            }

            // Redirect logic could be placed here or in specific protected routes/HOCs.
            // For now, we'll let the pages handle redirecting if not authenticated, 
            // to avoid circular logic or premature redirects during loading.
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setRole(null);
        if (typeof window !== "undefined") window.localStorage.removeItem("crm_role");
        router.push("/login");
    };

    const demoLogin = (role: string) => {
        const fakeUser = {
            uid: `demo-${role}`,
            email: `${role}@demo.com`,
            displayName: `Demo ${role}`,
            emailVerified: true,
            isAnonymous: false,
        } as unknown as User;

        setUser(fakeUser);
        setRole(role);
        if (typeof window !== "undefined") window.localStorage.setItem("crm_role", role);

        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'agent') router.push('/agent/dashboard');
        else router.push('/client/dashboard');
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signOut, demoLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
