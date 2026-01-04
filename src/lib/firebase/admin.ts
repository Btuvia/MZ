import * as admin from 'firebase-admin';

function getServiceAccount() {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const privateKey = privateKeyEnv?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        return {
            project_id: projectId,
            client_email: clientEmail,
            private_key: privateKey,
        };
    }

    return null;
}

function initAdmin() {
    if (!admin.apps.length) {
        const serviceAccount = getServiceAccount();

        if (!serviceAccount) {
            console.warn('Firebase Admin credentials missing; skipping initialization.');
            return null;
        }

        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            });
        } catch (error) {
            console.warn('Firebase Admin Initialization failed:', error);
            return null;
        }
    }

    return admin.apps.length ? admin : null;
}

const adminApp = initAdmin();

export const adminAuth = adminApp ? adminApp.auth() : null;
export const adminDb = adminApp ? adminApp.firestore() : null;
