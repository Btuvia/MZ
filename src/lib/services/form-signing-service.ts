import { db, storage } from '../firebase';
import { 
    collection, 
    addDoc, 
    getDoc, 
    doc, 
    updateDoc, 
    query, 
    where, 
    getDocs,
    Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface FormField {
    id: string;
    type: 'text' | 'signature' | 'checkbox' | 'date';
    role: 'client' | 'spouse' | 'employer' | 'agent' | 'other';
    x: number; // percentage from left
    y: number; // percentage from bottom (pdf-lib uses bottom-left origin)
    width: number;
    height: number;
    label: string;
    required: boolean;
    page: number;
}

export interface FormTemplate {
    id?: string;
    name: string;
    pdfUrl: string;
    fields: FormField[];
    createdAt: any;
    createdBy: string;
}

export interface SigningSession {
    id?: string;
    templateId: string;
    clientId: string;
    clientName: string;
    status: 'pending' | 'signed' | 'expired';
    password?: string;
    signedPdfUrl?: string;
    fieldValues: Record<string, string | boolean>;
    createdAt: any;
    signers: {
        role: string;
        name: string;
        signed: boolean;
        signedAt?: any;
    }[];
}

export const formSigningService = {
    // Templates
    async createTemplate(template: Omit<FormTemplate, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'form_templates'), {
            ...template,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async getTemplates(): Promise<FormTemplate[]> {
        const q = query(collection(db, 'form_templates'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormTemplate));
    },

    // Sessions
    async createSigningSession(session: Omit<SigningSession, 'id' | 'createdAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, 'signing_sessions'), {
            ...session,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    },

    async getSession(id: string): Promise<SigningSession | null> {
        const docSnap = await getDoc(doc(db, 'signing_sessions', id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as SigningSession;
        }
        return null;
    },

    async updateSessionStatus(id: string, status: SigningSession['status']): Promise<void> {
        await updateDoc(doc(db, 'signing_sessions', id), { status });
    },

    // PDF Processing
    async generateSignedPdf(sessionId: string, signatureDataUrl: string): Promise<string> {
        const session = await this.getSession(sessionId);
        if (!session) throw new Error('Session not found');

        const templateSnap = await getDoc(doc(db, 'form_templates', session.templateId));
        if (!templateSnap.exists()) throw new Error('Template not found');
        const template = templateSnap.data() as FormTemplate;

        // Fetch original PDF
        const response = await fetch(template.pdfUrl);
        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        // Add Signature Image
        const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
        
        for (const field of template.fields) {
            const page = pages[field.page - 1];
            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            // Convert percentages to PDF coordinates
            const x = (field.x / 100) * pageWidth;
            const y = (field.y / 100) * pageHeight;
            const w = (field.width / 100) * pageWidth;
            const h = (field.height / 100) * pageHeight;

            if (field.type === 'signature' && session.fieldValues[field.id]) {
                page.drawImage(signatureImage, {
                    x,
                    y,
                    width: w,
                    height: h,
                });
            } else if (field.type === 'text') {
                const value = session.fieldValues[field.id] as string || '';
                page.drawText(value, {
                    x,
                    y: y + 5, // Adjust for text baseline
                    size: 10,
                    color: rgb(0, 0, 0.5), // Blue ink
                });
            } else if (field.type === 'checkbox' && session.fieldValues[field.id]) {
                page.drawText('X', {
                    x: x + 2,
                    y: y + 2,
                    size: 12,
                    color: rgb(0, 0, 0),
                });
            }
        }

        const finalPdfBytes = await pdfDoc.save();
        
        // Upload to Storage
        const storageRef = ref(storage, `signed_forms/${sessionId}.pdf`);
        await uploadBytes(storageRef, finalPdfBytes);
        const downloadUrl = await getDownloadURL(storageRef);

        // Update Session
        await updateDoc(doc(db, 'signing_sessions', sessionId), {
            signedPdfUrl: downloadUrl,
            status: 'signed'
        });

        return downloadUrl;
    }
};
