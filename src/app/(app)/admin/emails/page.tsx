"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
    Mail, Send, Inbox, FileText, BarChart3, Plus, Search,
    Star, Trash2, Archive, RefreshCw, Clock, CheckCircle2,
    AlertCircle, Eye, MousePointer, Users, Calendar, Filter,
    Edit3, Copy, MoreVertical, ChevronDown, X, Sparkles,
    Zap, Target, TrendingUp, ArrowUpRight, ArrowDownRight,
    Play, Pause, Settings, Tag, Paperclip, Reply, Forward,
    UserPlus, Building2, ExternalLink, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

// Types
interface Email {
    id: string;
    subject: string;
    from: { name: string; email: string };
    to: { name: string; email: string }[];
    preview: string;
    body: string;
    date: string;
    read: boolean;
    starred: boolean;
    labels: string[];
    attachments: number;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash';
}

interface EmailTemplate {
    id: string;
    name: string;
    category: string;
    subject: string;
    preview: string;
    body: string;
    usageCount: number;
    lastUsed?: string;
    thumbnail?: string;
}

interface Campaign {
    id: string;
    name: string;
    subject: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
    recipients: number;
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    scheduledAt?: string;
    sentAt?: string;
    template?: string;
}

type TabType = 'inbox' | 'templates' | 'campaigns' | 'analytics';

export default function EmailCenterPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('inbox');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Data states
    const [emails, setEmails] = useState<Email[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showCampaignModal, setShowCampaignModal] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock Emails
        const mockEmails: Email[] = [
            {
                id: '1',
                subject: 'בקשה להצעת מחיר לביטוח חיים',
                from: { name: 'ישראל ישראלי', email: 'israel@example.com' },
                to: [{ name: 'מגן זהב', email: 'info@magenzahav.co.il' }],
                preview: 'שלום רב, אשמח לקבל הצעת מחיר לביטוח חיים. אני בן 35, נשוי עם 2 ילדים...',
                body: 'שלום רב,\n\nאשמח לקבל הצעת מחיר לביטוח חיים.\nאני בן 35, נשוי עם 2 ילדים.\nמשכורת חודשית: 18,000 ש"ח\n\nתודה רבה,\nישראל ישראלי',
                date: '2026-01-02T10:30:00',
                read: false,
                starred: true,
                labels: ['ליד חדש', 'ביטוח חיים'],
                attachments: 0,
                folder: 'inbox'
            },
            {
                id: '2',
                subject: 'אישור קבלת מסמכים',
                from: { name: 'מגדל ביטוח', email: 'docs@migdal.co.il' },
                to: [{ name: 'מגן זהב', email: 'info@magenzahav.co.il' }],
                preview: 'הרינו לאשר קבלת המסמכים עבור פוליסה מספר 123456...',
                body: 'שלום רב,\n\nהרינו לאשר קבלת המסמכים עבור פוליסה מספר 123456.\nהפוליסה תופעל תוך 3 ימי עסקים.\n\nבברכה,\nמגדל ביטוח',
                date: '2026-01-02T09:15:00',
                read: true,
                starred: false,
                labels: ['מגדל', 'אישורים'],
                attachments: 2,
                folder: 'inbox'
            },
            {
                id: '3',
                subject: 'תזכורת: חידוש פוליסה',
                from: { name: 'מערכת', email: 'system@magenzahav.co.il' },
                to: [{ name: 'רחל כהן', email: 'rachel@example.com' }],
                preview: 'שלום רחל, ברצוננו להזכיר כי פוליסת הביטוח שלך עומדת לפוג...',
                body: 'שלום רחל,\n\nברצוננו להזכיר כי פוליסת הביטוח שלך מספר 789012 עומדת לפוג בעוד 14 יום.\n\nנשמח לעמוד לרשותך לחידוש הפוליסה.\n\nבברכה,\nצוות מגן זהב',
                date: '2026-01-02T08:00:00',
                read: true,
                starred: false,
                labels: ['חידושים', 'אוטומטי'],
                attachments: 0,
                folder: 'sent'
            },
            {
                id: '4',
                subject: 'שאלה לגבי כיסוי ביטוחי',
                from: { name: 'דוד לוי', email: 'david@example.com' },
                to: [{ name: 'מגן זהב', email: 'info@magenzahav.co.il' }],
                preview: 'שלום, רציתי לשאול האם הביטוח שלי מכסה טיפולי שיניים...',
                body: 'שלום,\n\nרציתי לשאול האם הביטוח שלי מכסה טיפולי שיניים?\nמספר פוליסה: 456789\n\nתודה,\nדוד',
                date: '2026-01-01T16:45:00',
                read: false,
                starred: false,
                labels: ['שאלות'],
                attachments: 0,
                folder: 'inbox'
            },
            {
                id: '5',
                subject: 'הצעת מחיר מצורפת',
                from: { name: 'מגן זהב', email: 'info@magenzahav.co.il' },
                to: [{ name: 'משה פרץ', email: 'moshe@example.com' }],
                preview: 'שלום משה, מצורפת הצעת המחיר לביטוח רכב כפי שביקשת...',
                body: 'שלום משה,\n\nמצורפת הצעת המחיר לביטוח רכב כפי שביקשת.\nההצעה תקפה ל-14 יום.\n\nאשמח לענות על כל שאלה.\n\nבברכה,\nצוות מגן זהב',
                date: '2026-01-01T14:30:00',
                read: true,
                starred: true,
                labels: ['הצעות מחיר', 'ביטוח רכב'],
                attachments: 1,
                folder: 'sent'
            }
        ];

        // Mock Templates
        const mockTemplates: EmailTemplate[] = [
            {
                id: '1',
                name: 'ברוכים הבאים - לקוח חדש',
                category: 'קבלת פנים',
                subject: 'ברוכים הבאים למשפחת מגן זהב! 🎉',
                preview: 'שלום [שם], ברוכים הבאים למשפחת מגן זהב! אנחנו שמחים שבחרת בנו...',
                body: 'שלום [שם],\n\nברוכים הבאים למשפחת מגן זהב!\nאנחנו שמחים שבחרת בנו ללוות אותך בתחום הביטוח והפנסיה.\n\n[תוכן נוסף]',
                usageCount: 156,
                lastUsed: '2026-01-02'
            },
            {
                id: '2',
                name: 'תזכורת חידוש פוליסה',
                category: 'תזכורות',
                subject: 'תזכורת: פוליסת הביטוח שלך עומדת להסתיים',
                preview: 'שלום [שם], ברצוננו להזכיר כי פוליסה מספר [מספר] עומדת לפוג...',
                body: 'שלום [שם],\n\nברצוננו להזכיר כי פוליסה מספר [מספר] עומדת לפוג ב-[תאריך].\n\nנשמח לעמוד לרשותך לחידוש הפוליסה.',
                usageCount: 89,
                lastUsed: '2026-01-02'
            },
            {
                id: '3',
                name: 'הצעת מחיר',
                category: 'מכירות',
                subject: 'הצעת מחיר מיוחדת עבורך',
                preview: 'שלום [שם], מצורפת הצעת מחיר מותאמת אישית עבורך...',
                body: 'שלום [שם],\n\nתודה על פנייתך!\nמצורפת הצעת מחיר מותאמת אישית עבורך.\n\n[פרטי ההצעה]',
                usageCount: 234,
                lastUsed: '2026-01-01'
            },
            {
                id: '4',
                name: 'אישור קבלת תביעה',
                category: 'תביעות',
                subject: 'אישור קבלת תביעה מספר [מספר]',
                preview: 'שלום [שם], הרינו לאשר קבלת תביעתך. התביעה בטיפול...',
                body: 'שלום [שם],\n\nהרינו לאשר קבלת תביעתך מספר [מספר].\nהתביעה נמצאת כעת בטיפול ונעדכן אותך בהתקדמות.',
                usageCount: 45,
                lastUsed: '2025-12-28'
            },
            {
                id: '5',
                name: 'יום הולדת שמח',
                category: 'אירועים',
                subject: 'יום הולדת שמח! 🎂',
                preview: 'שלום [שם], צוות מגן זהב מאחל לך יום הולדת שמח...',
                body: 'שלום [שם],\n\nצוות מגן זהב מאחל לך יום הולדת שמח!\nמאחלים לך שנה מלאה בריאות, אושר והצלחה.',
                usageCount: 312,
                lastUsed: '2026-01-02'
            },
            {
                id: '6',
                name: 'סקר שביעות רצון',
                category: 'משוב',
                subject: 'נשמח לדעת מה דעתך!',
                preview: 'שלום [שם], חשוב לנו לשמוע את דעתך על השירות שקיבלת...',
                body: 'שלום [שם],\n\nחשוב לנו לשמוע את דעתך!\nנשמח אם תקדיש דקה למילוי סקר קצר על השירות שקיבלת.',
                usageCount: 78,
                lastUsed: '2025-12-30'
            }
        ];

        // Mock Campaigns
        const mockCampaigns: Campaign[] = [
            {
                id: '1',
                name: 'קמפיין חידושים ינואר 2026',
                subject: 'הזדמנות אחרונה לחדש את הפוליסה בתנאים מועדפים',
                status: 'sending',
                recipients: 450,
                sent: 312,
                opened: 156,
                clicked: 42,
                bounced: 8,
                scheduledAt: '2026-01-02T09:00:00'
            },
            {
                id: '2',
                name: 'מבצע ביטוח רכב',
                subject: '🚗 30% הנחה על ביטוח רכב - רק השבוע!',
                status: 'scheduled',
                recipients: 1250,
                sent: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                scheduledAt: '2026-01-05T10:00:00'
            },
            {
                id: '3',
                name: 'ניוזלטר דצמבר',
                subject: 'סיכום שנה ומה צפוי ב-2026',
                status: 'sent',
                recipients: 2340,
                sent: 2340,
                opened: 1245,
                clicked: 389,
                bounced: 23,
                sentAt: '2025-12-28T10:00:00'
            },
            {
                id: '4',
                name: 'הצעת פנסיה לעצמאים',
                subject: 'האם אתה דואג לעתיד שלך? הצעה מיוחדת בפנים',
                status: 'sent',
                recipients: 890,
                sent: 890,
                opened: 534,
                clicked: 156,
                bounced: 12,
                sentAt: '2025-12-20T14:00:00'
            },
            {
                id: '5',
                name: 'ברכות לשנה החדשה',
                subject: '✨ שנה טובה ומבורכת!',
                status: 'sent',
                recipients: 3500,
                sent: 3500,
                opened: 2890,
                clicked: 456,
                bounced: 34,
                sentAt: '2025-12-31T08:00:00'
            },
            {
                id: '6',
                name: 'קמפיין ביטוח בריאות',
                subject: 'הבריאות שלך חשובה לנו - הצעה מיוחדת',
                status: 'draft',
                recipients: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                bounced: 0
            }
        ];

        setEmails(mockEmails);
        setTemplates(mockTemplates);
        setCampaigns(mockCampaigns);
        setIsLoading(false);
    }, []);

    // Load data
    useEffect(() => {
        const timeout = setTimeout(() => {
            loadData();
        }, 0);
        return () => clearTimeout(timeout);
    }, [loadData]);

    // Filter emails
    const filteredEmails = emails.filter(email => 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate analytics
    const analytics = {
        totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
        totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
        totalClicked: campaigns.reduce((sum, c) => sum + c.clicked, 0),
        totalBounced: campaigns.reduce((sum, c) => sum + c.bounced, 0),
        avgOpenRate: campaigns.length > 0 
            ? Math.round((campaigns.reduce((sum, c) => sum + (c.sent > 0 ? c.opened / c.sent : 0), 0) / campaigns.filter(c => c.sent > 0).length) * 100)
            : 0,
        avgClickRate: campaigns.length > 0
            ? Math.round((campaigns.reduce((sum, c) => sum + (c.opened > 0 ? c.clicked / c.opened : 0), 0) / campaigns.filter(c => c.opened > 0).length) * 100)
            : 0
    };

    // Tabs
    const tabs = [
        { id: 'inbox', label: 'תיבת דואר', icon: Inbox, count: emails.filter(e => e!.read && e.folder === 'inbox').length },
        { id: 'templates', label: 'תבניות', icon: FileText, count: templates.length },
        { id: 'campaigns', label: 'קמפיינים', icon: Send, count: campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length },
        { id: 'analytics', label: 'אנליטיקס', icon: BarChart3 },
    ];

    // Email action handlers
    const handleStarEmail = async (emailId: string) => {
        setEmails(prev => prev.map(e => 
            e.id === emailId ? { ...e, starred: e!.starred } : e
        ));
        toast.success('הכוכב עודכן');
    };

    const handleDeleteEmail = async (emailId: string) => {
        setEmails(prev => prev.map(e => 
            e.id === emailId ? { ...e, folder: 'trash' as const } : e
        ));
        setSelectedEmail(null);
        toast.success('ההודעה הועברה לאשפה');
    };

    const handleMarkAsRead = async (emailId: string) => {
        setEmails(prev => prev.map(e => 
            e.id === emailId ? { ...e, read: true } : e
        ));
    };

    const handleArchiveEmail = async (emailId: string) => {
        setEmails(prev => prev.filter(e => e.id !== emailId));
        setSelectedEmail(null);
        toast.success('ההודעה הועברה לארכיון');
    };

    // Campaign action handlers
    const handleSendCampaign = async (campaignId: string) => {
        setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'sending' as const } : c
        ));
        toast.success('הקמפיין נשלח!');
    };

    const handlePauseCampaign = async (campaignId: string) => {
        setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'paused' as const } : c
        ));
        toast.success('הקמפיין הושהה');
    };

    const handleResumeCampaign = async (campaignId: string) => {
        setCampaigns(prev => prev.map(c => 
            c.id === campaignId ? { ...c, status: 'sending' as const } : c
        ));
        toast.success('הקמפיין חודש');
    };

    const handleDeleteCampaign = async (campaignId: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        toast.success('הקמפיין נמחק');
    };

    const handleDuplicateCampaign = async (campaignId: string) => {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) {
            const newCampaign = {
                ...campaign,
                id: Date.now().toString(),
                name: `${campaign.name} (עותק)`,
                status: 'draft' as const,
                sent: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                sentAt: undefined,
                scheduledAt: undefined
            };
            setCampaigns(prev => [newCampaign, ...prev]);
            toast.success('הקמפיין שוכפל');
        }
    };

    // Template action handlers
    const handleDuplicateTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const newTemplate = {
                ...template,
                id: Date.now().toString(),
                name: `${template.name} (עותק)`,
                usageCount: 0
            };
            setTemplates(prev => [...prev, newTemplate]);
            toast.success('התבנית שוכפלה');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('התבנית נמחקה');
    };

    const handleCreateTemplate = async (templateData: Omit<EmailTemplate, 'id' | 'usageCount'>) => {
        const newTemplate: EmailTemplate = {
            ...templateData,
            id: Date.now().toString(),
            usageCount: 0,
            lastUsed: undefined
        };
        setTemplates(prev => [newTemplate, ...prev]);
        toast.success('התבנית נוצרה בהצלחה!');
    };

    // Send email handler
    const handleSendEmail = async (to: string, subject: string, body: string) => {
        // In real app, this would call an email service
        const newEmail: Email = {
            id: Date.now().toString(),
            subject,
            from: { name: 'מגן זהב', email: 'info@magenzahav.co.il' },
            to: [{ name: to, email: to }],
            preview: body.substring(0, 100),
            body,
            date: new Date().toISOString(),
            read: true,
            starred: false,
            labels: [],
            attachments: 0,
            folder: 'sent'
        };
        setEmails(prev => [newEmail, ...prev]);
        setShowComposeModal(false);
        toast.success('ההודעה נשלחה בהצלחה!');
    };

    // Create campaign handler
    const handleCreateCampaign = async (campaignData: Partial<Campaign>) => {
        const newCampaign: Campaign = {
            id: Date.now().toString(),
            name: campaignData.name || 'קמפיין חדש',
            subject: campaignData.subject || '',
            status: campaignData.scheduledAt ? 'scheduled' : 'draft',
            recipients: 0,
            sent: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            scheduledAt: campaignData.scheduledAt
        };
        setCampaigns(prev => [newCampaign, ...prev]);
        setShowCampaignModal(false);
        toast.success('הקמפיין נוצר בהצלחה!');
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 hover:border-amber-500/30 transition-all group"
                        >
                            <ArrowRight size={20} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                                <Mail className="text-amber-400" />
                                מרכז אימיילים
                            </h1>
                            <p className="text-slate-400 mt-1">ניהול תקשורת, תבניות וקמפיינים</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline"
                            onClick={() => setShowCampaignModal(true)}
                        >
                            <Zap size={18} className="ml-2" />
                            קמפיין חדש
                        </Button>
                        <Button 
                            onClick={() => setShowComposeModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Plus size={18} className="ml-2" />
                            הודעה חדשה
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-amber-500 text-slate-900'
                                        : 'glass-card border border-amber-500/20 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <Badge className={`${
                                        activeTab === tab.id 
                                            ? 'bg-slate-900/30 text-slate-900' 
                                            : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {tab.count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={40} className="animate-spin text-amber-400" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Inbox Tab */}
                            {activeTab === 'inbox' && (
                                <InboxView 
                                    emails={filteredEmails}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    selectedEmail={selectedEmail}
                                    setSelectedEmail={setSelectedEmail}
                                    onStar={handleStarEmail}
                                    onDelete={handleDeleteEmail}
                                    onMarkAsRead={handleMarkAsRead}
                                    onArchive={handleArchiveEmail}
                                />
                            )}

                            {/* Templates Tab */}
                            {activeTab === 'templates' && (
                                <TemplatesView 
                                    templates={templates}
                                    selectedTemplate={selectedTemplate}
                                    setSelectedTemplate={setSelectedTemplate}
                                    onDuplicate={handleDuplicateTemplate}
                                    onDelete={handleDeleteTemplate}
                                    onUseTemplate={(template) => {
                                        setShowComposeModal(true);
                                        // Could pre-fill compose modal with template
                                    }}
                                    onCreateTemplate={handleCreateTemplate}
                                />
                            )}

                            {/* Campaigns Tab */}
                            {activeTab === 'campaigns' && (
                                <CampaignsView 
                                    campaigns={campaigns}
                                    onSend={handleSendCampaign}
                                    onPause={handlePauseCampaign}
                                    onResume={handleResumeCampaign}
                                    onDelete={handleDeleteCampaign}
                                    onDuplicate={handleDuplicateCampaign}
                                />
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <AnalyticsView analytics={analytics} campaigns={campaigns} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Compose Modal */}
                <AnimatePresence>
                    {showComposeModal ? <ComposeModal 
                            onClose={() => setShowComposeModal(false)}
                            templates={templates}
                            onSend={handleSendEmail}
                        /> : null}
                </AnimatePresence>

                {/* Campaign Modal */}
                <AnimatePresence>
                    {showCampaignModal ? <CampaignModal 
                            onClose={() => setShowCampaignModal(false)}
                            templates={templates}
                            onCreate={handleCreateCampaign}
                        /> : null}
                </AnimatePresence>
            </div>
        </DashboardShell>
    );
}

// ==================== Inbox View ====================
function InboxView({ 
    emails, 
    searchQuery, 
    setSearchQuery, 
    selectedEmail, 
    setSelectedEmail,
    onStar,
    onDelete,
    onMarkAsRead,
    onArchive
}: {
    emails: Email[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedEmail: Email | null;
    setSelectedEmail: (e: Email | null) => void;
    onStar: (id: string) => void;
    onDelete: (id: string) => void;
    onMarkAsRead: (id: string) => void;
    onArchive: (id: string) => void;
}) {
    const [folder, setFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash'>('inbox');

    const folderEmails = emails.filter(e => e.folder === folder);

    const handleSelectEmail = (email: Email) => {
        setSelectedEmail(email);
        if (email!.read) {
            onMarkAsRead(email.id);
        }
    };

    const handleReply = () => {
        if (selectedEmail) {
            toast.success('פותח חלון תגובה...');
            // In real app, open compose with pre-filled data
        }
    };

    const handleForward = () => {
        if (selectedEmail) {
            toast.success('פותח חלון העברה...');
            // In real app, open compose with forwarded content
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-4">
            {/* Email List */}
            <div className="lg:col-span-1 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="חיפוש אימיילים..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 glass-card border border-amber-500/20 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                    />
                </div>

                {/* Folders */}
                <div className="flex gap-2">
                    {[
                        { id: 'inbox', label: 'נכנס', icon: Inbox },
                        { id: 'sent', label: 'נשלח', icon: Send },
                        { id: 'drafts', label: 'טיוטות', icon: FileText },
                        { id: 'trash', label: 'אשפה', icon: Trash2 },
                    ].map((f) => {
                        const Icon = f.icon;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setFolder(f.id as any)}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    folder === f.id
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'text-slate-400 hover:text-amber-400'
                                }`}
                            >
                                <Icon size={14} />
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Email List */}
                <Card className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
                    {folderEmails.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Mail size={32} className="mx-auto mb-2 opacity-50" />
                            <p>אין הודעות</p>
                        </div>
                    ) : (
                        folderEmails.map((email) => (
                            <div
                                key={email.id}
                                onClick={() => handleSelectEmail(email)}
                                className={`p-3 cursor-pointer transition-all hover:bg-slate-800/50 ${
                                    selectedEmail?.id === email.id ? 'bg-amber-500/10 border-r-2 border-amber-500' : ''
                                } ${email!.read ? 'bg-slate-800/30' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onStar(email.id); }}
                                        className={`mt-1 ${email.starred ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                                    >
                                        <Star size={16} fill={email.starred ? 'currentColor' : 'none'} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-sm truncate ${email!.read ? 'font-bold text-slate-200' : 'text-slate-400'}`}>
                                                {folder === 'sent' ? email.to[0]?.name : email.from.name}
                                            </span>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(email.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`text-sm truncate ${email!.read ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {email.subject}
                                        </div>
                                        <div className="text-xs text-slate-600 truncate mt-1">
                                            {email.preview}
                                        </div>
                                        {email.labels.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {email.labels.slice(0, 2).map((label) => (
                                                    <span key={label} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </Card>
            </div>

            {/* Email Preview */}
            <div className="lg:col-span-2">
                {selectedEmail ? (
                    <Card className="p-6">
                        {/* Email Header */}
                        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-700/50">
                            <div>
                                <h2 className="text-xl font-bold text-amber-100 mb-2">{selectedEmail.subject}</h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-900 font-bold">
                                        {selectedEmail.from.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200">{selectedEmail.from.name}</div>
                                        <div className="text-slate-500">{selectedEmail.from.email}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500">
                                {new Date(selectedEmail.date).toLocaleDateString('he-IL', { 
                                    year: 'numeric', month: 'long', day: 'numeric', 
                                    hour: '2-digit', minute: '2-digit' 
                                })}
                            </div>
                        </div>

                        {/* Email Body */}
                        <div className="text-slate-300 whitespace-pre-wrap mb-6">
                            {selectedEmail.body}
                        </div>

                        {/* Attachments */}
                        {selectedEmail.attachments > 0 && (
                            <div className="mb-6 p-4 glass-card rounded-xl">
                                <div className="text-sm font-bold text-slate-400 mb-2">קבצים מצורפים ({selectedEmail.attachments})</div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg">
                                        <Paperclip size={16} className="text-slate-400" />
                                        <span className="text-sm text-slate-300">document.pdf</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button onClick={handleReply} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                                <Reply size={16} className="ml-2" />
                                השב
                            </Button>
                            <Button variant="outline" onClick={handleForward}>
                                <Forward size={16} className="ml-2" />
                                העבר
                            </Button>
                            <Button variant="outline" onClick={() => onArchive(selectedEmail.id)}>
                                <Archive size={16} className="ml-2" />
                                ארכיון
                            </Button>
                            <Button 
                                variant="outline" 
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => onDelete(selectedEmail.id)}
                            >
                                <Trash2 size={16} className="ml-2" />
                                מחק
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-12 text-center">
                        <Mail size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500">בחר הודעה לצפייה</p>
                    </Card>
                )}
            </div>
        </div>
    );
}

// ==================== Templates View ====================
function TemplatesView({ 
    templates, 
    selectedTemplate, 
    setSelectedTemplate,
    onDuplicate,
    onDelete,
    onUseTemplate,
    onCreateTemplate
}: {
    templates: EmailTemplate[];
    selectedTemplate: EmailTemplate | null;
    setSelectedTemplate: (t: EmailTemplate | null) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onUseTemplate: (template: EmailTemplate) => void;
    onCreateTemplate: (template: Omit<EmailTemplate, 'id' | 'usageCount'>) => void;
}) {
    const categories = [...new Set(templates.map(t => t.category))];
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('מכירות');
    const [newTemplateSubject, setNewTemplateSubject] = useState('');
    const [newTemplateBody, setNewTemplateBody] = useState('');

    const handleCreateTemplate = () => {
        if (newTemplateName! || newTemplateSubject! || newTemplateBody!) {
            toast.error('יש למלא את כל השדות');
            return;
        }
        onCreateTemplate({
            name: newTemplateName,
            category: newTemplateCategory,
            subject: newTemplateSubject,
            preview: newTemplateBody.substring(0, 100),
            body: newTemplateBody
        });
        setShowNewTemplateModal(false);
        setNewTemplateName('');
        setNewTemplateCategory('מכירות');
        setNewTemplateSubject('');
        setNewTemplateBody('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-200">תבניות אימייל ({templates.length})</h2>
                <Button 
                    onClick={() => setShowNewTemplateModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                    <Plus size={16} className="ml-2" />
                    תבנית חדשה
                </Button>
            </div>

            {/* Categories */}
            {categories.map((category) => (
                <div key={category}>
                    <h3 className="text-sm font-bold text-amber-400 mb-3">{category}</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.filter(t => t.category === category).map((template) => (
                            <Card 
                                key={template.id}
                                className="p-4 cursor-pointer hover:border-amber-500/40 transition-all relative"
                                onClick={() => setSelectedTemplate(template)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <FileText size={20} className="text-amber-400" />
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setShowMenu(showMenu === template.id ? null : template.id); 
                                            }}
                                            className="text-slate-500 hover:text-amber-400"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {showMenu === template.id && (
                                            <div className="absolute left-0 top-full mt-1 w-36 glass-card border border-amber-500/20 rounded-xl py-1 z-10">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onUseTemplate(template); setShowMenu(null); }}
                                                    className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-2"
                                                >
                                                    <Send size={14} />
                                                    השתמש
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); setShowMenu(null); }}
                                                    className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-2"
                                                >
                                                    <Copy size={14} />
                                                    שכפל
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(template.id); setShowMenu(null); }}
                                                    className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    מחק
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-200 mb-1">{template.name}</h4>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{template.preview}</p>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>שימושים: {template.usageCount}</span>
                                    {template.lastUsed ? <span>עודכן: {template.lastUsed}</span> : null}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {/* New Template Modal would go here */}
            {showNewTemplateModal ? <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowNewTemplateModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg glass-card rounded-3xl border border-amber-500/20 p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-amber-100">תבנית חדשה</h2>
                            <button onClick={() => setShowNewTemplateModal(false)} className="text-slate-400 hover:text-amber-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">שם התבנית</label>
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="לדוגמה: ברכת יום הולדת"
                                    className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">קטגוריה</label>
                                <select
                                    value={newTemplateCategory}
                                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                                    className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                                >
                                    <option value="מכירות">מכירות</option>
                                    <option value="שירות">שירות</option>
                                    <option value="אירועים">אירועים</option>
                                    <option value="משוב">משוב</option>
                                    <option value="כללי">כללי</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">נושא האימייל</label>
                                <input
                                    type="text"
                                    value={newTemplateSubject}
                                    onChange={(e) => setNewTemplateSubject(e.target.value)}
                                    placeholder="השתמש ב-[שם] לשילוב אוטומטי"
                                    className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-1">תוכן</label>
                                <textarea
                                    value={newTemplateBody}
                                    onChange={(e) => setNewTemplateBody(e.target.value)}
                                    placeholder="שלום [שם],&#10;&#10;כתוב כאן את תוכן התבנית...&#10;&#10;בברכה,&#10;צוות מגן זהב"
                                    rows={8}
                                    className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <Button 
                                onClick={handleCreateTemplate}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                            >
                                <Plus size={16} className="ml-2" />
                                צור תבנית
                            </Button>
                            <Button variant="outline" onClick={() => setShowNewTemplateModal(false)}>
                                ביטול
                            </Button>
                        </div>
                    </motion.div>
                </motion.div> : null}
        </div>
    );
}

// ==================== Campaigns View ====================
function CampaignsView({ 
    campaigns,
    onSend,
    onPause,
    onResume,
    onDelete,
    onDuplicate
}: { 
    campaigns: Campaign[];
    onSend: (id: string) => void;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
}) {
    const [showMenu, setShowMenu] = useState<string | null>(null);

    const getStatusConfig = (status: Campaign['status']) => {
        switch (status) {
            case 'draft': return { color: 'slate', label: 'טיוטה', icon: Edit3 };
            case 'scheduled': return { color: 'blue', label: 'מתוזמן', icon: Clock };
            case 'sending': return { color: 'amber', label: 'בשליחה', icon: Send };
            case 'sent': return { color: 'emerald', label: 'נשלח', icon: CheckCircle2 };
            case 'paused': return { color: 'orange', label: 'מושהה', icon: Pause };
        }
    };

    return (
        <div className="space-y-4">
            {campaigns.length === 0 ? (
                <Card className="p-12 text-center">
                    <Zap size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-400 mb-2">אין קמפיינים עדיין</h3>
                    <p className="text-slate-500">צור קמפיין חדש כדי להתחיל</p>
                </Card>
            ) : (
                campaigns.map((campaign) => {
                    const statusConfig = getStatusConfig(campaign.status);
                    const StatusIcon = statusConfig.icon;
                    const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0;
                    const clickRate = campaign.opened > 0 ? Math.round((campaign.clicked / campaign.opened) * 100) : 0;

                    return (
                        <Card key={campaign.id} className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-amber-100">{campaign.name}</h3>
                                        <Badge className={`bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400 border-${statusConfig.color}-500/30`}>
                                            <StatusIcon size={12} className="ml-1" />
                                            {statusConfig.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">{campaign.subject}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {campaign.status === 'draft' && (
                                        <Button 
                                            size="sm" 
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                                            onClick={() => onSend(campaign.id)}
                                        >
                                            <Play size={14} className="ml-1" />
                                            שלח
                                        </Button>
                                    )}
                                    {campaign.status === 'sending' && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="border-orange-500/30 text-orange-400"
                                            onClick={() => onPause(campaign.id)}
                                        >
                                            <Pause size={14} className="ml-1" />
                                            השהה
                                        </Button>
                                    )}
                                    {campaign.status === 'paused' && (
                                        <Button 
                                            size="sm" 
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                            onClick={() => onResume(campaign.id)}
                                        >
                                            <Play size={14} className="ml-1" />
                                            המשך
                                        </Button>
                                    )}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowMenu(showMenu === campaign.id ? null : campaign.id)}
                                            className="text-slate-500 hover:text-amber-400"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {showMenu === campaign.id && (
                                            <div className="absolute left-0 top-full mt-1 w-36 glass-card border border-amber-500/20 rounded-xl py-1 z-10">
                                                <button 
                                                    onClick={() => { onDuplicate(campaign.id); setShowMenu(null); }}
                                                    className="w-full text-right px-3 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-2"
                                                >
                                                    <Copy size={14} />
                                                    שכפל
                                                </button>
                                                <button 
                                                    onClick={() => { onDelete(campaign.id); setShowMenu(null); }}
                                                    className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                    מחק
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-5 gap-4">
                                <div className="text-center glass-card p-3 rounded-xl">
                                    <div className="text-xl font-black text-slate-200">{campaign.recipients.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">נמענים</div>
                                </div>
                                <div className="text-center glass-card p-3 rounded-xl">
                                    <div className="text-xl font-black text-blue-400">{campaign.sent.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">נשלחו</div>
                                </div>
                                <div className="text-center glass-card p-3 rounded-xl">
                                    <div className="text-xl font-black text-emerald-400">{campaign.opened.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">נפתחו ({openRate}%)</div>
                                </div>
                                <div className="text-center glass-card p-3 rounded-xl">
                                    <div className="text-xl font-black text-amber-400">{campaign.clicked.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">קליקים ({clickRate}%)</div>
                                </div>
                                <div className="text-center glass-card p-3 rounded-xl">
                                    <div className="text-xl font-black text-red-400">{campaign.bounced}</div>
                                    <div className="text-xs text-slate-500">חזרו</div>
                                </div>
                            </div>

                            {/* Schedule Info */}
                            {(campaign.scheduledAt || campaign.sentAt) ? <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar size={14} />
                                    {campaign.sentAt ? (
                                        <span>נשלח ב-{new Date(campaign.sentAt).toLocaleString('he-IL')}</span>
                                    ) : (
                                        <span>מתוזמן ל-{new Date(campaign.scheduledAt!).toLocaleString('he-IL')}</span>
                                    )}
                                </div> : null}
                        </Card>
                    );
                })
            )}
        </div>
    );
}

// ==================== Analytics View ====================
function AnalyticsView({ analytics, campaigns }: { analytics: any; campaigns: Campaign[] }) {
    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'סה"כ נשלחו', value: analytics.totalSent.toLocaleString(), icon: Send, color: 'blue' },
                    { label: 'נפתחו', value: analytics.totalOpened.toLocaleString(), icon: Eye, color: 'emerald', rate: `${analytics.avgOpenRate}%` },
                    { label: 'קליקים', value: analytics.totalClicked.toLocaleString(), icon: MousePointer, color: 'amber', rate: `${analytics.avgClickRate}%` },
                    { label: 'חזרו', value: analytics.totalBounced.toLocaleString(), icon: AlertCircle, color: 'red' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                                    <Icon size={24} className={`text-${stat.color}-400`} />
                                </div>
                                {stat.rate ? <span className={`text-sm font-bold text-${stat.color}-400`}>{stat.rate}</span> : null}
                            </div>
                            <div className="text-2xl font-black text-amber-100">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.label}</div>
                        </Card>
                    );
                })}
            </div>

            {/* Performance Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-amber-100 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-amber-400" />
                    ביצועי קמפיינים אחרונים
                </h3>
                <div className="space-y-4">
                    {campaigns.filter(c => c.sent > 0).slice(0, 5).map((campaign) => {
                        const openRate = Math.round((campaign.opened / campaign.sent) * 100);
                        const clickRate = Math.round((campaign.clicked / campaign.sent) * 100);
                        
                        return (
                            <div key={campaign.id} className="glass-card p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-bold text-slate-200">{campaign.name}</span>
                                    <span className="text-sm text-slate-500">{campaign.sent.toLocaleString()} נשלחו</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-500">יחס פתיחה</span>
                                            <span className="text-emerald-400 font-bold">{openRate}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${openRate}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-500">יחס הקלקה</span>
                                            <span className="text-amber-400 font-bold">{clickRate}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${clickRate}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

// ==================== Compose Modal ====================
function ComposeModal({ 
    onClose, 
    templates,
    onSend 
}: { 
    onClose: () => void; 
    templates: EmailTemplate[];
    onSend: (to: string, subject: string, body: string) => void;
}) {
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [isImproving, setIsImproving] = useState(false);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
        }
        setSelectedTemplate(templateId);
    };

    const handleSend = () => {
        if (to!) {
            toast.error('יש להזין כתובת אימייל');
            return;
        }
        if (subject!) {
            toast.error('יש להזין נושא');
            return;
        }
        onSend(to, subject, body);
    };

    const handleSaveAsDraft = () => {
        toast.success('נשמר כטיוטה');
        onClose();
    };

    const handleAIImprove = async () => {
        if (body!) {
            toast.error('יש להזין תוכן לשיפור');
            return;
        }
        setIsImproving(true);
        // Simulate AI improvement
        await new Promise(resolve => setTimeout(resolve, 1500));
        setBody(prev => `${prev}\n\n---\n✨ טקסט משופר על ידי AI:\n${prev.replace(/שלום/g, 'שלום רב').replace(/תודה/g, 'תודה רבה')}`);
        setIsImproving(false);
        toast.success('הטקסט שופר בהצלחה!');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-card rounded-3xl border border-amber-500/20 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-amber-100 flex items-center gap-2">
                        <Mail className="text-amber-400" />
                        הודעה חדשה
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-amber-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">בחר תבנית</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                        >
                            <option value="">ללא תבנית</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* To */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">אל</label>
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="הכנס כתובת אימייל..."
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">נושא</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="נושא ההודעה..."
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">תוכן</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="כתוב את ההודעה..."
                            rows={10}
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none resize-none"
                        />
                    </div>

                    {/* AI Assist */}
                    <Button 
                        variant="outline" 
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={handleAIImprove}
                        disabled={isImproving}
                    >
                        {isImproving ? (
                            <>
                                <RefreshCw size={16} className="ml-2 animate-spin" />
                                משפר...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} className="ml-2" />
                                שפר עם AI
                            </>
                        )}
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/50">
                    <Button 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                        onClick={handleSend}
                    >
                        <Send size={16} className="ml-2" />
                        שלח
                    </Button>
                    <Button variant="outline" onClick={handleSaveAsDraft}>
                        <FileText size={16} className="ml-2" />
                        שמור כטיוטה
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        ביטול
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ==================== Campaign Modal ====================
function CampaignModal({ 
    onClose, 
    templates,
    onCreate 
}: { 
    onClose: () => void; 
    templates: EmailTemplate[];
    onCreate: (data: Partial<Campaign>) => void;
}) {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedAudience, setSelectedAudience] = useState('all');

    const handleCreate = () => {
        if (name!) {
            toast.error('יש להזין שם לקמפיין');
            return;
        }
        if (subject!) {
            toast.error('יש להזין נושא');
            return;
        }

        const scheduledAt = scheduledDate && scheduledTime 
            ? `${scheduledDate}T${scheduledTime}:00`
            : undefined;

        onCreate({
            name,
            subject,
            scheduledAt,
            template: selectedTemplate
        });
    };

    const handleSaveAsDraft = () => {
        onCreate({
            name: name || 'קמפיין חדש',
            subject,
            template: selectedTemplate
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg glass-card rounded-3xl border border-amber-500/20 p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-amber-100 flex items-center gap-2">
                        <Zap className="text-amber-400" />
                        קמפיין חדש
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-amber-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">שם הקמפיין</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="לדוגמה: קמפיין חידושים ינואר"
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">נושא האימייל</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="נושא שיופיע בתיבת הדואר..."
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                        />
                    </div>

                    {/* Template */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">תבנית</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                        >
                            <option value="">בחר תבנית</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Recipients */}
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">קהל יעד</label>
                        <select
                            value={selectedAudience}
                            onChange={(e) => setSelectedAudience(e.target.value)}
                            className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                        >
                            <option value="all">כל הלקוחות (3,500)</option>
                            <option value="active">לקוחות פעילים (2,340)</option>
                            <option value="renewal">פוליסות לחידוש (450)</option>
                            <option value="leads">לידים חדשים (890)</option>
                        </select>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">תאריך</label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-1">שעה</label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full px-4 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/50">
                    <Button 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                        onClick={handleCreate}
                    >
                        <Calendar size={16} className="ml-2" />
                        {scheduledDate ? 'תזמן קמפיין' : 'צור קמפיין'}
                    </Button>
                    <Button variant="outline" onClick={handleSaveAsDraft}>
                        שמור כטיוטה
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        ביטול
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
