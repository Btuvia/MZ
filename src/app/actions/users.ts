"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sendEmail } from "./email";

export async function createUser(data: any) {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Firebase Admin not initialized" };
    }

    const { email, firstName, lastName, role, agency } = data;
    const password = Math.random().toString(36).slice(-8) + "Aa1!"; // Temp password

    try {
        // 1. Create User in Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        // 2. Set Custom Claims
        await adminAuth.setCustomUserClaims(userRecord.uid, { role });

        // 3. Create User Document in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            role,
            agency: agency || "מגן זהב",
            createdAt: new Date(),
            status: "active"
        });

        // 4. Send Invite Email
        const emailHtml = `
            <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
                <h1>ברוך הבא ל-InsurCRM! 🎉</h1>
                <p>החשבון שלך נוצר בהצלחה.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>שם משתמש:</strong> ${email}</p>
                    <p><strong>סיסמה זמנית:</strong> ${password}</p>
                </div>
                <p>אנא התחבר והחלף את הסיסמה בהקדם.</p>
                <p>בברכה,<br>צוות מגן זהב</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">התחבר למערכת</a>
            </div>
        `;

        await sendEmail(email, "הזמנה למערכת מגן זהב", emailHtml);

        return { success: true, uid: userRecord.uid };

    } catch (error: any) {
        console.error("Create User Error:", error);
        return { success: false, error: error.message };
    }
}
