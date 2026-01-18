'use client';

import {
    Copy,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Check,
    RefreshCw,
    Power,
    MoreHorizontal,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { generateWithGemini, getGeminiStatus } from '@/app/actions/gemini';
import { Card, Button, Badge } from '@/components/ui/base';
import DashboardShell from '@/components/ui/dashboard-shell';
import { ADMIN_NAV_ITEMS } from '@/lib/navigation-config';

// Types
type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'פעיל' | 'לא פעיל';
};

type Integration = {
    id: string;
    name: string;
    icon: string;
    status: 'מחובר' | 'לא מחובר';
    color: string;
    lastSync?: string;
};

type AgencySettings = {
    name: string;
    color: string;
    logo: string | null;
};

// Initial Data
const INITIAL_TEAM: TeamMember[] = [
    { id: '1', name: 'רועי כהן', email: 'roei@insurcrm.com', role: 'נציג מכירות', status: 'פעיל' },
    {
        id: '2',
        name: 'מיכל לוי',
        email: 'michal@insurcrm.com',
        role: 'מנהלת תיקי לקוחות',
        status: 'פעיל',
    },
    { id: '3', name: 'דני אברהם', email: 'danny@insurcrm.com', role: 'סוכן ביטוח', status: 'פעיל' },
];

const INITIAL_INTEGRATIONS: Integration[] = [
    {
        id: 'whatsapp',
        name: 'WhatsApp Business API',
        icon: '💬',
        status: 'לא מחובר',
        color: 'emerald',
    },
    { id: 'sms', name: 'SMS Gateway', icon: '📱', status: 'לא מחובר', color: 'blue' },
    {
        id: 'email',
        name: 'Email Service (SMTP)',
        icon: '📧',
        status: 'מחובר',
        color: 'indigo',
        lastSync: '2024-01-15 14:30',
    },
    { id: 'gcal', name: 'Google Calendar', icon: '📅', status: 'לא מחובר', color: 'orange' },
    { id: 'external_crm', name: 'CRM External', icon: '🔗', status: 'לא מחובר', color: 'slate' },
];

export default function AgencyManagementPage() {
    const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
    const [activeTab, setActiveTab] = useState('צוות וסוכנים');

    // Persistent State
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [settings, setSettings] = useState<AgencySettings>({
        name: 'Magen Zahav',
        color: 'indigo',
        logo: null,
    });

    // Field & Automation State (Persisted)
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [automations, setAutomations] = useState<any[]>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [teamForm, setTeamForm] = useState<Partial<TeamMember>>({
        name: '',
        email: '',
        role: 'נציג מכירות',
        status: 'פעיל',
    });

    // AI Builders State
    const [fieldInput, setFieldInput] = useState('');
    const [isGeneratingField, setIsGeneratingField] = useState(false);
    const [generatedField, setGeneratedField] = useState<any>(null);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [manualField, setManualField] = useState({
        label: '',
        type: 'text',
        options: [],
        description: '',
    });

    const [automationInput, setAutomationInput] = useState('');
    const [isGeneratingAutomation, setIsGeneratingAutomation] = useState(false);
    const [automationChat, setAutomationChat] = useState<
        { role: 'user' | 'ai'; content: string }[]
    >([
        {
            role: 'ai',
            content: 'היי! אני בונה האוטומציות. תאר לי מה תרצה שיקרה ואני אבנה את הלוגיקה.',
        },
    ]);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
    const [manualAutomation, setManualAutomation] = useState({
        title: '',
        desc: '',
        icon: '⚡',
        active: true,
    });
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Menu is closed via overlay clicks so the global listener is not needed

    // --- Persistence Effects ---
    useEffect(() => {
        // Load Data
        const load = (key: string, fallback: any) => {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : fallback;
        };

        setTeam(load('agency_team', INITIAL_TEAM));
        setIntegrations(load('agency_integrations', INITIAL_INTEGRATIONS));
        setSettings(load('agency_settings', { name: 'Magen Zahav', color: 'indigo', logo: null }));
        setCustomFields(
            load('agency_fields', [
                {
                    id: '1',
                    label: 'תאריך הצטרפות',
                    type: 'date',
                    description: 'תאריך התחלת פעילות בסוכנות',
                },
                {
                    id: '2',
                    label: 'מקור ליד',
                    type: 'select',
                    options: ['פייסבוק', 'גוגל', 'חבר מביא חבר'],
                    description: 'מהיכן הגיע הלקוח',
                },
            ])
        );
        setAutomations(
            load('agency_automations', [
                {
                    title: 'חלוקת לידים אוטומטית (Round Robin)',
                    desc: 'ליד חדש נכנס -> הקצאה אוטומטית לסוכן הבא בתור',
                    active: true,
                    icon: '⚖️',
                },
                {
                    title: 'ברכת יום הולדת',
                    desc: 'יום הולדת ללקוח -> שלח הודעת ברכה אישית בוואטסאפ',
                    active: true,
                    icon: '🎂',
                },
            ])
        );

        getGeminiStatus()
            .then((s) => setIsGeminiConfigured(Boolean(s.configured)))
            .catch(() => setIsGeminiConfigured(false));

        setIsLoading(false);
    }, []);

    // Save Data Effects
    useEffect(() => {
        if (!isLoading) localStorage.setItem('agency_team', JSON.stringify(team));
    }, [team, isLoading]);
    useEffect(() => {
        if (!isLoading) localStorage.setItem('agency_integrations', JSON.stringify(integrations));
    }, [integrations, isLoading]);
    useEffect(() => {
        if (!isLoading) localStorage.setItem('agency_settings', JSON.stringify(settings));
    }, [settings, isLoading]);
    useEffect(() => {
        if (!isLoading) localStorage.setItem('agency_fields', JSON.stringify(customFields));
    }, [customFields, isLoading]);
    useEffect(() => {
        if (!isLoading) localStorage.setItem('agency_automations', JSON.stringify(automations));
    }, [automations, isLoading]);

    // --- Handlers ---

    // Team Management
    const handleSaveTeamMember = () => {
        if (!teamForm.name || !teamForm.email) return;

        if (editingMember) {
            setTeam(
                team.map((m) =>
                    m.id === editingMember.id ? ({ ...m, ...teamForm } as TeamMember) : m
                )
            );
        } else {
            const newMember: TeamMember = {
                id: Date.now().toString(),
                name: teamForm.name!,
                email: teamForm.email!,
                role: teamForm.role || 'נציג מכירות',
                status: teamForm.status || 'פעיל',
            };
            setTeam([...team, newMember]);
        }
        closeTeamModal();
    };

    const handleDeleteTeamMember = (id: string) => {
        if (confirm('האם למחוק איש צוות זה?')) {
            setTeam(team.filter((m) => m.id !== id));
        }
    };

    const openTeamModal = (member?: TeamMember) => {
        if (member) {
            setEditingMember(member);
            setTeamForm(member);
        } else {
            setEditingMember(null);
            setTeamForm({ name: '', email: '', role: 'נציג מכירות', status: 'פעיל' });
        }
        setIsTeamModalOpen(true);
    };

    const closeTeamModal = () => {
        setIsTeamModalOpen(false);
        setEditingMember(null);
    };

    // Integrations
    const toggleIntegration = (id: string) => {
        setIntegrations(
            integrations.map((int) => {
                if (int.id === id) {
                    const newStatus = int.status === 'מחובר' ? 'לא מחובר' : 'מחובר';
                    return {
                        ...int,
                        status: newStatus,
                        lastSync:
                            newStatus === 'מחובר' ? new Date().toLocaleString('he-IL') : undefined,
                    };
                }
                return int;
            })
        );
    };

    // Settings
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings((prev) => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    // AI Handlers (Same as before, simplified for brevity)
    const handleGenerateField = async () => {
        if (!fieldInput.trim()) {
            toast.error('אנא תאר את השדה שברצונך ליצור');
            return;
        }

        setIsGeneratingField(true);
        setGeneratedField(null);

        try {
            // If API not configured, show demo
            if (!isGeminiConfigured) {
                setTimeout(() => {
                    setGeneratedField({
                        label: 'שדה דמו - ' + fieldInput.substring(0, 20),
                        type: 'text',
                        description: 'זהו שדה הדגמה. הגדר GEMINI_API_KEY לשימוש באמת',
                    });
                    toast.info('זוהי הדגמה - הגדר API key לפונקציונליות מלאה');
                    setIsGeneratingField(false);
                }, 1000);
                return;
            }

            const prompt = `You are a CRM field generator. Create a field schema based on this request in Hebrew: "${fieldInput}".

Rules:
1. The label must be in Hebrew
2. Description must be in Hebrew and explain the field's purpose
3. Type must be one of: "text", "number", "select", "date"
4. If type is "select", include an "options" array with Hebrew options
5. Return ONLY valid JSON, no markdown formatting

Required JSON format:
{
  "label": "Hebrew field name",
  "type": "text|number|select|date",
  "options": ["option1", "option2"],
  "description": "Hebrew description of what this field is for"
}`;

            const result = await generateWithGemini(prompt);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            // Clean the response text
            let jsonText = result.text.trim();

            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Find JSON object in the response
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('לא נמצא JSON תקין בתגובה');
            }

            const parsedField = JSON.parse(jsonMatch[0]);

            // Validate required fields
            if (!parsedField.label || !parsedField.type || !parsedField.description) {
                throw new Error('השדה שנוצר חסר שדות נדרשים');
            }

            // Validate type
            const validTypes = ['text', 'number', 'select', 'date'];
            if (!validTypes.includes(parsedField.type)) {
                parsedField.type = 'text'; // fallback
            }

            setGeneratedField(parsedField);
            toast.success('השדה נוצר בהצלחה! ניתן לאשר או לבטל');
        } catch (e) {
            console.error('Field generation error:', e);
            toast.error(e instanceof Error ? e.message : 'שגיאה ביצירת השדה. נסה שוב');
        } finally {
            setIsGeneratingField(false);
        }
    };

    const handleGenerateAutomation = async () => {
        if (!automationInput.trim()) {
            toast.error('אנא תאר את האוטומציה שברצונך ליצור');
            return;
        }

        const msg = automationInput;
        setAutomationChat((p) => [...p, { role: 'user', content: msg }]);
        setAutomationInput('');
        setIsGeneratingAutomation(true);

        try {
            // If API not configured, show demo
            if (!isGeminiConfigured) {
                setTimeout(() => {
                    const demoAuto = {
                        title: 'אוטומציה דמו - ' + msg.substring(0, 25),
                        desc: 'זוהי אוטומציה להדגמה. הגדר GEMINI_API_KEY לשימוש באמת',
                        icon: '🤖',
                        active: true,
                        id: Date.now(),
                    };
                    setAutomations((p) => [...p, demoAuto]);
                    setAutomationChat((p) => [
                        ...p,
                        {
                            role: 'ai',
                            content: `💡 הדגמה: יצרתי "${demoAuto.title}". הגדר API key לפונקציונליות מלאה.`,
                        },
                    ]);
                    toast.info('זוהי הדגמה - הגדר API key לפונקציונליות מלאה');
                    setIsGeneratingAutomation(false);
                }, 1500);
                return;
            }

            const prompt = `You are an automation architect for a CRM system. Create an automation based on this request in Hebrew: "${msg}".

Rules:
1. All text fields must be in Hebrew
2. Icon must be a single emoji that represents the automation
3. Return ONLY valid JSON, no markdown formatting

Required JSON format:
{
  "title": "Hebrew title of automation",
  "desc": "Hebrew description of what this automation does",
  "icon": "single emoji",
  "active": true
}`;

            const result = await generateWithGemini(prompt);

            if (result.error) {
                setAutomationChat((p) => [...p, { role: 'ai', content: `שגיאה: ${result.error}` }]);
                toast.error(result.error);
                return;
            }

            // Clean the response
            let jsonText = result.text.trim();
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Find JSON object
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('לא נמצא JSON תקין בתגובה');
            }

            const newAuto = JSON.parse(jsonMatch[0]);

            // Validate
            if (!newAuto.title || !newAuto.desc) {
                throw new Error('האוטומציה חסרה שדות נדרשים');
            }

            setAutomations((p) => [...p, { ...newAuto, id: Date.now() }]);
            setAutomationChat((p) => [
                ...p,
                { role: 'ai', content: `✅ בוצע! הוספתי אוטומציה: "${newAuto.title}"` },
            ]);
            toast.success('אוטומציה נוספה בהצלחה!');
        } catch (e) {
            console.error('Automation generation error:', e);
            const errorMsg = e instanceof Error ? e.message : 'שגיאה ביצירת האוטומציה';
            setAutomationChat((p) => [...p, { role: 'ai', content: `❌ ${errorMsg}` }]);
            toast.error(errorMsg);
        } finally {
            setIsGeneratingAutomation(false);
        }
    };

    const tabs = [
        { id: 'צוות וסוכנים', label: 'צוות וסוכנים', icon: '👥' },
        { id: 'שדות מותאמים', label: 'שדות מותאמים', icon: '📝' },
        { id: 'אוטומציות', label: 'אוטומציות', icon: '⚡' },
        { id: 'הגדרות מערכת', label: 'הגדרות מערכת', icon: '⚙️' },
    ];

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="animate-in fade-in space-y-8 duration-1000" dir="rtl">
                {/* Header */}
                <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-primary font-display text-3xl font-black tracking-tight italic">
                            ניהול סוכנות
                        </h2>
                        <p className="font-medium text-slate-500">
                            ניהול {settings.name}, צוות, ואוטומציות
                        </p>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
                        <div
                            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-colors ${isGeminiConfigured ? 'border-emerald-200' : ''}`}
                        >
                            <span
                                className={`h-2 w-2 animate-pulse rounded-full ${isGeminiConfigured ? 'bg-emerald-500' : 'bg-red-400'}`}
                            />
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                                {isGeminiConfigured ? 'GEMINI פעיל' : 'GEMINI חסר'}
                            </span>
                        </div>
                    </div>

                    {!isGeminiConfigured ? (
                        <div className="glass-card flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 shadow-lg shadow-amber-500/20">
                            <div className="h-3 w-3 animate-pulse rounded-full bg-red-400" />
                            <div className="text-xs font-bold">
                                חסר מפתח Gemini. הוסף GEMINI_API_KEY בקובץ .env.local כדי לאפשר את
                                יכולות ה-AI והאוטומציות.
                            </div>
                        </div>
                    ) : null}
                </header>

                <div className="border-b border-slate-200">
                    <nav className="no-scrollbar flex gap-8 overflow-x-auto pb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-1 pb-4 text-sm font-black transition-all ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{tab.icon}</span>
                                    {tab.label}
                                </span>
                                {activeTab === tab.id && (
                                    <div className="animate-in slide-in-from-bottom-1 absolute right-0 bottom-0 left-0 h-1 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)] transition-all" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-8 transition-all duration-500 ease-out">
                    {activeTab === 'צוות וסוכנים' && (
                        <div className="animate-in fade-in slide-in-from-top-4 space-y-6 duration-500">
                            <div className="flex items-center justify-between rounded-[2rem] border border-amber-500/30 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-slate-950/90 px-8 py-6 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.7)]">
                                <Button
                                    onClick={() => openTeamModal()}
                                    className="gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-8 font-black text-amber-900 italic shadow-xl shadow-amber-500/30"
                                >
                                    <Plus size={16} /> הוסף חבר צוות
                                </Button>
                                <div className="text-right">
                                    <h3 className="text-lg font-black text-amber-200 italic drop-shadow-[0_0_18px_rgba(251,191,36,0.45)]">
                                        ניהול צוות הסוכנות
                                    </h3>
                                    <p className="text-xs font-bold text-slate-200">
                                        הוסף וערוך סוכנים, מפיקים ומנהלים
                                    </p>
                                </div>
                            </div>

                            <Card className="overflow-hidden rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 shadow-xl">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="border-b border-slate-50">
                                            <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                שם
                                            </th>
                                            <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                תפקיד
                                            </th>
                                            <th className="px-8 py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                אימייל
                                            </th>
                                            <th className="px-8 py-6 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                סטטוס
                                            </th>
                                            <th className="px-8 py-6 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                                פעולות
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {team.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="group transition-all hover:bg-amber-500/5 hover:shadow-[0_0_25px_rgba(251,191,36,0.25)]"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-slate-800/70 text-xs font-black text-amber-200 shadow-inner transition-colors group-hover:bg-slate-700">
                                                            {member.name
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <p className="font-bold text-slate-100 drop-shadow-[0_0_14px_rgba(251,191,36,0.45)] transition-colors group-hover:text-amber-200">
                                                            {member.name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black tracking-tighter text-slate-300 uppercase italic">
                                                        {member.role}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-6 font-mono text-[11px] text-slate-200">
                                                    {member.email}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`border-none text-[9px] font-black shadow-sm ${member.status === 'פעיל' ? 'border border-emerald-400/40 bg-emerald-500/20 text-emerald-200' : 'border border-slate-700 bg-slate-800/70 text-slate-200'}`}
                                                    >
                                                        {member.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-left">
                                                    <div className="relative flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setActiveMenuId((prev) =>
                                                                    prev === member.id
                                                                        ? null
                                                                        : member.id
                                                                );
                                                            }}
                                                            className="rounded-full bg-white/80 p-2 text-slate-300 transition-colors hover:bg-white hover:text-amber-400"
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </button>
                                                        {activeMenuId === member.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-20"
                                                                    onClick={() =>
                                                                        setActiveMenuId(null)
                                                                    }
                                                                />
                                                                <div
                                                                    onClick={(event) =>
                                                                        event.stopPropagation()
                                                                    }
                                                                    className="absolute right-0 z-30 mt-2 w-44 space-y-1 rounded-2xl border border-slate-700 bg-slate-900/90 p-2 shadow-2xl"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black text-amber-100 transition-colors hover:text-white"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            openTeamModal(member);
                                                                            setActiveMenuId(null);
                                                                        }}
                                                                    >
                                                                        <Edit2 size={14} />
                                                                        עריכה
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black text-rose-200 transition-colors hover:text-white"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleDeleteTeamMember(
                                                                                member.id
                                                                            );
                                                                            setActiveMenuId(null);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        מחיקה
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>
                        </div>
                    )}

                    {/* Modals for Custom Fields & Automations remain similar but connected to persisted state */}
                    {activeTab === 'שדות מותאמים' && (
                        <div className="animate-in fade-in slide-in-from-top-4 space-y-8 duration-500">
                            {/* ... Field Builder UI (Condensed for brevity, kept functional logic) ... */}
                            <div className="flex items-center justify-between px-4">
                                <Button
                                    onClick={() => setIsFieldModalOpen(true)}
                                    className="rounded-2xl bg-indigo-600 px-8 font-black text-white italic shadow-xl shadow-indigo-500/10 hover:bg-slate-900"
                                >
                                    + שדה חדש
                                </Button>
                                <div className="text-right">
                                    <h3 className="text-primary text-lg font-black italic">
                                        שדות מותאמים ({customFields.length})
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400">
                                        הגדרת שדות לכרטיסי לקוח ופוליסות
                                    </p>
                                </div>
                            </div>

                            {/* AI Builder Card */}
                            <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[3rem] bg-gradient-to-l from-indigo-600 to-purple-600 p-12 text-white shadow-2xl md:flex-row">
                                <div className="relative z-10 flex-1 space-y-4 text-center md:text-right">
                                    <div className="flex items-center justify-center gap-3 md:justify-start">
                                        <Badge className="border-none bg-white/20 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase backdrop-blur-md">
                                            Premium AI Feature
                                        </Badge>
                                        <h3 className="text-3xl font-black tracking-tighter italic">
                                            בונה שדות AI
                                        </h3>
                                    </div>
                                    <p className="max-w-md font-medium text-indigo-100/80">
                                        תאר את השדה שאתה צריך והמערכת תבנה אותו אוטומטית
                                    </p>

                                    {!isGeminiConfigured && (
                                        <div className="rounded-xl border border-amber-300/30 bg-amber-500/20 p-4 text-sm text-amber-100">
                                            <p className="font-bold">⚠️ נדרש מפתח Gemini API</p>
                                            <p className="mt-1 text-xs">
                                                הגדר את GEMINI_API_KEY בקובץ .env.local כדי להפעיל
                                                תכונות AI
                                            </p>
                                            <a
                                                href="https://aistudio.google.com/app/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block text-xs underline hover:text-white"
                                            >
                                                📌 קבל מפתח חינם מ-Google AI Studio
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex justify-center gap-4 pt-4 md:justify-start">
                                        <input
                                            type="text"
                                            value={fieldInput}
                                            onChange={(e) => setFieldInput(e.target.value)}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                !isGeneratingField &&
                                                isGeminiConfigured &&
                                                handleGenerateField()
                                            }
                                            placeholder={
                                                isGeminiConfigured
                                                    ? 'לדוגמה: "שדה תאריך תחילת פנסיה"'
                                                    : 'נדרש מפתח API...'
                                            }
                                            disabled={!isGeminiConfigured}
                                            className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold text-white placeholder-white/40 backdrop-blur-md outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <Button
                                            onClick={handleGenerateField}
                                            disabled={isGeneratingField || !isGeminiConfigured}
                                            className="rounded-2xl bg-white px-8 font-black text-indigo-600 italic shadow-xl transition-all hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isGeneratingField ? 'בונה...' : 'בנה'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {generatedField ? (
                                <Card className="flex items-center justify-between rounded-[2rem] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                    <div>
                                        <h4 className="text-lg font-black text-emerald-100">
                                            {generatedField.label}
                                        </h4>
                                        <p className="text-xs text-emerald-200/80">
                                            {generatedField.description}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setGeneratedField(null)}
                                            variant="ghost"
                                            className="text-emerald-200 hover:text-white"
                                        >
                                            ביטול
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setCustomFields([
                                                    ...customFields,
                                                    { ...generatedField, id: Date.now() },
                                                ]);
                                                setGeneratedField(null);
                                            }}
                                            className="rounded-xl bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                                        >
                                            אישור
                                        </Button>
                                    </div>
                                </Card>
                            ) : null}

                            {/* Manual Modal */}
                            {isFieldModalOpen ? (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                                    <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-slate-100 shadow-2xl">
                                        <h3 className="mb-4 text-xl font-black text-amber-200">
                                            הוספת שדה חדש
                                        </h3>
                                        <input
                                            type="text"
                                            placeholder="שם השדה"
                                            value={manualField.label}
                                            onChange={(e) =>
                                                setManualField({
                                                    ...manualField,
                                                    label: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
                                        />
                                        <select
                                            value={manualField.type}
                                            onChange={(e) =>
                                                setManualField({
                                                    ...manualField,
                                                    type: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 outline-none"
                                        >
                                            <option value="text">טקסט</option>
                                            <option value="number">מספר</option>
                                            <option value="date">תאריך</option>
                                            <option value="select">בחירה</option>
                                        </select>
                                        <Button
                                            onClick={() => {
                                                setCustomFields([
                                                    ...customFields,
                                                    { ...manualField, id: Date.now() },
                                                ]);
                                                setIsFieldModalOpen(false);
                                            }}
                                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 py-4 font-black text-slate-900 shadow-lg shadow-amber-500/30"
                                        >
                                            שמור
                                        </Button>
                                        <button
                                            onClick={() => setIsFieldModalOpen(false)}
                                            className="mt-2 w-full text-xs font-bold text-amber-200"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {customFields.map((field, i) => (
                                    <Card
                                        key={i}
                                        className="group relative rounded-[2rem] border border-amber-500/25 bg-slate-950/80 p-6 shadow-lg"
                                    >
                                        <Badge className="absolute top-6 left-6 border border-amber-500/30 bg-amber-500/15 text-amber-200">
                                            {field.type}
                                        </Badge>
                                        <h4 className="mb-1 font-black text-amber-100 italic">
                                            {field.label}
                                        </h4>
                                        <p className="text-xs text-slate-300">
                                            {field.description || 'ללא תיאור'}
                                        </p>
                                        <button
                                            onClick={() =>
                                                setCustomFields(
                                                    customFields.filter((_, idx) => idx !== i)
                                                )
                                            }
                                            className="absolute bottom-6 left-6 text-slate-400 hover:text-rose-300"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'אוטומציות' && (
                        <div className="animate-in fade-in slide-in-from-top-4 grid gap-8 duration-500 lg:grid-cols-2">
                            {/* AI Chat Logic reused here for Automation Builder */}
                            <Card className="flex min-h-[500px] flex-col rounded-[3rem] bg-slate-900 p-8 text-white">
                                {!isGeminiConfigured && (
                                    <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-500/20 p-4 text-sm text-amber-100">
                                        <p className="font-bold">⚠️ נדרש מפתח Gemini API</p>
                                        <p className="mt-1 text-xs">
                                            הגדר את GEMINI_API_KEY בקובץ .env.local כדי להפעיל בונה
                                            האוטומציות
                                        </p>
                                        <a
                                            href="https://aistudio.google.com/app/apikey"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-block text-xs underline hover:text-white"
                                        >
                                            📌 קבל מפתח חינם מ-Google AI Studio
                                        </a>
                                    </div>
                                )}

                                <div className="custom-scrollbar mb-4 max-h-[400px] flex-1 space-y-4 overflow-y-auto px-2">
                                    {automationChat.map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'ai' ? 'mr-auto self-end bg-white/10' : 'ml-auto self-start bg-indigo-600'}`}
                                        >
                                            {msg.content}
                                        </div>
                                    ))}
                                    {isGeneratingAutomation ? (
                                        <div className="mr-auto animate-pulse text-xs text-slate-400">
                                            חושב...
                                        </div>
                                    ) : null}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={automationInput}
                                        onChange={(e) => setAutomationInput(e.target.value)}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            !isGeneratingAutomation &&
                                            isGeminiConfigured &&
                                            handleGenerateAutomation()
                                        }
                                        placeholder={
                                            isGeminiConfigured
                                                ? 'תאר אוטומציה...'
                                                : 'נדרש מפתח API...'
                                        }
                                        disabled={!isGeminiConfigured}
                                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleGenerateAutomation}
                                        disabled={!isGeminiConfigured || isGeneratingAutomation}
                                        className="rounded-xl bg-white p-3 text-indigo-900 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        <span className="block rotate-90">➤</span>
                                    </button>
                                </div>
                            </Card>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <Button
                                        onClick={() => setIsAutomationModalOpen(true)}
                                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white"
                                    >
                                        + ידני
                                    </Button>
                                    <h3 className="font-black italic">אוטומציות פעילות</h3>
                                </div>
                                {automations.map((auto, i) => (
                                    <Card
                                        key={i}
                                        className={`flex items-center justify-between rounded-[2rem] p-6 shadow-lg ${auto.active ? 'border border-amber-500/30 bg-slate-950/80' : 'border border-slate-700 bg-slate-900/60'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
                                                    const n = [...automations];
                                                    n[i].active = !n[i].active;
                                                    setAutomations(n);
                                                }}
                                                className={`relative h-7 w-12 rounded-full transition-colors ${auto.active ? 'bg-emerald-500/80' : 'bg-slate-700'}`}
                                            >
                                                <div
                                                    className={`absolute top-1 h-5 w-5 rounded-full shadow-sm transition-all ${auto.active ? 'right-6 bg-amber-100' : 'right-1 bg-slate-300'}`}
                                                />
                                            </button>
                                            <div className="text-right">
                                                <h4 className="text-sm font-black text-slate-100">
                                                    {auto.title}
                                                </h4>
                                                <p className="text-[10px] font-bold text-amber-200/80 uppercase">
                                                    {auto.desc}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-2xl text-amber-300">{auto.icon}</span>
                                    </Card>
                                ))}
                            </div>

                            {/* Manual Automation Modal */}
                            {isAutomationModalOpen ? (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                                    <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-slate-100 shadow-2xl">
                                        <h3 className="mb-4 text-xl font-black text-amber-200">
                                            אוטומציה חדשה
                                        </h3>
                                        <input
                                            type="text"
                                            placeholder="שם"
                                            value={manualAutomation.title}
                                            onChange={(e) =>
                                                setManualAutomation({
                                                    ...manualAutomation,
                                                    title: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
                                        />
                                        <textarea
                                            placeholder="תיאור"
                                            value={manualAutomation.desc}
                                            onChange={(e) =>
                                                setManualAutomation({
                                                    ...manualAutomation,
                                                    desc: e.target.value,
                                                })
                                            }
                                            className="w-full resize-none rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
                                            rows={3}
                                        />
                                        <Button
                                            onClick={() => {
                                                setAutomations([
                                                    ...automations,
                                                    { ...manualAutomation, active: true },
                                                ]);
                                                setIsAutomationModalOpen(false);
                                            }}
                                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 py-4 font-black text-slate-900 shadow-lg shadow-amber-500/30"
                                        >
                                            שמור
                                        </Button>
                                        <button
                                            onClick={() => setIsAutomationModalOpen(false)}
                                            className="mt-2 w-full text-xs font-bold text-amber-200"
                                        >
                                            ביטול
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {activeTab === 'הגדרות מערכת' && (
                        <div className="animate-in fade-in slide-in-from-top-4 space-y-8 pb-12 duration-500">
                            {/* Branding & Config */}
                            <div className="grid gap-8 lg:grid-cols-2">
                                <Card className="rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 p-8 shadow-xl">
                                    <h4 className="text-primary mb-6 border-b border-slate-50 pb-4 text-lg font-black italic">
                                        מיתוג והגדרות בסיס
                                    </h4>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">
                                                שם הסוכנות
                                            </label>
                                            <input
                                                type="text"
                                                value={settings.name}
                                                onChange={(e) =>
                                                    setSettings({
                                                        ...settings,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">
                                                צבע ראשי
                                            </label>
                                            <div className="flex gap-3">
                                                {[
                                                    'indigo',
                                                    'emerald',
                                                    'blue',
                                                    'rose',
                                                    'purple',
                                                    'amber',
                                                ].map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() =>
                                                            setSettings({ ...settings, color: c })
                                                        }
                                                        className={`h-10 w-10 rounded-full border-4 transition-all ${settings.color === c ? 'scale-110 border-slate-800' : 'border-transparent'}`}
                                                        style={{
                                                            backgroundColor: `var(--color-${c}-500, ${c})`,
                                                        }} // Simplified for demo
                                                    >
                                                        <div
                                                            className={`h-full w-full rounded-full bg-${c}-500`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-black text-slate-400 uppercase">
                                                לוגו מערכת
                                            </label>
                                            <label className="relative flex h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 transition-colors hover:bg-slate-50">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                />
                                                {settings.logo ? (
                                                    <img
                                                        src={settings.logo}
                                                        alt="Logo"
                                                        className="h-full object-contain"
                                                    />
                                                ) : (
                                                    <>
                                                        <span className="mb-2 text-2xl">📷</span>
                                                        <span className="text-xs font-bold text-slate-400">
                                                            לחץ להעלאת לוגו
                                                        </span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-slate-900 to-indigo-900 p-8 text-white shadow-xl">
                                    <h4 className="mb-6 text-lg font-black italic">
                                        Gemini API Key
                                    </h4>
                                    <p className="mb-6 text-sm text-indigo-200">
                                        ה-AI מוגדר בצד השרת באמצעות{' '}
                                        <span className="font-mono">GEMINI_API_KEY</span> בקובץ{' '}
                                        <span className="font-mono">.env.local</span>.
                                    </p>
                                    <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                                        <div>
                                            <p className="text-xs font-black tracking-widest text-indigo-200 uppercase">
                                                סטטוס
                                            </p>
                                            <p className="text-sm font-bold">
                                                {isGeminiConfigured ? 'מחובר' : 'לא מוגדר'}
                                            </p>
                                        </div>
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-lg ${isGeminiConfigured ? 'bg-emerald-500' : 'bg-red-400'}`}
                                        >
                                            {isGeminiConfigured ? '✓' : '!'}
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Integrations */}
                            <Card className="rounded-[2.5rem] border border-amber-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 p-8 shadow-xl">
                                <h4 className="text-primary mb-8 border-b border-slate-50 pb-4 text-lg font-black italic">
                                    אינטגרציות וחיבורים
                                </h4>
                                <div className="space-y-4">
                                    {integrations.map((int) => (
                                        <div
                                            key={int.id}
                                            className="group flex items-center justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-slate-950/90 p-4 transition-all hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="rounded-xl border border-amber-500/30 bg-slate-900/80 p-2 text-2xl text-amber-200 shadow-inner">
                                                    {int.icon}
                                                </span>
                                                <div>
                                                    <h5 className="text-primary text-sm font-black">
                                                        {int.name}
                                                    </h5>
                                                    <p
                                                        className={`text-[10px] font-bold ${int.status === 'מחובר' ? 'text-emerald-300' : 'text-amber-300'}`}
                                                    >
                                                        {int.status}{' '}
                                                        {int.lastSync
                                                            ? `עודכן לאחרונה: ${int.lastSync}`
                                                            : null}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => toggleIntegration(int.id)}
                                                variant="outline"
                                                className={`border-2 text-xs font-black ${int.status === 'מחובר' ? 'border-emerald-300 text-emerald-200 hover:bg-emerald-500/10' : 'border-amber-300 text-amber-200 hover:bg-amber-500/10'}`}
                                            >
                                                {int.status === 'מחובר' ? 'נתק' : 'חבר'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Modal */}
            {isTeamModalOpen ? (
                <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="animate-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-slate-100 shadow-2xl">
                        <div className="absolute top-0 right-0 h-2 w-full bg-gradient-to-r from-amber-500 to-orange-400" />
                        <h3 className="mb-6 text-2xl font-black text-amber-200 italic">
                            {editingMember ? 'עריכת איש צוות' : 'הוספת איש צוות'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-black text-slate-400">
                                    שם מלא
                                </label>
                                <input
                                    type="text"
                                    value={teamForm.name}
                                    onChange={(e) =>
                                        setTeamForm({ ...teamForm, name: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-black text-slate-400">
                                    אימייל
                                </label>
                                <input
                                    type="email"
                                    value={teamForm.email}
                                    onChange={(e) =>
                                        setTeamForm({ ...teamForm, email: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-black text-slate-400">
                                        תפקיד
                                    </label>
                                    <select
                                        value={teamForm.role}
                                        onChange={(e) =>
                                            setTeamForm({ ...teamForm, role: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 outline-none"
                                    >
                                        <option>נציג מכירות</option>
                                        <option>סוכן ביטוח</option>
                                        <option>מנהל משרד</option>
                                        <option>חיתום</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-black text-slate-400">
                                        סטטוס
                                    </label>
                                    <select
                                        value={teamForm.status}
                                        onChange={(e) =>
                                            setTeamForm({
                                                ...teamForm,
                                                status: e.target.value as any,
                                            })
                                        }
                                        className="w-full rounded-xl border border-amber-500/25 bg-slate-900/70 p-3 font-bold text-slate-100 outline-none"
                                    >
                                        <option>פעיל</option>
                                        <option>לא פעיל</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <Button
                                onClick={closeTeamModal}
                                variant="ghost"
                                className="flex-1 text-amber-200 hover:text-white"
                            >
                                ביטול
                            </Button>
                            <Button
                                onClick={handleSaveTeamMember}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-400 text-slate-900 shadow-lg shadow-amber-500/30"
                            >
                                שמור
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </DashboardShell>
    );
}
