import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
    try {
        if (!adminAuth) {
            return NextResponse.json(
                { success: false, error: "Firebase Admin not initialized. Check server logs and credentials." },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { email, password, displayName, role } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: "Missing email or password" },
                { status: 400 }
            );
        }

        // Create the user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName,
        });

        // Optional: Set custom claims for role-based access control (RBAC)
        if (role) {
            await adminAuth.setCustomUserClaims(userRecord.uid, { role });
        }

        return NextResponse.json({ success: true, uid: userRecord.uid, email: userRecord.email });

    } catch (error: unknown) {
        console.error('Error creating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'שגיאה ביצירת המשתמש';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
