"use client";

import { Edit2, Copy, Save, Trash2, Plus, X, Upload, Share2, Send, FileText, Download, Mail, Link2, ArrowLeft, ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClientAndSendCredentials } from "@/app/actions/client-credentials";
import { sendEmail } from "@/app/actions/email";
import { generateWithGemini } from "@/app/actions/gemini";
import LifecycleTracker from "@/components/client/LifecycleTracker";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { FileUpload } from "@/components/ui/file-upload";
import { 
    NeonModal, 
    NeonInput, 
    NeonSelect, 
    NeonCard,
    NeonButton
} from "@/components/ui/neon-form";
import { analyzeInsuranceDocument } from "@/lib/ai/ai-service";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { useSpeechRecognition } from "@/lib/hooks/useSpeechRecognition";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { ClientQuickActions } from "@/components/clients/ClientQuickActions";

// --- Types & Interfaces ---

type ClientDocument = {
    id: string;
    name: string;                    // שם המסמך
    type: string;                    // סוג קובץ (PDF/IMG)
    documentType?: 'אישי' | 'רפואי' | 'ביטוחי' | 'פנסיוני';  // סוג מסמך
    producer?: 'הפניקס' | 'כלל' | 'מגדל' | 'מנורה' | 'איילון' | 'הכשרה' | 'מור' | 'אלטשולר' | 'מיטב דש' | 'אחר';  // יצרן
    url: string;
    date: string;                    // מועד יצירה (אוטומטי)
    size: string;
    uploadedBy?: string;             // הועלה על ידי (אוטומטי)
    status?: 'נשמר' | 'נשלח לחברה' | 'תקין' | 'התקבל חלקית';  // סטטוס
};

type Interaction = {
    id: string;
    type: 'call' | 'meeting' | 'whatsapp' | 'email';
    direction: 'inbound' | 'outbound';
    date: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
};

type ExternalPolicy = {
    id: string;
    company: string;
    productType: string;
    premium: string;
    endDate: string;
    status: string;
};

type FamilyMember = {
    id: string;
    name: string;
    relation: string;
    age: number;
    idNumber: string;
    insured: boolean;
};

type Policy = {
    id: string;
    type: string;
    company: string;
    policyNumber: string;
    premium: string;
    coverage: string;
    startDate: string;
    renewalDate: string;
    status: "פעיל" | "לא פעיל" | "בתהליך" | "נמכר";
    color?: string;
    icon?: string;
    // New fields
    documentUrl?: string;      // קובץ הפוליסה
    documentName?: string;     // שם הקובץ
    showInClientPortal?: boolean; // האם להציג באיזור האישי של הלקוח
};

type Task = {
    id: string;
    title: string;
    priority: "נמוכה" | "בינונית" | "גבוהה";
    dueDate: string;
    status: "ממתינה" | "בתהליך" | "הושלמה";
    assignee: string;
    completedDate?: string;
};

type PensionProduct = {
    id: string;
    type: string;
    company: string;
    planName: string;
    managementFeeAccumulation: string;
    managementFeeDeposit: string;
    joinDate: string;
    fundNumber: string;
    avgSalary: string;
};

type InsuranceProduct = {
    id: string;
    company: string;
    isPlatinum: boolean;
    platinumProducts?: string[]; // Array of selected platinum products
    productType: string;
    amount: string;
    hasLien: boolean;
    premium: string;
    numInsured: number;
};

type ElementaryInsurance = {
    id: string;
    category: 'רכב' | 'דירה';
    type: string; // צד ג', מקיף וכו' או מבנה, תכולה וכו'
    manufacturer?: string; // ליצרן רכב
    insurer: string;
    effectiveDate: string;
    endDate: string;
    premium: number;
    status: 'פעיל' | 'לא פעיל';
};

// ===== Platinum Products Pricing & Types =====
type PlatinumSale = {
    id: string;
    productName: 'פלטינום בריאות' | 'פלטינום פרמיום' | 'רופא עד הבית' | 'פלטינום רפואה משלימה' | 'פלטינום דנטל';
    clientAge: number;
    discount: 10 | 20 | 30;
    monthlyPremium: number;
    calculatedPremium: number; // מחיר לפני הנחה
    saleDate: string;
    status: 'ממתין להפקה' | 'הופקה' | 'נשלח לפלטינום';
};

// פרטי תשלום לפלטינום
type PlatinumPaymentDetails = {
    // פרטי אשראי
    paymentMethod: 'אשראי' | 'הוראת קבע';
    creditCardNumber?: string;
    creditCardExpiry?: string;
    creditCardPayerIdNumber?: string;
    creditCardPayerPhone?: string;
    // הוראת קבע
    bankAccountNumber?: string;
    bankBranch?: string;
    bankName?: string;
    accountType?: 'עו"ש' | 'חיסכון';
    // יום גבייה
    billingDay?: 2 | 10 | 15 | 20;
};

type AiInsight = {
    riskScore: number;
    analysis: string;
    opportunities: { text: string; impact: string }[];
};

// טבלת מחירי פלטינום לפי גיל
const PLATINUM_PRICING: Record<string, Record<string, number>> = {
    'פלטינום בריאות': {
        '0-17': 43, '18-29': 76, '30-39': 102, '40-49': 132, '50-54': 162, '55-59': 210, '60-64': 278, '65-69': 395, '70-74': 511, '75+': 676
    },
    'פלטינום פרמיום': {
        '0-17': 63, '18-29': 105, '30-39': 138, '40-49': 179, '50-54': 226, '55-59': 294, '60-64': 388, '65-69': 544, '70-74': 703, '75+': 930
    },
    'רופא עד הבית': {
        '0-17': 25, '18-29': 35, '30-39': 45, '40-49': 55, '50-54': 65, '55-59': 80, '60-64': 100, '65-69': 130, '70-74': 165, '75+': 210
    },
    'פלטינום רפואה משלימה': {
        '0-17': 30, '18-29': 45, '30-39': 60, '40-49': 75, '50-54': 95, '55-59': 115, '60-64': 140, '65-69': 175, '70-74': 220, '75+': 280
    },
    'פלטינום דנטל': {
        '0-17': 38, '18-29': 52, '30-39': 68, '40-49': 85, '50-54': 105, '55-59': 130, '60-64': 160, '65-69': 200, '70-74': 250, '75+': 320
    }
};

// פונקציה לחישוב מחיר לפי גיל
const getPlatinumPrice = (productName: string, age: number): number => {
    const pricing = PLATINUM_PRICING[productName];
    if (!pricing) return 0;
    
    if (age <= 17) return pricing['0-17'];
    if (age <= 29) return pricing['18-29'];
    if (age <= 39) return pricing['30-39'];
    if (age <= 49) return pricing['40-49'];
    if (age <= 54) return pricing['50-54'];
    if (age <= 59) return pricing['55-59'];
    if (age <= 64) return pricing['60-64'];
    if (age <= 69) return pricing['65-69'];
    if (age <= 74) return pricing['70-74'];
    return pricing['75+'];
};

// פונקציה לחישוב עמלות פלטינום
const calculatePlatinumCommission = (sale: PlatinumSale) => {
    const monthlyPremium = sale.monthlyPremium;
    const isDental = sale.productName === 'פלטינום דנטל';
    
    // עמלה חד פעמית = פרמיה X 3
    const oneTimeCommission = monthlyPremium * 3;
    
    // עמלת נפרעים - 45% רגיל, 30% לדנטל
    const nifraaimRate = isDental ? 0.30 : 0.45;
    const monthlyCommission = monthlyPremium * nifraaimRate;
    
    return {
        oneTimeCommission,
        monthlyCommission,
        nifraaimRate: nifraaimRate * 100
    };
};

type ClientData = {
    id: string;
    name: string;
    // סוג זיהוי ומספר
    idType: 'תעודת זהות' | 'דרכון';
    idNumber: string;
    // שדות נוספים לדרכון
    passportCountry?: string;      // מדינת הנפקה
    passportExpiry?: string;       // תוקף דרכון
    phone: string;
    email: string;
    status: "פעיל" | "לא פעיל" | "נמכר";
    salesStatus?: string;
    opsStatus?: string;
    opsUnlocked?: boolean; // האם התפעול נפתח לעריכה (רק אחרי שליחת מייל)
    address: { city: string; street: string; num: string };
    employment: { status: string; occupation: string };
    family: FamilyMember[];
    policies: Policy[];
    tasks: Task[];
    pensionSales: PensionProduct[];
    insuranceSales: InsuranceProduct[];
    platinumSales: PlatinumSale[]; // מכירות כתב שירות פלטינום
    platinumPayment?: PlatinumPaymentDetails; // פרטי תשלום לפלטינום
    documents: ClientDocument[];
    interactions: Interaction[];
    externalPolicies?: ExternalPolicy[];
    aiInsights?: AiInsight;
    // שדות חדשים - פרטי לקוח
    birthDate?: string;           // תאריך לידה
    hasInsuranceReport?: boolean; // האם קיים העתק הר ביטוח
    // שדות חדשים - פרטים על הלקוח
    healthFund?: 'לאומית' | 'כללית' | 'מכבי' | 'מאוחדת'; // קופת חולים
    isSmoker?: boolean;           // האם מעשן
    paymentTerms?: 'העברה' | 'אשראי' | 'הוראת קבע'; // תנאי תשלום
    idIssueDate?: string;         // תאריך הנפקה תעודת זהות
    linkedClientId?: string;      // קשור ללקוח אחר בסוכנות
    linkedClientName?: string;    // שם הלקוח המקושר
    salesRepresentative?: string; // נציג מכירה
    // שדות הפניה משיתוף פעולה
    referralSource?: string;      // מזהה שיתוף הפעולה
    referralName?: string;        // שם המפנה
    referralCode?: string;        // קוד ההפניה
    referralNotes?: string;       // הערות מהמפנה
    // פרמיה שנסגרה (לחישוב עמלות שיתוף פעולה)
    closedPremium?: number;
    closedCompany?: string;
    elementaryInsurances: ElementaryInsurance[];
};

// --- Initial Data (Mock) ---

const INITIAL_CLIENT: ClientData = {
    id: "active",
    name: "שרה אולט בסמוט",
    idType: "תעודת זהות",
    idNumber: "329919617",
    phone: "0534261094",
    email: "sarabismot@gmail.com",
    status: "פעיל",
    salesStatus: "new_lead",
    opsStatus: "sent_to_company",
    address: { city: "תל אביב", street: "הרצל", num: "1" },
    employment: { status: "שכיר", occupation: "מנהלת שיווק" },
    family: [
        { id: "1", name: "דני אולט", relation: "בן זוג", age: 40, idNumber: "123456789", insured: true },
        { id: "2", name: "נועה אולט", relation: "ילדה", age: 12, idNumber: "987654321", insured: false }
    ],
    policies: [
        { id: "1", type: "פנסיה", company: "הראל", policyNumber: "PEN-2023-45678", premium: "₪850", coverage: "₪280,000", startDate: "2020-03-15", renewalDate: "2025-03-15", status: "פעיל", color: "from-blue-600 to-indigo-700", icon: "👨‍👩‍👧‍👦" },
        { id: "2", type: "ביטוח בריאות", company: "מגדל", policyNumber: "HLT-2023-12345", premium: "₪420", coverage: "כיסוי מלא", startDate: "2021-06-01", renewalDate: "2025-06-01", status: "פעיל", color: "from-emerald-600 to-teal-700", icon: "🏥" }
    ],
    tasks: [
        { id: "1", title: "שליחת הצעת ביטוח חיים", priority: "גבוהה", dueDate: "2024-02-20", status: "ממתינה", assignee: "רועי כהן" }
    ],
    pensionSales: [],
    insuranceSales: [],
    platinumSales: [], // מכירות כתב שירות פלטינום
    platinumPayment: undefined, // פרטי תשלום לפלטינום

    documents: [],
    interactions: [
        { id: "1", type: "call", direction: "inbound", date: "2024-02-15 10:30", summary: "הלקוחה התקשרה לשאול לגבי כיסוי ניתוחים בחו״ל בפוליסת הבריאות", sentiment: "neutral" },
        { id: "2", type: "whatsapp", direction: "outbound", date: "2024-02-14 14:00", summary: "נשלחה תזכורת לחידוש ביטוח רכב", sentiment: "positive" }
    ],
    externalPolicies: [],
    elementaryInsurances: []
};

export default function ClientDetailsPage() {
    const params = useParams();
    const clientId = params.id as string || "active";
    const { user } = useAuth(); // Get current user for agent name
    const [activeTab, setActiveTab] = useState("סיכום"); // שינוי ברירת מחדל לסיכום

    // Main Persisted State
    const [client, setClient] = useState<ClientData>(INITIAL_CLIENT);
    const [clientTasks, setClientTasks] = useState<Task[]>([]); // New state for global tasks
    const [allClients, setAllClients] = useState<ClientData[]>([]); // לחיפוש לקוח מקושר
    const [clientSearchQuery, setClientSearchQuery] = useState('');

    // AI State
    const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingAi, setLoadingAi] = useState(false);

    // Modals & Forms
    const [editMode, setEditMode] = useState<{ type: string; item?: any } | null>(null);
    const [formData, setFormData] = useState<any>({});

    // Sales Forms State
    const [pensionForm, setPensionForm] = useState<Partial<PensionProduct>>({});
    const [insuranceForm, setInsuranceForm] = useState<Partial<InsuranceProduct>>({});
    const [platinumForm, setPlatinumForm] = useState<{
        productName?: PlatinumSale['productName'];
        clientAge?: number;
        discount?: 10 | 20 | 30;
        monthlyPremium?: number;
    }>({});
    const [platinumPaymentForm, setPlatinumPaymentForm] = useState<Partial<PlatinumPaymentDetails>>({});
    const [isSubmittingPlatinum, setIsSubmittingPlatinum] = useState(false);
    const [showPlatinumSelect, setShowPlatinumSelect] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showMarketModal, setShowMarketModal] = useState(false);
    
    // Elementary Form State
    const [elementaryForm, setElementaryForm] = useState<Partial<ElementaryInsurance>>({
        category: 'רכב',
        type: 'חובה ומקיף',
        insurer: 'כלל',
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        premium: 0,
        status: 'פעיל'
    });

    // --- Persistence ---
    useEffect(() => {
        const loadClient = async () => {
            if (clientId === "new") {
                setClient({ ...INITIAL_CLIENT, id: "", name: "לקוח חדש", salesRepresentative: "נציג נוכחי" }); // נציג מכירה אוטומטי
                setLoading(false);
                return;
            }

            try {
                const data = await firestoreService.getClient(clientId);
                if (data) {
                    setClient(data as ClientData);
                } else if (clientId === "active") {
                    setClient(INITIAL_CLIENT);
                }

                // Load tasks from global collection
                const tasks = await firestoreService.getTasksForClient(clientId);
                setClientTasks(tasks);
                
                // Load all clients for linking feature
                const clients = await firestoreService.getClients();
                setAllClients(clients);

            } catch (error) {
                console.error("Failed to load client", error);
            } finally {
                setLoading(false);
            }
        };
        loadClient();
    }, [clientId]);

    // Save on changes? With Firestore we usually save explicitly, not on every render.
    // The previous code had a useEffect that saved to localStorage on every change. 
    // Doing that with Firestore (writes) is expensive and can cause loops/lag.
    // **Better approach**: Update the specific fields in the DB when `saveData` or `handleSaveModal` is called.

    // Removing the auto-save useEffect


    // --- Handlers ---

    const saveData = async (key: keyof ClientData, data: any) => {
        const updatedAppClient = { ...client, [key]: data };
        setClient(updatedAppClient);

        // Persist to Firestore
        if (client.id && client.id !== "new" && client.id !== "active") {
            await firestoreService.updateClient(client.id, { [key]: data });
        }
    };

    const handleStatusUpdate = async (type: 'sales' | 'ops', status: string) => {
        // אם מנסים לעדכן תפעול - לבדוק שהתפעול נפתח
        if (type === 'ops') {
            if (!client.opsUnlocked) {
                toast.error('לא ניתן לשנות סטטוס תפעול - יש לסגור קודם את המכירה בהצלחה');
                return;
            }
            // כאן אפשר להוסיף בדיקת הרשאות בעתיד
        }

        // אם זו מכירה ונסגר בהצלחה
        if (type === 'sales' && status === 'closed_won') {
            // שליחת מייל לתפעול
            const emailHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #4F46E5;">📋 תיק ביטוח חדש לטיפול</h2>
                    <p style="font-size: 16px;">היי,</p>
                    <p style="font-size: 16px;">ללקוח <strong>${client.name}</strong> נסגר תיק ביטוח.</p>
                    <p style="font-size: 16px; color: #059669; font-weight: bold;">יש לקדם תהליך בתפעול, תודה.</p>
                    <hr style="margin: 20px 0; border-color: #E5E7EB;" />
                    <p style="font-size: 12px; color: #6B7280;">מערכת מגן זהב CRM</p>
                </div>
            `;

            try {
                toast.loading('שולח מייל לתפעול...');
                await sendEmail(
                    'btuvia6580@gmail.com',
                    `תיק ביטוח חדש - ${client.name}`,
                    emailHtml
                );
                toast.dismiss();
                toast.success('✉️ מייל נשלח לתפעול בהצלחה!');

                // פותחים את האפשרות לשנות סטטוס תפעול
                await saveData('opsUnlocked', true);
                // מעדכנים את סטטוס הלקוח לפעיל
                await saveData('status', 'פעיל');
            } catch (error) {
                toast.dismiss();
                toast.error('שגיאה בשליחת המייל');
                console.error('Email error:', error);
            }

            // שליחת מייל ברכה ללקוח
            if (client.email) {
                const clientPortalUrl = typeof window !== 'undefined' ? `${window.location.origin}/client` : 'http://localhost:3000/client';
                
                const welcomeEmailHtml = `
                    <!DOCTYPE html>
                    <html dir="rtl" lang="he">
                    <head>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 0 auto; background: white; }
                            .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 40px 30px; text-align: center; }
                            .header h1 { color: white; margin: 0; font-size: 28px; }
                            .header .logo { font-size: 48px; margin-bottom: 15px; }
                            .content { padding: 40px 30px; }
                            .content p { font-size: 16px; line-height: 1.8; color: #374151; margin: 15px 0; }
                            .highlight-box { background: #F3F4F6; border-radius: 12px; padding: 20px; margin: 25px 0; }
                            .highlight-box h3 { color: #4F46E5; margin-top: 0; font-size: 18px; }
                            .credential { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
                            .credential:last-child { border-bottom: none; }
                            .credential .label { color: #6B7280; }
                            .credential .value { font-weight: bold; color: #1F2937; }
                            .cta-button { display: block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; margin: 30px 0; }
                            .footer { background: #F9FAFB; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB; }
                            .footer p { color: #6B7280; font-size: 14px; margin: 5px 0; }
                            .footer .signature { font-size: 18px; font-weight: bold; color: #4F46E5; margin-top: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="logo">🛡️</div>
                                <h1>ברוכים הבאים למשפחת מגן זהב!</h1>
                            </div>
                            <div class="content">
                                <p>שלום <strong>${client.name}</strong>,</p>
                                <p>אנחנו שמחים שהפכת להיות חלק ממשפחת <strong>"מגן זהב"</strong>!</p>
                                <p>אנחנו כאן לתת לך מענה לכל שאלה, בעיה ומקרה ביטוח.</p>
                                <p>אנחנו מזמינים אותך להיכנס לאזור האישי של הסוכנות שלנו:</p>
                                
                                <a href="${clientPortalUrl}" class="cta-button">כניסה לאזור האישי</a>
                                
                                <div class="highlight-box">
                                    <h3>🔐 פרטי ההתחברות שלך:</h3>
                                    <div class="credential">
                                        <span class="label">שם משתמש:</span>
                                        <span class="value">${client.idNumber}</span>
                                    </div>
                                    <div class="credential">
                                        <span class="label">סיסמה:</span>
                                        <span class="value">${client.phone}</span>
                                    </div>
                                </div>
                                
                                <p style="color: #6B7280; font-size: 14px;">
                                    💡 <strong>טיפ:</strong> ניתן להתחבר גם באמצעות חשבון Google - על ידי המייל שאיתו הצטרפת אלינו.
                                </p>
                                
                                <p style="margin-top: 30px;">שתהיה לנו דרך בטוחה,</p>
                            </div>
                            <div class="footer">
                                <div class="signature">🛡️ מגן זהב</div>
                                <p>סוכנות לביטוח פנסיוני ופיננסי</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                try {
                    await sendEmail({
                        to: client.email,
                        subject: `ברוכים הבאים למשפחת מגן זהב! 🛡️`,
                        html: welcomeEmailHtml
                    });
                    toast.success('✉️ מייל ברכה נשלח ללקוח!');
                } catch (error) {
                    console.error('Error sending welcome email:', error);
                    toast.error('שגיאה בשליחת מייל ללקוח');
                }
            }
        }

        // עדכון הסטטוס
        await saveData(type === 'sales' ? 'salesStatus' : 'opsStatus', status);
        toast.success(`סטטוס ${type === 'sales' ? 'מכירות' : 'תפעול'} עודכן`);
    };

    const handleEdit = (type: string, item?: any) => {
        // הגדרת נתוני ברירת מחדל לפי סוג המודל
        if (type === 'clientDetails') {
            setFormData({
                idNumber: client.idNumber,
                birthDate: client.birthDate,
                idIssueDate: client.idIssueDate
            });
        } else if (type === 'additionalDetails') {
            setFormData({
                healthFund: client.healthFund,
                isSmoker: client.isSmoker,
                paymentTerms: client.paymentTerms,
                email: client.email,
                linkedClientId: client.linkedClientId,
                linkedClientName: client.linkedClientName
            });
            setClientSearchQuery('');
        } else {
            setFormData(item ? { ...item } : {});
        }
        setEditMode({ type, item });
    };

    const handleSaveModal = async () => {
        if (!editMode) return;

        const { type } = editMode;
        // console.log(`Saving modal data for ${type}...`, formData);

        try {
            if (type === "family") {
                const list = [...client.family];
                if (formData.id) {
                    const idx = list.findIndex(i => i.id === formData.id);
                    if (idx > -1) list[idx] = formData;
                } else {
                    list.push({ ...formData, id: Date.now().toString() });
                }
                await saveData("family", list);
                toast.success("פרטי משפחה עודכנו");
            }
            else if (type === "policy") {
                const list = [...client.policies];
                if (formData.id) {
                    const idx = list.findIndex(i => i.id === formData.id);
                    if (idx > -1) list[idx] = formData;
                } else {
                    list.push({ ...formData, id: Date.now().toString(), color: "from-slate-500 to-slate-700", icon: "📄" });
                }
                await saveData("policies", list);
                toast.success("פוליסה עודכנה בהצלחה");
            }
            else if (type === "task") {
                const priorityMap: any = { "נמוכה": "low", "בינונית": "medium", "גבוהה": "high" };
                const statusMap: any = { "ממתינה": "pending", "בתהליך": "pending", "הושלמה": "completed" };

                const taskData = {
                    title: formData.title,
                    priority: priorityMap[formData.priority] || "medium",
                    date: formData.dueDate,
                    time: "10:00",
                    type: "task" as const,
                    status: (statusMap[formData.status] || "pending") as any,
                    client: client.name,
                    clientId: client.id,
                    assignee: formData.assignee || "admin"
                };

                // Only call Firestore if NOT in demo/active mode
                if (client.id && client.id !== "active" && client.id !== "new") {
                    if (formData.id) {
                        await firestoreService.updateTask(formData.id, taskData as any);
                        setClientTasks(prev => prev.map(t => t.id === formData.id ? { ...t, ...taskData } : t));
                    } else {
                        const newId = await firestoreService.addTask(taskData as any);
                        setClientTasks(prev => [...prev, { ...taskData, id: newId }]);
                    }
                } else {
                    // Demo mode: Update locally only
                    const mockId = formData.id || `mock-${Date.now()}`;
                    if (formData.id) {
                        setClientTasks(prev => prev.map(t => t.id === formData.id ? { ...t, ...taskData } : t));
                    } else {
                        setClientTasks(prev => [...prev, { ...taskData, id: mockId }]);
                    }
                }
                toast.success("משימה עודכנה במערכת");
            }
            else if (type === "personal") {
                // Personal details update
                const updatedClient = { ...client, ...formData };
                setClient(updatedClient);

                // Check if status changed to "נמכר"
                if (formData.status === "נמכר" && client.status !== "נמכר") {
                    handleSoldClientAutomation(formData);
                }

                // Sync with Firestore
                if (client.id && client.id !== "new" && client.id !== "active") {
                    await firestoreService.updateClient(client.id, formData);
                }
                toast.success("פרטי לקוח עודכנו");
            }
            else if (type === "clientDetails") {
                // עדכון פרטי לקוח בסיסיים
                const updatedData = {
                    idNumber: formData.idNumber,
                    birthDate: formData.birthDate,
                    idIssueDate: formData.idIssueDate,
                    isSmoker: formData.isSmoker
                };
                const updatedClient = { ...client, ...updatedData };
                setClient(updatedClient);

                if (client.id && client.id !== "new" && client.id !== "active") {
                    await firestoreService.updateClient(client.id, updatedData);
                }
                toast.success("פרטי לקוח עודכנו בהצלחה");
            }
            else if (type === "additionalDetails") {
                // עדכון פרטים נוספים על הלקוח
                const updatedData = {
                    healthFund: formData.healthFund,
                    paymentTerms: formData.paymentTerms,
                    email: formData.email,
                    linkedClientId: formData.linkedClientId,
                    linkedClientName: formData.linkedClientName
                };
                const updatedClient = { ...client, ...updatedData };
                setClient(updatedClient);

                if (client.id && client.id !== "new" && client.id !== "active") {
                    await firestoreService.updateClient(client.id, updatedData);
                }
                toast.success("פרטים נוספים עודכנו בהצלחה");
            }

            setEditMode(null);
        } catch (error: any) {
            console.error("Error saving modal data:", error);
            toast.error(`שגיאה בשמירת הנתונים: ${error.message || "בדוק חיבור ל-Firebase"}`);
            // Still close modal to allow user to continue in UI, or keep open if critical
            setEditMode(null);
        }
    };

    const handleSoldClientAutomation = async (data: any) => {
        if (!data.email) {
            toast.error("לא ניתן ליצור משתמש ללא אימייל");
            return;
        }

        try {
            toast.loading("יוצר חשבון ושולח פרטי התחברות...", { id: 'client-automation' });

            // Use the secure server action to create client credentials
            const result = await createClientAndSendCredentials({
                clientId: client.id,
                clientEmail: data.email,
                clientName: data.name || client.name,
                agentName: user?.displayName || undefined
            });

            if (result.success) {
                toast.success(
                    `✅ הלקוח קיבל גישה לפורטל!\n${result.message || 'פרטי התחברות נשלחו למייל'}`,
                    { id: 'client-automation', duration: 5000 }
                );

                // Note: Portal access is tracked in the users collection, not in clients
                console.log('Client portal access granted, uid:', result.uid);
            } else {
                toast.error(`שגיאה: ${result.error}`, { id: 'client-automation' });
            }
        } catch (error: any) {
            console.error("שגיאה ביצירת חשבון ללקוח:", error);
            toast.error(`שגיאה בתקשורת: ${error.message || 'נסה שוב'}`, { id: 'client-automation' });
        }
    };

    const deleteItem = async (key: "family" | "policies" | "tasks" | "pensionSales" | "insuranceSales" | "platinumSales" | "elementaryInsurances", id: string) => {
        if (confirm("האם למחוק פריט זה?")) {
            if (key === "tasks") {
                await firestoreService.deleteTask(id);
                setClientTasks(prev => prev.filter(t => t.id !== id));
            } else {
                const updatedList = (client[key] as any[]).filter((i: any) => i.id !== id);
                setClient(prev => ({ ...prev, [key]: updatedList }));

                if (client.id && client.id !== "new" && client.id !== "active") {
                    await firestoreService.updateClient(client.id, { [key]: updatedList });
                }
            }
        }
    };

    // --- Sales Logic ---
    const handleAddPension = () => {
        if (!pensionForm.type || !pensionForm.company) return alert("נא מלא את שדות החובה");

        const newProduct: PensionProduct = {
            id: Date.now().toString(),
            type: pensionForm.type!,
            company: pensionForm.company!,
            planName: pensionForm.planName || "",
            managementFeeAccumulation: pensionForm.managementFeeAccumulation ? `${pensionForm.managementFeeAccumulation}%` : "",
            managementFeeDeposit: pensionForm.managementFeeDeposit ? `${pensionForm.managementFeeDeposit}%` : "",
            joinDate: pensionForm.joinDate || "",
            fundNumber: pensionForm.fundNumber || "",
            avgSalary: pensionForm.avgSalary || ""
        };

        saveData("pensionSales", [...client.pensionSales, newProduct]);
        setPensionForm({}); // Reset form
    };

    const handleAddInsurance = () => {
        if (!insuranceForm.company || !insuranceForm.productType) return alert("נא מלא את שדות החובה");

        const newProduct: InsuranceProduct = {
            id: Date.now().toString(),
            company: insuranceForm.company!,
            isPlatinum: showPlatinumSelect,
            platinumProducts: insuranceForm.platinumProducts || [],
            productType: insuranceForm.productType!,
            amount: insuranceForm.amount || "",
            hasLien: insuranceForm.hasLien || false,
            premium: insuranceForm.premium || "",
            numInsured: insuranceForm.numInsured || 1
        };

        saveData("insuranceSales", [...client.insuranceSales, newProduct]);
        setInsuranceForm({});
        setShowPlatinumSelect(false);
    };

    // === Platinum Sales Logic ===
    const handleAddPlatinum = () => {
        if (!platinumForm.productName || !platinumForm.clientAge || !platinumForm.discount || !platinumForm.monthlyPremium) {
            toast.error("נא מלא את כל השדות");
            return;
        }

        // בדיקה שהנחה לדנטל לא עולה על 10%
        if (platinumForm.productName === 'פלטינום דנטל' && platinumForm.discount > 10) {
            toast.error("הנחה מקסימלית לפלטינום דנטל היא 10%");
            return;
        }

        const calculatedPrice = getPlatinumPrice(platinumForm.productName, platinumForm.clientAge);
        
        const newSale: PlatinumSale = {
            id: Date.now().toString(),
            productName: platinumForm.productName,
            clientAge: platinumForm.clientAge,
            discount: platinumForm.discount,
            calculatedPremium: calculatedPrice,
            monthlyPremium: platinumForm.monthlyPremium,
            saleDate: new Date().toISOString(),
            status: 'ממתין להפקה' // ממתין עד שילחצו על "הפק מוצרי פלטינום"
        };

        // חישוב עמלות
        const commission = calculatePlatinumCommission(newSale);
        
        // שמירה ללקוח
        saveData("platinumSales", [...(client.platinumSales || []), newSale]);
        
        // הצגת הודעת הצלחה
        toast.success(
            `✅ מוצר ${platinumForm.productName} נשמר!\n` +
            `💰 עמלה צפויה: ₪${commission.oneTimeCommission.toFixed(0)} חד-פעמי`,
            { duration: 3000 }
        );
        
        // איפוס טופס
        setPlatinumForm({});
    };

    // הפקת מוצרי פלטינום ושליחה למייל
    const handleSubmitPlatinumProducts = async () => {
        const pendingProducts = (client.platinumSales || []).filter(s => s.status === 'ממתין להפקה');
        
        if (pendingProducts.length === 0) {
            toast.error("אין מוצרים להפקה");
            return;
        }

        // בדיקת פרטי תשלום
        if (!platinumPaymentForm.paymentMethod) {
            toast.error("נא למלא פרטי תשלום");
            return;
        }

        if (platinumPaymentForm.paymentMethod === 'אשראי') {
            if (!platinumPaymentForm.creditCardNumber || !platinumPaymentForm.creditCardExpiry) {
                toast.error("נא למלא פרטי כרטיס אשראי");
                return;
            }
        } else {
            if (!platinumPaymentForm.bankAccountNumber || !platinumPaymentForm.bankBranch || !platinumPaymentForm.bankName) {
                toast.error("נא למלא פרטי הוראת קבע");
                return;
            }
        }

        if (!platinumPaymentForm.billingDay) {
            toast.error("נא לבחור יום גבייה");
            return;
        }

        setIsSubmittingPlatinum(true);

        try {
            // חישוב סה"כ
            const totalMonthly = pendingProducts.reduce((sum, p) => sum + p.monthlyPremium, 0);
            // const totalOneTime = pendingProducts.reduce((sum, p) => sum + (p.monthlyPremium * 3), 0);

            // הכנת תוכן המייל
            const productsHtml = pendingProducts.map(p => `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.productName}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.discount}%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">₪${p.monthlyPremium}</td>
                </tr>
            `).join('');

            const emailHtml = `
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <title>הזמנת מוצרי פלטינום - ${client.name}</title>
            </head>
            <body style="font-family: Arial, sans-serif; direction: rtl; padding: 20px;">
                <div style="max-width: 700px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #1a365d; text-align: center;">🌟 הזמנת מוצרי פלטינום חדשה</h1>
                    
                    <h2 style="color: #2563eb; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">פרטי הלקוח</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; font-weight: bold;">שם מלא:</td><td>${client.name}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">${client.idType || 'תעודת זהות'}:</td><td>${client.idNumber}</td></tr>
                        ${client.idType === 'דרכון' ? `
                        <tr><td style="padding: 8px; font-weight: bold;">מדינת הנפקה:</td><td>${client.passportCountry || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תוקף דרכון:</td><td>${client.passportExpiry || '-'}</td></tr>
                        ` : ''}
                        <tr><td style="padding: 8px; font-weight: bold;">אימייל:</td><td>${client.email}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">טלפון:</td><td>${client.phone}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תאריך לידה:</td><td>${client.birthDate || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">כתובת:</td><td>${client.address.street} ${client.address.num}, ${client.address.city}</td></tr>
                    </table>

                    <h2 style="color: #2563eb; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">פרטי תשלום</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; font-weight: bold;">אמצעי תשלום:</td><td>${platinumPaymentForm.paymentMethod}</td></tr>
                        ${platinumPaymentForm.paymentMethod === 'אשראי' ? `
                        <tr><td style="padding: 8px; font-weight: bold;">מספר כרטיס:</td><td>****${platinumPaymentForm.creditCardNumber?.slice(-4)}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תוקף:</td><td>${platinumPaymentForm.creditCardExpiry}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">ת.ז. בעל הכרטיס:</td><td>${platinumPaymentForm.creditCardPayerIdNumber || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">טלפון בעל הכרטיס:</td><td>${platinumPaymentForm.creditCardPayerPhone || '-'}</td></tr>
                        ` : `
                        <tr><td style="padding: 8px; font-weight: bold;">בנק:</td><td>${platinumPaymentForm.bankName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">סניף:</td><td>${platinumPaymentForm.bankBranch}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">מספר חשבון:</td><td>${platinumPaymentForm.bankAccountNumber}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">סוג חשבון:</td><td>${platinumPaymentForm.accountType || 'עו"ש'}</td></tr>
                        `}
                        <tr><td style="padding: 8px; font-weight: bold;">יום גבייה:</td><td>${platinumPaymentForm.billingDay} לחודש</td></tr>
                    </table>

                    <h2 style="color: #2563eb; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">המוצרים שנרכשו</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #2563eb; color: white;">
                                <th style="padding: 12px; text-align: right;">מוצר</th>
                                <th style="padding: 12px; text-align: right;">הנחה</th>
                                <th style="padding: 12px; text-align: right;">מחיר חודשי</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background: #ffd700; font-weight: bold;">
                                <td colspan="2" style="padding: 12px;">סה"כ חודשי:</td>
                                <td style="padding: 12px;">₪${totalMonthly}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0;"><strong>🏢 סוכנות:</strong> מגן זהב</p>
                        <p style="margin: 5px 0;"><strong>👤 נציג:</strong> ${client.salesRepresentative || user?.displayName || 'לא צוין'}</p>
                        <p style="margin: 0;"><strong>📅 תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            // שליחת המייל
            const emailResult = await sendEmail({
                to: 'shaked@platinum.org.il',
                subject: `🌟 הזמנת פלטינום חדשה - ${client.name} - ${pendingProducts.length} מוצרים`,
                html: emailHtml
            });

            if (emailResult.success) {
                // עדכון סטטוס כל המוצרים ל"נשלח לפלטינום"
                const updatedSales = (client.platinumSales || []).map(sale => 
                    sale.status === 'ממתין להפקה' 
                        ? { ...sale, status: 'נשלח לפלטינום' as const }
                        : sale
                );

                // שמירת פרטי התשלום
                saveData("platinumSales", updatedSales);
                saveData("platinumPayment", platinumPaymentForm);

                toast.success(
                    `✅ ${pendingProducts.length} מוצרי פלטינום נשלחו בהצלחה!\n` +
                    `📧 נשלח ל: shaked@platinum.org.il\n` +
                    `💰 סה"כ חודשי: ₪${totalMonthly}`,
                    { duration: 6000 }
                );

                // איפוס טופס תשלום
                setPlatinumPaymentForm({});
            } else {
                toast.error(`שגיאה בשליחת המייל: ${emailResult.error}`);
            }
        } catch (error: any) {
            console.error('Error submitting platinum products:', error);
            toast.error(`שגיאה: ${error.message || 'נסה שוב'}`);
        } finally {
            setIsSubmittingPlatinum(false);
        }
    };

    // חישוב מחיר פלטינום אוטומטי כשמשתנה המוצר או הגיל
    const calculatePlatinumPremium = () => {
        if (!platinumForm.productName || !platinumForm.clientAge) return null;
        
        const basePrice = getPlatinumPrice(platinumForm.productName, platinumForm.clientAge);
        const discountRate = platinumForm.discount || 0;
        const finalPrice = basePrice * (1 - discountRate / 100);
        
        return { basePrice, finalPrice };
    };

    const platinumPriceCalc = calculatePlatinumPremium();

    const handleReferral = (type: string) => {
        const isElementary = type === "ביטוח אלמנטרי";
        const recipient = isElementary ? "office@tlp-ins.co.il" : "hafnayot@tlp-ins.co.il";
        const cc = "btuvia6580@gmail.com";
        // const subject = `הפניית לקוח - ${client.name} - ${type}`;
        const body = `
פרטי לקוח:
שם: ${client.name}
טלפון: ${client.phone}
שירות מבוקש: ${type}

תודה רבה- מגן זהב 054-657-5555
`;

        // Simulation logic
        console.log(`Sending mail to: ${recipient}, CC: ${cc}`);
        console.log(body);

        alert(`הפנייה נשלחה בהצלחה!\n\nנשלח ל: ${recipient}\nעותק ל: ${cc}\nשירות: ${type}`);
        setShowReferralModal(false);
    };

    // --- AI Logic ---
    const fetchAiInsights = useCallback(async () => {
        setLoadingAi(true);
        try {
            const prompt = `Analyze insurance client: ${JSON.stringify(client)}. Return JSON: { "riskScore": 15, "analysis": "...", "opportunities": [{"text": "...", "impact": "..."}] }`;
            const res = await generateWithGemini(prompt);
            if (!res.error) {
                setAiInsight(JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim()));
            }
        } catch (e) { console.error(e); } finally { setLoadingAi(false); }
    }, [client]);

    useEffect(() => {
        if (activeTab === "תובנות AI" && !aiInsight) fetchAiInsights();
    }, [activeTab, aiInsight, fetchAiInsights]);


    const handleUploadDocument = async (file: File, metadata?: { documentType?: string; producer?: string; documentName?: string }) => {
        // Mock upload - in real app would upload to Storage and get URL
        const now = new Date();
        const newDoc: ClientDocument = {
            id: Date.now().toString(),
            name: metadata?.documentName || file.name,
            type: file.type.includes("pdf") ? "PDF" : "IMG",
            documentType: (metadata?.documentType as ClientDocument['documentType']) || 'אישי',
            producer: (metadata?.producer as ClientDocument['producer']) || undefined,
            url: URL.createObjectURL(file), // Temporary local URL for demo
            date: now.toLocaleString("he-IL"),
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            uploadedBy: "מנהל מערכת", // TODO: Get from auth context
            status: 'נשמר'
        };

        const updatedDocs = [...(client.documents || []), newDoc];
        saveData("documents", updatedDocs);
        toast.success("המסמך הועלה בהצלחה");
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("האם למחוק מסמך זה?")) return;
        const updatedDocs = client.documents.filter(d => d.id !== docId);
        saveData("documents", updatedDocs);
    };

    const handleDeleteExternalPolicy = async (policyId: string) => {
        if (!confirm("האם למחוק פוליסה חיצונית זו?")) return;
        const updatedPolicies = (client.externalPolicies || []).filter(p => p.id !== policyId);
        saveData("externalPolicies", updatedPolicies);
        toast.success("הפוליסה הוסרה בהצלחה");
    };

    const [newNote, setNewNote] = useState("");
    const [isVoiceSummarizing, setIsVoiceSummarizing] = useState(false);
    const [summarizeOnStop, setSummarizeOnStop] = useState(false);
    const {
        isSupported: isSpeechSupported,
        isListening: isSpeechListening,
        transcript: speechTranscript,
        error: speechError,
        start: startSpeech,
        stop: stopSpeech,
        reset: resetSpeech
    } = useSpeechRecognition({ lang: "he-IL" });

    useEffect(() => {
        if (isSpeechListening) return;
        if (!summarizeOnStop) return;

        setSummarizeOnStop(false);
        const text = speechTranscript.trim();
        resetSpeech();
        if (!text) {
            toast.error("לא זוהה טקסט מההקלטה");
            return;
        }
        void (async () => {
            setIsVoiceSummarizing(true);
            try {
                const clipped = text.length > 8000 ? text.slice(0, 8000) : text;
                const prompt = `You are a Hebrew-speaking CRM assistant for an insurance agency.
Convert the following spoken transcript into a clear, professional, readable documentation note.

Rules:
- Write in Hebrew.
- Keep it concise but complete.
- Use short sections and bullets.
- Include: סיכום, נקודות חשובות, החלטות/התחייבויות, פעולות להמשך, סנטימנט (חיובי/ניטרלי/שלילי).
- Do NOT mention that this is AI-generated.

Client: ${client.name}
Date: ${new Date().toLocaleString("he-IL")}

Transcript:
${clipped}`;

                const result = await generateWithGemini(prompt);
                if (result.error) {
                    toast.error(`שגיאת AI: ${result.error}`);
                    return;
                }
                const noteText = (result.text || "").trim();
                if (!noteText) {
                    toast.error("לא התקבל תיעוד מה-AI");
                    return;
                }

                setNewNote(noteText);
                toast.success("התיעוד נוצר והוזן לשדה. אפשר לערוך ולשמור.");
            } catch {
                toast.error("שגיאה ביצירת תיעוד מההקלטה");
            } finally {
                setIsVoiceSummarizing(false);
            }
        })();
    }, [client.name, isSpeechListening, resetSpeech, speechTranscript, summarizeOnStop]);

    const handleSaveNote = () => {
        if (!newNote) return;
        const note: Interaction = {
            id: Date.now().toString(),
            type: 'call', // Default to call for quick note
            direction: 'outbound',
            date: new Date().toLocaleString("he-IL"),
            summary: newNote,
            sentiment: 'neutral'
        };
        const updated = [note, ...(client.interactions || [])];
        saveData("interactions", updated);
        setNewNote("");
    };

    const handleUploadHarHabituach = async (file: File) => {
        setIsAnalyzing(true);
        try {
            toast.info("מפענח דוח... אנא תמתין מספר שניות");
            const result = await analyzeInsuranceDocument(file);

            if (result && result.policies.length > 0) {
                const newPolicies: ExternalPolicy[] = result.policies.map((p: any, idx: number) => ({
                    id: Date.now().toString() + idx,
                    company: p.company,
                    productType: p.type,
                    premium: `₪${p.premium}`,
                    endDate: p.expirationDate,
                    status: "פעיל"
                }));

                saveData("externalPolicies", [...(client.externalPolicies || []), ...newPolicies]);
                // סימון אוטומטי שיש דוח הר הביטוח
                saveData("hasInsuranceReport", true);
                toast.success(`הקובץ פוענח בהצלחה! אותרו ${newPolicies.length} פוליסות.`);
            } else {
                // גם אם לא נמצאו פוליסות, הקובץ הועלה
                saveData("hasInsuranceReport", true);
                toast.error("לא נמצאו פוליסות בדוח או שהפענוח נכשל.");
            }
        } catch (e) {
            console.error(e);
            toast.error("שגיאה בפענוח הקובץ");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImportLead = (policy: ExternalPolicy) => {
        // Create a new task for this lead
        const taskData = {
            title: `ליד חדש: ${policy.productType} - ${policy.company}`,
            priority: "high" as const,
            dueDate: new Date().toISOString().split('T')[0],
            status: "pending" as const,
            type: "task" as const,
            clientName: client.name,
            description: `פרמיה נוכחית: ${policy.premium}, מסתיים ב: ${policy.endDate}`
        };

        firestoreService.addTask(taskData as any).then(() => {
            toast.success(`נוצר ליד חדש עבור פוליסת ${policy.productType}`);
        });
    };

    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const handleGenerateAIInsights = async () => {
        setIsGeneratingInsights(true);
        // Simulate AI delay
        setTimeout(() => {
            const mockInsights = {
                gaps: [
                    { title: "חוסר בביטוח מחלות קשות", description: "ללקוח אין כיסוי למחלות קשות. בהתחשב בגיל (40), מומלץ להציע כיסוי בסיסי.", severity: "high" },
                    { title: "תמיל פנסיוני לא אופטימלי", description: "דמי הניהול בקרן הפנסיה (0.7%) גבוהים מהממוצע בשוק (0.2%).", severity: "medium" }
                ],
                savings: [
                    { title: "הוזלת דמי ניהול", amount: "₪4,500", description: "צפי חיסכון ל-5 שנים ע\"י ניוד קרן השתלמות." },
                    { title: "ביטול כפל ביטוח תאונות", amount: "₪720", description: "קיים כפל ביטוחי עם הפוליסה הקבוצתית." }
                ],
                opportunities: [
                    { title: "פתיחת חיסכון לילד", description: "הילדה נועה הגיעה לגיל 12 - זמן טוב לפתוח חיסכון לבר מצווה/לימודים." },
                    { title: "ביטוח נסיעות לחו\"ל", description: "הלקוח טס בממוצע 3 פעמים בשנה. שקול להציע פספורט כארד שנתי." }
                ]
            };
            saveData("aiInsights", mockInsights);
            setIsGeneratingInsights(false);
        }, 2000);
    };

    // פונקציה לחישוב גיל מתאריך לידה
    const calculateAge = (birthDate: string): number => {
        if (!birthDate) return 0;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // חיפוש לקוחות לקישור
    const filteredClients = allClients.filter(c => 
        c.id !== client.id && 
        (c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
         c.idNumber?.includes(clientSearchQuery))
    );

    const tabs = ["סיכום", "סטטוס", "לביצוע מכירה", "פרטים אישיים", "אלמנטרי", "פוליסות", "מסמכים", "משימות", "תקשורת", "פיננסי", "הר הביטוח", "תובנות AI"];

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-fade-in-up" dir="rtl">

                {/* Header - Neon Premium Design */}
                <div className="relative group animate-in fade-in zoom-in duration-700">
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600/30 via-indigo-600/30 to-amber-500/30 rounded-[2.5rem] blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
                    <div className="relative bg-[#0d1326] rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden border border-slate-800">
                        {/* Glowing Decorative Orbs */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 animate-float" />
                        
                        {/* Edit Button */}
                        <button 
                            onClick={() => handleEdit("personal", { name: client.name, phone: client.phone, email: client.email, status: client.status, idNumber: client.idNumber })} 
                            className="absolute top-8 left-8 p-3 bg-slate-800/50 hover:bg-amber-500/20 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:rotate-3 border border-slate-700 hover:border-amber-500/50"
                        >
                            <Edit2 size={18} className="text-amber-400" />
                        </button>

                        <div className="relative z-10">
                            {/* Top Row: Name and Main Actions */}
                            <div className="flex flex-col lg:flex-row justify-between items-center gap-10 mb-10">
                                <div className="flex items-center gap-8 text-right w-full lg:w-auto">
                                    <div className="relative group/avatar">
                                        <div className="absolute inset-0 bg-linear-to-br from-amber-400 to-amber-600 rounded-[2.5rem] blur-md group-hover/avatar:blur-xl transition-all duration-500" />
                                        <div className="relative h-32 w-32 rounded-[2.5rem] bg-linear-to-br from-slate-900 to-[#1e293b] flex items-center justify-center text-5xl font-black text-amber-400 border-2 border-amber-500/30 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                                            {client.name.substring(0, 2)}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-6 w-6 rounded-full border-4 border-[#0d1326] shadow-lg" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h1 className="text-4xl md:text-6xl font-black font-display leading-none tracking-tight text-white italic drop-shadow-2xl">
                                                {client.name.split(" ")[0]} <span className="text-amber-500">{client.name.split(" ").slice(1).join(" ")}</span>
                                            </h1>
                                        </div>
                                        <div className="flex gap-2">
                                            {client.salesStatus === 'closed_won' ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase">✓ פעיל</Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase">◉ ליד</Badge>
                                            )}
                                            {!!client.opsUnlocked && (
                                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">⚡ תפעול פתוח</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                    <ClientQuickActions 
                                        clientId={client.id}
                                        clientName={client.name}
                                        phone={client.phone}
                                        email={client.email}
                                        variant="horizontal"
                                    />
                                    <button
                                        onClick={() => setShowReferralModal(true)}
                                        className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl font-black flex items-center justify-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 group/btn italic text-sm"
                                    >
                                        <Share2 size={18} />
                                        הפנייה מהירה
                                    </button>
                                </div>
                            </div>

                            {/* Middle Row: Identity 3-Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-amber-500/30 transition-all group/info">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> מספר זהות
                                    </p>
                                    <p className="text-xl font-black text-white group-hover/info:text-amber-500 transition-colors">{client.idNumber}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-amber-500/30 transition-all group/info">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> דואר אלקטרוני
                                    </p>
                                    <p className="text-xl font-black text-white group-hover/info:text-indigo-400 transition-colors truncate">{client.email}</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 hover:border-amber-500/30 transition-all group/info">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> טלפון נייד
                                    </p>
                                    <p className="text-xl font-black text-white group-hover/info:text-emerald-400 transition-colors">{client.phone}</p>
                                </div>
                            </div>

                            {/* Bottom Row: Status Bar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-400">עדכון אחרון: {client.interactions?.[0]?.date || "היום"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400">סטטוס:</span>
                                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px] font-black px-3 py-0.5 rounded-full">
                                            {client.status}
                                        </Badge>
                                    </div>
                                </div>
                                
                                {!!client.referralName && (
                                    <div className="bg-white/5 px-6 py-2 rounded-2xl border border-white/10 text-indigo-300 text-xs font-black">
                                        🤝 שותף: {client.referralName}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Neon Pill Design */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none px-2 no-scrollbar">
                    {tabs.map((tab, index) => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)} 
                            className={`px-8 py-3.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-300 relative overflow-hidden group/tab ${
                                activeTab === tab 
                                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-105 italic' 
                                    : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-slate-800'
                            }`}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {activeTab === tab && (
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/tab:translate-x-full transition-transform duration-1000" />
                            )}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- Tab Content: Summary --- */}
                {activeTab === "סיכום" && (
                    <div className="space-y-10 stagger-children">
                        {/* Key Financial Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Premiums Card */}
                            <NeonCard className="p-0! overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl border border-amber-500/20 group-hover:scale-110 transition-transform">💰</div>
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-none">+2.5%</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">סך פרמיות חודשי</p>
                                    <h3 className="text-4xl font-black text-amber-500 italic font-display">
                                        ₪{(client.policies.reduce((acc, curr) => acc + (parseFloat(String(curr.premium || '').replace(/[^\d.-]/g, '')) || 0), 0) +
                                            client.insuranceSales.reduce((acc, curr) => acc + (parseFloat(String(curr.premium || '').replace(/[^\d.-]/g, '')) || 0), 0) +
                                            client.pensionSales.reduce((acc, curr) => acc + (parseFloat(String(curr.managementFeeDeposit || '').replace(/[^\d.-]/g, '')) || 0), 0)
                                        ).toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            {/* Portfolio Value */}
                            <NeonCard className="!p-0 overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl border border-blue-500/20 group-hover:scale-110 transition-transform">🛡️</div>
                                        <Badge className="bg-blue-500/10 text-blue-400 border-none">כיסוי כולל</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">שווי תיק ביטוחי</p>
                                    <h3 className="text-4xl font-black text-white italic font-display">
                                        ₪{client.policies.reduce((acc, curr) => acc + (parseFloat(String(curr.coverage || '').replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            {/* Portfolio Split */}
                            <NeonCard className="p-0! overflow-hidden group">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl border border-purple-500/20 group-hover:scale-110 transition-transform">📊</div>
                                        <Badge className="bg-purple-500/10 text-purple-400 border-none">{client.policies.length + client.pensionSales.length + client.insuranceSales.length} מוצרים</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">חלוקת הון בסיכון</p>
                                    <div className="flex h-3 rounded-full overflow-hidden gap-1.5 mt-4 bg-slate-800 p-0.5 shadow-inner">
                                        <div className="bg-amber-500 rounded-full animate-pulse" style={{ width: '40%' }} />
                                        <div className="bg-blue-500 rounded-full" style={{ width: '35%' }} />
                                        <div className="bg-purple-500 rounded-full" style={{ width: '25%' }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black text-slate-500 mt-4 uppercase tracking-tighter">
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />פנסיוני</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />בריאות</span>
                                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />סיכונים</span>
                                    </div>
                                </div>
                            </NeonCard>
                        </div>

                        {/* Detailed Client Info Blocks */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            <NeonCard title="👤 פרטי זיהוי ומסמכים" action={<button onClick={() => handleEdit("clientDetails")} className="text-amber-500 hover:text-amber-400 transition-colors"><Edit2 size={16} /></button>}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 group/item hover:border-amber-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">מספר זהות</p>
                                        <p className="font-black text-white text-lg group-hover/item:text-amber-500 transition-colors">{client.idNumber || '—'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 group/item hover:border-amber-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">תאריך לידה</p>
                                        <p className="font-black text-white group-hover/item:text-amber-500 transition-colors">{client.birthDate ? new Date(client.birthDate).toLocaleDateString('he-IL') : '—'}</p>
                                    </div>
                                    <div className="bg-[#0b1021] p-6 rounded-2xl border border-slate-800 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">גיל נוכחי</p>
                                            <p className="text-4xl font-black text-amber-500 italic leading-none">{client.birthDate ? calculateAge(client.birthDate) : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 group/item hover:border-amber-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">תאריך הנפקת ת.ז</p>
                                        <p className="font-black text-white group-hover/item:text-amber-500 transition-colors">{client.idIssueDate ? new Date(client.idIssueDate).toLocaleDateString('he-IL') : '—'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 group/item hover:border-amber-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">האם מעשן</p>
                                        <p className={`font-black flex items-center gap-3 ${client.isSmoker ? 'text-red-400' : 'text-emerald-400'}`}>
                                            <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${client.isSmoker ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                            {client.isSmoker === undefined ? '—' : client.isSmoker ? 'כן' : 'לא'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`mt-6 p-6 rounded-3xl flex items-center gap-6 border-2 transition-all ${client.hasInsuranceReport ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]' : 'bg-amber-500/5 border-amber-500/20 animate-pulse-slow'}`}>
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl ${client.hasInsuranceReport ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'}`}>
                                        {client.hasInsuranceReport ? '✓' : '!'}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-black text-lg italic ${client.hasInsuranceReport ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {client.hasInsuranceReport ? 'דוח הר הביטוח מאומת' : 'חסר דוח הר הביטוח'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 mt-1">
                                            {client.hasInsuranceReport ? 'הנתונים מעודכנים ומוזנים במערכת' : 'נדרש להעלות דוח עדכני כדי להפעיל תובנות AI'}
                                        </p>
                                    </div>
                                </div>
                            </NeonCard>

                            <NeonCard title="📋 מאפייני לקוח וקשרים" action={<button onClick={() => handleEdit("additionalDetails")} className="text-amber-500 hover:text-amber-400 transition-colors"><Edit2 size={16} /></button>}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">קופת חולים</p>
                                        <p className="font-black text-white">{client.healthFund || '—'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">תנאי תשלום</p>
                                        <p className="font-black text-white">{client.paymentTerms || '—'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">נציג שירות</p>
                                        <p className="font-black text-white">{client.salesRepresentative || 'מערכת'}</p>
                                    </div>
                                </div>

                                {client.email && (
                                    <div className="mt-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                                        <div className="p-2 bg-slate-800 rounded-xl text-slate-400"><Mail size={16} /></div>
                                        <p className="font-bold text-slate-300 text-sm">{client.email}</p>
                                    </div>
                                )}

                                {client.linkedClientId && (
                                    <div className="mt-4 bg-indigo-500/10 p-5 rounded-3xl border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.1)] flex items-center justify-between group/link hover:bg-indigo-500/20 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500 text-black rounded-2xl shadow-lg shadow-indigo-500/20 rotate-12 group-hover/link:rotate-0 transition-transform">
                                                <Link2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">לקוח מקושר</p>
                                                <p className="font-black text-indigo-200 text-lg">{client.linkedClientName || 'לקוח ללא שם'}</p>
                                            </div>
                                        </div>
                                        <ArrowLeft size={20} className="text-indigo-400 -translate-x-2 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-100 transition-all" />
                                    </div>
                                )}
                            </NeonCard>
                        </div>

                        {/* Summary Opportunities & Split */}
                        <div className="grid lg:grid-cols-2 gap-8">
                             <NeonCard title="💹 התפלגות פוליסות">
                                <div className="space-y-4">
                                    {[...client.policies, ...client.insuranceSales].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-800/60 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-lg ${i % 2 === 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    {('icon' in item ? item.icon : '📄')}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-sm">{('type' in item ? item.type : item.productType)}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.company}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-amber-500 italic text-lg">{item.premium}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {client.policies.length === 0 && client.insuranceSales.length === 0 && (
                                        <div className="text-center py-12 opacity-30 italic font-bold text-slate-500">
                                            אין פוליסות פעילות להצגה
                                        </div>
                                    )}
                                </div>
                             </NeonCard>

                             <NeonCard title="🚀 הזדמנויות עסקיות">
                                <div className="space-y-4">
                                    {client.pensionSales.length === 0 && (
                                        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">⚠️</div>
                                                <div>
                                                    <h5 className="font-black text-red-400 text-sm">חוסר פנסיוני</h5>
                                                    <p className="text-xs text-slate-500 font-bold mt-0.5">לא זוהתה קרן פנסיה פעילה</p>
                                                </div>
                                            </div>
                                            <NeonButton size="sm" variant="secondary" onClick={() => setActiveTab("לביצוע מכירה")}>סגור פער</NeonButton>
                                        </div>
                                    )}
                                    {!client.policies.some(p => p.type.includes("בריאות")) && (
                                        <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">🏥</div>
                                                <div>
                                                    <h5 className="font-black text-blue-400 text-sm">הזדמנות בריאות</h5>
                                                    <p className="text-xs text-slate-500 font-bold mt-0.5">ניתוח מעלה חוסר בביטוח פרטי</p>
                                                </div>
                                            </div>
                                            <NeonButton size="sm" variant="secondary" onClick={() => setActiveTab("לביצוע מכירה")}>הצע חבילה</NeonButton>
                                        </div>
                                    )}
                                    {!client.hasInsuranceReport && (
                                        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">📄</div>
                                                <div>
                                                    <h5 className="font-black text-amber-400 text-sm">פענוח דוח</h5>
                                                    <p className="text-xs text-slate-500 font-bold mt-0.5">נדרש העלאת דוח הר הביטוח</p>
                                                </div>
                                            </div>
                                            <NeonButton size="sm" variant="secondary" onClick={() => setActiveTab("הר הביטוח")}>העלה</NeonButton>
                                        </div>
                                    )}
                                </div>
                             </NeonCard>
                        </div>
                    </div>
                )}

                {/* --- Tab Content: Status Tracker --- */}
                {activeTab === "סטטוס" && <LifecycleTracker client={client} onUpdate={handleStatusUpdate} />}

                {/* --- Tab Content: Sales Execution --- */}
                {activeTab === "לביצוע מכירה" && (
                    <div className="grid lg:grid-cols-2 gap-8 stagger-children">
                        {/* Pension Sales Section */}
                        <NeonCard title="📊 מכירה פנסיונית">
                            <div className="grid grid-cols-2 gap-6">
                                <NeonSelect 
                                    label="סוג המוצר"
                                    value={pensionForm.type || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, type: e.target.value })}
                                >
                                    <option value="">בחר...</option>
                                    <option>קופת גמל</option>
                                    <option>קרן השתלמות</option>
                                    <option>קרן פנסיה</option>
                                </NeonSelect>

                                <NeonSelect 
                                    label="חברה מנהלת"
                                    value={pensionForm.company || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, company: e.target.value })}
                                >
                                    <option value="">בחר...</option>
                                    <option>אלטשולר שחם</option>
                                    <option>הפניקס</option>
                                    <option>הראל</option>
                                    <option>כלל</option>
                                    <option>מגדל</option>
                                    <option>מיטב</option>
                                    <option>מנורה</option>
                                    <option>פסגות</option>
                                    <option>מור</option>
                                    <option>אינפיניטי</option>
                                </NeonSelect>

                                <div className="col-span-2">
                                    <NeonInput 
                                        label="שם התוכנית"
                                        placeholder="הזן שם תוכנית..." 
                                        value={pensionForm.planName || ""} 
                                        onChange={e => setPensionForm({ ...pensionForm, planName: e.target.value })}
                                    />
                                </div>

                                <NeonInput 
                                    label='דנ"ה מצבירה (%)'
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    value={pensionForm.managementFeeAccumulation || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, managementFeeAccumulation: e.target.value })}
                                />

                                <NeonInput 
                                    label='דנ"ה מהפקה (%)'
                                    type="number" 
                                    step="0.01" 
                                    placeholder="0.00"
                                    value={pensionForm.managementFeeDeposit || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, managementFeeDeposit: e.target.value })}
                                />

                                <NeonInput 
                                    label="מועד הצטרפות"
                                    type="date"
                                    value={pensionForm.joinDate || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, joinDate: e.target.value })}
                                />

                                <NeonInput 
                                    label="מספר קופה/עמית"
                                    placeholder="הזן מספר..."
                                    value={pensionForm.fundNumber || ""} 
                                    onChange={e => setPensionForm({ ...pensionForm, fundNumber: e.target.value })}
                                />

                                <div className="col-span-2">
                                    <NeonInput 
                                        label="משכורת ממוצעת"
                                        type="number" 
                                        placeholder="₪"
                                        value={pensionForm.avgSalary || ""} 
                                        onChange={e => setPensionForm({ ...pensionForm, avgSalary: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <NeonButton onClick={handleAddPension} className="flex-1">
                                    <Plus size={20} className="ml-2" /> טעינת מוצר
                                </NeonButton>
                                <button 
                                    onClick={() => setShowMarketModal(true)} 
                                    className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    <span className="text-xl">🤖</span> ניתוח שוק (AI)
                                </button>
                            </div>

                            {/* List of Added Pension Products */}
                            <div className="mt-8 space-y-4 border-t border-slate-800/50 pt-8">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">{client.pensionSales.length}</span>
                                    מוצרים שנוספו לרשימה
                                </h5>
                                {client.pensionSales.map((item, index) => (
                                    <div key={item.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] flex justify-between items-center group/item hover:border-amber-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl shadow-inner border border-amber-500/20">
                                                {item.type[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-lg">{item.type} - {item.company}</p>
                                                <p className="text-xs text-slate-500 font-bold tracking-tight mt-1">{item.fundNumber}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteItem("pensionSales", item.id)} className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {client.pensionSales.length === 0 && (
                                    <div className="text-center py-10 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                                        <div className="text-5xl mb-4 opacity-20 filter grayscale">📈</div>
                                        <p className="text-slate-500 font-bold italic">אין מוצרים פנסיוניים שהוספו</p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>

                        {/* Insurance Sales Section */}
                        <NeonCard title="🛡️ מכירת ביטוח">
                            <div className="grid grid-cols-2 gap-6">
                                <NeonSelect 
                                    label="חברת ביטוח"
                                    value={insuranceForm.company || ""} 
                                    onChange={e => setInsuranceForm({ ...insuranceForm, company: e.target.value })}
                                >
                                    <option value="">בחר...</option>
                                    <option>הראל</option>
                                    <option>הפניקס</option>
                                    <option>מנורה</option>
                                    <option>איילון</option>
                                    <option>הכשרה</option>
                                </NeonSelect>

                                <div className="col-span-2 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-white italic">מכירת פלטינום?</label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-3 text-sm cursor-pointer group/radio">
                                                <input type="radio" name="plat" onChange={() => setShowPlatinumSelect(true)} checked={showPlatinumSelect} className="w-5 h-5 accent-amber-500" />
                                                <span className={`${showPlatinumSelect ? 'text-amber-400' : 'text-slate-500'} font-black transition-colors`}>כן</span>
                                            </label>
                                            <label className="flex items-center gap-3 text-sm cursor-pointer group/radio">
                                                <input type="radio" name="plat" onChange={() => setShowPlatinumSelect(false)} checked={!showPlatinumSelect} className="w-5 h-5 accent-amber-500" />
                                                <span className={`${!showPlatinumSelect ? 'text-amber-400' : 'text-slate-500'} font-black transition-colors`}>לא</span>
                                            </label>
                                        </div>
                                    </div>
                                    {showPlatinumSelect && (
                                        <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                                            <NeonSelect 
                                                multiple 
                                                label="בחר מוצרי פלטינום (Ctrl+Click)"
                                                className="h-32"
                                                onChange={e => {
                                                    const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
                                                    setInsuranceForm({ ...insuranceForm, platinumProducts: selected });
                                                }}
                                            >
                                                <option>פלטינום בריאות</option>
                                                <option>פלטינום פרימיום</option>
                                                <option>רופא עד הבית</option>
                                                <option>שיניים</option>
                                                <option>רפואה אלטרנטיבית</option>
                                            </NeonSelect>
                                        </div>
                                    )}
                                </div>

                                <NeonSelect 
                                    label="מוצר ביטוח"
                                    value={insuranceForm.productType || ""} 
                                    onChange={e => setInsuranceForm({ ...insuranceForm, productType: e.target.value })}
                                >
                                    <option value="">בחר...</option>
                                    <option>בריאות</option>
                                    <option>מחלות קשות</option>
                                    <option>ריסק</option>
                                    <option>תאונות אישיות</option>
                                    <option>משכנתא</option>
                                    <option>אכע</option>
                                    <option>מטריה ביטוחית</option>
                                </NeonSelect>

                                <NeonInput 
                                    label="סכום ביטוח"
                                    type="number" 
                                    placeholder="₪"
                                    value={insuranceForm.amount || ""} 
                                    onChange={e => setInsuranceForm({ ...insuranceForm, amount: e.target.value })}
                                />

                                <div className="flex items-center gap-4 p-5 bg-slate-900/50 rounded-[1.5rem] border border-slate-800">
                                    <input 
                                        type="checkbox" 
                                        checked={insuranceForm.hasLien || false} 
                                        onChange={e => setInsuranceForm({ ...insuranceForm, hasLien: e.target.checked })} 
                                        className="w-6 h-6 rounded-lg accent-amber-500" 
                                    />
                                    <label className="text-sm font-black text-slate-400 italic">האם קיים שיעבוד?</label>
                                </div>

                                <NeonInput 
                                    label="פרמיה"
                                    type="number" 
                                    placeholder="₪"
                                    value={insuranceForm.premium || ""} 
                                    onChange={e => setInsuranceForm({ ...insuranceForm, premium: e.target.value })}
                                />

                                <div className="col-span-2">
                                    <NeonInput 
                                        label="כמה נפשות בפוליסה"
                                        type="number" 
                                        value={insuranceForm.numInsured || 1} 
                                        onChange={e => setInsuranceForm({ ...insuranceForm, numInsured: +e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <NeonButton onClick={handleAddInsurance} className="w-full mt-8">
                                <Plus size={20} className="ml-2" /> הוסף ביטוח לסל
                            </NeonButton>

                            {/* List of Added Insurance Products */}
                            <div className="mt-8 space-y-4 border-t border-slate-800/50 pt-8">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">{client.insuranceSales.length}</span>
                                    ביטוחים שנוספו לרשימה
                                </h5>
                                {client.insuranceSales.map((item, index) => (
                                    <div key={item.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] flex justify-between items-center group/item hover:border-emerald-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 text-xl shadow-inner border border-emerald-500/20">
                                                🛡️
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-lg">{item.productType} - {item.company}</p>
                                                <p className="text-xs text-slate-500 font-bold tracking-tight mt-1">
                                                    {item.isPlatinum ? '✨ כולל פלטינום' : ''} • ₪{item.premium}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteItem("insuranceSales", item.id)} className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {client.insuranceSales.length === 0 && (
                                    <div className="text-center py-10 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                                        <div className="text-5xl mb-4 opacity-20 filter grayscale">🛡️</div>
                                        <p className="text-slate-500 font-bold italic">אין ביטוחים שהוספו</p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>

                        {/* ===== Platinum Service Sale Section ===== */}
                        <NeonCard title="⭐ מכירת כתב שירות פלטינום" className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Form Column */}
                                <div className="space-y-6">
                                    <NeonSelect 
                                        label="שם המוצר"
                                        value={platinumForm.productName || ""} 
                                        onChange={e => setPlatinumForm({ ...platinumForm, productName: e.target.value as PlatinumSale['productName'] })} 
                                    >
                                        <option value="">בחר מוצר...</option>
                                        <option value="פלטינום בריאות">פלטינום בריאות</option>
                                        <option value="פלטינום פרמיום">פלטינום פרמיום</option>
                                        <option value="רופא עד הבית">רופא עד הבית</option>
                                        <option value="פלטינום רפואה משלימה">פלטינום רפואה משלימה</option>
                                        <option value="פלטינום דנטל">פלטינום דנטל</option>
                                    </NeonSelect>

                                    <div className="grid grid-cols-2 gap-6">
                                        <NeonInput 
                                            label="גיל הלקוח"
                                            type="number" 
                                            min="0" 
                                            max="120"
                                            value={platinumForm.clientAge || ""} 
                                            onChange={e => setPlatinumForm({ ...platinumForm, clientAge: +e.target.value })} 
                                            placeholder="הזן גיל"
                                        />

                                        <NeonSelect 
                                            label={`הנחה ${platinumForm.productName === 'פלטינום דנטל' ? '(מקס 10%)' : ''}`}
                                            value={platinumForm.discount || ""} 
                                            onChange={e => setPlatinumForm({ ...platinumForm, discount: +e.target.value as 10 | 20 | 30 })} 
                                        >
                                            <option value="">בחר הנחה...</option>
                                            <option value="10">10%</option>
                                            {platinumForm.productName !== 'פלטינום דנטל' && (
                                                <>
                                                    <option value="20">20%</option>
                                                    <option value="30">30%</option>
                                                </>
                                            )}
                                        </NeonSelect>
                                    </div>

                                    {platinumPriceCalc && (
                                        <div className="bg-amber-500/10 p-6 rounded-[2rem] border border-amber-500/20 animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest block mb-1">מחיר בסיס</span>
                                                    <span className="text-2xl font-black text-amber-500 italic">₪{platinumPriceCalc.basePrice}</span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest block mb-1">מחיר סופי</span>
                                                    <span className="text-3xl font-black text-emerald-500 italic">₪{platinumPriceCalc.finalPrice.toFixed(0)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <NeonInput 
                                        label="עלות חודשית סופית (₪)"
                                        type="number" 
                                        value={platinumForm.monthlyPremium || ""} 
                                        onChange={e => setPlatinumForm({ ...platinumForm, monthlyPremium: +e.target.value })} 
                                        placeholder={platinumPriceCalc ? `מומלץ: ₪${platinumPriceCalc.finalPrice.toFixed(0)}` : "הזן סכום"}
                                    />

                                    {platinumForm.monthlyPremium && platinumForm.productName && (
                                        <div className="bg-indigo-500/10 p-6 rounded-[2rem] border border-indigo-500/20">
                                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">💰 עמלות צפויות</h5>
                                            <div className="grid grid-cols-2 gap-6 text-sm">
                                                <div>
                                                    <p className="text-slate-500 font-bold mb-1">חד-פעמית</p>
                                                    <p className="font-black text-indigo-400 text-lg">₪{(platinumForm.monthlyPremium * 3).toFixed(0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 font-bold mb-1">נפרעים</p>
                                                    <p className="font-black text-indigo-400 text-lg">₪{(platinumForm.monthlyPremium * (platinumForm.productName === 'פלטינום דנטל' ? 0.30 : 0.45)).toFixed(0)}/ח'</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <NeonButton onClick={handleAddPlatinum} className="w-full">
                                        <Plus size={20} className="ml-2" /> אישור מכירה פלטינום
                                    </NeonButton>
                                </div>

                                {/* List Column */}
                                <div className="space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20">{(client.platinumSales || []).length}</span>
                                        מכירות פלטינום בסל
                                    </h5>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar px-2">
                                        {(client.platinumSales || []).map((item, index) => {
                                            const commission = calculatePlatinumCommission(item);
                                            return (
                                                <div key={item.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] group/item hover:border-amber-500/30 transition-all duration-300">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 text-xl border border-amber-500/20 shadow-inner">⭐</div>
                                                            <div>
                                                                <p className="font-black text-white text-lg">{item.productName}</p>
                                                                <p className="text-xs text-slate-500 font-bold mt-1">
                                                                    גיל {item.clientAge} • הנחה {item.discount}% • ₪{item.monthlyPremium}/ח'
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black border border-emerald-500/20 tracking-tighter uppercase">{item.status}</span>
                                                            <button onClick={() => deleteItem("platinumSales", item.id)} className="p-2 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-tight">
                                                        <div className="text-slate-600">עמלה חד"פ: <span className="text-indigo-400">₪{commission.oneTimeCommission.toFixed(0)}</span></div>
                                                        <div className="text-slate-600">עמלת נפרעים: <span className="text-indigo-400">₪{commission.monthlyCommission.toFixed(0)}</span></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!client.platinumSales || client.platinumSales.length === 0) && (
                                            <div className="text-center py-20 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                                                <div className="text-6xl mb-4 opacity-20 filter grayscale">⭐</div>
                                                <p className="text-slate-500 font-bold italic">אין מכירות פלטינום</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Section */}
                            {client.platinumSales && client.platinumSales.length > 0 && (
                                <div className="mt-12 pt-12 border-t-2 border-slate-800/50">
                                    <div className="flex items-center gap-3 mb-10 overflow-hidden">
                                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">💳</div>
                                        <div>
                                            <h5 className="text-2xl font-black text-white italic tracking-tight">פרטי תשלום והפקה</h5>
                                            <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Payment & Issuance Details</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="space-y-8">
                                            {/* ID Type Selection */}
                                            <div className="bg-[#0d1326] p-6 rounded-[2.5rem] border border-slate-800 shadow-inner">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 mr-2">סוג מסמך זיהוי</label>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setClient({ ...client, idType: 'תעודת זהות' })}
                                                        className={`p-5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                                            client.idType === 'תעודת זהות' 
                                                                ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)]' 
                                                                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🪪</span> תעודת זהות
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setClient({ ...client, idType: 'דרכון' })}
                                                        className={`p-5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                                            client.idType === 'דרכון' 
                                                                ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)]' 
                                                                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🛂</span> דרכון
                                                    </button>
                                                </div>

                                                {client.idType === 'דרכון' && (
                                                    <div className="grid grid-cols-2 gap-6 mt-8 animate-in slide-in-from-top-4 duration-300">
                                                        <NeonInput 
                                                            label="ארץ הנפקה"
                                                            value={client.passportCountry || ""} 
                                                            onChange={e => setClient({ ...client, passportCountry: e.target.value })} 
                                                            placeholder="ארץ הנפקת הדרכון"
                                                        />
                                                        <NeonInput 
                                                            label="תוקף דרכון"
                                                            type="date" 
                                                            value={client.passportExpiry || ""} 
                                                            onChange={e => setClient({ ...client, passportExpiry: e.target.value })} 
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Payment Method Selection */}
                                            <div className="bg-[#0d1326] p-6 rounded-[2.5rem] border border-slate-800 shadow-inner">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 mr-2">אמצעי תשלום</label>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlatinumPaymentForm({ ...platinumPaymentForm, paymentMethod: 'אשראי' })}
                                                        className={`p-5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                                            platinumPaymentForm.paymentMethod === 'אשראי' 
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)]' 
                                                                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">💳</span> כרטיס אשראי
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPlatinumPaymentForm({ ...platinumPaymentForm, paymentMethod: 'הוראת קבע' })}
                                                        className={`p-5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                                            platinumPaymentForm.paymentMethod === 'הוראת קבע' 
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)]' 
                                                                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🏦</span> הוראת קבע
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Dynamic Payment Fields */}
                                            {platinumPaymentForm.paymentMethod === 'אשראי' && (
                                                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 space-y-6 animate-in fade-in duration-500">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="col-span-2">
                                                            <NeonInput 
                                                                label="מספר כרטיס אשראי"
                                                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                                                maxLength={19}
                                                                value={platinumPaymentForm.creditCardNumber || ""} 
                                                                onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, creditCardNumber: e.target.value })} 
                                                            />
                                                        </div>
                                                        <NeonInput 
                                                            label="תוקף"
                                                            placeholder="MM/YY"
                                                            maxLength={5}
                                                            value={platinumPaymentForm.creditCardExpiry || ""} 
                                                            onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, creditCardExpiry: e.target.value })} 
                                                        />
                                                        <NeonInput 
                                                            label='ת"ז גורם משלם'
                                                            maxLength={9}
                                                            placeholder="מספר ת.ז"
                                                            value={platinumPaymentForm.creditCardPayerIdNumber || ""} 
                                                            onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, creditCardPayerIdNumber: e.target.value })} 
                                                        />
                                                    </div>
                                                    <NeonInput 
                                                        label="טלפון בעל הכרטיס"
                                                        type="tel" 
                                                        placeholder="050-0000000"
                                                        value={platinumPaymentForm.creditCardPayerPhone || ""} 
                                                        onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, creditCardPayerPhone: e.target.value })} 
                                                    />
                                                </div>
                                            )}

                                            {platinumPaymentForm.paymentMethod === 'הוראת קבע' && (
                                                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 space-y-6 animate-in fade-in duration-500">
                                                    <NeonSelect 
                                                        label="שם הבנק"
                                                        value={platinumPaymentForm.bankName || ""} 
                                                        onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, bankName: e.target.value })} 
                                                    >
                                                        <option value="">בחר בנק...</option>
                                                        <option value="הפועלים">הפועלים</option>
                                                        <option value="לאומי">לאומי</option>
                                                        <option value="דיסקונט">דיסקונט</option>
                                                        <option value="מזרחי טפחות">מזרחי טפחות</option>
                                                        <option value="הבינלאומי">הבינלאומי</option>
                                                        <option value="יהב">יהב</option>
                                                        <option value="מרכנתיל">מרכנתיל</option>
                                                        <option value="אוצר החייל">אוצר החייל</option>
                                                    </NeonSelect>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <NeonInput 
                                                            label="מספר סניף"
                                                            placeholder="סניף"
                                                            value={platinumPaymentForm.bankBranch || ""} 
                                                            onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, bankBranch: e.target.value })} 
                                                        />
                                                        <NeonInput 
                                                            label="מספר חשבון"
                                                            placeholder="חשבון"
                                                            value={platinumPaymentForm.bankAccountNumber || ""} 
                                                            onChange={e => setPlatinumPaymentForm({ ...platinumPaymentForm, bankAccountNumber: e.target.value })} 
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 mr-2">סוג חשבון</label>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPlatinumPaymentForm({ ...platinumPaymentForm, accountType: 'עו&quot;ש' })}
                                                                className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${
                                                                    platinumPaymentForm.accountType === 'עו&quot;ש' 
                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                                        : 'bg-slate-900/50 text-slate-400 border-slate-800'
                                                                }`}
                                                            >עו&quot;ש</button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setPlatinumPaymentForm({ ...platinumPaymentForm, accountType: 'חיסכון' })}
                                                                className={`p-4 rounded-2xl border-2 font-black text-xs transition-all ${
                                                                    platinumPaymentForm.accountType === 'חיסכון' 
                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                                        : 'bg-slate-900/50 text-slate-400 border-slate-800'
                                                                }`}
                                                            >חיסכון</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Billing Day */}
                                            <div className="bg-[#0d1326] p-6 rounded-[2.5rem] border border-slate-800 shadow-inner">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 mr-2">יום גבייה בחודש</label>
                                                <div className="grid grid-cols-4 gap-4">
                                                    {[2, 10, 15, 20].map(day => (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => setPlatinumPaymentForm({ ...platinumPaymentForm, billingDay: day as 2 | 10 | 15 | 20 })}
                                                            className={`p-4 rounded-2xl border-2 font-black text-lg transition-all ${
                                                                platinumPaymentForm.billingDay === day 
                                                                    ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                                                                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700'
                                                            }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        onClick={handleSubmitPlatinumProducts} 
                                        disabled={isSubmittingPlatinum || !client.platinumSales?.some(s => s.status === 'ממתין להפקה')}
                                        className="w-full mt-12 bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_50px_rgba(79,70,229,0.3)] rounded-[2rem] font-black py-6 text-xl italic tracking-tighter transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {isSubmittingPlatinum ? (
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                                                <span>מעבד פקודת הפקה...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-4">
                                                <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                <span>הפקת מוצרי פלטינום ({client.platinumSales?.filter(s => s.status === 'ממתין להפקה').length || 0})</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Products Status Summary */}
                                    <div className="mt-8 grid grid-cols-3 gap-6">
                                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 text-center">
                                            <div className="text-2xl font-black text-amber-500 italic leading-none">{client.platinumSales?.filter(s => s.status === 'ממתין להפקה').length || 0}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">ממתינים</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 text-center">
                                            <div className="text-2xl font-black text-blue-500 italic leading-none">{client.platinumSales?.filter(s => s.status === 'הופקה').length || 0}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">הופקו</div>
                                        </div>
                                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 text-center">
                                            <div className="text-2xl font-black text-emerald-500 italic leading-none">{client.platinumSales?.filter(s => s.status === 'נשלח לפלטינום').length || 0}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">נשלחו</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </NeonCard>
                    </div>
                )}

                {/* --- Tab Content: Personal --- */}
                {activeTab === "פרטים אישיים" && (
                    <div className="grid gap-8 stagger-children">
                        <NeonCard title="📍 כתובת מגורים">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NeonInput 
                                    label="עיר" 
                                    value={client.address.city} 
                                    readOnly 
                                />
                                <NeonInput 
                                    label="רחוב ומספר" 
                                    value={`${client.address.street} ${client.address.num}`} 
                                    readOnly 
                                />
                            </div>
                        </NeonCard>

                        <NeonCard title="💼 תעסוקה">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NeonInput 
                                    label="סטטוס" 
                                    value={client.employment.status} 
                                    readOnly 
                                />
                                <NeonInput 
                                    label="עיסוק" 
                                    value={client.employment.occupation} 
                                    readOnly 
                                />
                            </div>
                        </NeonCard>

                        {/* Family Members Section */}
                        <NeonCard title="👨‍👩‍👧‍👦 בני משפחה">
                            <div className="flex justify-end mb-6">
                                <NeonButton onClick={() => handleEdit("family")} variant="secondary">
                                    <Plus size={16} className="ml-2" /> הוסף בן משפחה
                                </NeonButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {client.family.map((member, i) => (
                                    <div key={member.id} className="p-6 bg-slate-900/50 border border-slate-800 rounded-[2rem] relative group hover:border-amber-500/30 transition-all duration-300">
                                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => handleEdit("family", member)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteItem("family", member.id)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-14 w-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 text-xl font-black">{member.name[0]}</div>
                                            <div>
                                                <p className="font-black text-white text-lg">{member.name}</p>
                                                <p className="text-xs text-slate-500 font-bold flex items-center gap-2 mt-1">
                                                    <span className="bg-slate-800 px-3 py-0.5 rounded-full">{member.relation}</span>
                                                    <span className="bg-slate-800 px-3 py-0.5 rounded-full">גיל {member.age}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${member.insured ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {member.insured ? '✓ מבוטח' : '✗ לא מבוטח'}
                                        </div>
                                    </div>
                                ))}
                                {client.family.length === 0 && (
                                    <div className="col-span-2 text-center py-16 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800/50">
                                        <div className="text-6xl mb-4 opacity-10">👨‍👩‍👧‍👦</div>
                                        <p className="text-slate-500 font-bold italic">אין בני משפחה רשומים</p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>
                    </div>
                )}

                {/* --- Tab Content: Elementary (Car/Home) --- */}
                {activeTab === "אלמנטרי" && (
                    <div className="space-y-8 stagger-children">
                        <NeonCard title="🚗 הוספת ביטוח אלמנטרי">
                            <div className="flex justify-center mb-10 p-1 bg-slate-900/50 rounded-[2rem] border border-slate-800 w-fit mx-auto">
                                <button 
                                    onClick={() => setElementaryForm({...elementaryForm, category: 'רכב', type: 'חובה ומקיף'})}
                                    className={`px-10 py-3 rounded-[1.5rem] text-sm font-black transition-all ${elementaryForm.category === 'רכב' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >רכב</button>
                                <button 
                                    onClick={() => setElementaryForm({...elementaryForm, category: 'דירה', type: 'מבנה ותכולה'})}
                                    className={`px-10 py-3 rounded-[1.5rem] text-sm font-black transition-all ${elementaryForm.category === 'דירה' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >דירה</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <NeonSelect 
                                    label="סוג כיסוי"
                                    value={elementaryForm.type}
                                    onChange={(e) => setElementaryForm({...elementaryForm, type: e.target.value})}
                                >
                                    {elementaryForm.category === 'רכב' ? (
                                        <>
                                            <option value="חובה">חובה</option>
                                            <option value="צד ג'">צד ג'</option>
                                            <option value="מקיף">מקיף</option>
                                            <option value="חובה וצד ג'">חובה וצד ג'</option>
                                            <option value="חובה ומקיף">חובה ומקיף</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="מבנה">מבנה</option>
                                            <option value="תכולה">תכולה</option>
                                            <option value="מבנה ותכולה">מבנה ותכולה</option>
                                        </>
                                    )}
                                </NeonSelect>

                                {elementaryForm.category === 'רכב' && (
                                    <NeonSelect 
                                        label="יצרן רכב (לוי יצחק)"
                                        value={elementaryForm.manufacturer}
                                        onChange={(e) => setElementaryForm({...elementaryForm, manufacturer: e.target.value})}
                                    >
                                        {["טויוטה", "יונדאי", "קיה", "מאזדה", "סקודה", "מיצובישי", "שברולט", "רנו", "פיג'ו", "סיטרואן", "הונדה", "ניסאן", "סובארו", "פולקסווגן", "אאודי", "מרצדס", "ב.מ.וו", "טסלה", "BYD", "MG", "יומי", "צ'רי"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </NeonSelect>
                                )}

                                <NeonSelect 
                                    label="חברה מבטחת"
                                    value={elementaryForm.insurer}
                                    onChange={(e) => setElementaryForm({...elementaryForm, insurer: e.target.value})}
                                >
                                    {["כלל", "מגדל", "הראל", "מנורה", "הפניקס", "איילון"].map(ins => (
                                        <option key={ins} value={ins}>{ins}</option>
                                    ))}
                                </NeonSelect>

                                <NeonInput 
                                    label="תאריך כניסה לתוקף"
                                    type="date"
                                    value={elementaryForm.effectiveDate}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        const endDate = new Date(new Date(newDate).setFullYear(new Date(newDate).getFullYear() + 1)).toISOString().split('T')[0];
                                        setElementaryForm({...elementaryForm, effectiveDate: newDate, endDate});
                                    }}
                                />

                                <NeonInput 
                                    label="מועד סיום"
                                    type="date"
                                    value={elementaryForm.endDate}
                                    onChange={(e) => setElementaryForm({...elementaryForm, endDate: e.target.value})}
                                />

                                <NeonInput 
                                    label="פרמיה שנתית (₪)"
                                    type="number"
                                    value={elementaryForm.premium}
                                    onChange={(e) => setElementaryForm({...elementaryForm, premium: Number(e.target.value)})}
                                    placeholder="0.00"
                                />
                            </div>

                            <NeonButton 
                                onClick={async () => {
                                    const newElem = {
                                        ...elementaryForm,
                                        id: Date.now().toString(),
                                        status: 'פעיל'
                                    } as ElementaryInsurance;
                                    
                                    const updatedList = [...(client.elementaryInsurances || []), newElem];
                                    await saveData("elementaryInsurances", updatedList);
                                    toast.success(`ביטוח ${newElem.category} הוסף בהצלחה!`);
                                    
                                    // Reset
                                    setElementaryForm({
                                        category: 'רכב',
                                        type: 'חובה ומקיף',
                                        insurer: 'כלל',
                                        effectiveDate: new Date().toISOString().split('T')[0],
                                        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                                        premium: 0,
                                        status: 'פעיל'
                                    });
                                }}
                                className="w-full mt-10"
                            >
                                <Save size={20} className="ml-2" /> שמור ביטוח חדש
                            </NeonButton>
                        </NeonCard>

                        {/* List of existing elementary insurances */}
                        {client.elementaryInsurances?.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {client.elementaryInsurances.map((ins, i) => (
                                    <div key={ins.id} className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] group relative hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-2 h-full ${ins.category === 'רכב' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`} />
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-6">
                                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500 border border-slate-700">
                                                    {ins.category === 'רכב' ? '🚗' : '🏠'}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-white text-2xl italic tracking-tight">{ins.category === 'רכב' ? `רכב - ${ins.manufacturer}` : `דירה - ${ins.type}`}</h5>
                                                    <p className="text-xs font-black text-slate-500 mt-1 uppercase tracking-widest">{ins.insurer} • {ins.type}</p>
                                                    <div className="flex gap-4 mt-4">
                                                        <span className="bg-slate-800/80 text-amber-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-700">₪{ins.premium.toLocaleString()} / שנה</span>
                                                        <span className="bg-slate-800/80 text-slate-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-slate-700">{ins.effectiveDate} - {ins.endDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => deleteItem("elementaryInsurances" as any, ins.id)}
                                                className="p-3 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                            ><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Tab Content: Policies --- */}
                {activeTab === "פוליסות" && (
                    <div className="space-y-8 stagger-children">
                        <div className="flex justify-end">
                            <Button onClick={() => handleEdit("policy")} className="btn-premium">
                                <Plus size={16} className="inline ml-2" /> הוסף פוליסה 
                                <span className="text-white/60 mr-2 text-xs">(תפעול בלבד)</span>
                            </Button>
                        </div>
                        <div className="grid gap-6">
                            {client.policies.map((policy, index) => (
                                <Card key={policy.id} className="border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden group hover-lift" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className={`h-2 bg-linear-to-r ${policy.color || 'from-indigo-500 via-purple-500 to-fuchsia-500'} progress-animated`} />
                                    <div className="p-8 relative">
                                        <div className="absolute top-8 left-8 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                                            <button onClick={() => handleEdit("policy", policy)} className="p-3 bg-white hover:bg-indigo-50 rounded-xl shadow-lg border border-slate-100 transition-all hover:scale-110"><Edit2 size={16} className="text-slate-500 hover:text-indigo-600" /></button>
                                            <button onClick={() => deleteItem("policies", policy.id)} className="p-3 bg-white hover:bg-red-50 rounded-xl shadow-lg border border-slate-100 transition-all hover:scale-110"><Trash2 size={16} className="text-slate-500 hover:text-red-600" /></button>
                                        </div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{policy.icon || '📄'}</div>
                                                <div>
                                                    <h4 className="text-2xl font-black text-gradient">{policy.type}</h4>
                                                    <p className="text-sm font-medium text-slate-400 mt-1">{policy.company} • {policy.policyNumber}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`text-xs font-bold px-4 py-2 rounded-xl ${policy.status === 'פעיל' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{policy.status}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="bg-linear-to-br from-slate-50 to-indigo-50/30 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">פרמיה</p>
                                                <p className="text-2xl font-black text-gradient">{policy.premium}</p>
                                            </div>
                                            <div className="bg-linear-to-br from-slate-50 to-purple-50/30 p-4 rounded-2xl border border-slate-100 hover:border-purple-200 transition-all">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">כיסוי</p>
                                                <p className="text-2xl font-black text-gradient">{policy.coverage}</p>
                                            </div>
                                            <div className="bg-linear-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">תחולה</p>
                                                <p className="text-sm font-bold text-primary">{policy.startDate}</p>
                                            </div>
                                            <div className="bg-linear-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">חידוש</p>
                                                <p className="text-sm font-bold text-primary">{policy.renewalDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {client.policies.length === 0 && (
                                <div className="text-center py-16 text-slate-400">
                                    <div className="text-6xl mb-4 opacity-50">📋</div>
                                    <p className="text-lg font-medium">אין פוליסות</p>
                                    <p className="text-sm mt-1">לחץ על "הוסף פוליסה" להוספת פוליסה חדשה</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Tab Content: Documents --- */}
                {activeTab === "מסמכים" && (
                    <DocumentsTab 
                        documents={client.documents || []}
                        onUpload={handleUploadDocument}
                        onDelete={handleDeleteDocument}
                        onUpdateDocument={(docId, updates) => {
                            const updatedDocs = client.documents.map(doc => 
                                doc.id === docId ? { ...doc, ...updates } : doc
                            );
                            saveData("documents", updatedDocs);
                            toast.success("המסמך עודכן בהצלחה");
                        }}
                    />
                )}
                {/* --- Tab Content: Communication --- */}
                {activeTab === "תקשורת" && (
                    <div className="space-y-6 animate-in fade-in duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Input Area */}
                            <div className="lg:col-span-1 space-y-4">
                                <Card className="border-none shadow-xl bg-white p-6">
                                    <h4 className="font-black text-primary text-lg mb-4">תיעוד אינטרקציה חדשה</h4>

                                    <div className="flex gap-2 mb-3">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            disabled={!isSpeechSupported || isVoiceSummarizing}
                                            onClick={() => {
                                                if (!isSpeechSupported) return;
                                                if (isSpeechListening) {
                                                    setSummarizeOnStop(true);
                                                    stopSpeech();
                                                } else {
                                                    resetSpeech();
                                                    startSpeech();
                                                }
                                            }}
                                            className="rounded-xl"
                                        >
                                            {isSpeechListening ? "עצור והפק תיעוד" : "הקלט סיכום"}
                                        </Button>

                                        {isVoiceSummarizing ? <div className="flex items-center text-xs font-bold text-indigo-600">
                                                יוצר תיעוד...
                                            </div> : null}
                                    </div>

                                    {!isSpeechSupported && (
                                        <p className="text-[11px] text-slate-500 mb-2">הקלטה קולית זמינה בדפדפני Chrome/Edge.</p>
                                    )}
                                    {speechError ? <p className="text-[11px] text-red-600 mb-2">שגיאת הקלטה: {speechError}</p> : null}

                                    <textarea
                                        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[150px] font-medium outline-none focus:border-indigo-500 transition-all"
                                        placeholder="כתוב סיכום שיחה, פגישה או הודעה..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                     />
                                    <div className="flex gap-2 mt-4">
                                        <Button onClick={handleSaveNote} className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-black shadow-lg hover:bg-indigo-700 transition-all">
                                            <Save size={16} className="ml-2" /> שמור תיעוד
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-4 text-center">התיעוד ישמר בציר הזמן ויהיה גלוי לכל הצוות</p>
                                </Card>
                            </div>

                            {/* Timeline */}
                            <div className="lg:col-span-2 space-y-6">
                                <h4 className="font-black text-primary text-xl px-2">היסטוריית התקשרויות</h4>
                                <div className="space-y-4 relative before:absolute before:right-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                    {client.interactions && client.interactions.length > 0 ? (
                                        client.interactions.map((interaction) => (
                                            <Card key={interaction.id} className="border-none shadow-md bg-white p-5 relative z-10 mr-4">
                                                <div className="absolute right-[-29px] top-6 h-6 w-6 rounded-full bg-white border-4 border-indigo-100 z-20" />
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${interaction.type === 'whatsapp' ? 'bg-green-100 text-green-600' :
                                                        interaction.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-indigo-100 text-indigo-600'
                                                        }`}>
                                                        {interaction.type === 'whatsapp' ? '💬' : interaction.type === 'email' ? '✉️' : '📞'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-xs font-black text-slate-400 block mb-1">{interaction.date} • {interaction.direction === 'inbound' ? 'נכנס' : 'יוצא'}</span>
                                                                <h5 className="font-bold text-primary text-sm">{interaction.summary}</h5>
                                                            </div>
                                                            <Badge variant="outline" className={
                                                                interaction.sentiment === 'positive' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                    interaction.sentiment === 'negative' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                        'bg-slate-50 text-slate-500 border-slate-100'
                                                            }>
                                                                {interaction.sentiment === 'positive' ? 'חיובי' : interaction.sentiment === 'negative' ? 'שלילי' : 'ניטרלי'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50 font-black italic">אין תיעוד במערכת</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Tab Content: Har HaBituach --- */}
                {activeTab === "הר הביטוח" && (
                    <div className="space-y-6 animate-in fade-in duration-700">
                        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <div>
                                <h4 className="font-black text-primary text-xl">ייבוא נתונים מהר הביטוח</h4>
                                <p className="text-sm text-slate-500 mt-1">העלה דוח מסלקה או הר הביטוח (Excel/PDF) כדי לזהות כפל ביטוחי והזדמנויות.</p>
                            </div>
                            <div className="w-1/3">
                                {isAnalyzing ? (
                                    <div className="flex items-center justify-center h-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-xs font-bold text-indigo-600">מפענח...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <FileUpload onUpload={handleUploadHarHabituach} label="גרור דוח לכאן" />
                                )}
                            </div>
                        </div>

                        {client.externalPolicies && client.externalPolicies.length > 0 ? <Card className="border-none shadow-xl bg-white p-8">
                                <h4 className="font-black text-primary text-xl mb-6">פוליסות חיצוניות שאותרו</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead>
                                            <tr className="text-xs text-slate-400 border-b border-slate-100">
                                                <th className="pb-3 pr-2">חברה</th>
                                                <th className="pb-3">סוג מוצר</th>
                                                <th className="pb-3">פרמיה שנתית</th>
                                                <th className="pb-3">תום תקופה</th>
                                                <th className="pb-3">סטטוס</th>
                                                <th className="pb-3 pl-2">פעולות</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50 text-sm font-bold text-slate-600">
                                            {client.externalPolicies.map((policy) => (
                                                <tr key={policy.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 pr-2">{policy.company}</td>
                                                    <td className="py-4">{policy.productType}</td>
                                                    <td className="py-4 font-mono text-slate-800">{policy.premium}</td>
                                                    <td className="py-4">{new Date(policy.endDate).toLocaleDateString("he-IL")}</td>
                                                    <td className="py-4"><Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">{policy.status}</Badge></td>
                                                    <td className="py-4 pl-2 flex items-center gap-2">
                                                        <Button onClick={() => handleImportLead(policy)} size="sm" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200">
                                                            + צור ליד
                                                        </Button>
                                                        <button onClick={() => handleDeleteExternalPolicy(policy.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="מחק">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card> : null}

                        {(!client.externalPolicies || client.externalPolicies.length === 0) && (
                            <div className="text-center py-20 opacity-40">
                                <div className="text-6xl mb-4">🏔️</div>
                                <h3 className="text-xl font-black text-slate-400">טרם הועלו נתונים</h3>
                            </div>
                        )}
                    </div>
                )}
                {/* --- Tab Content: AI Insights --- */}
                {activeTab === "תובנות AI" && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {!client.aiInsights && (
                            <div className="text-center py-20 bg-white rounded-3xl shadow-xl">
                                <div className="text-6xl mb-6">🧠</div>
                                <h3 className="text-2xl font-black text-primary mb-2">המערכת מוכנה לנתח את התיק</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">האלגוריתם יסרוק את כל הפוליסות, הנתונים הפיננסיים והמסמכים כדי לאתר חוסרים, הזדמנויות וחיסכון כספי.</p>
                                <Button
                                    onClick={handleGenerateAIInsights}
                                    disabled={isGeneratingInsights}
                                    className="bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl px-10 py-6 font-black shadow-lg text-lg hover:shadow-2xl transition-all"
                                >
                                    {isGeneratingInsights ? "מנתח נתונים..." : "✨ הרץ ניתוח AI מלא"}
                                </Button>
                            </div>
                        )}

                        {client.aiInsights ? <div className="space-y-8">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <Card className="border-none shadow-xl bg-red-50 p-6 border-t-4 border-red-400">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl">🛡️</div>
                                            <h4 className="font-black text-red-900 text-lg">פערי כיסוי (Gaps)</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.gaps.map((gap: any, i: number) => (
                                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                                                    <h5 className="font-bold text-red-800 text-sm mb-1">{gap.title}</h5>
                                                    <p className="text-xs text-slate-500">{gap.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-xl bg-emerald-50 p-6 border-t-4 border-emerald-400">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">💰</div>
                                            <h4 className="font-black text-emerald-900 text-lg">פוטנציאל חיסכון</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.savings.map((saving: any, i: number) => (
                                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 text-right">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h5 className="font-bold text-emerald-800 text-sm">{saving.title}</h5>
                                                        <Badge className="bg-emerald-100 text-emerald-700 font-mono">{saving.amount}</Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-500">{saving.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="border-none shadow-xl bg-purple-50 p-6 border-t-4 border-purple-400">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xl">🚀</div>
                                            <h4 className="font-black text-purple-900 text-lg">הזדמנויות צמיחה</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.opportunities.map((opp: any, i: number) => (
                                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                                                    <h5 className="font-bold text-purple-800 text-sm mb-1">{opp.title}</h5>
                                                    <p className="text-xs text-slate-500">{opp.description}</p>
                                                    <Button size="sm" className="w-full mt-3 bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200 text-xs font-bold">צור קשר עם הלקוח</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                                <div className="text-center">
                                    <Button onClick={handleGenerateAIInsights} variant="ghost" className="text-slate-400 hover:text-indigo-600 text-xs">🔄 רענן ניתוח</Button>
                                </div>
                            </div> : null}
                    </div>
                )}
                {activeTab === "פיננסי" && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {/* Financial Overview Cards using derived data */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-none shadow-xl bg-linear-to-br from-slate-900 to-slate-800 text-white p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">💰</div>
                                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-black">+2.5%</span>
                                </div>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">סך פרמיות חודשי</p>
                                <h3 className="text-3xl font-black font-mono">
                                    ₪{client.policies.reduce((acc, curr) => acc + (parseFloat(String(curr.premium || '').replace(/[^\d.-]/g, '')) || 0), 0) +
                                        client.insuranceSales.reduce((acc, curr) => acc + (parseFloat(String(curr.premium || '').replace(/[^\d.-]/g, '')) || 0), 0) +
                                        client.pensionSales.reduce((acc, curr) => acc + (parseFloat(String(curr.managementFeeDeposit || '').replace(/[^\d.-]/g, '')) || 0), 0) // Naive estimate for pension
                                    }
                                </h3>
                            </Card>

                            <Card className="border-none shadow-xl bg-white p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">🛡️</div>
                                    <span className="text-slate-300 text-xs font-bold">כיסוי כולל</span>
                                </div>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">שווי תיק ביטוחי</p>
                                <h3 className="text-3xl font-black text-primary font-mono">
                                    ₪{client.policies.reduce((acc, curr) => acc + (parseFloat(String(curr.coverage || '').replace(/[^\d.-]/g, '')) || 0), 0).toLocaleString()}
                                </h3>
                            </Card>

                            <Card className="border-none shadow-xl bg-white p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">📊</div>
                                    <span className="text-slate-300 text-xs font-bold">{client.policies.length + client.pensionSales.length + client.insuranceSales.length} מוצרים</span>
                                </div>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">חלוקת תיק</p>
                                <div className="flex h-2 rounded-full overflow-hidden gap-1 mt-3">
                                    <div className="bg-emerald-500" style={{ width: '40%' }} />
                                    <div className="bg-blue-500" style={{ width: '35%' }} />
                                    <div className="bg-purple-500" style={{ width: '25%' }} />
                                </div>
                            </Card>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            <Card className="border-none shadow-xl bg-white p-8">
                                <h4 className="text-xl font-black text-primary mb-6">התפלגות פרמיות</h4>
                                <div className="space-y-4">
                                    {[...client.policies, ...client.insuranceSales].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-fuchsia-500'}`} />
                                                <span className="font-bold text-slate-600 text-sm">{(item as any).type || (item as any).productType} - {(item as any).company}</span>
                                            </div>
                                            <span className="font-black text-primary font-mono group-hover:text-accent transition-colors">{item.premium}</span>
                                        </div>
                                    ))}
                                    {client.policies.length === 0 && client.insuranceSales.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm">אין נתונים להצגה</p>
                                    )}
                                </div>
                            </Card>

                            <Card className="border-none shadow-xl bg-white p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-8 -mt-8 z-0" />
                                <h4 className="text-xl font-black text-primary mb-6 relative z-10">הזדמנויות עסקיות</h4>
                                <div className="space-y-3 relative z-10">
                                    {client.pensionSales.length === 0 && (
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
                                            <div className="text-2xl">⚠️</div>
                                            <div>
                                                <h5 className="font-black text-red-800 text-sm">חסר מוצר פנסיוני</h5>
                                                <p className="text-xs text-red-600/80">ללקוח אין קופת גמל או קרן פנסיה פעילה</p>
                                            </div>
                                            <Button onClick={() => setActiveTab("לביצוע מכירה")} size="sm" className="mr-auto bg-white text-red-600 border border-red-200 hover:bg-red-50">טפל</Button>
                                        </div>
                                    )}
                                    {!client.policies.some(p => p.type.includes("בריאות")) && (
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                            <div className="text-2xl">🏥</div>
                                            <div>
                                                <h5 className="font-black text-emerald-800 text-sm">הזדמנות לביטוחי בריאות</h5>
                                                <p className="text-xs text-emerald-600/80">מומלץ להציע ביטוח משלים או פרטי</p>
                                            </div>
                                            <Button onClick={() => setActiveTab("לביצוע מכירה")} size="sm" className="mr-auto bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50">הצע</Button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="text-2xl">👨‍👩‍👧‍👦</div>
                                        <div>
                                            <h5 className="font-black text-slate-800 text-sm">ביטוח למשפחה</h5>
                                            <p className="text-xs text-slate-500">בדוק אפשרות לצירוף בני משפחה לפוליסות קיימות</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div >
                )
                }

                {/* --- Tab Content: Tasks --- */}
                {
                    activeTab === "משימות" && (
                        <div className="space-y-8 animate-in fade-in duration-700">
                            <div className="flex justify-between items-center">
                                <h4 className="font-black text-primary text-xl italic">משימות פתוחות</h4>
                                <Button onClick={() => handleEdit("task")} className="bg-slate-900 text-white rounded-xl shadow-lg px-6 font-black text-xs">+ משימה חדשה</Button>
                            </div>
                            <div className="space-y-4">
                                {clientTasks.map((task) => {
                                    const priorityLabel = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' }[task.priority as string] || 'בינונית';
                                    const statusLabel = { pending: 'ממתינה', overdue: 'באיחור', completed: 'הושלמה', transferred: 'הועבר' }[task.status as string] || 'ממתינה';

                                    return (
                                        <Card key={task.id} className="border-none shadow-lg bg-white p-6 hover:shadow-xl transition-all relative group">
                                            <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button onClick={() => handleEdit("task", { ...task, priority: priorityLabel, status: statusLabel, dueDate: task.date })} className="text-slate-300 hover:text-indigo-600"><Edit2 size={16} /></button>
                                                <button onClick={() => deleteItem("tasks", task.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-3 w-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-green-400'}`} />
                                                <div>
                                                    <h5 className="font-black text-primary">{task.title}</h5>
                                                    <div className="flex gap-3 mt-2 text-xs text-slate-400 font-bold">
                                                        <span>📅 {task.date || task.dueDate}</span>
                                                        <span className="bg-slate-100 px-2 rounded text-slate-600">{statusLabel}</span>
                                                        <span>👤 {task.assignee}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                                {clientTasks.length === 0 && <div className="text-center py-10 opacity-50 font-black italic">אין משימות פתוחות</div>}
                            </div>
                        </div>
                    )
                }

                {/* --- Unified Edit Modal --- */}
                {editMode && (
                    <NeonModal
                        isOpen={!!editMode}
                        onClose={() => setEditMode(null)}
                        title={
                            editMode.type === 'family' ? '👥 עריכת בן משפחה' :
                            editMode.type === 'policy' ? '📄 פרטי פוליסה' :
                            editMode.type === 'task' ? '📅 ניהול משימה' :
                            editMode.type === 'clientDetails' ? '👤 פרטים מזהים' :
                            '📝 עריכת נוספים'
                        }
                        onSave={handleSaveModal}
                        saveLabel="שמור שינויים"
                        maxWidth="max-w-2xl"
                    >
                        {/* Family Member Edit */}
                        {editMode.type === 'family' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NeonInput label="שם מלא" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                                <NeonInput label="קרבה" value={formData.relation || ''} onChange={e => setFormData({...formData, relation: e.target.value})} />
                                <NeonInput label="גיל" type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} />
                                <NeonSelect label="מבוטח?" value={formData.insured ? 'כן' : 'לא'} onChange={e => setFormData({...formData, insured: e.target.value === 'כן'})}>
                                    <option value="לא">לא</option>
                                    <option value="כן">כן</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Task Edit */}
                        {editMode.type === 'task' && (
                            <div className="space-y-6">
                                <NeonInput label="נושא המשימה" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonInput label="תאריך יעד" type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                    <NeonSelect label="עדיפות" value={formData.priority || 'בינונית'} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                        <option value="נמוכה">נמוכה</option>
                                        <option value="בינונית">בינונית</option>
                                        <option value="גבוהה">גבוהה</option>
                                    </NeonSelect>
                                </div>
                                <NeonSelect label="סטטוס" value={formData.status || 'ממתינה'} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option value="ממתינה">ממתינה</option>
                                    <option value="בתהליך">בתהליך</option>
                                    <option value="הושלמה">הושלמה</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Policy Edit */}
                        {editMode.type === 'policy' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NeonInput label="סוג מוצר" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} />
                                <NeonInput label="חברה" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} />
                                <NeonInput label="מספר פוליסה" value={formData.id || ''} readOnly />
                                <NeonInput label="פרמיה חודשית" value={formData.premium || ''} onChange={e => setFormData({...formData, premium: e.target.value})} />
                                <NeonInput label="סכום כיסוי" value={formData.coverage || ''} onChange={e => setFormData({...formData, coverage: e.target.value})} />
                                <NeonInput label="תאריך סיום" type="date" value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                            </div>
                        )}

                        {/* Client Details Edit */}
                        {editMode.type === 'clientDetails' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NeonInput label="מספר זהות" value={formData.idNumber || ''} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                                <NeonInput label="תאריך לידה" type="date" value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                                <NeonInput label="תאריך הנפקת ת.ז" type="date" value={formData.idIssueDate || ''} onChange={e => setFormData({...formData, idIssueDate: e.target.value})} />
                                <NeonSelect label="האם מעשן" value={formData.isSmoker ? 'כן' : 'לא'} onChange={e => setFormData({...formData, isSmoker: e.target.value === 'כן'})}>
                                    <option value="לא">לא</option>
                                    <option value="כן">כן</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Additional Details Edit */}
                        {editMode.type === 'additionalDetails' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonSelect label="קופת חולים" value={formData.healthFund || ''} onChange={e => setFormData({...formData, healthFund: e.target.value})}>
                                        <option value="">בחר...</option>
                                        <option value="כללית">כללית</option>
                                        <option value="מכבי">מכבי</option>
                                        <option value="מאוחדת">מאוחדת</option>
                                        <option value="לאומית">לאומית</option>
                                    </NeonSelect>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonSelect label="תנאי תשלום" value={formData.paymentTerms || ''} onChange={e => setFormData({...formData, paymentTerms: e.target.value})}>
                                        <option value="">בחר...</option>
                                        <option value="העברה">העברה</option>
                                        <option value="אשראי">אשראי</option>
                                        <option value="הוראת קבע">הוראת קבע</option>
                                    </NeonSelect>
                                    <NeonInput label="דואר אלקטרוני" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                                
                                <NeonInput 
                                    label="חיפוש לקוח מקושר" 
                                    placeholder="חפש לפי שם או ת.ז..." 
                                    value={clientSearchQuery} 
                                    onChange={e => setClientSearchQuery(e.target.value)} 
                                />
                                
                                {clientSearchQuery && filteredClients.length > 0 && (
                                    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                                        {filteredClients.slice(0, 5).map(c => (
                                            <button 
                                                key={c.id} 
                                                onClick={() => {
                                                    setFormData({ ...formData, linkedClientId: c.id, linkedClientName: c.name });
                                                    setClientSearchQuery('');
                                                }}
                                                className="w-full text-right px-6 py-3 hover:bg-slate-800 border-b border-slate-800 last:border-b-0 text-white font-bold text-sm"
                                            >
                                                {c.name} <span className="text-slate-500 text-xs mr-2">{c.idNumber}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {formData.linkedClientName && (
                                    <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-6 py-3 rounded-2xl">
                                        <span className="text-amber-400 font-bold">מקושר ל: {formData.linkedClientName}</span>
                                        <button onClick={() => setFormData({ ...formData, linkedClientId: undefined, linkedClientName: undefined })} className="text-red-400 hover:text-red-500">✕</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </NeonModal>
                )}

                {/* --- Market Analysis Modal --- */}
                {
                    showMarketModal ? <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
                            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl rounded-3xl border-none">
                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 font-display">
                                                <span className="text-4xl">🤖</span> ניתוח שוק והשוואת תשואות
                                            </h2>
                                            <p className="text-slate-500 font-medium mt-1">האלגוריתם סורק את ביצועי הקרנות המובילות במסלול S&P 500</p>
                                        </div>
                                        <button onClick={() => setShowMarketModal(false)} className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xl">✕</button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Sources */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">מקורות מידע חיצוניים</h4>
                                            <a href="https://www.mygemel.net/%D7%A7%D7%A8%D7%A0%D7%95%D7%AA-%D7%94%D7%A9%D7%AA%D7%9C%D7%9E%D7%95%D7%AA" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-all group">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg group-hover:scale-110 transition-transform">📈</div>
                                                <div>
                                                    <div className="font-black text-slate-700 group-hover:text-emerald-700">MyGemel</div>
                                                    <div className="text-xs text-slate-400">השוואת קרנות השתלמות</div>
                                                </div>
                                            </a>
                                            <a href="https://pensyanet.cma.gov.il/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all group">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg group-hover:scale-110 transition-transform">🏛️</div>
                                                <div>
                                                    <div className="font-black text-slate-700 group-hover:text-blue-700">פנסיה-נט</div>
                                                    <div className="text-xs text-slate-400">מערכת משרד האוצר</div>
                                                </div>
                                            </a>
                                            <a href="https://big.hcsra.co.il/graph/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-200 transition-all group">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg group-hover:scale-110 transition-transform">📊</div>
                                                <div>
                                                    <div className="font-black text-slate-700 group-hover:text-purple-700">ביטוח-נט (Big)</div>
                                                    <div className="text-xs text-slate-400">גרפים וניתוח ביטוח</div>
                                                </div>
                                            </a>
                                        </div>

                                        {/* Comparison Table */}
                                        <div className="lg:col-span-2 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">השוואת מסלולי S&P 500 (תשואה מצטברת)</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-right">
                                                    <thead>
                                                        <tr className="text-xs text-slate-400 border-b border-slate-200">
                                                            <th className="pb-3 pr-2">שם הקרן</th>
                                                            <th className="pb-3">מתחילת שנה</th>
                                                            <th className="pb-3">3 שנים</th>
                                                            <th className="pb-3">5 שנים</th>
                                                            <th className="pb-3">דמי ניהול ממוצע</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200/50 text-sm font-bold text-slate-600">
                                                        {[
                                                            { name: "אלטשולר שחם S&P 500", ytd: "18.4%", y3: "42.1%", y5: "76.5%", fee: "0.7%" },
                                                            { name: "הפניקס S&P 500", ytd: "17.9%", y3: "40.8%", y5: "74.2%", fee: "0.65%" },
                                                            { name: "מיטב S&P 500", ytd: "18.1%", y3: "41.5%", y5: "75.1%", fee: "0.68%" },
                                                            { name: "מנורה מבטחים S&P 500", ytd: "17.6%", y3: "39.9%", y5: "73.0%", fee: "0.62%" },
                                                            { name: "הראל S&P 500", ytd: "17.8%", y3: "40.3%", y5: "73.8%", fee: "0.65%" },
                                                        ].map((fund, i) => (
                                                            <tr key={i} className="group hover:bg-white transition-colors">
                                                                <td className="py-4 pr-2 font-black text-slate-700">{fund.name}</td>
                                                                <td className="py-4 text-emerald-600 ltr">{fund.ytd}</td>
                                                                <td className="py-4 text-emerald-600 ltr">{fund.y3}</td>
                                                                <td className="py-4 text-emerald-600 ltr">{fund.y5}</td>
                                                                <td className="py-4 text-slate-400 ltr">{fund.fee}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-start gap-3">
                                                <span className="text-xl">💡</span>
                                                <p className="text-xs text-yellow-800 leading-relaxed font-bold">
                                                    המלצת המערכת: אלטשולר שחם ומיטב מציגים את הביצועים העקביים ביותר לאורך זמן במסלול זה.
                                                    עם זאת, שים לב לדמי הניהול - ניתן לרוב להשיג הנחה של 0.1-0.2% במיקוח.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div> : null
                }
                {/* --- Referral Modal --- */}
                {
                    showReferralModal ? <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative text-center">
                                <button onClick={() => setShowReferralModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={20} /></button>
                                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-6">
                                    <Share2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">לאן תרצה להפנות את הלקוח?</h3>
                                <p className="text-sm text-slate-500 font-medium mb-8">המערכת תשלח מייל אוטומטי עם פרטי הלקוח לגורם הרלוונטי.</p>

                                <div className="space-y-3">
                                    {[
                                        { label: "ביטוח אלמנטרי", icon: "🚗" },
                                        { label: "החזרי מס", icon: "💰" },
                                        { label: "תכנון פרישה", icon: "📈" },
                                        { label: "כתב שירות תלפיות", icon: "📄" }
                                    ].map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => handleReferral(option.label)}
                                            className="w-full p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-between group"
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-indigo-700">{option.label}</span>
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{option.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div> : null
                }
            </div>
        </DashboardShell>
    );
}

// --- Documents Tab Component ---
function DocumentsTab({ 
    documents, 
    onUpload, 
    onDelete,
    onUpdateDocument 
}: { 
    documents: ClientDocument[];
    onUpload: (file: File, metadata?: { documentType?: string; producer?: string; documentName?: string }) => void;
    onDelete: (id: string) => void;
    onUpdateDocument: (id: string, updates: Partial<ClientDocument>) => void;
}) {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadFormData, setUploadFormData] = useState({
        documentName: '',
        documentType: 'אישי' as ClientDocument['documentType'],
        producer: '' as ClientDocument['producer'] | '',
    });
    // const [editingDoc, setEditingDoc] = useState<string | null>(null);

    const DOCUMENT_TYPES = ['אישי', 'רפואי', 'ביטוחי', 'פנסיוני'];
    const PRODUCERS = ['הפניקס', 'כלל', 'מגדל', 'מנורה', 'איילון', 'הכשרה', 'מור', 'אלטשולר', 'מיטב דש', 'אחר'];
    const STATUSES = ['נשמר', 'נשלח לחברה', 'תקין', 'התקבל חלקית'];

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setUploadFormData(prev => ({ ...prev, documentName: file.name.replace(/\.[^/.]+$/, '') }));
        setShowUploadForm(true);
    };

    const handleUploadSubmit = () => {
        if (!selectedFile) return;
        onUpload(selectedFile, {
            documentName: uploadFormData.documentName,
            documentType: uploadFormData.documentType,
            producer: uploadFormData.producer || undefined,
        });
        setShowUploadForm(false);
        setSelectedFile(null);
        setUploadFormData({ documentName: '', documentType: 'אישי', producer: '' });
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'נשמר': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'נשלח לחברה': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'תקין': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'התקבל חלקית': return 'bg-orange-100 text-orange-600 border-orange-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getDocTypeColor = (type?: string) => {
        switch (type) {
            case 'אישי': return 'bg-blue-100 text-blue-600';
            case 'רפואי': return 'bg-red-100 text-red-600';
            case 'ביטוחי': return 'bg-purple-100 text-purple-600';
            case 'פנסיוני': return 'bg-green-100 text-green-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Upload Area */}
            <Card className="border-none shadow-xl bg-white p-8">
                <FileUpload
                    onUpload={handleFileSelect}
                    label="גרור מסמכים לכאן (ת.ז, פוליסות, טפסים)"
                />
            </Card>

            {/* Upload Form Modal */}
            {showUploadForm && selectedFile ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900">📄 פרטי המסמך</h3>
                            <button onClick={() => { setShowUploadForm(false); setSelectedFile(null); }} className="p-2 rounded-xl hover:bg-slate-100">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Document Name */}
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 block">שם המסמך *</label>
                                <input
                                    type="text"
                                    value={uploadFormData.documentName}
                                    onChange={e => setUploadFormData(prev => ({ ...prev, documentName: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="שם המסמך"
                                />
                            </div>

                            {/* Document Type */}
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 block">סוג מסמך *</label>
                                <select
                                    value={uploadFormData.documentType}
                                    onChange={e => setUploadFormData(prev => ({ ...prev, documentType: e.target.value as any }))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {DOCUMENT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Producer */}
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 block">יצרן</label>
                                <select
                                    value={uploadFormData.producer}
                                    onChange={e => setUploadFormData(prev => ({ ...prev, producer: e.target.value as any }))}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">בחר יצרן (אופציונלי)</option>
                                    {PRODUCERS.map(producer => (
                                        <option key={producer} value={producer}>{producer}</option>
                                    ))}
                                </select>
                            </div>

                            {/* File Info */}
                            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{selectedFile.name}</p>
                                    <p className="text-xs text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button 
                                variant="ghost" 
                                onClick={() => { setShowUploadForm(false); setSelectedFile(null); }}
                                className="flex-1"
                            >
                                ביטול
                            </Button>
                            <Button 
                                onClick={handleUploadSubmit}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                            >
                                <Upload size={16} className="ml-2" />
                                העלה מסמך
                            </Button>
                        </div>
                    </Card>
                </div> : null}

            {/* Documents List */}
            <div className="grid gap-4">
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <Card key={doc.id} className="border-none shadow-md bg-white p-5 group hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-primary text-base mb-2">{doc.name}</h4>
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {doc.documentType ? <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getDocTypeColor(doc.documentType)}`}>
                                                    {doc.documentType}
                                                </span> : null}
                                            {doc.producer ? <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                                                    🏢 {doc.producer}
                                                </span> : null}
                                            {doc.status ? <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(doc.status)}`}>
                                                    {doc.status}
                                                </span> : null}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-bold">
                                            <span>📅 {doc.date}</span>
                                            <span>💾 {doc.size}</span>
                                            {doc.uploadedBy ? <span>👤 {doc.uploadedBy}</span> : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Edit Status */}
                                    <select
                                        value={doc.status || 'נשמר'}
                                        onChange={(e) => onUpdateDocument(doc.id, { status: e.target.value as any })}
                                        className="h-9 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        title="עדכן סטטוס"
                                    >
                                        {STATUSES.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <a
                                        href={doc.url}
                                        download={doc.name}
                                        className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 flex items-center justify-center transition-all"
                                        title="הורד"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => onDelete(doc.id)}
                                        className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 flex items-center justify-center transition-all"
                                        title="מחק"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-16 opacity-40">
                        <div className="text-6xl mb-4">📁</div>
                        <p className="font-black text-slate-400 text-lg">אין מסמכים עדיין</p>
                        <p className="text-slate-400 text-sm mt-2">גרור קבצים לאזור למעלה להעלאה</p>
                    </div>
                )}
            </div>
        </div>
    );
}
