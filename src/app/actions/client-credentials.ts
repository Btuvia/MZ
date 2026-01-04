"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sendEmail } from "@/app/actions/email";

// Admin email constant - primary admin
const ADMIN_EMAIL = "btuvia6580@gmail.com";

/**
 * Generate a secure password for client portal access
 */
function generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill rest with random chars
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Determine Hebrew greeting based on name
 */
function getHebrewGender(name: string): { greeting: string; dear: string } {
    const firstName = name.split(' ')[0];
    // Simple heuristic for Hebrew names
    const isFemale = firstName.endsWith('ה') || firstName.endsWith('ת') || firstName.endsWith('י');
    return {
        greeting: isFemale ? 'שלום' : 'שלום',
        dear: isFemale ? 'יקרה' : 'יקר'
    };
}

/**
 * Create client portal credentials and send them via email
 * This action is triggered when sales status changes to "closed_won" or "נמכר"
 */
export async function createClientAndSendCredentials({
    clientId,
    clientEmail,
    clientName,
    agentName,
}: {
    clientId: string;
    clientEmail: string;
    clientName: string;
    agentName?: string;
}): Promise<{ success: boolean; message?: string; error?: string; uid?: string }> {
    try {
        // Validate inputs
        if (!clientEmail || !clientEmail.includes('@')) {
            return { success: false, error: 'כתובת אימייל לא תקינה' };
        }
        
        if (!clientName || clientName.trim() === '') {
            return { success: false, error: 'שם הלקוח חסר' };
        }
        
        // Check if Firebase Admin is initialized
        if (!adminAuth || !adminDb) {
            return { success: false, error: 'Firebase Admin לא מאותחל - בדוק את הגדרות השרת' };
        }
        
        // Check if user already exists
        let existingUser = null;
        try {
            existingUser = await adminAuth.getUserByEmail(clientEmail);
        } catch (e: any) {
            // User doesn't exist - that's fine, we'll create one
            if (e.code !== 'auth/user-not-found') {
                console.error('Error checking existing user:', e);
            }
        }
        
        if (existingUser) {
            // Check if they already have portal access
            const userDoc = await adminDb.collection('users').doc(existingUser.uid).get();
            if (userDoc.exists && userDoc.data()?.role === 'client') {
                return { 
                    success: false, 
                    error: 'ללקוח זה כבר יש גישה לפורטל. ניתן לאפס סיסמה דרך דף התחברות.' 
                };
            }
        }
        
        // Generate secure password
        const password = generateSecurePassword(12);
        
        let uid: string;
        
        if (existingUser) {
            // Update existing user
            await adminAuth.updateUser(existingUser.uid, {
                password: password,
                displayName: clientName,
            });
            uid = existingUser.uid;
        } else {
            // Create new user in Firebase Auth
            const userRecord = await adminAuth.createUser({
                email: clientEmail,
                password: password,
                displayName: clientName,
            });
            uid = userRecord.uid;
        }
        
        // Set custom claims
        await adminAuth.setCustomUserClaims(uid, { 
            role: 'client',
            clientId: clientId,
            createdAt: new Date().toISOString()
        });
        
        // Create/update user document in Firestore
        await adminDb.collection('users').doc(uid).set({
            uid: uid,
            email: clientEmail,
            displayName: clientName,
            role: 'client',
            linkedClientId: clientId,
            createdAt: new Date().toISOString(),
            createdBy: 'system-automation',
            lastLoginAt: null,
            isActive: true
        }, { merge: true });
        
        // Get gender-appropriate greeting
        const { dear } = getHebrewGender(clientName);
        
        // Prepare email content
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.insurcrm.com';
        
        const emailHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ברוכים הבאים למגן זהב</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; direction: rtl;">
            <table cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffd700; margin: 0; font-size: 28px;">🛡️ מגן זהב</h1>
                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">סוכנות ביטוח מקצועית</p>
                    </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                    <td style="padding: 40px 30px;">
                        <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 22px;">
                            שלום ${clientName} ה${dear}, ברוכים הבאים! 🎉
                        </h2>
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                            אנו שמחים לבשר לך שתהליך ההצטרפות הושלם בהצלחה!<br>
                            כעת באפשרותך להיכנס לאזור האישי שלך ולצפות בכל התיק הביטוחי.
                        </p>
                        
                        <!-- Credentials Box -->
                        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-right: 4px solid #2563eb;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">🔐 פרטי ההתחברות שלך:</h3>
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">שם משתמש:</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 16px;">${clientEmail}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">סיסמה זמנית:</td>
                                    <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 16px; font-family: monospace; letter-spacing: 2px;">${password}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- Login Button -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${loginUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);">
                                🚀 כניסה לאזור האישי
                            </a>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #fef3cd; border-radius: 8px; padding: 15px; margin: 20px 0; border-right: 4px solid #f59e0b;">
                            <p style="color: #92400e; font-size: 14px; margin: 0;">
                                <strong>🔒 המלצת אבטחה:</strong> מומלץ לשנות את הסיסמה בכניסה הראשונה.
                            </p>
                        </div>
                        
                        <!-- Features -->
                        <div style="margin: 30px 0;">
                            <h3 style="color: #1a365d; font-size: 16px; margin: 0 0 15px 0;">✨ מה תוכל/י למצוא באזור האישי:</h3>
                            <ul style="color: #4a5568; font-size: 14px; line-height: 2; padding-right: 20px; margin: 0;">
                                <li>צפייה בכל הפוליסות שלך במקום אחד</li>
                                <li>הורדת מסמכים ותעודות ביטוח</li>
                                <li>מעקב אחר תביעות</li>
                                <li>יצירת קשר ישיר עם הסוכן שלך</li>
                                <li>תזכורות לחידושים ותשלומים</li>
                            </ul>
                        </div>
                    </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                    <td style="background-color: #1a365d; padding: 25px 30px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
                            ${agentName ? `הסוכן שלך: ${agentName}` : 'צוות מגן זהב'}
                        </p>
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} מגן זהב - סוכנות ביטוח | כל הזכויות שמורות
                        </p>
                        <p style="color: #64748b; font-size: 11px; margin: 10px 0 0 0;">
                            מייל זה נשלח אוטומטית. לתמיכה: ${ADMIN_EMAIL}
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;
        
        // Send email with credentials
        const emailResult = await sendEmail({
            to: clientEmail,
            subject: '🛡️ ברוכים הבאים למגן זהב - פרטי הגישה שלך',
            html: emailHtml
        });
        
        if (!emailResult.success) {
            console.error('Failed to send email:', emailResult.error);
            return { 
                success: true, 
                message: `המשתמש נוצר בהצלחה אך שליחת המייל נכשלה. הסיסמה: ${password}`,
                uid: uid
            };
        }
        
        return { 
            success: true, 
            message: 'פרטי ההתחברות נשלחו בהצלחה למייל הלקוח',
            uid: uid
        };
        
    } catch (error: any) {
        console.error('Error creating client credentials:', error);
        
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'כתובת האימייל כבר רשומה במערכת' };
        }
        
        if (error.code === 'auth/invalid-email') {
            return { success: false, error: 'כתובת אימייל לא תקינה' };
        }
        
        return { 
            success: false, 
            error: error.message || 'שגיאה ביצירת פרטי ההתחברות' 
        };
    }
}

/**
 * Check if a client already has portal access
 */
export async function checkClientPortalAccess(clientEmail: string): Promise<{ hasAccess: boolean; uid?: string }> {
    try {
        if (!adminAuth) {
            throw new Error('Firebase Admin not initialized');
        }
        
        const user = await adminAuth.getUserByEmail(clientEmail);
        const customClaims = user.customClaims || {};
        
        if (customClaims.role === 'client') {
            return { hasAccess: true, uid: user.uid };
        }
        
        return { hasAccess: false };
    } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
            return { hasAccess: false };
        }
        throw e;
    }
}
