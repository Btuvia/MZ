'use client';

import {
    Edit2,
    Copy,
    Save,
    Trash2,
    Plus,
    X,
    Upload,
    Share2,
    Send,
    FileText,
    Download,
    Mail,
    Link2,
    ArrowLeft,
    ArrowRight,
    Database,
    Star,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { createClientAndSendCredentials } from '@/app/actions/client-credentials';
import { sendEmail } from '@/app/actions/email';
import { generateWithGemini } from '@/app/actions/gemini';
import LifecycleTracker from '@/components/client/LifecycleTracker';
import { ClientQuickActions } from '@/components/clients/ClientQuickActions';
import { Card, Button, Badge } from '@/components/ui/base';
import DashboardShell from '@/components/ui/dashboard-shell';
import { FileUpload } from '@/components/ui/file-upload';
import { NeonModal, NeonInput, NeonSelect, NeonCard, NeonButton } from '@/components/ui/neon-form';
import { analyzeInsuranceDocument } from '@/lib/ai/ai-service';
import { useAuth } from '@/lib/contexts/AuthContext';
import { firestoreService } from '@/lib/firebase/firestore-service';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { ADMIN_NAV_ITEMS } from '@/lib/navigation-config';
import { InsuranceComparisonWizard } from '@/components/clients/InsuranceComparisonWizard';
import { PensionAnalysisWizard } from '@/components/clients/PensionAnalysisWizard';
import { insuranceReportService } from '@/lib/services/insurance-report-service';
import { InsuranceImportModal } from '@/components/clients/InsuranceImportModal';
import { ImportedPolicy } from '@/lib/services/insurance-import-service';
import { GoldenShieldRiskAnalyzer } from '@/components/clients/GoldenShieldRiskAnalyzer';
import { CancellationLetterModal } from '@/components/clients/CancellationLetterModal';
import { getClientRating, getRatingColor } from '@/lib/client-utils';

// --- Types & Interfaces ---

type ClientDocument = {
    id: string;
    name: string; // שם המסמך
    type: string; // סוג קובץ (PDF/IMG)
    documentType?: 'אישי' | 'רפואי' | 'ביטוחי' | 'פנסיוני'; // סוג מסמך
    producer?:
        | 'הפניקס'
        | 'כלל'
        | 'מגדל'
        | 'מנורה'
        | 'איילון'
        | 'הכשרה'
        | 'מור'
        | 'אלטשולר'
        | 'מיטב דש'
        | 'אחר'; // יצרן
    url: string;
    date: string; // מועד יצירה (אוטומטי)
    size: string;
    uploadedBy?: string; // הועלה על ידי (אוטומטי)
    status?: 'נשמר' | 'נשלח לחברה' | 'תקין' | 'התקבל חלקית'; // סטטוס
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
    status: 'פעיל' | 'לא פעיל' | 'בתהליך' | 'נמכר';
    color?: string;
    icon?: string;
    // New fields
    documentUrl?: string; // קובץ הפוליסה
    documentName?: string; // שם הקובץ
    showInClientPortal?: boolean; // האם להציג באיזור האישי של הלקוח
};

type Task = {
    id: string;
    title: string;
    priority: string;
    dueDate?: string;
    date?: string;
    status: string;
    assignee?: string;
    assignedTo?: string;
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
    productName:
        | 'פלטינום בריאות'
        | 'פלטינום פרמיום'
        | 'רופא עד הבית'
        | 'פלטינום רפואה משלימה'
        | 'פלטינום דנטל';
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
    opportunities: any[];
    gaps: any[];
    savings: any[];
};

// טבלת מחירי פלטינום לפי גיל
const PLATINUM_PRICING: Record<string, Record<string, number>> = {
    'פלטינום בריאות': {
        '0-17': 43,
        '18-29': 76,
        '30-39': 102,
        '40-49': 132,
        '50-54': 162,
        '55-59': 210,
        '60-64': 278,
        '65-69': 395,
        '70-74': 511,
        '75+': 676,
    },
    'פלטינום פרמיום': {
        '0-17': 63,
        '18-29': 105,
        '30-39': 138,
        '40-49': 179,
        '50-54': 226,
        '55-59': 294,
        '60-64': 388,
        '65-69': 544,
        '70-74': 703,
        '75+': 930,
    },
    'רופא עד הבית': {
        '0-17': 25,
        '18-29': 35,
        '30-39': 45,
        '40-49': 55,
        '50-54': 65,
        '55-59': 80,
        '60-64': 100,
        '65-69': 130,
        '70-74': 165,
        '75+': 210,
    },
    'פלטינום רפואה משלימה': {
        '0-17': 30,
        '18-29': 45,
        '30-39': 60,
        '40-49': 75,
        '50-54': 95,
        '55-59': 115,
        '60-64': 140,
        '65-69': 175,
        '70-74': 220,
        '75+': 280,
    },
    'פלטינום דנטל': {
        '0-17': 38,
        '18-29': 52,
        '30-39': 68,
        '40-49': 85,
        '50-54': 105,
        '55-59': 130,
        '60-64': 160,
        '65-69': 200,
        '70-74': 250,
        '75+': 320,
    },
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
    const nifraaimRate = isDental ? 0.3 : 0.45;
    const monthlyCommission = monthlyPremium * nifraaimRate;

    return {
        oneTimeCommission,
        monthlyCommission,
        nifraaimRate: nifraaimRate * 100,
    };
};

type ClientData = {
    id: string;
    name: string;
    // סוג זיהוי ומספר
    idType: 'תעודת זהות' | 'דרכון';
    idNumber: string;
    // שדות נוספים לדרכון
    passportCountry?: string; // מדינת הנפקה
    passportExpiry?: string; // תוקף דרכון
    phone: string;
    email: string;
    status: 'פעיל' | 'לא פעיל' | 'נמכר';
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
    birthDate?: string; // תאריך לידה
    hasInsuranceReport?: boolean; // האם קיים העתק הר ביטוח
    // שדות חדשים - פרטים על הלקוח
    healthFund?: 'לאומית' | 'כללית' | 'מכבי' | 'מאוחדת'; // קופת חולים
    isSmoker?: boolean; // האם מעשן
    paymentTerms?: 'העברה' | 'אשראי' | 'הוראת קבע'; // תנאי תשלום
    idIssueDate?: string; // תאריך הנפקה תעודת זהות
    linkedClientId?: string; // קשור ללקוח אחר בסוכנות
    linkedClientName?: string; // שם הלקוח המקושר
    salesRepresentative?: string; // נציג מכירה
    // שדות הפניה משיתוף פעולה
    referralSource?: string; // מזהה שיתוף הפעולה
    referralName?: string; // שם המפנה
    referralCode?: string; // קוד ההפניה
    referralNotes?: string; // הערות מהמפנה
    // פרמיה שנסגרה (לחישוב עמלות שיתוף פעולה)
    closedPremium?: number;
    closedCompany?: string;
    elementaryInsurances: ElementaryInsurance[];
};

// --- Initial Data (Mock) ---

const INITIAL_CLIENT: ClientData = {
    id: 'active',
    name: 'שרה אולט בסמוט',
    idType: 'תעודת זהות',
    idNumber: '329919617',
    phone: '0534261094',
    email: 'sarabismot@gmail.com',
    status: 'פעיל',
    salesStatus: 'new_lead',
    opsStatus: 'sent_to_company',
    address: { city: 'תל אביב', street: 'הרצל', num: '1' },
    employment: { status: 'שכיר', occupation: 'מנהלת שיווק' },
    family: [
        {
            id: '1',
            name: 'דני אולט',
            relation: 'בן זוג',
            age: 40,
            idNumber: '123456789',
            insured: true,
        },
        {
            id: '2',
            name: 'נועה אולט',
            relation: 'ילדה',
            age: 12,
            idNumber: '987654321',
            insured: false,
        },
    ],
    policies: [
        {
            id: '1',
            type: 'פנסיה',
            company: 'הראל',
            policyNumber: 'PEN-2023-45678',
            premium: '₪850',
            coverage: '₪280,000',
            startDate: '2020-03-15',
            renewalDate: '2025-03-15',
            status: 'פעיל',
            color: 'from-blue-600 to-indigo-700',
            icon: '👨‍👩‍👧‍👦',
        },
        {
            id: '2',
            type: 'ביטוח בריאות',
            company: 'מגדל',
            policyNumber: 'HLT-2023-12345',
            premium: '₪420',
            coverage: 'כיסוי מלא',
            startDate: '2021-06-01',
            renewalDate: '2025-06-01',
            status: 'פעיל',
            color: 'from-emerald-600 to-teal-700',
            icon: '🏥',
        },
    ],
    tasks: [
        {
            id: '1',
            title: 'שליחת הצעת ביטוח חיים',
            priority: 'גבוהה',
            dueDate: '2024-02-20',
            status: 'ממתינה',
            assignee: 'רועי כהן',
        },
    ],
    pensionSales: [],
    insuranceSales: [],
    platinumSales: [], // מכירות כתב שירות פלטינום
    platinumPayment: undefined, // פרטי תשלום לפלטינום

    documents: [],
    interactions: [
        {
            id: '1',
            type: 'call',
            direction: 'inbound',
            date: '2024-02-15 10:30',
            summary: 'הלקוחה התקשרה לשאול לגבי כיסוי ניתוחים בחו״ל בפוליסת הבריאות',
            sentiment: 'neutral',
        },
        {
            id: '2',
            type: 'whatsapp',
            direction: 'outbound',
            date: '2024-02-14 14:00',
            summary: 'נשלחה תזכורת לחידוש ביטוח רכב',
            sentiment: 'positive',
        },
    ],
    externalPolicies: [],
    elementaryInsurances: [],
};

export default function ClientDetailsPage() {
    const params = useParams();
    const clientId = (params.id as string) || 'active';
    const { user } = useAuth(); // Get current user for agent name
    const [activeTab, setActiveTab] = useState('מבט על'); // שינוי ברירת מחדל לסיכום

    // Main Persisted State
    const [client, setClient] = useState<ClientData>(INITIAL_CLIENT);
    const [loading, setLoading] = useState(true);
    const [clientTasks, setClientTasks] = useState<Task[]>([]); // New state for global tasks
    const [allClients, setAllClients] = useState<ClientData[]>([]); // לחיפוש לקוח מקושר
    const [clientSearchQuery, setClientSearchQuery] = useState('');

    const totalPremium = useMemo(() => {
        return client.policies.reduce((sum, p) => {
            const val = parseInt(p.premium.replace(/[^\d]/g, '')) || 0;
            return sum + val;
        }, 0);
    }, [client.policies]);

    const clientRating = useMemo(() => {
        if (totalPremium > 600) return { label: 'A+', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', shadow: 'shadow-fuchsia-500/20' };
        if (totalPremium > 300) return { label: 'A', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' };
        if (totalPremium > 100) return { label: 'B', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' };
        return { label: 'C', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', shadow: 'shadow-slate-500/20' };
    }, [totalPremium]);

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
    const [platinumPaymentForm, setPlatinumPaymentForm] = useState<Partial<PlatinumPaymentDetails>>(
        {}
    );
    const [isSubmittingPlatinum, setIsSubmittingPlatinum] = useState(false);
    const [showPlatinumSelect, setShowPlatinumSelect] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showMarketModal, setShowMarketModal] = useState(false);
    const [showComparisonWizard, setShowComparisonWizard] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showCancellationModal, setShowCancellationModal] = useState(false);

    // Elementary Form State
    const [elementaryForm, setElementaryForm] = useState<Partial<ElementaryInsurance>>({
        category: 'רכב',
        type: 'חובה ומקיף',
        insurer: 'כלל',
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            .toISOString()
            .split('T')[0],
        premium: 0,
        status: 'פעיל',
    });

    // --- Persistence ---
    useEffect(() => {
        const loadClient = async () => {
            if (clientId === 'new') {
                setClient({
                    ...INITIAL_CLIENT,
                    id: '',
                    name: 'לקוח חדש',
                    salesRepresentative: 'נציג נוכחי',
                }); // נציג מכירה אוטומטי
                setLoading(false);
                return;
            }

            try {
                const data = await firestoreService.getClient(clientId);
                if (data) {
                    // Map Firestore data to local ClientData type
                    const mappedClient = {
                        ...INITIAL_CLIENT,
                        ...data,
                        idNumber: (data as any).idNumber || (data as any).nationalId || INITIAL_CLIENT.idNumber,
                        elementaryInsurances: (data as any).elementaryInsurances || INITIAL_CLIENT.elementaryInsurances || []
                    } as unknown as ClientData;
                    setClient(mappedClient);
                } else if (clientId === 'active') {
                    setClient(INITIAL_CLIENT);
                }

                // Load tasks from global collection
                const tasks = await firestoreService.getTasksForClient(clientId);
                setClientTasks(tasks as any);

                // Load all clients for linking feature
                const clients = await firestoreService.getClients();
                setAllClients(clients.map(c => ({
                    ...INITIAL_CLIENT,
                    ...c,
                    idNumber: c.idNumber || c.nationalId || '',
                    elementaryInsurances: (c as any).elementaryInsurances || []
                })) as unknown as ClientData[]);
            } catch (error) {
                console.error('Failed to load client', error);
            } finally {
                setLoading(false);
            }
        };
        loadClient();
    }, [clientId]);

    const handleSaveComparisonReport = async (report: any) => {
        if (!client) return;

        const newInteraction: Interaction = {
            id: Date.now().toString(),
            type: 'whatsapp',
            direction: 'outbound',
            date: new Date().toLocaleString('he-IL'),
            summary: `הופק דוח השוואת ביטוח: ${report.comparison[0].company} (חיסכון של ₪${report.comparison[0].savings})`,
            sentiment: 'positive',
        };

        const updatedInteractions = [newInteraction, ...(client.interactions || [])];
        await saveData('interactions', updatedInteractions);
        toast.success('הדוח נשמר בהיסטוריית הלקוח');
    };

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
        if (client.id && client.id !== 'new' && client.id !== 'active') {
            await firestoreService.updateClient(client.id, { [key]: data });
        }
    };

    const triggerPolicyAutomations = async (policy: Policy) => {
        if (!client.email) return;

        // 1. Welcome Email (Trigger: status === 'נמכר')
        if (policy.status === 'נמכר') {
            const welcomeHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px; background-color: #f9fafb;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
                        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900;">ברוכים הבאים! 🛡️</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p style="font-size: 20px; color: #1f2937; font-weight: bold;">שלום ${client.name},</p>
                            <p style="font-size: 18px; line-height: 1.8; color: #4b5563;">
                                אנחנו כל כך מתרגשים ושמחים שהחלטת להצטרף למשפחת סוכנות הביטוח שלנו! 
                                עבורנו, אתה לא רק לקוח - אתה חלק מהמשפחה. אנחנו מבטיחים להיות כאן עבורך בכל רגע, 
                                עם המקצועיות, השירות והחיוך שתמיד מאפיינים אותנו.
                            </p>
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="font-size: 14px; color: #9ca3af; text-align: center;">נשמח לעמוד לשירותך בכל עת,</p>
                                <p style="font-size: 18px; color: #4f46e5; font-weight: 900; text-align: center;">צוות מגן זהב</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            try {
                await sendEmail({
                    to: client.email,
                    subject: `מרגש! הצטרפת למשפחת מגן זהב 🛡️`,
                    html: welcomeHtml
                });
                toast.success('נשלח מייל Welcome מרגש ללקוח!');
            } catch (err) {
                console.error('Failed to send welcome email', err);
            }
        }

        // 2. Issuance/Referral Reward (Trigger: status === 'פעיל')
        if (policy.status === 'פעיל') {
            const referralHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px; background-color: #fdf2f8;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 2px solid #ec4899;">
                        <div style="background-color: #ec4899; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900;">🎁 הטבה מיוחדת רק בשבילך!</h1>
                        </div>
                        <div style="padding: 40px;">
                            <p style="font-size: 18px; color: #1f2937;">היי ${client.name}, הפוליסה שלך הופקה בהצלחה! 🎉</p>
                            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">
                                כחלק מהחודש הראשון שלך איתנו, החלטנו לפנק אותך בהטבה מטורפת על הפניית לקוחות:
                            </p>
                            <ul style="list-style: none; padding: 0; margin: 20px 0;">
                                <li style="padding: 15px; background: #f9fafb; border-radius: 12px; margin-bottom: 10px; border-right: 4px solid #ec4899;">
                                    🤝 <strong>100 ש"ח BUYME</strong> על כל לקוח שתפנה ויסגור איתנו.
                                </li>
                                <li style="padding: 15px; background: #fdf2f8; border-radius: 12px; margin-bottom: 10px; border-right: 4px solid #ec4899;">
                                    💎 <strong>150 ש"ח BUYME</strong> אם הפרמיה של הלקוח המופנה מעל 350 ש"ח.
                                </li>
                                <li style="padding: 15px; background: #fce7f3; border-radius: 12px; margin-bottom: 10px; border-right: 4px solid #ec4899;">
                                    👑 <strong>200 ש"ח BUYME</strong> אם הפרמיה של הלקוח המופנה מעל 500 ש"ח.
                                </li>
                            </ul>
                            <p style="font-weight: bold; color: #db2777; text-align: center; margin-top: 20px;">
                                פשוט תעבירו לנו את הפרטים שלהם ואנחנו נדאג לכל השאר!
                            </p>
                        </div>
                    </div>
                </div>
            `;
            try {
                await sendEmail({
                    to: client.email,
                    subject: `הטבה בלעדית: מקבלים BUYME על כל חבר שמצטרף! 🎁`,
                    html: referralHtml
                });
                toast.success('נשלח מייל הטבת חבר-מביא-חבר!');
            } catch (err) {
                console.error('Failed to send referral email', err);
            }
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
                const clientPortalUrl =
                    typeof window !== 'undefined'
                        ? `${window.location.origin}/client`
                        : 'http://localhost:3000/client';

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
                        html: welcomeEmailHtml,
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
                idIssueDate: client.idIssueDate,
            });
        } else if (type === 'additionalDetails') {
            setFormData({
                healthFund: client.healthFund,
                isSmoker: client.isSmoker,
                paymentTerms: client.paymentTerms,
                email: client.email,
                linkedClientId: client.linkedClientId,
                linkedClientName: client.linkedClientName,
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
            if (type === 'family') {
                const list = [...client.family];
                if (formData.id) {
                    const idx = list.findIndex((i) => i.id === formData.id);
                    if (idx > -1) list[idx] = formData;
                } else {
                    list.push({ ...formData, id: Date.now().toString() });
                }
                await saveData('family', list);
                toast.success('פרטי משפחה עודכנו');
            } else if (type === 'policy') {
                const list = [...client.policies];
                if (formData.id) {
                    const idx = list.findIndex((i) => i.id === formData.id);
                    if (idx > -1) list[idx] = formData;
                } else {
                    list.push({
                        ...formData,
                        id: Date.now().toString(),
                        color: 'from-slate-500 to-slate-700',
                        icon: '📄',
                    });
                }
                await saveData('policies', list);
                
                // Trigger automation
                if (formData.id) {
                    const oldPolicy = client.policies.find(p => p.id === formData.id);
                    if (oldPolicy?.status !== formData.status) {
                        triggerPolicyAutomations(formData as Policy);
                    }
                } else {
                    triggerPolicyAutomations(formData as Policy);
                }

                toast.success('פוליסה עודכנה בהצלחה');
            } else if (type === 'task') {
                const priorityMap: any = { נמוכה: 'low', בינונית: 'medium', גבוהה: 'high' };
                const statusMap: any = {
                    ממתינה: 'pending',
                    בתהליך: 'pending',
                    הושלמה: 'completed',
                };

                const taskData = {
                    title: formData.title,
                    priority: priorityMap[formData.priority] || 'medium',
                    date: formData.dueDate,
                    time: '10:00',
                    type: 'task' as const,
                    status: (statusMap[formData.status] || 'pending') as any,
                    client: client.name,
                    clientId: client.id,
                    assignee: formData.assignee || 'admin',
                };

                // Only call Firestore if NOT in demo/active mode
                if (client.id && client.id !== 'active' && client.id !== 'new') {
                    if (formData.id) {
                        await firestoreService.updateTask(formData.id, taskData as any);
                        setClientTasks((prev) =>
                            prev.map((t) => (t.id === formData.id ? { ...t, ...taskData } : t))
                        );
                    } else {
                        const newId = await firestoreService.addTask(taskData as any);
                        setClientTasks((prev) => [...prev, { ...taskData, id: newId }]);
                    }
                } else {
                    // Demo mode: Update locally only
                    const mockId = formData.id || `mock-${Date.now()}`;
                    if (formData.id) {
                        setClientTasks((prev) =>
                            prev.map((t) => (t.id === formData.id ? { ...t, ...taskData } : t))
                        );
                    } else {
                        setClientTasks((prev) => [...prev, { ...taskData, id: mockId }]);
                    }
                }
                toast.success('משימה עודכנה במערכת');
            } else if (type === 'personal') {
                // Personal details update
                const updatedClient = { ...client, ...formData };
                setClient(updatedClient);

                // Check if status changed to "נמכר"
                if (formData.status === 'נמכר' && client.status !== 'נמכר') {
                    handleSoldClientAutomation(formData);
                }

                // Sync with Firestore
                if (client.id && client.id !== 'new' && client.id !== 'active') {
                    await firestoreService.updateClient(client.id, formData);
                }
                toast.success('פרטי לקוח עודכנו');
            } else if (type === 'clientDetails') {
                // עדכון פרטי לקוח בסיסיים
                const updatedData = {
                    idNumber: formData.idNumber,
                    birthDate: formData.birthDate,
                    idIssueDate: formData.idIssueDate,
                    isSmoker: formData.isSmoker,
                };
                const updatedClient = { ...client, ...updatedData };
                setClient(updatedClient);

                if (client.id && client.id !== 'new' && client.id !== 'active') {
                    await firestoreService.updateClient(client.id, updatedData);
                }
                toast.success('פרטי לקוח עודכנו בהצלחה');
            } else if (type === 'additionalDetails') {
                // עדכון פרטים נוספים על הלקוח
                const updatedData = {
                    healthFund: formData.healthFund,
                    paymentTerms: formData.paymentTerms,
                    email: formData.email,
                    linkedClientId: formData.linkedClientId,
                    linkedClientName: formData.linkedClientName,
                };
                const updatedClient = { ...client, ...updatedData };
                setClient(updatedClient);

                if (client.id && client.id !== 'new' && client.id !== 'active') {
                    await firestoreService.updateClient(client.id, updatedData);
                }
                toast.success('פרטים נוספים עודכנו בהצלחה');
            }

            setEditMode(null);
        } catch (error: any) {
            console.error('Error saving modal data:', error);
            toast.error(`שגיאה בשמירת הנתונים: ${error.message || 'בדוק חיבור ל-Firebase'}`);
            // Still close modal to allow user to continue in UI, or keep open if critical
            setEditMode(null);
        }
    };

    const handleSoldClientAutomation = async (data: any) => {
        if (!data.email) {
            toast.error('לא ניתן ליצור משתמש ללא אימייל');
            return;
        }

        try {
            toast.loading('יוצר חשבון ושולח פרטי התחברות...', { id: 'client-automation' });

            // Use the secure server action to create client credentials
            const result = await createClientAndSendCredentials({
                clientId: client.id,
                clientEmail: data.email,
                clientName: data.name || client.name,
                agentName: user?.displayName || undefined,
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
            console.error('שגיאה ביצירת חשבון ללקוח:', error);
            toast.error(`שגיאה בתקשורת: ${error.message || 'נסה שוב'}`, {
                id: 'client-automation',
            });
        }
    };

    const deleteItem = async (
        key:
            | 'family'
            | 'policies'
            | 'tasks'
            | 'pensionSales'
            | 'insuranceSales'
            | 'platinumSales'
            | 'elementaryInsurances',
        id: string
    ) => {
        if (confirm('האם למחוק פריט זה?')) {
            if (key === 'tasks') {
                await firestoreService.deleteTask(id);
                setClientTasks((prev) => prev.filter((t) => t.id !== id));
            } else {
                const updatedList = (client[key] as any[]).filter((i: any) => i.id !== id);
                setClient((prev) => ({ ...prev, [key]: updatedList }));

                if (client.id && client.id !== 'new' && client.id !== 'active') {
                    await firestoreService.updateClient(client.id, { [key]: updatedList });
                }
            }
        }
    };

    // --- Sales Logic ---
    const handleAddPension = () => {
        if (!pensionForm.type || !pensionForm.company) return alert('נא מלא את שדות החובה');

        const newProduct: PensionProduct = {
            id: Date.now().toString(),
            type: pensionForm.type!,
            company: pensionForm.company!,
            planName: pensionForm.planName || '',
            managementFeeAccumulation: pensionForm.managementFeeAccumulation
                ? `${pensionForm.managementFeeAccumulation}%`
                : '',
            managementFeeDeposit: pensionForm.managementFeeDeposit
                ? `${pensionForm.managementFeeDeposit}%`
                : '',
            joinDate: pensionForm.joinDate || '',
            fundNumber: pensionForm.fundNumber || '',
            avgSalary: pensionForm.avgSalary || '',
        };

        saveData('pensionSales', [...client.pensionSales, newProduct]);
        setPensionForm({}); // Reset form
    };

    const handleAddInsurance = () => {
        if (!insuranceForm.company || !insuranceForm.productType)
            return alert('נא מלא את שדות החובה');

        const newProduct: InsuranceProduct = {
            id: Date.now().toString(),
            company: insuranceForm.company!,
            isPlatinum: showPlatinumSelect,
            platinumProducts: insuranceForm.platinumProducts || [],
            productType: insuranceForm.productType!,
            amount: insuranceForm.amount || '',
            hasLien: insuranceForm.hasLien || false,
            premium: insuranceForm.premium || '',
            numInsured: insuranceForm.numInsured || 1,
        };

        saveData('insuranceSales', [...client.insuranceSales, newProduct]);
        setInsuranceForm({});
        setShowPlatinumSelect(false);
    };

    // === Platinum Sales Logic ===
    const handleAddPlatinum = () => {
        if (
            !platinumForm.productName ||
            !platinumForm.clientAge ||
            !platinumForm.discount ||
            !platinumForm.monthlyPremium
        ) {
            toast.error('נא מלא את כל השדות');
            return;
        }

        // בדיקה שהנחה לדנטל לא עולה על 10%
        if (platinumForm.productName === 'פלטינום דנטל' && platinumForm.discount > 10) {
            toast.error('הנחה מקסימלית לפלטינום דנטל היא 10%');
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
            status: 'ממתין להפקה', // ממתין עד שילחצו על "הפק מוצרי פלטינום"
        };

        // חישוב עמלות
        const commission = calculatePlatinumCommission(newSale);

        // שמירה ללקוח
        saveData('platinumSales', [...(client.platinumSales || []), newSale]);

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
        const pendingProducts = (client.platinumSales || []).filter(
            (s) => s.status === 'ממתין להפקה'
        );

        if (pendingProducts.length === 0) {
            toast.error('אין מוצרים להפקה');
            return;
        }

        // בדיקת פרטי תשלום
        if (!platinumPaymentForm.paymentMethod) {
            toast.error('נא למלא פרטי תשלום');
            return;
        }

        if (platinumPaymentForm.paymentMethod === 'אשראי') {
            if (!platinumPaymentForm.creditCardNumber || !platinumPaymentForm.creditCardExpiry) {
                toast.error('נא למלא פרטי כרטיס אשראי');
                return;
            }
        } else {
            if (
                !platinumPaymentForm.bankAccountNumber ||
                !platinumPaymentForm.bankBranch ||
                !platinumPaymentForm.bankName
            ) {
                toast.error('נא למלא פרטי הוראת קבע');
                return;
            }
        }

        if (!platinumPaymentForm.billingDay) {
            toast.error('נא לבחור יום גבייה');
            return;
        }

        setIsSubmittingPlatinum(true);

        try {
            // חישוב סה"כ
            const totalMonthly = pendingProducts.reduce((sum, p) => sum + p.monthlyPremium, 0);
            // const totalOneTime = pendingProducts.reduce((sum, p) => sum + (p.monthlyPremium * 3), 0);

            // הכנת תוכן המייל
            const productsHtml = pendingProducts
                .map(
                    (p) => `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.productName}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${p.discount}%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">₪${p.monthlyPremium}</td>
                </tr>
            `
                )
                .join('');

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
                        ${
                            client.idType === 'דרכון'
                                ? `
                        <tr><td style="padding: 8px; font-weight: bold;">מדינת הנפקה:</td><td>${client.passportCountry || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תוקף דרכון:</td><td>${client.passportExpiry || '-'}</td></tr>
                        `
                                : ''
                        }
                        <tr><td style="padding: 8px; font-weight: bold;">אימייל:</td><td>${client.email}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">טלפון:</td><td>${client.phone}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תאריך לידה:</td><td>${client.birthDate || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">כתובת:</td><td>${client.address.street} ${client.address.num}, ${client.address.city}</td></tr>
                    </table>

                    <h2 style="color: #2563eb; border-bottom: 2px solid #ffd700; padding-bottom: 10px;">פרטי תשלום</h2>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 8px; font-weight: bold;">אמצעי תשלום:</td><td>${platinumPaymentForm.paymentMethod}</td></tr>
                        ${
                            platinumPaymentForm.paymentMethod === 'אשראי'
                                ? `
                        <tr><td style="padding: 8px; font-weight: bold;">מספר כרטיס:</td><td>****${platinumPaymentForm.creditCardNumber?.slice(-4)}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">תוקף:</td><td>${platinumPaymentForm.creditCardExpiry}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">ת.ז. בעל הכרטיס:</td><td>${platinumPaymentForm.creditCardPayerIdNumber || '-'}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">טלפון בעל הכרטיס:</td><td>${platinumPaymentForm.creditCardPayerPhone || '-'}</td></tr>
                        `
                                : `
                        <tr><td style="padding: 8px; font-weight: bold;">בנק:</td><td>${platinumPaymentForm.bankName}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">סניף:</td><td>${platinumPaymentForm.bankBranch}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">מספר חשבון:</td><td>${platinumPaymentForm.bankAccountNumber}</td></tr>
                        <tr><td style="padding: 8px; font-weight: bold;">סוג חשבון:</td><td>${platinumPaymentForm.accountType || 'עו"ש'}</td></tr>
                        `
                        }
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
                html: emailHtml,
            });

            if (emailResult.success) {
                // עדכון סטטוס כל המוצרים ל"נשלח לפלטינום"
                const updatedSales = (client.platinumSales || []).map((sale) =>
                    sale.status === 'ממתין להפקה'
                        ? { ...sale, status: 'נשלח לפלטינום' as const }
                        : sale
                );

                // שמירת פרטי התשלום
                saveData('platinumSales', updatedSales);
                saveData('platinumPayment', platinumPaymentForm);

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
        const isElementary = type === 'ביטוח אלמנטרי';
        const recipient = isElementary ? 'office@tlp-ins.co.il' : 'hafnayot@tlp-ins.co.il';
        const cc = 'btuvia6580@gmail.com';
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
                setAiInsight(
                    JSON.parse(
                        res.text
                            .replace(/```json/g, '')
                            .replace(/```/g, '')
                            .trim()
                    )
                );
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAi(false);
        }
    }, [client]);

    useEffect(() => {
        if (activeTab === 'תובנות AI' && !aiInsight) fetchAiInsights();
    }, [activeTab, aiInsight, fetchAiInsights]);

    const handleUploadDocument = async (
        file: File,
        metadata?: { documentType?: string; producer?: string; documentName?: string }
    ) => {
        // Mock upload - in real app would upload to Storage and get URL
        const now = new Date();
        const newDoc: ClientDocument = {
            id: Date.now().toString(),
            name: metadata?.documentName || file.name,
            type: file.type.includes('pdf') ? 'PDF' : 'IMG',
            documentType: (metadata?.documentType as ClientDocument['documentType']) || 'אישי',
            producer: (metadata?.producer as ClientDocument['producer']) || undefined,
            url: URL.createObjectURL(file), // Temporary local URL for demo
            date: now.toLocaleString('he-IL'),
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadedBy: 'מנהל מערכת', // TODO: Get from auth context
            status: 'נשמר',
        };

        const updatedDocs = [...(client.documents || []), newDoc];
        saveData('documents', updatedDocs);
        toast.success('המסמך הועלה בהצלחה');
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('האם למחוק מסמך זה?')) return;
        const updatedDocs = client.documents.filter((d) => d.id !== docId);
        saveData('documents', updatedDocs);
    };

    const handleDeleteExternalPolicy = async (policyId: string) => {
        if (!confirm('האם למחוק פוליסה חיצונית זו?')) return;
        const updatedPolicies = (client.externalPolicies || []).filter((p) => p.id !== policyId);
        saveData('externalPolicies', updatedPolicies);
        toast.success('הפוליסה הוסרה בהצלחה');
    };

    const [newNote, setNewNote] = useState('');
    const [isVoiceSummarizing, setIsVoiceSummarizing] = useState(false);
    const [summarizeOnStop, setSummarizeOnStop] = useState(false);
    const {
        isSupported: isSpeechSupported,
        isListening: isSpeechListening,
        transcript: speechTranscript,
        error: speechError,
        start: startSpeech,
        stop: stopSpeech,
        reset: resetSpeech,
    } = useSpeechRecognition({ lang: 'he-IL' });

    useEffect(() => {
        if (isSpeechListening) return;
        if (!summarizeOnStop) return;

        setSummarizeOnStop(false);
        const text = speechTranscript.trim();
        resetSpeech();
        if (!text) {
            toast.error('לא זוהה טקסט מההקלטה');
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
Date: ${new Date().toLocaleString('he-IL')}

Transcript:
${clipped}`;

                const result = await generateWithGemini(prompt);
                if (result.error) {
                    toast.error(`שגיאת AI: ${result.error}`);
                    return;
                }
                const noteText = (result.text || '').trim();
                if (!noteText) {
                    toast.error('לא התקבל תיעוד מה-AI');
                    return;
                }

                setNewNote(noteText);
                toast.success('התיעוד נוצר והוזן לשדה. אפשר לערוך ולשמור.');
            } catch {
                toast.error('שגיאה ביצירת תיעוד מההקלטה');
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
            date: new Date().toLocaleString('he-IL'),
            summary: newNote,
            sentiment: 'neutral',
        };
        const updated = [note, ...(client.interactions || [])];
        saveData('interactions', updated);
        setNewNote('');
    };

    const handleUploadHarHabituach = async (file: File) => {
        setIsAnalyzing(true);
        try {
            toast.info('מפענח דוח... אנא תמתין מספר שניות');
            const result = await analyzeInsuranceDocument(file);

            if (result && result.policies.length > 0) {
                const newPolicies: ExternalPolicy[] = result.policies.map(
                    (p: any, idx: number) => ({
                        id: Date.now().toString() + idx,
                        company: p.company,
                        productType: p.type,
                        premium: `₪${p.premium}`,
                        endDate: p.expirationDate,
                        status: 'פעיל',
                    })
                );

                saveData('externalPolicies', [...(client.externalPolicies || []), ...newPolicies]);
                // סימון אוטומטי שיש דוח הר הביטוח
                saveData('hasInsuranceReport', true);
                toast.success(`הקובץ פוענח בהצלחה! אותרו ${newPolicies.length} פוליסות.`);
            } else {
                // גם אם לא נמצאו פוליסות, הקובץ הועלה
                saveData('hasInsuranceReport', true);
                toast.error('לא נמצאו פוליסות בדוח או שהפענוח נכשל.');
            }
        } catch (e) {
            console.error(e);
            toast.error('שגיאה בפענוח הקובץ');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImportLead = (policy: ExternalPolicy) => {
        // Create a new task for this lead
        const taskData = {
            title: `ליד חדש: ${policy.productType} - ${policy.company}`,
            priority: 'high' as const,
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending' as const,
            type: 'task' as const,
            clientName: client.name,
            description: `פרמיה נוכחית: ${policy.premium}, מסתיים ב: ${policy.endDate}`,
        };

        firestoreService.addTask(taskData as any).then(() => {
            toast.success(`נוצר ליד חדש עבור פוליסת ${policy.productType}`);
        });
    };

    const handleImportComplete = async (importedPolicies: ImportedPolicy[]) => {
        const mappedPolicies: Policy[] = importedPolicies.map((p) => ({
            id: Math.random().toString(36).substr(2, 9),
            type: p.type,
            company: p.company,
            policyNumber: p.policyNumber,
            premium: `₪${p.premium.toLocaleString()}`,
            coverage: 'מידע ייובא',
            startDate: p.startDate || new Date().toISOString().split('T')[0],
            renewalDate: '',
            status: p.status === 'פעיל' ? 'פעיל' : 'לא פעיל',
            color: 'from-slate-600 to-slate-800',
            icon: '📄',
        }));

        const updatedPolicies = [...client.policies, ...mappedPolicies];
        await saveData('policies', updatedPolicies);
    };

    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const handleGenerateAIInsights = async () => {
        setIsGeneratingInsights(true);
        // Simulate AI delay
        setTimeout(() => {
            const mockInsights = {
                gaps: [
                    {
                        title: 'חוסר בביטוח מחלות קשות',
                        description:
                            'ללקוח אין כיסוי למחלות קשות. בהתחשב בגיל (40), מומלץ להציע כיסוי בסיסי.',
                        severity: 'high',
                    },
                    {
                        title: 'תמיל פנסיוני לא אופטימלי',
                        description: 'דמי הניהול בקרן הפנסיה (0.7%) גבוהים מהממוצע בשוק (0.2%).',
                        severity: 'medium',
                    },
                ],
                savings: [
                    {
                        title: 'הוזלת דמי ניהול',
                        amount: '₪4,500',
                        description: 'צפי חיסכון ל-5 שנים ע"י ניוד קרן השתלמות.',
                    },
                    {
                        title: 'ביטול כפל ביטוח תאונות',
                        amount: '₪720',
                        description: 'קיים כפל ביטוחי עם הפוליסה הקבוצתית.',
                    },
                ],
                opportunities: [
                    {
                        title: 'פתיחת חיסכון לילד',
                        description:
                            'הילדה נועה הגיעה לגיל 12 - זמן טוב לפתוח חיסכון לבר מצווה/לימודים.',
                    },
                    {
                        title: 'ביטוח נסיעות לחו"ל',
                        description: 'הלקוח טס בממוצע 3 פעמים בשנה. שקול להציע פספורט כארד שנתי.',
                    },
                ],
            };
            saveData('aiInsights', mockInsights);
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
    const filteredClients = allClients.filter(
        (c) =>
            c.id !== client.id &&
            (c.name?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                c.idNumber?.includes(clientSearchQuery))
    );

    const tabs = [
        'מבט על',
        'סטטוס',
        'לביצוע מכירת פרט',
        'אלמנטרי',
        'פוליסות',
        'מסמכים',
        'תקשורת',
        'פיננסי',
        'תובנות AI',
    ];

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="animate-fade-in-up space-y-8" dir="rtl">
                {/* Header - Neon Premium Design */}
                <div className="group animate-in fade-in zoom-in relative duration-700">
                    <div className="absolute inset-0 rounded-[2.5rem] bg-linear-to-r from-blue-600/30 via-indigo-600/30 to-amber-500/30 opacity-50 blur-3xl transition-opacity duration-700 group-hover:opacity-75" />
                    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-[#0d1326] p-10 text-white shadow-2xl">
                        {/* Glowing Decorative Orbs */}
                        <div className="absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-amber-500/10 blur-[100px]" />
                        <div className="animate-float absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]" />

                        {/* Edit Button */}
                        <button
                            onClick={() =>
                                handleEdit('personal', {
                                    name: client.name,
                                    phone: client.phone,
                                    email: client.email,
                                    status: client.status,
                                    idNumber: client.idNumber,
                                })
                            }
                            className="absolute top-8 left-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-3 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:rotate-3 hover:border-amber-500/50 hover:bg-amber-500/20"
                        >
                            <Edit2 size={18} className="text-amber-400" />
                        </button>

                        <div className="relative z-10">
                            {/* Top Row: Name and Main Actions */}
                            <div className="mb-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
                                <div className="flex w-full items-center gap-8 text-right lg:w-auto">
                                    <div className="group/avatar relative">
                                        <div className="absolute inset-0 rounded-[2.5rem] bg-linear-to-br from-amber-400 to-amber-600 blur-md transition-all duration-500 group-hover/avatar:blur-xl" />
                                        <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] border-2 border-amber-500/30 bg-linear-to-br from-slate-900 to-[#1e293b] text-5xl font-black text-amber-400 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105">
                                            {client.name.substring(0, 2)}
                                        </div>
                                        <div className="absolute -right-2 -bottom-2 h-6 w-6 rounded-full border-4 border-[#0d1326] bg-emerald-500 shadow-lg" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <h1 className="font-display text-4xl leading-none font-black tracking-tight text-white italic drop-shadow-2xl md:text-6xl">
                                                {client.name.split(' ')[0]}{' '}
                                                <span className="text-amber-500">
                                                    {client.name.split(' ').slice(1).join(' ')}
                                                </span>
                                            </h1>
                                            <div
                                                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 font-black italic shadow-2xl transition-all duration-500 hover:scale-110 ${clientRating.border} ${clientRating.bg} ${clientRating.color} ${clientRating.shadow}`}
                                            >
                                                <Star size={20} fill="currentColor" className="animate-pulse" />
                                                <span className="text-2xl uppercase">
                                                    דירוג {clientRating.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {client.salesStatus === 'closed_won' ? (
                                                <Badge className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-[10px] font-black text-emerald-400 uppercase">
                                                    ✓ פעיל
                                                </Badge>
                                            ) : (
                                                <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 px-4 py-1 text-[10px] font-black text-amber-400 uppercase">
                                                    ◉ ליד
                                                </Badge>
                                            )}
                                            {!!client.opsUnlocked && (
                                                <Badge className="animate-pulse rounded-full border-blue-500/30 bg-blue-500/10 px-4 py-1 text-[10px] font-black text-blue-400 uppercase">
                                                    ⚡ תפעול פתוח
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col items-center gap-4 sm:flex-row lg:w-auto">
                                    <ClientQuickActions
                                        clientId={client.id}
                                        clientName={client.name}
                                        phone={client.phone}
                                        email={client.email}
                                        variant="horizontal"
                                    />
                                    <button
                                        onClick={() => setShowReferralModal(true)}
                                        className="group/btn flex items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-indigo-500 to-indigo-600 px-8 py-4 text-sm font-black text-white italic shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                                    >
                                        <Share2 size={18} />
                                        הפנייה מהירה
                                    </button>
                                </div>
                            </div>

                            {/* Middle Row: Identity 3-Column Grid */}
                            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="group/info rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-amber-500/30">
                                    <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{' '}
                                        מספר זהות
                                    </p>
                                    <p className="text-xl font-black text-white transition-colors group-hover/info:text-amber-500">
                                        {client.idNumber}
                                    </p>
                                </div>
                                <div className="group/info rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-amber-500/30">
                                    <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />{' '}
                                        דואר אלקטרוני
                                    </p>
                                    <p className="truncate text-xl font-black text-white transition-colors group-hover/info:text-indigo-400">
                                        {client.email}
                                    </p>
                                </div>
                                <div className="group/info rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-amber-500/30">
                                    <p className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
                                        טלפון נייד
                                    </p>
                                    <p className="text-xl font-black text-white transition-colors group-hover/info:text-emerald-400">
                                        {client.phone}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Row: Status Bar */}
                            <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-slate-400">
                                            עדכון אחרון: {client.interactions?.[0]?.date || 'היום'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400">
                                            סטטוס:
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full border-amber-500/30 px-3 py-0.5 text-[10px] font-black text-amber-500"
                                        >
                                            {client.status}
                                        </Badge>
                                    </div>
                                </div>

                                {!!client.referralName && (
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2 text-xs font-black text-indigo-300">
                                        🤝 שותף: {client.referralName}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Neon Pill Design */}
                <div className="scrollbar-none no-scrollbar flex items-center gap-3 overflow-x-auto px-2 pb-4">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`group/tab relative overflow-hidden rounded-2xl px-8 py-3.5 text-[11px] font-black whitespace-nowrap transition-all duration-300 ${
                                activeTab === tab
                                    ? 'scale-105 bg-amber-500 text-black italic shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                    : 'border border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                            }`}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {activeTab === tab && (
                                <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover/tab:translate-x-full" />
                            )}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- Tab Content: Summary --- */}
                {activeTab === 'מבט על' && (
                    <div className="stagger-children space-y-10">
                        {/* Key Financial Cards */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            {/* Premiums Card */}
                            <NeonCard className="group overflow-hidden p-0!">
                                <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                                <div className="p-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-3xl transition-transform group-hover:scale-110">
                                            💰
                                        </div>
                                        <Badge className="border-none bg-emerald-500/10 text-emerald-400">
                                            +2.5%
                                        </Badge>
                                    </div>
                                    <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                        סך פרמיות חודשי
                                    </p>
                                    <h3 className="font-display text-4xl font-black text-amber-500 italic">
                                        ₪
                                        {(
                                            client.policies.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.premium || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            ) +
                                            client.insuranceSales.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.premium || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            ) +
                                            client.pensionSales.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(
                                                            curr.managementFeeDeposit || ''
                                                        ).replace(/[^\d.-]/g, '')
                                                    ) || 0),
                                                0
                                            )
                                        ).toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            {/* Portfolio Value */}
                            <NeonCard className="group overflow-hidden !p-0">
                                <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
                                <div className="p-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-3xl transition-transform group-hover:scale-110">
                                            🛡️
                                        </div>
                                        <Badge className="border-none bg-blue-500/10 text-blue-400">
                                            כיסוי כולל
                                        </Badge>
                                    </div>
                                    <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                        שווי תיק ביטוחי
                                    </p>
                                    <h3 className="font-display text-4xl font-black text-white italic">
                                        ₪
                                        {client.policies
                                            .reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.coverage || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            )
                                            .toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            {/* Portfolio Split */}
                            <NeonCard className="group overflow-hidden p-0!">
                                <div className="p-8">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-3xl transition-transform group-hover:scale-110">
                                            📊
                                        </div>
                                        <Badge className="border-none bg-purple-500/10 text-purple-400">
                                            {client.policies.length +
                                                client.pensionSales.length +
                                                client.insuranceSales.length}{' '}
                                            מוצרים
                                        </Badge>
                                    </div>
                                    <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                        חלוקת הון בסיכון
                                    </p>
                                    <div className="mt-4 flex h-3 gap-1.5 overflow-hidden rounded-full bg-slate-800 p-0.5 shadow-inner">
                                        <div
                                            className="animate-pulse rounded-full bg-amber-500"
                                            style={{ width: '40%' }}
                                        />
                                        <div
                                            className="rounded-full bg-blue-500"
                                            style={{ width: '35%' }}
                                        />
                                        <div
                                            className="rounded-full bg-purple-500"
                                            style={{ width: '25%' }}
                                        />
                                    </div>
                                    <div className="mt-4 flex justify-between text-[10px] font-black tracking-tighter text-slate-500 uppercase">
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                            פנסיוני
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            בריאות
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                            סיכונים
                                        </span>
                                    </div>
                                </div>
                            </NeonCard>
                        </div>

                        {/* Detailed Client Info Blocks */}
                        <div className="grid gap-8 lg:grid-cols-2">
                            <NeonCard
                                title="👤 פרטי זיהוי ומסמכים"
                                action={
                                    <button
                                        onClick={() => handleEdit('clientDetails')}
                                        className="text-amber-500 transition-colors hover:text-amber-400"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                }
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group/item rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-amber-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            מספר זהות
                                        </p>
                                        <p className="text-lg font-black text-white transition-colors group-hover/item:text-amber-500">
                                            {client.idNumber || '—'}
                                        </p>
                                    </div>
                                    <div className="group/item rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-amber-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            תאריך לידה
                                        </p>
                                        <p className="font-black text-white transition-colors group-hover/item:text-amber-500">
                                            {client.birthDate
                                                ? new Date(client.birthDate).toLocaleDateString(
                                                      'he-IL'
                                                  )
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="flex items-end justify-between rounded-2xl border border-slate-800 bg-[#0b1021] p-6">
                                        <div>
                                            <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                גיל נוכחי
                                            </p>
                                            <p className="text-4xl leading-none font-black text-amber-500 italic">
                                                {client.birthDate
                                                    ? calculateAge(client.birthDate)
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="group/item rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-amber-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            תאריך הנפקת ת.ז
                                        </p>
                                        <p className="font-black text-white transition-colors group-hover/item:text-amber-500">
                                            {client.idIssueDate
                                                ? new Date(client.idIssueDate).toLocaleDateString(
                                                      'he-IL'
                                                  )
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="group/item rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-amber-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            האם מעשן
                                        </p>
                                        <p
                                            className={`flex items-center gap-3 font-black ${client.isSmoker ? 'text-red-400' : 'text-emerald-400'}`}
                                        >
                                            <span
                                                className={`h-3 w-3 rounded-full shadow-[0_0_10px_currentColor] ${client.isSmoker ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            />
                                            {client.isSmoker === undefined
                                                ? '—'
                                                : client.isSmoker
                                                  ? 'כן'
                                                  : 'לא'}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className={`mt-6 flex items-center gap-6 rounded-3xl border-2 p-6 transition-all ${client.hasInsuranceReport ? 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]' : 'animate-pulse-slow border-amber-500/20 bg-amber-500/5'}`}
                                >
                                    <div
                                        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black shadow-2xl ${client.hasInsuranceReport ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'}`}
                                    >
                                        {client.hasInsuranceReport ? '✓' : '!'}
                                    </div>
                                    <div className="flex-1">
                                        <p
                                            className={`text-lg font-black italic ${client.hasInsuranceReport ? 'text-emerald-400' : 'text-amber-400'}`}
                                        >
                                            {client.hasInsuranceReport
                                                ? 'דוח הר הביטוח מאומת'
                                                : 'חסר דוח הר הביטוח'}
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-slate-500">
                                            {client.hasInsuranceReport
                                                ? 'הנתונים מעודכנים ומוזנים במערכת'
                                                : 'נדרש להעלות דוח עדכני כדי להפעיל תובנות AI'}
                                        </p>
                                    </div>
                                </div>
                            </NeonCard>

                            <NeonCard
                                title="📋 מאפייני לקוח וקשרים"
                                action={
                                    <button
                                        onClick={() => handleEdit('additionalDetails')}
                                        className="text-amber-500 transition-colors hover:text-amber-400"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                }
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-indigo-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            קופת חולים
                                        </p>
                                        <p className="font-black text-white">
                                            {client.healthFund || '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-indigo-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            תנאי תשלום
                                        </p>
                                        <p className="font-black text-white">
                                            {client.paymentTerms || '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-indigo-500/30">
                                        <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            נציג שירות
                                        </p>
                                        <p className="font-black text-white">
                                            {client.salesRepresentative || 'מערכת'}
                                        </p>
                                    </div>
                                </div>

                                {client.email ? (
                                    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                                        <div className="rounded-xl bg-slate-800 p-2 text-slate-400">
                                            <Mail size={16} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-300">
                                            {client.email}
                                        </p>
                                    </div>
                                ) : null}

                                {client.linkedClientId ? (
                                    <div className="group/link mt-4 flex cursor-pointer items-center justify-between rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-5 shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all hover:bg-indigo-500/20">
                                        <div className="flex items-center gap-4">
                                            <div className="rotate-12 rounded-2xl bg-indigo-500 p-3 text-black shadow-lg shadow-indigo-500/20 transition-transform group-hover/link:rotate-0">
                                                <Link2 size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                                                    לקוח מקושר
                                                </p>
                                                <p className="text-lg font-black text-indigo-200">
                                                    {client.linkedClientName || 'לקוח ללא שם'}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowLeft
                                            size={20}
                                            className="-translate-x-2 text-indigo-400 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
                                        />
                                    </div>
                                ) : null}
                            </NeonCard>
                        </div>

                        {/* Summary Opportunities & Split */}
                        <div className="grid gap-8 lg:grid-cols-2">
                            <NeonCard title="💹 התפלגות פוליסות">
                                <div className="space-y-4">
                                    {[...client.policies, ...client.insuranceSales].map(
                                        (item, i) => (
                                            <div
                                                key={i}
                                                className="group flex items-center justify-between rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 transition-all hover:bg-slate-800/60"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-lg ${i % 2 === 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}
                                                    >
                                                        {'icon' in item ? item.icon : '📄'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">
                                                            {'type' in item
                                                                ? item.type
                                                                : item.productType}
                                                        </p>
                                                        <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                            {item.company}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-lg font-black text-amber-500 italic">
                                                        {item.premium}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                    {client.policies.length === 0 &&
                                        client.insuranceSales.length === 0 && (
                                            <div className="py-12 text-center font-bold text-slate-500 italic opacity-30">
                                                אין פוליסות פעילות להצגה
                                            </div>
                                        )}
                                </div>
                            </NeonCard>

                            <NeonCard title="🚀 הזדמנויות עסקיות">
                                <div className="space-y-4">
                                    {client.pensionSales.length === 0 && (
                                        <div className="group flex items-center justify-between rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale transition-all group-hover:grayscale-0">
                                                    ⚠️
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-red-400">
                                                        חוסר פנסיוני
                                                    </h5>
                                                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                                                        לא זוהתה קרן פנסיה פעילה
                                                    </p>
                                                </div>
                                            </div>
                                            <NeonButton
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setActiveTab('לביצוע מכירה')}
                                            >
                                                סגור פער
                                            </NeonButton>
                                        </div>
                                    )}
                                    {!client.policies.some((p) => p.type.includes('בריאות')) && (
                                        <div className="group flex items-center justify-between rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale transition-all group-hover:grayscale-0">
                                                    🏥
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-blue-400">
                                                        הזדמנות בריאות
                                                    </h5>
                                                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                                                        ניתוח מעלה חוסר בביטוח פרטי
                                                    </p>
                                                </div>
                                            </div>
                                            <NeonButton
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setActiveTab('לביצוע מכירה')}
                                            >
                                                הצע חבילה
                                            </NeonButton>
                                        </div>
                                    )}
                                    {!client.hasInsuranceReport && (
                                        <div className="group flex items-center justify-between rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-3xl grayscale transition-all group-hover:grayscale-0">
                                                    📄
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-amber-400">
                                                        פענוח דוח
                                                    </h5>
                                                    <p className="mt-0.5 text-xs font-bold text-slate-500">
                                                        נדרש העלאת דוח הר הביטוח
                                                    </p>
                                                </div>
                                            </div>
                                            <NeonButton
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setActiveTab('הר הביטוח')}
                                            >
                                                העלה
                                            </NeonButton>
                                        </div>
                                    )}
                                </div>
                            </NeonCard>
                        </div>

                        {/* Address & Employment - Integrated from Personal Info */}
                        <div className="grid gap-8 lg:grid-cols-2">
                            <NeonCard title="📍 כתובת מגורים">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <NeonInput label="עיר" value={client.address.city} readOnly />
                                    <NeonInput
                                        label="רחוב ומספר"
                                        value={`${client.address.street} ${client.address.num}`}
                                        readOnly
                                    />
                                </div>
                            </NeonCard>

                            <NeonCard title="💼 תעסוקה">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        </div>

                        {/* Elementary Insurance Summary */}
                        <NeonCard title="🚗 אלמנטרי ופלטינום">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                                    <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        מוצרי פלטינום בסל
                                    </p>
                                    <p className="text-3xl font-black text-white italic">
                                        {(client.platinumSales || []).length}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                                    <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        סטטוס הפקה
                                    </p>
                                    <div className="flex gap-2 text-white">
                                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                            {client.platinumSales?.filter(s => s.status === 'ממתין להפקה').length || 0} ממתינים
                                        </Badge>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                            {client.platinumSales?.filter(s => s.status === 'נשלח לפלטינום').length || 0} נשלחו
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </NeonCard>

                        {/* Family Members Section - Moved from Personal Info */}
                        <NeonCard title="👨‍👩‍👧‍👦 בני משפחה קשורים">
                            <div className="mb-6 flex justify-end">
                                <NeonButton
                                    onClick={() => handleEdit('family')}
                                    variant="secondary"
                                    size="sm"
                                >
                                    <Plus size={16} className="ml-2" /> הוסף בן משפחה
                                </NeonButton>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 text-right">
                                {client.family.map((member, i) => (
                                    <div
                                        key={member.id}
                                        className="group relative rounded-[2rem] border border-slate-800 bg-slate-900/50 p-6 transition-all duration-300 hover:border-amber-500/30"
                                    >
                                        <div className="absolute top-4 left-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                onClick={() => handleEdit('family', member)}
                                                className="rounded-xl bg-slate-800 p-2 text-slate-400 transition-colors hover:text-amber-400"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteItem('family', member.id)}
                                                className="rounded-xl bg-slate-800 p-2 text-slate-400 transition-colors hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="mb-4 flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xl font-black text-amber-500">
                                                {member.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white">
                                                    {member.name}
                                                </p>
                                                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <span className="rounded-full bg-slate-800 px-3 py-0.5">
                                                        {member.relation}
                                                    </span>
                                                    <span className="rounded-full bg-slate-800 px-3 py-0.5">
                                                        גיל {member.age}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black tracking-widest uppercase ${member.insured ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}
                                        >
                                            {member.insured ? '✓ מבוטח' : '✗ לא מבוטח'}
                                        </div>
                                    </div>
                                ))}
                                {client.family.length === 0 && (
                                    <div className="col-span-2 rounded-[2rem] border-2 border-dashed border-slate-800/50 bg-slate-900/20 py-16 text-center">
                                        <div className="mb-4 text-6xl opacity-10">👨‍👩‍👧‍👦</div>
                                        <p className="font-bold text-slate-500 italic">
                                            אין בני משפחה רשומים
                                        </p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>
                    </div>
                )}

                {/* --- Tab Content: Status Tracker --- */}
                {activeTab === 'סטטוס' && (
                    <LifecycleTracker client={client} onUpdate={handleStatusUpdate} />
                )}

                {/* --- Tab Content: Sales Execution --- */}
                {activeTab === 'לביצוע מכירת פרט' && (
                    <div className="stagger-children grid gap-8 lg:grid-cols-2">
                        {/* Pension Sales Section */}
                        <NeonCard title="📊 מכירה פנסיונית">
                            <div className="grid grid-cols-2 gap-6">
                                <NeonSelect
                                    label="סוג המוצר"
                                    value={pensionForm.type || ''}
                                    onChange={(e) =>
                                        setPensionForm({ ...pensionForm, type: e.target.value })
                                    }
                                >
                                    <option value="">בחר...</option>
                                    <option>קופת גמל</option>
                                    <option>קרן השתלמות</option>
                                    <option>קרן פנסיה</option>
                                </NeonSelect>

                                <NeonSelect
                                    label="חברה מנהלת"
                                    value={pensionForm.company || ''}
                                    onChange={(e) =>
                                        setPensionForm({ ...pensionForm, company: e.target.value })
                                    }
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
                                        value={pensionForm.planName || ''}
                                        onChange={(e) =>
                                            setPensionForm({
                                                ...pensionForm,
                                                planName: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <NeonInput
                                    label='דנ"ה מצבירה (%)'
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={pensionForm.managementFeeAccumulation || ''}
                                    onChange={(e) =>
                                        setPensionForm({
                                            ...pensionForm,
                                            managementFeeAccumulation: e.target.value,
                                        })
                                    }
                                />

                                <NeonInput
                                    label='דנ"ה מהפקה (%)'
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={pensionForm.managementFeeDeposit || ''}
                                    onChange={(e) =>
                                        setPensionForm({
                                            ...pensionForm,
                                            managementFeeDeposit: e.target.value,
                                        })
                                    }
                                />

                                <NeonInput
                                    label="מועד הצטרפות"
                                    type="date"
                                    value={pensionForm.joinDate || ''}
                                    onChange={(e) =>
                                        setPensionForm({ ...pensionForm, joinDate: e.target.value })
                                    }
                                />

                                <NeonInput
                                    label="מספר קופה/עמית"
                                    placeholder="הזן מספר..."
                                    value={pensionForm.fundNumber || ''}
                                    onChange={(e) =>
                                        setPensionForm({
                                            ...pensionForm,
                                            fundNumber: e.target.value,
                                        })
                                    }
                                />

                                <div className="col-span-2">
                                    <NeonInput
                                        label="משכורת ממוצעת"
                                        type="number"
                                        placeholder="₪"
                                        value={pensionForm.avgSalary || ''}
                                        onChange={(e) =>
                                            setPensionForm({
                                                ...pensionForm,
                                                avgSalary: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <NeonButton onClick={handleAddPension} className="flex-1">
                                    <Plus size={20} className="ml-2" /> טעינת מוצר
                                </NeonButton>
                                <button
                                    onClick={() => setShowMarketModal(true)}
                                    className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 font-black text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                                >
                                    <span className="text-xl">🤖</span> ניתוח שוק (AI)
                                </button>
                                <button
                                    onClick={() => setShowComparisonWizard(true)}
                                    className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-amber-500 to-orange-600 font-black text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                >
                                    <span className="text-xl">📋</span> השוואת ביטוח
                                </button>
                            </div>

                            {/* List of Added Pension Products */}
                            <div className="mt-8 space-y-4 border-t border-slate-800/50 pt-8">
                                <h5 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-500">
                                        {client.pensionSales.length}
                                    </span>
                                    מוצרים שנוספו לרשימה
                                </h5>
                                {client.pensionSales.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="group/item flex items-center justify-between rounded-[1.5rem] border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:border-amber-500/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xl font-black text-amber-500 shadow-inner">
                                                {item.type[0]}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white">
                                                    {item.type} - {item.company}
                                                </p>
                                                <p className="mt-1 text-xs font-bold tracking-tight text-slate-500">
                                                    {item.fundNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteItem('pensionSales', item.id)}
                                            className="rounded-2xl p-3 text-slate-600 transition-all hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {client.pensionSales.length === 0 && (
                                    <div className="rounded-[2rem] border-2 border-dashed border-slate-800/50 bg-slate-900/20 py-10 text-center">
                                        <div className="mb-4 text-5xl opacity-20 grayscale filter">
                                            📈
                                        </div>
                                        <p className="font-bold text-slate-500 italic">
                                            אין מוצרים פנסיוניים שהוספו
                                        </p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>

                        {/* Insurance Sales Section */}
                        <NeonCard title="🛡️ מכירת ביטוח">
                            <div className="grid grid-cols-2 gap-6">
                                <NeonSelect
                                    label="חברת ביטוח"
                                    value={insuranceForm.company || ''}
                                    onChange={(e) =>
                                        setInsuranceForm({
                                            ...insuranceForm,
                                            company: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">בחר...</option>
                                    <option>הראל</option>
                                    <option>הפניקס</option>
                                    <option>מנורה</option>
                                    <option>איילון</option>
                                    <option>הכשרה</option>
                                </NeonSelect>

                                <div className="col-span-2 rounded-[2rem] border border-slate-800 bg-slate-900/50 p-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-black text-white italic">
                                            מכירת פלטינום?
                                        </label>
                                        <div className="flex gap-6">
                                            <label className="group/radio flex cursor-pointer items-center gap-3 text-sm">
                                                <input
                                                    type="radio"
                                                    name="plat"
                                                    onChange={() => setShowPlatinumSelect(true)}
                                                    checked={showPlatinumSelect}
                                                    className="h-5 w-5 accent-amber-500"
                                                />
                                                <span
                                                    className={`${showPlatinumSelect ? 'text-amber-400' : 'text-slate-500'} font-black transition-colors`}
                                                >
                                                    כן
                                                </span>
                                            </label>
                                            <label className="group/radio flex cursor-pointer items-center gap-3 text-sm">
                                                <input
                                                    type="radio"
                                                    name="plat"
                                                    onChange={() => setShowPlatinumSelect(false)}
                                                    checked={!showPlatinumSelect}
                                                    className="h-5 w-5 accent-amber-500"
                                                />
                                                <span
                                                    className={`${!showPlatinumSelect ? 'text-amber-400' : 'text-slate-500'} font-black transition-colors`}
                                                >
                                                    לא
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    {showPlatinumSelect ? (
                                        <div className="animate-in slide-in-from-top-2 mt-6 duration-300">
                                            <NeonSelect
                                                multiple
                                                label="בחר מוצרי פלטינום (Ctrl+Click)"
                                                className="h-32"
                                                onChange={(e) => {
                                                    const selected = Array.from(
                                                        (e.target as HTMLSelectElement)
                                                            .selectedOptions,
                                                        (option) => option.value
                                                    );
                                                    setInsuranceForm({
                                                        ...insuranceForm,
                                                        platinumProducts: selected,
                                                    });
                                                }}
                                            >
                                                <option>פלטינום בריאות</option>
                                                <option>פלטינום פרימיום</option>
                                                <option>רופא עד הבית</option>
                                                <option>שיניים</option>
                                                <option>רפואה אלטרנטיבית</option>
                                            </NeonSelect>
                                        </div>
                                    ) : null}
                                </div>

                                <NeonSelect
                                    label="מוצר ביטוח"
                                    value={insuranceForm.productType || ''}
                                    onChange={(e) =>
                                        setInsuranceForm({
                                            ...insuranceForm,
                                            productType: e.target.value,
                                        })
                                    }
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
                                    value={insuranceForm.amount || ''}
                                    onChange={(e) =>
                                        setInsuranceForm({
                                            ...insuranceForm,
                                            amount: e.target.value,
                                        })
                                    }
                                />

                                <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-800 bg-slate-900/50 p-5">
                                    <input
                                        type="checkbox"
                                        checked={insuranceForm.hasLien || false}
                                        onChange={(e) =>
                                            setInsuranceForm({
                                                ...insuranceForm,
                                                hasLien: e.target.checked,
                                            })
                                        }
                                        className="h-6 w-6 rounded-lg accent-amber-500"
                                    />
                                    <label className="text-sm font-black text-slate-400 italic">
                                        האם קיים שיעבוד?
                                    </label>
                                </div>

                                <NeonInput
                                    label="פרמיה"
                                    type="number"
                                    placeholder="₪"
                                    value={insuranceForm.premium || ''}
                                    onChange={(e) =>
                                        setInsuranceForm({
                                            ...insuranceForm,
                                            premium: e.target.value,
                                        })
                                    }
                                />

                                <div className="col-span-2">
                                    <NeonInput
                                        label="כמה נפשות בפוליסה"
                                        type="number"
                                        value={insuranceForm.numInsured || 1}
                                        onChange={(e) =>
                                            setInsuranceForm({
                                                ...insuranceForm,
                                                numInsured: +e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <NeonButton onClick={handleAddInsurance} className="mt-8 w-full">
                                <Plus size={20} className="ml-2" /> הוסף ביטוח לסל
                            </NeonButton>

                            {/* List of Added Insurance Products */}
                            <div className="mt-8 space-y-4 border-t border-slate-800/50 pt-8">
                                <h5 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-500">
                                        {client.insuranceSales.length}
                                    </span>
                                    ביטוחים שנוספו לרשימה
                                </h5>
                                {client.insuranceSales.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="group/item flex items-center justify-between rounded-[1.5rem] border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:border-emerald-500/30"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-xl text-emerald-500 shadow-inner">
                                                🛡️
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-white">
                                                    {item.productType} - {item.company}
                                                </p>
                                                <p className="mt-1 text-xs font-bold tracking-tight text-slate-500">
                                                    {item.isPlatinum ? '✨ כולל פלטינום' : ''} • ₪
                                                    {item.premium}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteItem('insuranceSales', item.id)}
                                            className="rounded-2xl p-3 text-slate-600 transition-all hover:bg-red-500/10 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {client.insuranceSales.length === 0 && (
                                    <div className="rounded-[2rem] border-2 border-dashed border-slate-800/50 bg-slate-900/20 py-10 text-center">
                                        <div className="mb-4 text-5xl opacity-20 grayscale filter">
                                            🛡️
                                        </div>
                                        <p className="font-bold text-slate-500 italic">
                                            אין ביטוחים שהוספו
                                        </p>
                                    </div>
                                )}
                            </div>
                        </NeonCard>

                        {/* ===== Platinum Service Sale Section ===== */}
                        <NeonCard title="⭐ מכירת כתב שירות פלטינום" className="lg:col-span-2">
                            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                                {/* Form Column */}
                                <div className="space-y-6">
                                    <NeonSelect
                                        label="שם המוצר"
                                        value={platinumForm.productName || ''}
                                        onChange={(e) =>
                                            setPlatinumForm({
                                                ...platinumForm,
                                                productName: e.target
                                                    .value as PlatinumSale['productName'],
                                            })
                                        }
                                    >
                                        <option value="">בחר מוצר...</option>
                                        <option value="פלטינום בריאות">פלטינום בריאות</option>
                                        <option value="פלטינום פרמיום">פלטינום פרמיום</option>
                                        <option value="רופא עד הבית">רופא עד הבית</option>
                                        <option value="פלטינום רפואה משלימה">
                                            פלטינום רפואה משלימה
                                        </option>
                                        <option value="פלטינום דנטל">פלטינום דנטל</option>
                                    </NeonSelect>

                                    <div className="grid grid-cols-2 gap-6">
                                        <NeonInput
                                            label="גיל הלקוח"
                                            type="number"
                                            min="0"
                                            max="120"
                                            value={platinumForm.clientAge || ''}
                                            onChange={(e) =>
                                                setPlatinumForm({
                                                    ...platinumForm,
                                                    clientAge: +e.target.value,
                                                })
                                            }
                                            placeholder="הזן גיל"
                                        />

                                        <NeonSelect
                                            label={`הנחה ${platinumForm.productName === 'פלטינום דנטל' ? '(מקס 10%)' : ''}`}
                                            value={platinumForm.discount || ''}
                                            onChange={(e) =>
                                                setPlatinumForm({
                                                    ...platinumForm,
                                                    discount: +e.target.value as 10 | 20 | 30,
                                                })
                                            }
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

                                    {platinumPriceCalc ? (
                                        <div className="animate-in zoom-in-95 rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 duration-300">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="mb-1 block text-[10px] font-black tracking-widest text-amber-500/60 uppercase">
                                                        מחיר בסיס
                                                    </span>
                                                    <span className="text-2xl font-black text-amber-500 italic">
                                                        ₪{platinumPriceCalc.basePrice}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="mb-1 block text-[10px] font-black tracking-widest text-emerald-500/60 uppercase">
                                                        מחיר סופי
                                                    </span>
                                                    <span className="text-3xl font-black text-emerald-500 italic">
                                                        ₪{platinumPriceCalc.finalPrice.toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    <NeonInput
                                        label="עלות חודשית סופית (₪)"
                                        type="number"
                                        value={platinumForm.monthlyPremium || ''}
                                        onChange={(e) =>
                                            setPlatinumForm({
                                                ...platinumForm,
                                                monthlyPremium: +e.target.value,
                                            })
                                        }
                                        placeholder={
                                            platinumPriceCalc
                                                ? `מומלץ: ₪${platinumPriceCalc.finalPrice.toFixed(0)}`
                                                : 'הזן סכום'
                                        }
                                    />

                                    {platinumForm.monthlyPremium && platinumForm.productName ? (
                                        <div className="rounded-[2rem] border border-indigo-500/20 bg-indigo-500/10 p-6">
                                            <h5 className="mb-4 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                                                💰 עמלות צפויות
                                            </h5>
                                            <div className="grid grid-cols-2 gap-6 text-sm">
                                                <div>
                                                    <p className="mb-1 font-bold text-slate-500">
                                                        חד-פעמית
                                                    </p>
                                                    <p className="text-lg font-black text-indigo-400">
                                                        ₪
                                                        {(platinumForm.monthlyPremium * 3).toFixed(
                                                            0
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="mb-1 font-bold text-slate-500">
                                                        נפרעים
                                                    </p>
                                                    <p className="text-lg font-black text-indigo-400">
                                                        ₪
                                                        {(
                                                            platinumForm.monthlyPremium *
                                                            (platinumForm.productName ===
                                                            'פלטינום דנטל'
                                                                ? 0.3
                                                                : 0.45)
                                                        ).toFixed(0)}
                                                        /ח'
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}

                                    <NeonButton onClick={handleAddPlatinum} className="w-full">
                                        <Plus size={20} className="ml-2" /> אישור מכירה פלטינום
                                    </NeonButton>
                                </div>

                                {/* List Column */}
                                <div className="space-y-6">
                                    <h5 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-500">
                                            {(client.platinumSales || []).length}
                                        </span>
                                        מכירות פלטינום בסל
                                    </h5>
                                    <div className="custom-scrollbar max-h-[500px] space-y-4 overflow-y-auto px-2">
                                        {(client.platinumSales || []).map((item, index) => {
                                            const commission = calculatePlatinumCommission(item);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group/item rounded-[1.5rem] border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:border-amber-500/30"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-xl text-amber-500 shadow-inner">
                                                                ⭐
                                                            </div>
                                                            <div>
                                                                <p className="text-lg font-black text-white">
                                                                    {item.productName}
                                                                </p>
                                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                                    גיל {item.clientAge} • הנחה{' '}
                                                                    {item.discount}% • ₪
                                                                    {item.monthlyPremium}/ח'
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black tracking-tighter text-emerald-500 uppercase">
                                                                {item.status}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    deleteItem(
                                                                        'platinumSales',
                                                                        item.id
                                                                    )
                                                                }
                                                                className="rounded-xl p-2 text-slate-700 transition-all hover:bg-red-500/10 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800/50 pt-4 text-[10px] font-black tracking-tight uppercase">
                                                        <div className="text-slate-600">
                                                            עמלה חד"פ:{' '}
                                                            <span className="text-indigo-400">
                                                                ₪
                                                                {commission.oneTimeCommission.toFixed(
                                                                    0
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="text-slate-600">
                                                            עמלת נפרעים:{' '}
                                                            <span className="text-indigo-400">
                                                                ₪
                                                                {commission.monthlyCommission.toFixed(
                                                                    0
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!client.platinumSales ||
                                            client.platinumSales.length === 0) && (
                                            <div className="rounded-[2rem] border-2 border-dashed border-slate-800/50 bg-slate-900/20 py-20 text-center">
                                                <div className="mb-4 text-6xl opacity-20 grayscale filter">
                                                    ⭐
                                                </div>
                                                <p className="font-bold text-slate-500 italic">
                                                    אין מכירות פלטינום
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Section */}
                            {client.platinumSales && client.platinumSales.length > 0 ? (
                                <div className="mt-12 border-t-2 border-slate-800/50 pt-12">
                                    <div className="mb-10 flex items-center gap-3 overflow-hidden">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                                            💳
                                        </div>
                                        <div>
                                            <h5 className="text-2xl font-black tracking-tight text-white italic">
                                                פרטי תשלום והפקה
                                            </h5>
                                            <p className="mt-1 text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                                                Payment & Issuance Details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                                        <div className="space-y-8">
                                            {/* ID Type Selection */}
                                            <div className="rounded-[2.5rem] border border-slate-800 bg-[#0d1326] p-6 shadow-inner">
                                                <label className="mr-2 mb-4 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    סוג מסמך זיהוי
                                                </label>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setClient({
                                                                ...client,
                                                                idType: 'תעודת זהות',
                                                            })
                                                        }
                                                        className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 text-sm font-black transition-all ${
                                                            client.idType === 'תעודת זהות'
                                                                ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                                                                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🪪</span> תעודת
                                                        זהות
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setClient({
                                                                ...client,
                                                                idType: 'דרכון',
                                                            })
                                                        }
                                                        className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 text-sm font-black transition-all ${
                                                            client.idType === 'דרכון'
                                                                ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                                                                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🛂</span> דרכון
                                                    </button>
                                                </div>

                                                {client.idType === 'דרכון' && (
                                                    <div className="animate-in slide-in-from-top-4 mt-8 grid grid-cols-2 gap-6 duration-300">
                                                        <NeonInput
                                                            label="ארץ הנפקה"
                                                            value={client.passportCountry || ''}
                                                            onChange={(e) =>
                                                                setClient({
                                                                    ...client,
                                                                    passportCountry: e.target.value,
                                                                })
                                                            }
                                                            placeholder="ארץ הנפקת הדרכון"
                                                        />
                                                        <NeonInput
                                                            label="תוקף דרכון"
                                                            type="date"
                                                            value={client.passportExpiry || ''}
                                                            onChange={(e) =>
                                                                setClient({
                                                                    ...client,
                                                                    passportExpiry: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Payment Method Selection */}
                                            <div className="rounded-[2.5rem] border border-slate-800 bg-[#0d1326] p-6 shadow-inner">
                                                <label className="mr-2 mb-4 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    אמצעי תשלום
                                                </label>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPlatinumPaymentForm({
                                                                ...platinumPaymentForm,
                                                                paymentMethod: 'אשראי',
                                                            })
                                                        }
                                                        className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 text-sm font-black transition-all ${
                                                            platinumPaymentForm.paymentMethod ===
                                                            'אשראי'
                                                                ? 'border-blue-600 bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.3)]'
                                                                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">💳</span> כרטיס
                                                        אשראי
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPlatinumPaymentForm({
                                                                ...platinumPaymentForm,
                                                                paymentMethod: 'הוראת קבע',
                                                            })
                                                        }
                                                        className={`flex items-center justify-center gap-3 rounded-2xl border-2 p-5 text-sm font-black transition-all ${
                                                            platinumPaymentForm.paymentMethod ===
                                                            'הוראת קבע'
                                                                ? 'border-blue-600 bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.3)]'
                                                                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <span className="text-xl">🏦</span> הוראת
                                                        קבע
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Dynamic Payment Fields */}
                                            {platinumPaymentForm.paymentMethod === 'אשראי' && (
                                                <div className="animate-in fade-in space-y-6 rounded-[2.5rem] border border-slate-800 bg-slate-900/50 p-8 duration-500">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="col-span-2">
                                                            <NeonInput
                                                                label="מספר כרטיס אשראי"
                                                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                                                maxLength={19}
                                                                value={
                                                                    platinumPaymentForm.creditCardNumber ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    setPlatinumPaymentForm({
                                                                        ...platinumPaymentForm,
                                                                        creditCardNumber:
                                                                            e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <NeonInput
                                                            label="תוקף"
                                                            placeholder="MM/YY"
                                                            maxLength={5}
                                                            value={
                                                                platinumPaymentForm.creditCardExpiry ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                setPlatinumPaymentForm({
                                                                    ...platinumPaymentForm,
                                                                    creditCardExpiry:
                                                                        e.target.value,
                                                                })
                                                            }
                                                        />
                                                        <NeonInput
                                                            label='ת"ז גורם משלם'
                                                            maxLength={9}
                                                            placeholder="מספר ת.ז"
                                                            value={
                                                                platinumPaymentForm.creditCardPayerIdNumber ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                setPlatinumPaymentForm({
                                                                    ...platinumPaymentForm,
                                                                    creditCardPayerIdNumber:
                                                                        e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <NeonInput
                                                        label="טלפון בעל הכרטיס"
                                                        type="tel"
                                                        placeholder="050-0000000"
                                                        value={
                                                            platinumPaymentForm.creditCardPayerPhone ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setPlatinumPaymentForm({
                                                                ...platinumPaymentForm,
                                                                creditCardPayerPhone:
                                                                    e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {platinumPaymentForm.paymentMethod === 'הוראת קבע' && (
                                                <div className="animate-in fade-in space-y-6 rounded-[2.5rem] border border-slate-800 bg-slate-900/50 p-8 duration-500">
                                                    <NeonSelect
                                                        label="שם הבנק"
                                                        value={platinumPaymentForm.bankName || ''}
                                                        onChange={(e) =>
                                                            setPlatinumPaymentForm({
                                                                ...platinumPaymentForm,
                                                                bankName: e.target.value,
                                                            })
                                                        }
                                                    >
                                                        <option value="">בחר בנק...</option>
                                                        <option value="הפועלים">הפועלים</option>
                                                        <option value="לאומי">לאומי</option>
                                                        <option value="דיסקונט">דיסקונט</option>
                                                        <option value="מזרחי טפחות">
                                                            מזרחי טפחות
                                                        </option>
                                                        <option value="הבינלאומי">הבינלאומי</option>
                                                        <option value="יהב">יהב</option>
                                                        <option value="מרכנתיל">מרכנתיל</option>
                                                        <option value="אוצר החייל">
                                                            אוצר החייל
                                                        </option>
                                                    </NeonSelect>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <NeonInput
                                                            label="מספר סניף"
                                                            placeholder="סניף"
                                                            value={
                                                                platinumPaymentForm.bankBranch || ''
                                                            }
                                                            onChange={(e) =>
                                                                setPlatinumPaymentForm({
                                                                    ...platinumPaymentForm,
                                                                    bankBranch: e.target.value,
                                                                })
                                                            }
                                                        />
                                                        <NeonInput
                                                            label="מספר חשבון"
                                                            placeholder="חשבון"
                                                            value={
                                                                platinumPaymentForm.bankAccountNumber ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                setPlatinumPaymentForm({
                                                                    ...platinumPaymentForm,
                                                                    bankAccountNumber:
                                                                        e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="mr-2 mb-4 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                            סוג חשבון
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setPlatinumPaymentForm({
                                                                        ...platinumPaymentForm,
                                                                        accountType: 'עו"ש',
                                                                    })
                                                                }
                                                                className={`rounded-2xl border-2 p-4 text-xs font-black transition-all ${
                                                                    platinumPaymentForm.accountType ===
                                                                    'עו"ש'
                                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                                                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                                                                }`}
                                                            >
                                                                עו"ש
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setPlatinumPaymentForm({
                                                                        ...platinumPaymentForm,
                                                                        accountType: 'חיסכון',
                                                                    })
                                                                }
                                                                className={`rounded-2xl border-2 p-4 text-xs font-black transition-all ${
                                                                    platinumPaymentForm.accountType ===
                                                                    'חיסכון'
                                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                                                        : 'border-slate-800 bg-slate-900/50 text-slate-400'
                                                                }`}
                                                            >
                                                                חיסכון
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Billing Day */}
                                            <div className="rounded-[2.5rem] border border-slate-800 bg-[#0d1326] p-6 shadow-inner">
                                                <label className="mr-2 mb-4 block text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    יום גבייה בחודש
                                                </label>
                                                <div className="grid grid-cols-4 gap-4">
                                                    {[2, 10, 15, 20].map((day) => (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() =>
                                                                setPlatinumPaymentForm({
                                                                    ...platinumPaymentForm,
                                                                    billingDay: day as
                                                                        | 2
                                                                        | 10
                                                                        | 15
                                                                        | 20,
                                                                })
                                                            }
                                                            className={`rounded-2xl border-2 p-4 text-lg font-black transition-all ${
                                                                platinumPaymentForm.billingDay ===
                                                                day
                                                                    ? 'border-amber-500 bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
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
                                        disabled={
                                            isSubmittingPlatinum ||
                                            !client.platinumSales?.some(
                                                (s) => s.status === 'ממתין להפקה'
                                            )
                                        }
                                        className="group relative mt-12 w-full overflow-hidden rounded-[2rem] bg-linear-to-r from-purple-600 via-indigo-600 to-purple-600 py-6 text-xl font-black tracking-tighter text-white italic shadow-[0_0_50px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                                        {isSubmittingPlatinum ? (
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent" />
                                                <span>מעבד פקודת הפקה...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-4">
                                                <Send
                                                    size={24}
                                                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                                                />
                                                <span>
                                                    הפקת מוצרי פלטינום (
                                                    {client.platinumSales?.filter(
                                                        (s) => s.status === 'ממתין להפקה'
                                                    ).length || 0}
                                                    )
                                                </span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Products Status Summary */}
                                    <div className="mt-8 grid grid-cols-3 gap-6">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
                                            <div className="text-2xl leading-none font-black text-amber-500 italic">
                                                {client.platinumSales?.filter(
                                                    (s) => s.status === 'ממתין להפקה'
                                                ).length || 0}
                                            </div>
                                            <div className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                ממתינים
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
                                            <div className="text-2xl leading-none font-black text-blue-500 italic">
                                                {client.platinumSales?.filter(
                                                    (s) => s.status === 'הופקה'
                                                ).length || 0}
                                            </div>
                                            <div className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                הופקו
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-center">
                                            <div className="text-2xl leading-none font-black text-emerald-500 italic">
                                                {client.platinumSales?.filter(
                                                    (s) => s.status === 'נשלח לפלטינום'
                                                ).length || 0}
                                            </div>
                                            <div className="mt-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                נשלחו
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </NeonCard>
                    </div>
                )}



                {/* --- Tab Content: Elementary (Car/Home) --- */}
                {activeTab === 'אלמנטרי' && (
                    <div className="stagger-children space-y-8">
                        <NeonCard title="🚗 הוספת ביטוח אלמנטרי">
                            <div className="mx-auto mb-10 flex w-fit justify-center rounded-[2rem] border border-slate-800 bg-slate-900/50 p-1">
                                <button
                                    onClick={() =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            category: 'רכב',
                                            type: 'חובה ומקיף',
                                        })
                                    }
                                    className={`rounded-[1.5rem] px-10 py-3 text-sm font-black transition-all ${elementaryForm.category === 'רכב' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    רכב
                                </button>
                                <button
                                    onClick={() =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            category: 'דירה',
                                            type: 'מבנה ותכולה',
                                        })
                                    }
                                    className={`rounded-[1.5rem] px-10 py-3 text-sm font-black transition-all ${elementaryForm.category === 'דירה' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    דירה
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                <NeonSelect
                                    label="סוג כיסוי"
                                    value={elementaryForm.type}
                                    onChange={(e) =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            type: e.target.value,
                                        })
                                    }
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
                                        onChange={(e) =>
                                            setElementaryForm({
                                                ...elementaryForm,
                                                manufacturer: e.target.value,
                                            })
                                        }
                                    >
                                        {[
                                            'טויוטה',
                                            'יונדאי',
                                            'קיה',
                                            'מאזדה',
                                            'סקודה',
                                            'מיצובישי',
                                            'שברולט',
                                            'רנו',
                                            "פיג'ו",
                                            'סיטרואן',
                                            'הונדה',
                                            'ניסאן',
                                            'סובארו',
                                            'פולקסווגן',
                                            'אאודי',
                                            'מרצדס',
                                            'ב.מ.וו',
                                            'טסלה',
                                            'BYD',
                                            'MG',
                                            'יומי',
                                            "צ'רי",
                                        ].map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </NeonSelect>
                                )}

                                <NeonSelect
                                    label="חברה מבטחת"
                                    value={elementaryForm.insurer}
                                    onChange={(e) =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            insurer: e.target.value,
                                        })
                                    }
                                >
                                    {['כלל', 'מגדל', 'הראל', 'מנורה', 'הפניקס', 'איילון'].map(
                                        (ins) => (
                                            <option key={ins} value={ins}>
                                                {ins}
                                            </option>
                                        )
                                    )}
                                </NeonSelect>

                                <NeonInput
                                    label="תאריך כניסה לתוקף"
                                    type="date"
                                    value={elementaryForm.effectiveDate}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        const endDate = new Date(
                                            new Date(newDate).setFullYear(
                                                new Date(newDate).getFullYear() + 1
                                            )
                                        )
                                            .toISOString()
                                            .split('T')[0];
                                        setElementaryForm({
                                            ...elementaryForm,
                                            effectiveDate: newDate,
                                            endDate,
                                        });
                                    }}
                                />

                                <NeonInput
                                    label="מועד סיום"
                                    type="date"
                                    value={elementaryForm.endDate}
                                    onChange={(e) =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            endDate: e.target.value,
                                        })
                                    }
                                />

                                <NeonInput
                                    label="פרמיה שנתית (₪)"
                                    type="number"
                                    value={elementaryForm.premium}
                                    onChange={(e) =>
                                        setElementaryForm({
                                            ...elementaryForm,
                                            premium: Number(e.target.value),
                                        })
                                    }
                                    placeholder="0.00"
                                />
                            </div>

                            <NeonButton
                                onClick={async () => {
                                    const newElem = {
                                        ...elementaryForm,
                                        id: Date.now().toString(),
                                        status: 'פעיל',
                                    } as ElementaryInsurance;

                                    const updatedList = [
                                        ...(client.elementaryInsurances || []),
                                        newElem,
                                    ];
                                    await saveData('elementaryInsurances', updatedList);
                                    toast.success(`ביטוח ${newElem.category} הוסף בהצלחה!`);

                                    // Reset
                                    setElementaryForm({
                                        category: 'רכב',
                                        type: 'חובה ומקיף',
                                        insurer: 'כלל',
                                        effectiveDate: new Date().toISOString().split('T')[0],
                                        endDate: new Date(
                                            new Date().setFullYear(new Date().getFullYear() + 1)
                                        )
                                            .toISOString()
                                            .split('T')[0],
                                        premium: 0,
                                        status: 'פעיל',
                                    });
                                }}
                                className="mt-10 w-full"
                            >
                                <Save size={20} className="ml-2" /> שמור ביטוח חדש
                            </NeonButton>
                        </NeonCard>

                        {/* List of existing elementary insurances */}
                        {client.elementaryInsurances?.length > 0 && (
                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                {client.elementaryInsurances.map((ins, i) => (
                                    <div
                                        key={ins.id}
                                        className="group relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-900/50 p-8 transition-all duration-300 hover:border-amber-500/30"
                                    >
                                        <div
                                            className={`absolute top-0 right-0 h-full w-2 ${ins.category === 'רכב' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
                                        />
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-6">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-slate-700 bg-slate-800 text-3xl shadow-inner transition-transform duration-500 group-hover:scale-110">
                                                    {ins.category === 'רכב' ? '🚗' : '🏠'}
                                                </div>
                                                <div>
                                                    <h5 className="text-2xl font-black tracking-tight text-white italic">
                                                        {ins.category === 'רכב'
                                                            ? `רכב - ${ins.manufacturer}`
                                                            : `דירה - ${ins.type}`}
                                                    </h5>
                                                    <p className="mt-1 text-xs font-black tracking-widest text-slate-500 uppercase">
                                                        {ins.insurer} • {ins.type}
                                                    </p>
                                                    <div className="mt-4 flex gap-4">
                                                        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-[10px] font-black text-amber-400">
                                                            ₪{ins.premium.toLocaleString()} / שנה
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-[10px] font-black text-slate-400">
                                                            {ins.effectiveDate} - {ins.endDate}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    deleteItem(
                                                        'elementaryInsurances' as any,
                                                        ins.id
                                                    )
                                                }
                                                className="rounded-2xl p-3 text-slate-700 transition-all hover:bg-red-500/10 hover:text-red-500"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- Tab Content: Policies --- */}
                {activeTab === 'פוליסות' && (
                    <div className="stagger-children space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white italic">תיק ביטוחי פעיל</h3>
                            <div className="flex gap-4">
                                <NeonButton 
                                    onClick={() => setShowImportModal(true)} 
                                    variant="secondary"
                                    className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                                >
                                    <Database size={16} className="ml-2" />
                                    ייבוא חכם (מסלקה/הר הביטוח)
                                </NeonButton>
                                <NeonButton onClick={() => handleEdit('policy')} variant="secondary">
                                    <Plus size={16} className="ml-2" /> הוסף פוליסה
                                    <span className="mr-2 text-[10px] font-black tracking-widest opacity-60">
                                        (תפעול בלבד)
                                    </span>
                                </NeonButton>
                            </div>
                        </div>
                        <div className="grid gap-8">
                            {client.policies.map((policy, index) => (
                                <NeonCard key={policy.id} className="group overflow-hidden p-0!">
                                    <div
                                        className={`h-2 bg-linear-to-r ${policy.color || 'from-indigo-500 via-purple-500 to-fuchsia-500'}`}
                                    />
                                    <div className="relative p-8">
                                        <div className="absolute top-8 left-8 flex gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                                            <button
                                                onClick={() => handleEdit('policy', policy)}
                                                className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 transition-all hover:border-amber-500/50 hover:bg-amber-500/20"
                                            >
                                                <Edit2 size={16} className="text-amber-400" />
                                            </button>
                                            <button
                                                onClick={() => deleteItem('policies', policy.id)}
                                                className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 transition-all hover:border-red-500/50 hover:bg-red-500/20"
                                            >
                                                <Trash2 size={16} className="text-red-400" />
                                            </button>
                                        </div>
                                        <div className="mb-8 flex items-start justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-110">
                                                    {policy.icon || '📄'}
                                                </div>
                                                <div>
                                                    <h4 className="text-2xl font-black tracking-tight text-white italic">
                                                        {policy.type}
                                                    </h4>
                                                    <p className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                                                        {policy.company} • {policy.policyNumber}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge
                                                className={`rounded-full border px-4 py-1 text-[10px] font-black tracking-widest uppercase ${policy.status === 'פעיל' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}
                                            >
                                                {policy.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-amber-500/30">
                                                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    פרמיה
                                                </p>
                                                <p className="text-xl font-black text-amber-500 italic">
                                                    {policy.premium}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all hover:border-blue-500/30">
                                                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    כיסוי
                                                </p>
                                                <p className="text-xl font-black text-white italic">
                                                    {policy.coverage}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    תחולה
                                                </p>
                                                <p className="font-black text-slate-300">
                                                    {policy.startDate}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                                                <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    חידוש
                                                </p>
                                                <p className="font-black text-slate-300">
                                                    {policy.renewalDate}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </NeonCard>
                            ))}
                            {client.policies.length === 0 && (
                                <div className="rounded-[3rem] border-2 border-dashed border-slate-800/50 bg-slate-900/20 py-24 text-center shadow-inner">
                                    <div className="mb-6 text-7xl opacity-10">📋</div>
                                    <p className="text-xl font-black text-slate-500 italic">
                                        אין פוליסות פעילות בתיק
                                    </p>
                                    <p className="mt-2 text-xs font-bold tracking-widest text-slate-600 uppercase">
                                        לחץ על "הוסף פוליסה" לעדכון ידני
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Tab Content: Documents --- */}
                {activeTab === 'מסמכים' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
                            <div>
                                <h4 className="text-xl font-black text-white italic">ניהול מסמכי ביטוח</h4>
                                <p className="text-xs font-bold text-slate-500 mt-1">כאן ניתן לנהל מסמכים ולהפיק דוחות השוואה חכמים</p>
                            </div>
                            <div className="flex gap-4">
                                <NeonButton onClick={() => setShowCancellationModal(true)} variant="secondary" className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20">
                                    <Mail size={18} className="ml-2" /> מכתב ביטול רשמי
                                </NeonButton>
                                <NeonButton onClick={() => setShowComparisonWizard(true)} variant="secondary">
                                    <FileText size={18} className="ml-2" /> יצירת דוח השוואה מהיר
                                </NeonButton>
                            </div>
                        </div>
                        <DocumentsTab
                            documents={client.documents || []}
                            onUpload={handleUploadDocument}
                            onDelete={handleDeleteDocument}
                            onUpdateDocument={(docId, updates) => {
                                const updatedDocs = client.documents.map((doc) =>
                                    doc.id === docId ? { ...doc, ...updates } : doc
                                );
                                saveData('documents', updatedDocs);
                                toast.success('המסמך עודכן בהצלחה');
                            }}
                        />

                        {/* Integrated Har Habituach Section */}
                        <div className="mt-12 border-t border-slate-800 pt-12">
                            <NeonCard title="🏔️ ייבוא נתונים מהר הביטוח">
                                <div className="grid items-center gap-8 md:grid-cols-2">
                                    <div>
                                        <p className="mb-6 leading-relaxed font-bold text-slate-400">
                                            העלה דוח מסלקה או הר הביטוח (Excel/PDF) כדי לזהות כפל
                                            ביטוחי, חוסרים בכיסוי והזדמנויות לחיסכון עבור הלקוח.
                                        </p>
                                        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-[10px] font-black tracking-widest text-amber-500 uppercase">
                                            <span>💡</span> המערכת תבצע ניתוח אוטומטי ותטמיע את הממצאים
                                            בתיק
                                        </div>
                                    </div>
                                    <div className="relative">
                                        {isAnalyzing ? (
                                            <div className="rounded-2.5xl flex animate-pulse flex-col items-center justify-center border border-slate-800 bg-slate-900/50 p-12">
                                                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                                                <span className="text-xs font-black tracking-[0.2em] text-indigo-400 uppercase">
                                                    מפענח נתונים...
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="group transition-all">
                                                <FileUpload
                                                    onUpload={handleUploadHarHabituach}
                                                    label="גרור דוח לכאן או לחץ לבחירה"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </NeonCard>

                            {client.externalPolicies && client.externalPolicies.length > 0 ? (
                                <NeonCard title="🔍 פוליסות חיצוניות שאותרו" className="mt-8">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-separate border-spacing-y-3 text-right">
                                            <thead>
                                                <tr className="px-4 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                    <th className="pr-6 pb-4">חברה</th>
                                                    <th className="pb-4">סוג מוצר</th>
                                                    <th className="pb-4">פרמיה</th>
                                                    <th className="pb-4">תום תקופה</th>
                                                    <th className="pb-4">סטטוס</th>
                                                    <th className="pb-4 pl-6 text-left">פעולות</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {client.externalPolicies.map((policy) => (
                                                    <tr
                                                        key={policy.id}
                                                        className="group transition-all hover:bg-slate-900/50"
                                                    >
                                                        <td className="rounded-r-2xl border-y border-r border-slate-900 py-5 pr-6 font-black text-white group-hover:border-slate-800">
                                                            {policy.company}
                                                        </td>
                                                        <td className="border-y border-slate-900 py-5 font-bold text-slate-400 group-hover:border-slate-800">
                                                            {policy.productType}
                                                        </td>
                                                        <td className="border-y border-slate-900 py-5 font-black text-amber-500 italic group-hover:border-slate-800">
                                                            {policy.premium}
                                                        </td>
                                                        <td className="border-y border-slate-900 py-5 text-xs font-bold text-slate-500 uppercase group-hover:border-slate-800">
                                                            {new Date(
                                                                policy.endDate
                                                            ).toLocaleDateString('he-IL')}
                                                        </td>
                                                        <td className="border-y border-slate-900 py-5 group-hover:border-slate-800">
                                                            <Badge className="border-slate-700 bg-slate-800 px-3 text-[10px] font-black text-slate-500 uppercase">
                                                                {policy.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="flex items-center justify-end gap-3 rounded-l-2xl border-y border-l border-slate-900 py-5 pl-6 group-hover:border-slate-800">
                                                            <NeonButton
                                                                onClick={() => handleImportLead(policy)}
                                                                size="sm"
                                                                variant="secondary"
                                                                className="px-5! py-2! text-[10px]!"
                                                            >
                                                                + צור ליד
                                                            </NeonButton>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteExternalPolicy(
                                                                        policy.id
                                                                    )
                                                                }
                                                                className="rounded-xl border border-transparent p-2.5 text-slate-600 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </NeonCard>
                            ) : null}
                        </div>
                    </div>
                )}
                {/* --- Tab Content: Communication --- */}
                {activeTab === 'תקשורת' && (
                    <div className="animate-in fade-in space-y-12 duration-700">
                        {/* Integrated Tasks Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-4">
                                <h4 className="text-3xl font-black tracking-tighter text-white italic">
                                    ⚡ משימות לביצוע
                                </h4>
                                <NeonButton
                                    onClick={() => handleEdit('task')}
                                    variant="secondary"
                                    size="sm"
                                >
                                    <Plus size={16} className="ml-2" /> משימה חדשה
                                </NeonButton>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {clientTasks.map((task) => {
                                    const priorityLabel =
                                        { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' }[
                                            task.priority as string
                                        ] || 'בינונית';
                                    const statusLabel =
                                        {
                                            pending: 'ממתינה',
                                            overdue: 'באיחור',
                                            completed: 'הושלמה',
                                            transferred: 'הועבר',
                                        }[task.status as string] || 'ממתינה';

                                    return (
                                        <NeonCard
                                            key={task.id}
                                            className="group p-6! transition-all hover:scale-[1.01]"
                                        >
                                            <div className="absolute top-6 left-6 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() =>
                                                        handleEdit('task', {
                                                            ...task,
                                                            priority: priorityLabel,
                                                            status: statusLabel,
                                                            dueDate: task.date,
                                                        })
                                                    }
                                                    className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-colors hover:text-amber-400"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem('tasks', task.id)}
                                                    className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-colors hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`mt-2 h-3 w-3 flex-shrink-0 rounded-full shadow-[0_0_10px_currentColor] ${
                                                        task.priority === 'high'
                                                            ? 'bg-red-500 text-red-500'
                                                            : task.priority === 'medium'
                                                              ? 'bg-amber-500 text-amber-500'
                                                              : 'bg-emerald-500 text-emerald-500'
                                                    }`}
                                                />
                                                <div className="flex-1 overflow-hidden text-right">
                                                    <h5 className="mb-3 truncate text-lg font-black tracking-tight text-white italic transition-colors group-hover:text-amber-500">
                                                        {task.title}
                                                    </h5>
                                                    <div className="flex flex-wrap gap-3 text-[9px] font-black tracking-widest text-slate-500 uppercase">
                                                        <span className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-1">
                                                            <span className="text-amber-500">📅</span>{' '}
                                                            {task.date || task.dueDate}
                                                        </span>
                                                        <span
                                                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                                                                statusLabel === 'הושלמה'
                                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                                    : statusLabel === 'באיחור'
                                                                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                                                                      : 'border-slate-800 bg-slate-900/50 text-slate-400'
                                                            }`}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </NeonCard>
                                    );
                                })}
                                {clientTasks.length === 0 && (
                                    <div className="col-span-full rounded-[2rem] border-2 border-dashed border-slate-800/30 bg-slate-900/10 py-12 text-center opacity-50">
                                        <p className="font-bold text-slate-600 italic">אין משימות פתוחות</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px w-full bg-linear-to-r from-transparent via-slate-800 to-transparent" />

                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
                            {/* Input Area */}
                            <div className="lg:col-span-1">
                                <NeonCard title="✍️ תיעוד אינטראקציה">
                                    <div className="space-y-6">
                                        <div className="flex gap-3">
                                            <NeonButton
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
                                                className="w-full text-xs!"
                                            >
                                                {isSpeechListening
                                                    ? 'עצור והפק תיעוד'
                                                    : '🎤 הקלט סיכום קולי'}
                                            </NeonButton>
                                        </div>

                                        {isVoiceSummarizing ? (
                                            <div className="flex animate-pulse items-center justify-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                                                    יוצר תיעוד AI...
                                                </span>
                                            </div>
                                        ) : null}

                                        <textarea
                                            className="rounded-2.5xl min-h-[200px] w-full border border-slate-800 bg-slate-900/50 p-5 text-sm font-bold text-white shadow-inner transition-all outline-none placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                                            placeholder="מה סוכם בשיחה? כתוב כאן..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                        />

                                        <NeonButton
                                            onClick={handleSaveNote}
                                            className="w-full py-6! text-lg! shadow-xl shadow-indigo-500/20"
                                        >
                                            <Save size={20} className="ml-2" /> שמור תיעוד בתיק
                                        </NeonButton>

                                        <p className="text-center text-[10px] leading-relaxed font-black tracking-widest text-slate-600 uppercase">
                                            התיעוד יישמר בציר הזמן לצמיתות
                                            <br />
                                            ויהיה גלוי לכל נציגי הסוכנות
                                        </p>
                                    </div>
                                </NeonCard>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-8 lg:col-span-2">
                                <h4 className="flex items-center gap-4 px-4 text-2xl font-black tracking-tight text-white italic">
                                    <span className="text-emerald-500">📅</span> היסטוריית התקשרויות
                                </h4>
                                <div className="relative space-y-6 before:absolute before:top-4 before:right-12 before:bottom-4 before:w-1 before:rounded-full before:bg-slate-800/50">
                                    {client.interactions && client.interactions.length > 0 ? (
                                        client.interactions.map((interaction) => (
                                            <div
                                                key={interaction.id}
                                                className="animate-in slide-in-from-right-8 relative z-10 mr-16 duration-500"
                                            >
                                                <div
                                                    className={`absolute top-8 right-[-44px] flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[#0d1326] text-xl shadow-2xl ${
                                                        interaction.type === 'whatsapp'
                                                            ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                                                            : interaction.type === 'email'
                                                              ? 'bg-blue-500 text-white shadow-blue-500/20'
                                                              : 'bg-amber-500 text-black shadow-amber-500/20'
                                                    }`}
                                                >
                                                    {interaction.type === 'whatsapp'
                                                        ? '💬'
                                                        : interaction.type === 'email'
                                                          ? '✉️'
                                                          : '📞'}
                                                </div>
                                                <NeonCard className="group cursor-default p-6! transition-all hover:border-amber-500/30">
                                                    <div className="mb-4 flex items-start justify-between">
                                                        <div>
                                                            <div className="mb-1 flex items-center gap-3">
                                                                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                                                    {interaction.date}
                                                                </span>
                                                                <Badge
                                                                    className={`rounded-md px-2 py-0.5 text-[8px] font-black uppercase ${interaction.direction === 'inbound' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                                                                >
                                                                    {interaction.direction ===
                                                                    'inbound'
                                                                        ? 'נכנס'
                                                                        : 'יוצא'}
                                                                </Badge>
                                                            </div>
                                                            <h5 className="text-lg leading-tight font-black tracking-tight text-white transition-colors group-hover:text-amber-500">
                                                                {interaction.summary}
                                                            </h5>
                                                        </div>
                                                        <Badge
                                                            className={`rounded-full border px-4 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                                interaction.sentiment === 'positive'
                                                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                                    : interaction.sentiment ===
                                                                        'negative'
                                                                      ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                                                      : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                                                            }`}
                                                        >
                                                            {interaction.sentiment === 'positive'
                                                                ? 'חיובי'
                                                                : interaction.sentiment ===
                                                                    'negative'
                                                                  ? 'שלילי'
                                                                  : 'ניטרלי'}
                                                        </Badge>
                                                    </div>
                                                </NeonCard>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="mr-12 rounded-[3rem] border-2 border-dashed border-slate-800/30 bg-slate-900/10 py-20 text-center shadow-inner">
                                            <div className="mb-6 text-6xl opacity-5 grayscale">
                                                📭
                                            </div>
                                            <p className="text-lg font-black text-slate-600 italic">
                                                אין תיעוד היסטורי במערכת
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* --- Tab Content: AI Insights --- */}
                {activeTab === 'תובנות AI' && (
                    <div className="animate-in fade-in space-y-10 duration-700">
                        {!client.aiInsights && (
                            <div className="relative overflow-hidden rounded-[3rem] border border-slate-800 bg-slate-900/40 py-24 text-center shadow-2xl">
                                <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent" />
                                <div className="relative z-10">
                                    <div className="mb-8 text-8xl">🧠</div>
                                    <h3 className="mb-4 text-4xl font-black tracking-tighter text-white italic">
                                        המערכת מוכנה לניתוח התיק
                                    </h3>
                                    <p className="mx-auto mb-10 max-w-lg leading-relaxed font-bold text-slate-400">
                                        האלגוריתם יסרוק את כל הפוליסות, הנתונים הפיננסיים והמסמכים
                                        כדי לאתר חוסרים, כפל ביטוחי והזדמנויות לחיסכון משמעותי.
                                    </p>
                                    <NeonButton
                                        onClick={handleGenerateAIInsights}
                                        disabled={isGeneratingInsights}
                                        className="px-12 py-8! text-xl! shadow-2xl shadow-indigo-500/20"
                                    >
                                        {isGeneratingInsights ? (
                                            <span className="flex items-center gap-3">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                מנתח נתונים ב-Real-time...
                                            </span>
                                        ) : (
                                            '✨ הרץ ניתוח AI מלא'
                                        )}
                                    </NeonButton>
                                </div>
                            </div>
                        )}

                        <div className="mb-12">
                            <GoldenShieldRiskAnalyzer 
                                policies={client.policies}
                                clientAge={calculateAge(client.birthDate || '')}
                            />
                        </div>

                        {client.aiInsights ? (
                            <div className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-3">
                                    <NeonCard className="border-t-4! border-t-red-500 shadow-red-500/5">
                                        <div className="mb-8 flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-500">
                                                🛡️
                                            </div>
                                            <h4 className="text-xl font-black tracking-tight text-white italic">
                                                פערי כיסוי (Gaps)
                                            </h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.gaps.map((gap: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="group rounded-2xl border border-slate-800/50 bg-slate-900 p-5 transition-all hover:border-red-500/30"
                                                >
                                                    <h5 className="mb-2 text-sm font-black tracking-wide text-red-400 uppercase">
                                                        {gap.title}
                                                    </h5>
                                                    <p className="text-xs leading-relaxed font-bold text-slate-500">
                                                        {gap.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </NeonCard>

                                    <NeonCard className="border-t-4! border-t-emerald-500 shadow-emerald-500/5">
                                        <div className="mb-8 flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl text-emerald-500">
                                                💰
                                            </div>
                                            <h4 className="text-xl font-black tracking-tight text-white italic">
                                                פוטנציאל חיסכון
                                            </h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.savings.map(
                                                (saving: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="group rounded-2xl border border-slate-800/50 bg-slate-900 p-5 transition-all hover:border-emerald-500/30"
                                                    >
                                                        <div className="mb-2 flex items-start justify-between">
                                                            <h5 className="text-sm font-black tracking-wide text-emerald-400 uppercase">
                                                                {saving.title}
                                                            </h5>
                                                            <Badge className="border-emerald-500/30 bg-emerald-500/20 text-[10px] font-black text-emerald-400">
                                                                {saving.amount}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs leading-relaxed font-bold text-slate-500">
                                                            {saving.description}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </NeonCard>

                                    <NeonCard className="border-t-4! border-t-purple-500 shadow-purple-500/5">
                                        <div className="mb-8 flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl text-purple-500">
                                                🚀
                                            </div>
                                            <h4 className="text-xl font-black tracking-tight text-white italic">
                                                הזדמנויות צמיחה
                                            </h4>
                                        </div>
                                        <div className="space-y-4">
                                            {client.aiInsights.opportunities.map(
                                                (opp: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="group rounded-2xl border border-slate-800/50 bg-slate-900 p-5 transition-all hover:border-purple-500/30"
                                                    >
                                                        <h5 className="mb-2 text-sm font-black tracking-wide text-purple-400 uppercase">
                                                            {opp.title}
                                                        </h5>
                                                        <p className="mb-4 text-xs leading-relaxed font-bold text-slate-500">
                                                            {opp.description}
                                                        </p>
                                                        <NeonButton
                                                            size="sm"
                                                            variant="secondary"
                                                            className="w-full py-2! text-[10px]!"
                                                        >
                                                            צור קשר עם הלקוח
                                                        </NeonButton>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </NeonCard>
                                </div>
                                <div className="pt-8 text-center">
                                    <button
                                        onClick={handleGenerateAIInsights}
                                        className="text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase transition-colors hover:text-indigo-400"
                                    >
                                        🔄 רענן ניתוח אלגוריתמי
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
                {activeTab === 'פיננסי' && (
                    <div className="animate-in fade-in space-y-8 duration-700">
                        {/* Financial Overview Cards using derived data */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            <NeonCard className="group relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-all group-hover:bg-emerald-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                                            💰
                                        </div>
                                        <Badge className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-300 uppercase">
                                            +2.5% צפי
                                        </Badge>
                                    </div>
                                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        סך פרמיות חודשי
                                    </p>
                                    <h3 className="text-4xl font-black tracking-tighter text-white italic">
                                        ₪
                                        {(
                                            client.policies.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.premium || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            ) +
                                            client.insuranceSales.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.premium || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            ) +
                                            client.pensionSales.reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(
                                                            curr.managementFeeDeposit || ''
                                                        ).replace(/[^\d.-]/g, '')
                                                    ) || 0),
                                                0
                                            )
                                        ).toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            <NeonCard className="group relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-all group-hover:bg-blue-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                                            🛡️
                                        </div>
                                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                            שווי ריאלי
                                        </span>
                                    </div>
                                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        שווי תיק ביטוחי
                                    </p>
                                    <h3 className="text-4xl font-black tracking-tighter text-white italic">
                                        ₪
                                        {client.policies
                                            .reduce(
                                                (acc, curr) =>
                                                    acc +
                                                    (parseFloat(
                                                        String(curr.coverage || '').replace(
                                                            /[^\d.-]/g,
                                                            ''
                                                        )
                                                    ) || 0),
                                                0
                                            )
                                            .toLocaleString()}
                                    </h3>
                                </div>
                            </NeonCard>

                            <NeonCard className="group relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl transition-all group-hover:bg-purple-500/10" />
                                <div className="relative z-10">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl">
                                            📊
                                        </div>
                                        <Badge className="rounded-full bg-purple-500/20 px-3 py-1 text-[10px] font-black tracking-widest text-purple-300 uppercase">
                                            {client.policies.length +
                                                client.pensionSales.length +
                                                client.insuranceSales.length}{' '}
                                            מוצרים
                                        </Badge>
                                    </div>
                                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                        חלוקת תיק מפורטת
                                    </p>
                                    <div className="mt-5 flex h-3 gap-1.5 overflow-hidden rounded-full border border-slate-800 bg-slate-900 p-0.5">
                                        <div
                                            className="rounded-full bg-emerald-500"
                                            style={{ width: '40%' }}
                                        />
                                        <div
                                            className="rounded-full bg-blue-500"
                                            style={{ width: '35%' }}
                                        />
                                        <div
                                            className="rounded-full bg-purple-500"
                                            style={{ width: '25%' }}
                                        />
                                    </div>
                                </div>
                            </NeonCard>
                        </div>

                        <div className="grid gap-10 lg:grid-cols-2">
                            <NeonCard title="📁 התפלגות פרמיות ומכירות">
                                <div className="custom-scrollbar max-h-[400px] space-y-4 overflow-y-auto pr-2">
                                    {[...client.policies, ...client.insuranceSales].length > 0 ? (
                                        [...client.policies, ...client.insuranceSales].map(
                                            (item, i) => (
                                                <div
                                                    key={i}
                                                    className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-indigo-500/30"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] ${i % 2 === 0 ? 'bg-indigo-500 text-indigo-500' : 'bg-amber-500 text-amber-500'}`}
                                                        />
                                                        <span className="text-sm font-black tracking-tight text-white italic">
                                                            {(item as any).type ||
                                                                (item as any).productType}
                                                        </span>
                                                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                                            {(item as any).company}
                                                        </span>
                                                    </div>
                                                    <span className="font-black tracking-tighter text-amber-500 italic">
                                                        {item.premium}
                                                    </span>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <div className="py-12 text-center font-black text-slate-500 italic opacity-30">
                                            אין נתונים מאוחסנים
                                        </div>
                                    )}
                                </div>
                            </NeonCard>

                            <NeonCard title="🔔 הזדמנויות עסקיות">
                                <div className="space-y-6">
                                    {client.pensionSales.length === 0 && (
                                        <div className="group flex items-start gap-5 rounded-[2rem] border border-red-500/20 bg-red-500/5 p-6 transition-all hover:bg-red-500/10">
                                            <div className="text-4xl transition-transform group-hover:scale-110">
                                                ⚠️
                                            </div>
                                            <div>
                                                <h5 className="mb-1 text-lg font-black tracking-tight text-red-400 italic">
                                                    חסר מוצר פנסיוני
                                                </h5>
                                                <p className="text-xs leading-relaxed font-bold text-slate-500">
                                                    ללקוח אין קופת גמל או קרן פנסיה פעילה בתיק.
                                                </p>
                                                <NeonButton
                                                    onClick={() => setActiveTab('לביצוע מכירת פרט')}
                                                    size="sm"
                                                    variant="secondary"
                                                    className="mt-4 text-[10px]!"
                                                >
                                                    טפל עכשיו
                                                </NeonButton>
                                            </div>
                                        </div>
                                    )}
                                    {!client.policies.some((p) => p.type.includes('בריאות')) && (
                                        <div className="group flex items-start gap-5 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 transition-all hover:bg-emerald-500/10">
                                            <div className="text-4xl transition-transform group-hover:scale-110">
                                                🏥
                                            </div>
                                            <div>
                                                <h5 className="mb-1 text-lg font-black tracking-tight text-emerald-400 italic">
                                                    הזדמנות לביטוחי בריאות
                                                </h5>
                                                <p className="text-xs leading-relaxed font-bold text-slate-500">
                                                    מומלץ להציע ביטוח משלים או פרטי ללקוח זה.
                                                </p>
                                                <NeonButton
                                                    onClick={() => setActiveTab('לביצוע מכירת פרט')}
                                                    size="sm"
                                                    variant="secondary"
                                                    className="mt-4 text-[10px]!"
                                                >
                                                    הצע פוליסה
                                                </NeonButton>
                                            </div>
                                        </div>
                                    )}
                                    <div className="group flex items-center gap-5 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 p-6 transition-all hover:bg-indigo-500/10">
                                        <div className="text-4xl transition-transform group-hover:scale-110">
                                            💡
                                        </div>
                                        <div>
                                            <h5 className="mb-1 text-lg font-black tracking-tight text-indigo-400 italic">
                                                ניצול הטבות מס
                                            </h5>
                                            <p className="text-xs leading-relaxed font-bold text-slate-500">
                                                ניתן להגדיל את ההפקדה החודשית לניצול מקסימלי של סעיף
                                                47.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </NeonCard>
                        </div>
                    </div>
                )}


                {/* --- Unified Edit Modal --- */}
                {editMode ? (
                    <NeonModal
                        isOpen={!!editMode}
                        onClose={() => setEditMode(null)}
                        title={
                            editMode.type === 'family'
                                ? '👥 עריכת בן משפחה'
                                : editMode.type === 'policy'
                                  ? '📄 פרטי פוליסה'
                                  : editMode.type === 'task'
                                    ? '📅 ניהול משימה'
                                    : editMode.type === 'clientDetails'
                                      ? '👤 פרטים מזהים'
                                      : '📝 עריכת נוספים'
                        }
                        onSave={handleSaveModal}
                        saveLabel="שמור שינויים"
                        maxWidth="max-w-2xl"
                    >
                        {/* Family Member Edit */}
                        {editMode.type === 'family' && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <NeonInput
                                    label="שם מלא"
                                    value={formData.name || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="קרבה"
                                    value={formData.relation || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, relation: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="גיל"
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, age: e.target.value })
                                    }
                                />
                                <NeonSelect
                                    label="מבוטח?"
                                    value={formData.insured ? 'כן' : 'לא'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            insured: e.target.value === 'כן',
                                        })
                                    }
                                >
                                    <option value="לא">לא</option>
                                    <option value="כן">כן</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Task Edit */}
                        {editMode.type === 'task' && (
                            <div className="space-y-6">
                                <NeonInput
                                    label="נושא המשימה"
                                    value={formData.title || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                />
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonInput
                                        label="תאריך יעד"
                                        type="date"
                                        value={formData.dueDate || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, dueDate: e.target.value })
                                        }
                                    />
                                    <NeonSelect
                                        label="עדיפות"
                                        value={formData.priority || 'בינונית'}
                                        onChange={(e) =>
                                            setFormData({ ...formData, priority: e.target.value })
                                        }
                                    >
                                        <option value="נמוכה">נמוכה</option>
                                        <option value="בינונית">בינונית</option>
                                        <option value="גבוהה">גבוהה</option>
                                    </NeonSelect>
                                </div>
                                <NeonSelect
                                    label="סטטוס"
                                    value={formData.status || 'ממתינה'}
                                    onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value })
                                    }
                                >
                                    <option value="ממתינה">ממתינה</option>
                                    <option value="בתהליך">בתהליך</option>
                                    <option value="הושלמה">הושלמה</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Policy Edit */}
                        {editMode.type === 'policy' && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <NeonInput
                                    label="סוג מוצר"
                                    value={formData.type || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, type: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="חברה"
                                    value={formData.company || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, company: e.target.value })
                                    }
                                />
                                <NeonInput label="מספר פוליסה" value={formData.id || ''} readOnly />
                                <NeonInput
                                    label="פרמיה חודשית"
                                    value={formData.premium || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, premium: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="סכום כיסוי"
                                    value={formData.coverage || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, coverage: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="תאריך סיום"
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, endDate: e.target.value })
                                    }
                                />
                            </div>
                        )}

                        {/* Client Details Edit */}
                        {editMode.type === 'clientDetails' && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <NeonInput
                                    label="מספר זהות"
                                    value={formData.idNumber || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, idNumber: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="תאריך לידה"
                                    type="date"
                                    value={formData.birthDate || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, birthDate: e.target.value })
                                    }
                                />
                                <NeonInput
                                    label="תאריך הנפקת ת.ז"
                                    type="date"
                                    value={formData.idIssueDate || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, idIssueDate: e.target.value })
                                    }
                                />
                                <NeonSelect
                                    label="האם מעשן"
                                    value={formData.isSmoker ? 'כן' : 'לא'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isSmoker: e.target.value === 'כן',
                                        })
                                    }
                                >
                                    <option value="לא">לא</option>
                                    <option value="כן">כן</option>
                                </NeonSelect>
                            </div>
                        )}

                        {/* Additional Details Edit */}
                        {editMode.type === 'additionalDetails' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonSelect
                                        label="קופת חולים"
                                        value={formData.healthFund || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, healthFund: e.target.value })
                                        }
                                    >
                                        <option value="">בחר...</option>
                                        <option value="כללית">כללית</option>
                                        <option value="מכבי">מכבי</option>
                                        <option value="מאוחדת">מאוחדת</option>
                                        <option value="לאומית">לאומית</option>
                                    </NeonSelect>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <NeonSelect
                                        label="תנאי תשלום"
                                        value={formData.paymentTerms || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                paymentTerms: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="">בחר...</option>
                                        <option value="העברה">העברה</option>
                                        <option value="אשראי">אשראי</option>
                                        <option value="הוראת קבע">הוראת קבע</option>
                                    </NeonSelect>
                                    <NeonInput
                                        label="דואר אלקטרוני"
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>

                                <NeonInput
                                    label="חיפוש לקוח מקושר"
                                    placeholder="חפש לפי שם או ת.ז..."
                                    value={clientSearchQuery}
                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                />

                                {clientSearchQuery && filteredClients.length > 0 ? (
                                    <div className="max-h-40 overflow-hidden overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900">
                                        {filteredClients.slice(0, 5).map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        linkedClientId: c.id,
                                                        linkedClientName: c.name,
                                                    });
                                                    setClientSearchQuery('');
                                                }}
                                                className="w-full border-b border-slate-800 px-6 py-3 text-right text-sm font-bold text-white last:border-b-0 hover:bg-slate-800"
                                            >
                                                {c.name}{' '}
                                                <span className="mr-2 text-xs text-slate-500">
                                                    {c.idNumber}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}

                                {formData.linkedClientName ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 px-6 py-3">
                                        <span className="font-bold text-amber-400">
                                            מקושר ל: {formData.linkedClientName}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    linkedClientId: undefined,
                                                    linkedClientName: undefined,
                                                })
                                            }
                                            className="text-red-400 hover:text-red-500"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </NeonModal>
                ) : null}

            <PensionAnalysisWizard
                isOpen={showMarketModal}
                onClose={() => setShowMarketModal(false)}
                clientData={client}
                onSaveAnalysis={async (result) => {
                    if (id) {
                        try {
                            await firestoreService.addPensionAnalysis(id as string, result);
                            toast.success('ניתוח פנסיוני נשמר בהצלחה בכרטיס הלקוח');
                        } catch (error) {
                            console.error('Error saving pension analysis:', error);
                            toast.error('שגיאה בשמירת הניתוח');
                        }
                    }
                }}
            />
                {/* --- Referral Modal --- */}
                {showReferralModal ? <NeonModal
                        isOpen={showReferralModal}
                        onClose={() => setShowReferralModal(false)}
                        title="🚀 הפניית לקוח לגורם מקצועי"
                        maxWidth="max-w-md"
                        hideFooter
                    >
                        <div className="space-y-8 text-center">
                            <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-inner">
                                <Share2 size={40} />
                            </div>
                            <div>
                                <h3 className="mb-3 text-2xl font-black text-white italic tracking-tight">לאן תרצה להפנות?</h3>
                                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                    המערכת תשלח מייל אוטומטי עם פרטי הלקוח לגורם הרלוונטי ותתעד את ההפניה בתיק הלקוח.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    { label: 'ביטוח אלמנטרי', icon: '🚗', color: 'hover:border-red-500/30' },
                                    { label: 'החזרי מס', icon: '💰', color: 'hover:border-emerald-500/30' },
                                    { label: 'תכנון פרישה', icon: '📈', color: 'hover:border-amber-500/30' },
                                    { label: 'כתב שירות תלפיות', icon: '📄', color: 'hover:border-blue-500/30' },
                                ].map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => handleReferral(option.label)}
                                        className={`group flex items-center justify-between p-5 bg-slate-900 border border-slate-800 rounded-2.5xl transition-all ${option.color}`}
                                    >
                                        <span className="font-black text-white italic group-hover:text-amber-500 transition-colors">
                                            {option.label}
                                        </span>
                                        <span className="text-3xl transition-transform group-hover:scale-110 grayscale group-hover:grayscale-0">
                                            {option.icon}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </NeonModal> : null}
            </div>
            {/* --- Modals --- */}
            <InsuranceComparisonWizard 
                isOpen={showComparisonWizard}
                onClose={() => setShowComparisonWizard(false)}
                clientData={{
                    id: client.id,
                    name: client.name,
                    age: calculateAge(client.birthDate || ''),
                    currentPremium: totalPremium,
                    policies: client.policies.map((p) => ({
                        type: p.type,
                        company: p.company,
                        premium: parseInt(p.premium.replace(/[^\d]/g, '')),
                    })),
                }}
                onSaveReport={handleSaveComparisonReport}
            />

            {/* Smart Insurance Import Modal */}
            <InsuranceImportModal 
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportComplete={handleImportComplete}
            />

            <CancellationLetterModal 
                isOpen={showCancellationModal}
                onClose={() => setShowCancellationModal(false)}
                clientData={{
                    ...client,
                    spouseId: client.family?.find(f => f.relation.includes('בן זוג'))?.idNumber || ''
                }}
            />
        </DashboardShell>
    );
}

// --- Documents Tab Component ---
function DocumentsTab({
    documents,
    onUpload,
    onDelete,
    onUpdateDocument,
}: {
    documents: ClientDocument[];
    onUpload: (
        file: File,
        metadata?: { documentType?: string; producer?: string; documentName?: string }
    ) => void;
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

    const DOCUMENT_TYPES = ['אישי', 'רפואי', 'ביטוחי', 'פנסיוני'];
    const PRODUCERS = [
        'הפניקס',
        'כלל',
        'מגדל',
        'מנורה',
        'איילון',
        'הכשרה',
        'מור',
        'אלטשולר',
        'מיטב דש',
        'אחר',
    ];
    const STATUSES = ['נשמר', 'נשלח לחברה', 'תקין', 'התקבל חלקית'];

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setUploadFormData((prev) => ({
            ...prev,
            documentName: file.name.replace(/\.[^/.]+$/, ''),
        }));
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

    return (
        <div className="animate-in fade-in space-y-8 duration-700">
            {/* Upload Area */}
            <NeonCard className="p-8!">
                <FileUpload
                    onUpload={handleFileSelect}
                    label="גרור מסמכים לכאן (ת.ז, פוליסות, טפסים)"
                />
            </NeonCard>

            {/* Upload Form Modal */}
            {showUploadForm && selectedFile ? (
                <NeonModal
                    isOpen={showUploadForm}
                    onClose={() => {
                        setShowUploadForm(false);
                        setSelectedFile(null);
                    }}
                    title="📄 פרטי המסמך החדש"
                    onSave={handleUploadSubmit}
                    saveLabel="העלה מסמך"
                >
                    <div className="space-y-6">
                        <NeonInput
                            label="שם המסמך *"
                            value={uploadFormData.documentName}
                            onChange={(e) =>
                                setUploadFormData((prev) => ({
                                    ...prev,
                                    documentName: e.target.value,
                                }))
                            }
                        />

                        <div className="grid grid-cols-2 gap-6">
                            <NeonSelect
                                label="סוג מסמך *"
                                value={uploadFormData.documentType || 'אישי'}
                                onChange={(e) =>
                                    setUploadFormData((prev) => ({
                                        ...prev,
                                        documentType: e.target.value as any,
                                    }))
                                }
                            >
                                {DOCUMENT_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </NeonSelect>

                            <NeonSelect
                                label="יצרן"
                                value={uploadFormData.producer || ''}
                                onChange={(e) =>
                                    setUploadFormData((prev) => ({
                                        ...prev,
                                        producer: e.target.value as any,
                                    }))
                                }
                            >
                                <option value="">בחר יצרן...</option>
                                {PRODUCERS.map((producer) => (
                                    <option key={producer} value={producer}>
                                        {producer}
                                    </option>
                                ))}
                            </NeonSelect>
                        </div>

                        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black tracking-tight text-white">
                                    {selectedFile.name}
                                </p>
                                <p className="mt-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    </div>
                </NeonModal>
            ) : null}

            {/* Documents List */}
            <div className="grid gap-4">
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <NeonCard key={doc.id} className="group p-5!">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-1 items-start gap-5">
                                    <div className="rounded-2.5xl flex h-16 w-16 items-center justify-center border border-slate-800 bg-slate-900 text-slate-400 transition-colors group-hover:text-amber-500">
                                        <FileText size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="mb-3 text-lg font-black tracking-tight text-white transition-colors group-hover:text-amber-500">
                                            {doc.name}
                                        </h4>

                                        <div className="mb-4 flex flex-wrap gap-3">
                                            {doc.documentType ? (
                                                <Badge
                                                    className={`rounded-lg px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                        doc.documentType === 'אישי'
                                                            ? 'bg-blue-500/10 text-blue-400'
                                                            : doc.documentType === 'רפואי'
                                                              ? 'bg-red-500/10 text-red-400'
                                                              : doc.documentType === 'ביטוחי'
                                                                ? 'bg-purple-500/10 text-purple-400'
                                                                : 'bg-emerald-500/10 text-emerald-400'
                                                    }`}
                                                >
                                                    {doc.documentType}
                                                </Badge>
                                            ) : null}
                                            {doc.producer ? (
                                                <Badge className="rounded-lg bg-slate-800 px-3 py-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                    🏢 {doc.producer}
                                                </Badge>
                                            ) : null}
                                            {doc.status ? (
                                                <Badge
                                                    className={`rounded-lg border px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                        doc.status === 'תקין'
                                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                            : doc.status === 'נשלח לחברה'
                                                              ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                                                              : 'border-slate-700 bg-slate-800 text-slate-500'
                                                    }`}
                                                >
                                                    {doc.status}
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap gap-6 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                            <span>📅 {doc.date}</span>
                                            <span>💾 {doc.size}</span>
                                            {doc.uploadedBy ? (
                                                <span>👤 {doc.uploadedBy}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <select
                                        value={doc.status || 'נשמר'}
                                        onChange={(e) =>
                                            onUpdateDocument(doc.id, {
                                                status: e.target.value as any,
                                            })
                                        }
                                        className="h-10 rounded-xl border border-slate-800 bg-slate-900 px-4 text-[10px] font-black tracking-widest text-slate-300 uppercase transition-all outline-none hover:bg-slate-800 focus:border-amber-500/50"
                                    >
                                        {STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <a
                                        href={doc.url}
                                        download={doc.name}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 transition-all hover:bg-amber-500/20 hover:text-amber-500"
                                        title="הורד"
                                    >
                                        <Download size={18} />
                                    </a>
                                    <button
                                        onClick={() => onDelete(doc.id)}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 transition-all hover:bg-red-500/20 hover:text-red-500"
                                        title="מחק"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </NeonCard>
                    ))
                ) : (
                    <div className="rounded-[3rem] border-2 border-dashed border-slate-800/30 bg-slate-900/10 py-24 text-center shadow-inner">
                        <div className="mb-6 text-7xl opacity-5 grayscale">📁</div>
                        <p className="text-lg font-black tracking-tight text-slate-600 italic">
                            אין מסמכים מאוחסנים בתיק
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
