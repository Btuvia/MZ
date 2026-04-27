"use client";

import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle, Handshake, FileText, Send, X, Phone, CreditCard, QrCode, Link2, Copy, Users, TrendingUp, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sendEmail } from "@/app/actions/email";
import { createUser } from "@/app/actions/users";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { NeonModal, NeonInput, NeonSelect, NeonCard, NeonTextarea } from "@/components/ui/neon-form";
import { handleError, showSuccess } from "@/lib/error-handler";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import type { UserRole } from "@/types";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "agent" | "client";
    status: "פעיל" | "לא פעיל";
    lastLogin?: string;
    agency?: string;
};

type ReferredLead = {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    closedPremium?: number;
    company?: string;
};

type Collaboration = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    type: 'סוכן' | 'נציג' | 'שיתוף פעולה';
    terms?: string;
    status: 'טיוטה' | 'נשלח חוזה' | 'חתום' | 'פעיל' | 'מבוטל';
    createdAt: Date;
    contractSentAt?: Date;
    referralCode?: string;        // קוד הפניה ייחודי
    referredLeads?: ReferredLead[]; // לידים שהופנו
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("הכל");
    const [loading, setLoading] = useState(true);
    
    // Tabs State
    const [activeTab, setActiveTab] = useState<'agents' | 'collaborations'>('agents');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", role: "agent", status: "פעיל", agency: ""
    });
    
    // Collaboration States
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
    const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);
    const [collabFormData, setCollabFormData] = useState({
        name: "", email: "", phone: "", idNumber: "", type: "שיתוף פעולה" as Collaboration['type'], terms: ""
    });
    const [sendingContract, setSendingContract] = useState(false);
    
    // QR Code Modal State
    const [qrModalCollab, setQrModalCollab] = useState<Collaboration | null>(null);
    
    // Collaborator Details Modal State
    const [detailsCollab, setDetailsCollab] = useState<Collaboration | null>(null);

    useEffect(() => {
        loadUsers();
        loadCollaborations();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await firestoreService.getUsers();
            // Map Firestore data to User type
            const mappedUsers = data.map((d: any) => ({
                id: d.id,
                firstName: d.firstName || "",
                lastName: d.lastName || "",
                email: d.email,
                role: d.role,
                status: d.status || "פעיל",
                lastLogin: "לא ידוע", // Placeholder
                agency: d.agency
            })) as User[];
            setUsers(mappedUsers);
        } catch (error) {
            handleError(error, { context: 'טעינת משתמשים' });
        } finally {
            setLoading(false);
        }
    };
    
    const loadCollaborations = async () => {
        try {
            const data = await firestoreService.getCollaborations();
            setCollaborations(data as Collaboration[]);
        } catch (error) {
            handleError(error, { context: 'טעינת שיתופי פעולה', silent: true });
            // Initialize with empty array if no data
            setCollaborations([]);
        }
    };

    const handleSaveUser = () => {
        if (formData!.firstName || formData!.lastName || formData!.email) return;

        if (editingUser) {
            // Edit existing (Not implemented fully on backend yet)
            alert("עריכת משתמש טרם נתמכה בגרסה זו");
            closeModal();
        } else {
            // Create new
            handleCreateUserApi();
        }
    };

    const handleCreateUserApi = async () => {
        try {
            const res = await createUser({
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role as UserRole,
                agency: formData.agency
            });

            if (res.success) {
                alert(`משתמש נוסף בהצלחה! הזמנה נשלחה למייל.`);
                loadUsers(); // Reload list
                closeModal();
            } else {
                alert("שגיאה: " + res.error);
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : "שגיאה לא ידועה";
            alert("שגיאה בתקשורת: " + errorMessage);
        }
    };

    const handleDeleteUser = (id: string) => {
        if (confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const handleChangeRole = async (userId: string, newRole: "admin" | "agent" | "client") => {
        try {
            await firestoreService.updateUserRole(userId, newRole);
            setUsers(users.map(u => 
                u.id === userId ? { ...u, role: newRole } : u
            ));
            toast.success(`תפקיד המשתמש שונה ל${getRoleBadge(newRole).label}`);
        } catch (error) {
            console.error("Error changing user role:", error);
            toast.error("שגיאה בשינוי תפקיד המשתמש");
        }
    };

    const toggleUserStatus = (id: string) => {
        setUsers(users.map(u =>
            u.id === id ? { ...u, status: u.status === "פעיל" ? "לא פעיל" : "פעיל" } : u
        ));
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                agency: user.agency || ""
            });
        } else {
            setEditingUser(null);
            setFormData({ firstName: "", lastName: "", email: "", role: "agent", status: "פעיל", agency: "מגן זהב" });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    // Collaboration Functions
    const openCollabModal = (collab?: Collaboration) => {
        if (collab) {
            setEditingCollab(collab);
            setCollabFormData({
                name: collab.name,
                email: collab.email,
                phone: collab.phone || "",
                idNumber: collab.idNumber || "",
                type: collab.type,
                terms: collab.terms || ""
            });
        } else {
            setEditingCollab(null);
            setCollabFormData({ name: "", email: "", phone: "", idNumber: "", type: "שיתוף פעולה", terms: "" });
        }
        setIsCollabModalOpen(true);
    };

    const closeCollabModal = () => {
        setIsCollabModalOpen(false);
        setEditingCollab(null);
    };

    const handleSaveCollab = async () => {
        if (collabFormData!.name || collabFormData!.email) {
            toast.error("שם ואימייל הם שדות חובה");
            return;
        }

        try {
            if (editingCollab) {
                // Update existing
                await firestoreService.updateCollaboration(editingCollab.id, {
                    name: collabFormData.name,
                    email: collabFormData.email,
                    phone: collabFormData.phone,
                    idNumber: collabFormData.idNumber,
                    type: collabFormData.type,
                    terms: collabFormData.terms,
                });
                toast.success("שיתוף פעולה עודכן בהצלחה");
            } else {
                // Create new
                const newCollab: Omit<Collaboration, 'id'> = {
                    name: collabFormData.name,
                    email: collabFormData.email,
                    phone: collabFormData.phone,
                    idNumber: collabFormData.idNumber,
                    type: collabFormData.type,
                    terms: collabFormData.terms,
                    status: 'טיוטה',
                    createdAt: new Date(),
                };
                await firestoreService.createCollaboration(newCollab);
                toast.success("שיתוף פעולה נוצר בהצלחה");
            }
            loadCollaborations();
            closeCollabModal();
        } catch (error) {
            console.error("Error saving collaboration:", error);
            toast.error("שגיאה בשמירת שיתוף הפעולה");
        }
    };

    const handleDeleteCollab = async (id: string) => {
        if (confirm("האם אתה בטוח שברצונך למחוק שיתוף פעולה זה?")) {
            try {
                await firestoreService.deleteCollaboration(id);
                toast.success("שיתוף פעולה נמחק בהצלחה");
                loadCollaborations();
            } catch (error) {
                console.error("Error deleting collaboration:", error);
                toast.error("שגיאה במחיקת שיתוף הפעולה");
            }
        }
    };

    const generateAndSendContract = async (collab: Collaboration) => {
        // Validate required fields for contract
        if (collab!.phone || collab!.idNumber || collab!.terms) {
            toast.error("יש למלא טלפון, תעודת זהות ותנאים לפני שליחת החוזה");
            openCollabModal(collab);
            return;
        }

        setSendingContract(true);
        try {
            // Generate contract content
            const today = new Date();
            const dateStr = today.toLocaleDateString('he-IL');
            
            const contractHtml = `
                <DOCTYPE! html>
                <html dir="rtl" lang="he">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.8; }
                        h1 { text-align: center; color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
                        .header { text-align: center; margin-bottom: 40px; }
                        .logo { font-size: 28px; font-weight: bold; color: #1e40af; }
                        .section { margin: 30px 0; }
                        .section-title { font-weight: bold; font-size: 18px; color: #374151; margin-bottom: 10px; }
                        .info-row { display: flex; margin: 10px 0; }
                        .info-label { font-weight: bold; min-width: 150px; }
                        .terms-box { background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; white-space: pre-wrap; }
                        .signature-section { margin-top: 60px; display: flex; justify-content: space-between; }
                        .signature-box { width: 45%; text-align: center; }
                        .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 10px; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">🛡️ מגן זהב</div>
                        <p>סוכנות לביטוח פנסיוני ופיננסי</p>
                    </div>
                    
                    <h1>הסכם שיתוף פעולה</h1>
                    
                    <div class="section">
                        <p><strong>תאריך:</strong> ${dateStr}</p>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">פרטי הצד המתקשר:</div>
                        <div class="info-row"><span class="info-label">שם:</span> ${collab.name}</div>
                        <div class="info-row"><span class="info-label">טלפון:</span> ${collab.phone}</div>
                        <div class="info-row"><span class="info-label">אימייל:</span> ${collab.email}</div>
                        <div class="info-row"><span class="info-label">ת.ז:</span> ${collab.idNumber}</div>
                        <div class="info-row"><span class="info-label">סוג שיתוף:</span> ${collab.type}</div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">תנאי ההסכם:</div>
                        <div class="terms-box">${collab.terms}</div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">כללי:</div>
                        <p>1. הסכם זה נערך ונחתם בין "מגן זהב" לבין הצד המתקשר הנ"ל.</p>
                        <p>2. ההסכם יכנס לתוקף עם חתימת שני הצדדים.</p>
                        <p>3. כל שינוי בהסכם יעשה בכתב ובחתימת שני הצדדים.</p>
                        <p>4. תוקף ההסכם - עד להודעה בכתב של אחד הצדדים על סיומו.</p>
                    </div>
                    
                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line">מגן זהב</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">${collab.name}</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>הסכם זה הופק ממערכת ניהול מגן זהב</p>
                        <p>לבירורים: btuvia6580@gmail.com</p>
                    </div>
                </body>
                </html>
            `;

            // Send email with contract
            const result = await sendEmail({
                to: collab.email,
                subject: `הסכם שיתוף פעולה - מגן זהב`,
                body: `שלום ${collab.name},

מצורף הסכם שיתוף פעולה עם מגן זהב.
אנא עיין/י בתנאים והחזר/י את ההסכם חתום.

בברכה,
צוות מגן זהב
                `,
                html: contractHtml
            });

            if (result.success) {
                // Update collaboration status
                await firestoreService.updateCollaboration(collab.id, {
                    status: 'נשלח חוזה',
                    contractSentAt: new Date()
                });
                toast.success(`החוזה נשלח בהצלחה ל-${collab.email}`);
                loadCollaborations();
            } else {
                toast.error("שגיאה בשליחת החוזה: " + result.error);
            }
        } catch (error) {
            console.error("Error sending contract:", error);
            toast.error("שגיאה בשליחת החוזה");
        } finally {
            setSendingContract(false);
        }
    };

    const getCollabStatusBadge = (status: Collaboration['status']) => {
        switch (status) {
            case 'טיוטה': return { color: "bg-slate-100 text-slate-600 border-slate-200" };
            case 'נשלח חוזה': return { color: "bg-amber-100 text-amber-600 border-amber-200" };
            case 'חתום': return { color: "bg-blue-100 text-blue-600 border-blue-200" };
            case 'פעיל': return { color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
            case 'מבוטל': return { color: "bg-red-100 text-red-600 border-red-200" };
            default: return { color: "bg-slate-100 text-slate-600 border-slate-200" };
        }
    };

    // Generate referral code and URL
    const generateReferralCode = async (collab: Collaboration) => {
        // Generate unique code if not exists
        if (collab!.referralCode) {
            const code = `REF-${collab.id.substring(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
            await firestoreService.updateCollaboration(collab.id, { referralCode: code });
            collab.referralCode = code;
        }
        setQrModalCollab(collab);
    };

    const getReferralUrl = (code: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        return `${baseUrl}/referral/${code}`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("הקישור הועתק ללוח!");
    };

    // Load referred leads for collaborator
    const loadCollaboratorLeads = async (collab: Collaboration) => {
        try {
            const clients = await firestoreService.getClients();
            const referredLeads = clients
                .filter((c: any) => c.referralSource === collab.id)
                .map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    status: c.salesStatus || c.status,
                    createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt),
                    closedPremium: c.closedPremium,
                    company: c.closedCompany
                }));
            
            // Update the collaboration with the leads
            const updatedCollab = { ...collab, referredLeads };
            setDetailsCollab(updatedCollab);
        } catch (error) {
            console.error("Error loading collaborator leads:", error);
            toast.error("שגיאה בטעינת הלידים");
        }
    };

    // Calculate stats for collaborator
    const getCollabStats = (collab: Collaboration) => {
        const leads = collab.referredLeads || [];
        const closedLeads = leads.filter(l => l.status === 'נסגר בהצלחה' || l.closedPremium);
        const totalPremium = closedLeads.reduce((sum, l) => sum + (l.closedPremium || 0), 0);
        
        // Group by month
        const byMonth: { [key: string]: { count: number; premium: number } } = {};
        leads.forEach(lead => {
            const month = new Date(lead.createdAt).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
            if (byMonth![month]) byMonth[month] = { count: 0, premium: 0 };
            byMonth[month].count++;
            if (lead.closedPremium) byMonth[month].premium += lead.closedPremium;
        });

        // Group by company
        const byCompany: { [key: string]: { count: number; premium: number } } = {};
        closedLeads.forEach(lead => {
            const company = lead.company || 'לא ידוע';
            if (byCompany![company]) byCompany[company] = { count: 0, premium: 0 };
            byCompany[company].count++;
            byCompany[company].premium += lead.closedPremium || 0;
        });

        return { totalLeads: leads.length, closedLeads: closedLeads.length, totalPremium, byMonth, byCompany };
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === "הכל" || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === "admin").length,
        agents: users.filter(u => u.role === "agent").length,
        clients: users.filter(u => u.role === "client").length,
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return { label: "מנהל", color: "bg-purple-100 text-purple-600 border-purple-200" };
            case "agent": return { label: "סוכן", color: "bg-blue-100 text-blue-600 border-blue-200" };
            case "client": return { label: "לקוח", color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
            default: return { label: role, color: "bg-slate-100 text-slate-600 border-slate-200" };
        }
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-linear-to-r from-amber-600 via-orange-600 to-amber-600 rounded-[2.5rem] p-12 text-slate-900 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl font-black font-display italic tracking-tighter leading-none mb-4 uppercase">ניהול משתמשים</h1>
                            <p className="text-sm font-bold text-slate-900/80 max-w-2xl">
                                שליטה מלאה במשתמשי המערכת, הרשאות סוכנים וניהול שיתופי פעולה חיצוניים
                            </p>
                        </div>
                        {activeTab === 'agents' ? (
                            <Button
                                className="bg-slate-900 text-amber-400 hover:bg-black border border-amber-500/30 gap-2 h-14 px-8 rounded-2xl shadow-xl font-black"
                                onClick={() => openModal()}
                            >
                                <UserPlus size={20} />
                                משתמש חדש
                            </Button>
                        ) : (
                            <Button
                                className="bg-slate-900 text-amber-400 hover:bg-black border border-amber-500/30 gap-2 h-14 px-8 rounded-2xl shadow-xl font-black"
                                onClick={() => openCollabModal()}
                            >
                                <Handshake size={20} />
                                שיתוף פעולה חדש
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 glass-dark rounded-[2rem] p-3 shadow-2xl border border-slate-800/50 max-w-2xl mx-auto">
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-500 ${
                            activeTab === 'agents'
                                ? 'bg-linear-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <UserPlus size={20} />
                        סוכנים ומשתמשים
                    </button>
                    <button
                        onClick={() => setActiveTab('collaborations')}
                        className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-500 ${
                            activeTab === 'collaborations'
                                ? 'bg-linear-to-r from-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/20 scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Handshake size={20} />
                        שיתוף פעולה
                    </button>
                </div>

                {activeTab === 'agents' ? (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "סך משתמשים", value: stats.total, icon: "👥", color: "from-blue-600/20 to-indigo-700/20", border: "border-blue-500/30" },
                                { label: "מנהלים", value: stats.admins, icon: "👑", color: "from-purple-600/20 to-indigo-700/20", border: "border-purple-500/30" },
                                { label: "סוכנים", value: stats.agents, icon: "💼", color: "from-emerald-600/20 to-teal-700/20", border: "border-emerald-500/30" },
                                { label: "לקוחות", value: stats.clients, icon: "🤝", color: "from-amber-500/20 to-orange-600/20", border: "border-amber-500/30" }
                            ].map((stat, i) => (
                                <NeonCard key={i} className={`p-6 border-2 ${stat.border}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                                            <h4 className="text-4xl font-black tracking-tighter text-white font-display italic">{stat.value}</h4>
                                        </div>
                                        <div className="text-3xl grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">{stat.icon}</div>
                                    </div>
                                </NeonCard>
                            ))}
                        </div>

                {/* Search and Filters */}
                <NeonCard className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 relative group">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="חפש משתמש לפי שם או אימייל..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-6 pr-14 py-5 rounded-2xl bg-[#0d1326] border-2 border-slate-800/80 font-bold text-white text-sm focus:border-amber-500 outline-none transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative min-w-[200px]">
                                <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full px-5 pr-12 py-5 rounded-2xl bg-[#0d1326] border-2 border-slate-800/80 font-black text-white text-sm focus:border-amber-500 outline-none appearance-none cursor-pointer transition-all"
                                >
                                    <option>הכל</option>
                                    <option value="admin">מנהלים</option>
                                    <option value="agent">סוכנים</option>
                                    <option value="client">לקוחות</option>
                                </select>
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">▼</div>
                            </div>
                        </div>
                    </div>
                </NeonCard>

                {/* Users Table */}
                <NeonCard className="overflow-hidden min-h-[400px] p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-900/50">
                                <tr className="border-b border-slate-800">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">משתמש</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">תפקיד</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">סטטוס</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">כניסה אחרונה</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-110 transition-transform">
                                                    {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                                                </div>
                                                <div>
                                                    <p className="font-black text-primary">{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs font-medium text-slate-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleChangeRole(user.id, e.target.value as "admin" | "agent" | "client")}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                                                    user.role === 'admin' 
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                        : user.role === 'agent'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                <option value="admin">מנהל מערכת</option>
                                                <option value="agent">סוכן</option>
                                                <option value="client">לקוח</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => toggleUserStatus(user.id)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${user.status === "פעיל"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                                    }`}
                                            >
                                                <div className={`h-2 w-2 rounded-full ${user.status === "פעיל" ? "bg-currentColor animate-pulse" : "bg-slate-400"}`} />
                                                {user.status}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-slate-400">{user.lastLogin}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="outline" size="sm" className="px-3" onClick={() => openModal(user)}>
                                                    <Edit2 size={14} className="text-slate-500" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="px-3 text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleDeleteUser(user.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                                            לא נמצאו משתמשים התואמים את החיפוש 🕵️‍♂️
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </NeonCard>
                    </>
                ) : (
                    /* Collaborations Tab Content */
                    <>
                        {/* Collaboration Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "סה״כ שיתופים", value: collaborations.length, icon: "🤝", color: "from-indigo-600/20 to-purple-700/20", border: "border-indigo-500/30" },
                                { label: "טיוטות", value: collaborations.filter(c => c.status === 'טיוטה').length, icon: "📝", color: "from-slate-500/20 to-slate-600/20", border: "border-slate-500/30" },
                                { label: "חוזים שנשלחו", value: collaborations.filter(c => c.status === 'נשלח חוזה').length, icon: "📧", color: "from-amber-500/20 to-orange-600/20", border: "border-amber-500/30" },
                                { label: "פעילים", value: collaborations.filter(c => c.status === 'פעיל').length, icon: "✅", color: "from-emerald-500/20 to-teal-600/20", border: "border-emerald-500/30" }
                            ].map((stat, i) => (
                                <NeonCard key={i} className={`p-6 border-2 ${stat.border}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                                            <h4 className="text-4xl font-black tracking-tighter text-white font-display italic">{stat.value}</h4>
                                        </div>
                                        <div className="text-3xl grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">{stat.icon}</div>
                                    </div>
                                </NeonCard>
                            ))}
                        </div>

                        {/* Collaborations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collaborations.map((collab) => (
                                <NeonCard key={collab.id} title={collab.name}>
                                    <div className="flex items-start justify-between -mt-4 mb-4">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{collab.type}</p>
                                        <Badge className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 border ${getCollabStatusBadge(collab.status).color.split(' ').filter(c => c.includes('text') || c.includes('border')).join(' ')}`}>
                                            {collab.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-amber-500">📧</span>
                                            <span className="font-bold text-slate-300">{collab.email}</span>
                                        </div>
                                        {collab.phone ? <div className="flex items-center gap-3 text-sm">
                                                <span className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-amber-500">📱</span>
                                                <span className="font-bold text-slate-300" dir="ltr">{collab.phone}</span>
                                            </div> : null}
                                        {collab.idNumber ? <div className="flex items-center gap-3 text-sm">
                                                <span className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-amber-500">🪪</span>
                                                <span className="font-bold text-slate-300">{collab.idNumber}</span>
                                            </div> : null}
                                        {collab.terms ? <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">תנאי ההסכם</p>
                                                <p className="text-sm font-medium text-slate-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">{collab.terms}</p>
                                            </div> : null}
                                        
                                        {/* Referral Code Badge */}
                                        {collab.referralCode ? <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between group/code cursor-copy transition-all hover:bg-amber-500/10" onClick={() => copyToClipboard(collab.referralCode!)}>
                                                <div className="flex items-center gap-3">
                                                    <QrCode size={18} className="text-amber-500" />
                                                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">קוד הפניה פעיל</span>
                                                </div>
                                                <span className="text-xs font-black font-mono text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg group-hover/code:border-amber-500/50 transition-all">{collab.referralCode}</span>
                                            </div> : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2"
                                            onClick={() => openCollabModal(collab)}
                                        >
                                            <Edit2 size={14} />
                                            עריכה
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2 bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
                                            onClick={() => generateReferralCode(collab)}
                                        >
                                            <QrCode size={14} />
                                            הפק קוד
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2 bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                                            onClick={() => loadCollaboratorLeads(collab)}
                                        >
                                            <Users size={14} />
                                            לידים
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2 bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                            onClick={() => generateAndSendContract(collab)}
                                            disabled={sendingContract}
                                        >
                                            <Send size={14} />
                                            {sendingContract ? "שולח..." : "שלח חוזה"}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="px-3 text-red-500 border-red-200 hover:bg-red-50"
                                            onClick={() => handleDeleteCollab(collab.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </NeonCard>
                            ))}

                            {/* Empty State */}
                            {collaborations.length === 0 && (
                                <NeonCard className="p-16 col-span-full text-center">
                                    <div className="text-8xl mb-6 grayscale opacity-20">🤝</div>
                                    <h3 className="text-2xl font-black text-white mb-3 italic tracking-tighter uppercase">אין שיתופי פעולה עדיין</h3>
                                    <p className="text-slate-500 mb-10 max-w-md mx-auto font-bold">הצטרף למהפכה הפיננסית והתחל לחבר שותפים עסקיים למערכת מגן זהב</p>
                                    <Button 
                                        className="bg-linear-to-r from-amber-500 to-orange-500 text-slate-900 font-black px-10 py-6 rounded-2xl shadow-xl shadow-amber-500/20 gap-3"
                                        onClick={() => openCollabModal()}
                                    >
                                        <Handshake size={24} />
                                        הוסף שיתוף פעולה ראשון
                                    </Button>
                                </NeonCard>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            <NeonModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingUser ? "עריכת משתמש" : "הוספת משתמש חדש"}
                onSave={handleSaveUser}
                saveLabel={editingUser ? "שמור שינויים" : "צור משתמש"}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <NeonInput 
                            label="שם פרטי"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="ישראל"
                        />
                        <NeonInput 
                            label="שם משפחה"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="ישראלי"
                        />
                    </div>
                    <NeonInput 
                        label="אימייל"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <NeonSelect 
                            label="תפקיד"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                        >
                            <option value="admin">מנהל</option>
                            <option value="agent">סוכן</option>
                            <option value="client">לקוח</option>
                        </NeonSelect>
                        <NeonSelect 
                            label="סטטוס"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                            <option value="פעיל">פעיל</option>
                            <option value="לא פעיל">לא פעיל</option>
                        </NeonSelect>
                    </div>
                </div>
            </NeonModal>

            {/* Collaboration Modal */}
            <NeonModal
                isOpen={isCollabModalOpen}
                onClose={closeCollabModal}
                title={editingCollab ? "עריכת שיתוף פעולה" : "שיתוף פעולה חדש"}
                onSave={handleSaveCollab}
                saveLabel={editingCollab ? "שמור שינויים" : "צור שיתוף פעולה"}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <NeonInput 
                            label="שם מלא *"
                            value={collabFormData.name}
                            onChange={e => setCollabFormData({ ...collabFormData, name: e.target.value })}
                            placeholder="ישראל ישראלי"
                        />
                        <NeonSelect 
                            label="סוג שיתוף"
                            value={collabFormData.type}
                            onChange={e => setCollabFormData({ ...collabFormData, type: e.target.value as any })}
                        >
                            <option value="סוכן">סוכן</option>
                            <option value="נציג">נציג</option>
                            <option value="שיתוף פעולה">שיתוף פעולה</option>
                        </NeonSelect>
                    </div>

                    <NeonInput 
                        label="אימייל *"
                        type="email"
                        value={collabFormData.email}
                        onChange={e => setCollabFormData({ ...collabFormData, email: e.target.value })}
                        placeholder="email@example.com"
                    />

                    <div className="pt-4 border-t border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <FileText size={14} className="text-amber-500" />
                             פרטים להפקת חוזה
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <NeonInput 
                                label="טלפון נייד *"
                                type="tel"
                                value={collabFormData.phone}
                                onChange={e => setCollabFormData({ ...collabFormData, phone: e.target.value })}
                                placeholder="050-1234567"
                                dir="ltr"
                            />
                            <NeonInput 
                                label="תעודת זהות *"
                                value={collabFormData.idNumber}
                                onChange={e => setCollabFormData({ ...collabFormData, idNumber: e.target.value })}
                                placeholder="123456789"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <NeonTextarea 
                        label="תנאי ההסכם *"
                        value={collabFormData.terms}
                        onChange={e => setCollabFormData({ ...collabFormData, terms: e.target.value })}
                        className="min-h-[150px]"
                        placeholder="פרט את התנאים שסוכמו..."
                    />

                    {editingCollab ? <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">סטטוס נוכחי</p>
                                <Badge className={`${getCollabStatusBadge(editingCollab.status).color.split(' ').filter(c => c.includes('text') || c.includes('border')).join(' ')} border text-[10px] px-3 py-1 font-black bg-slate-800 rounded-full mt-1`}>
                                    {editingCollab.status}
                                </Badge>
                            </div>
                            {editingCollab.contractSentAt ? <div className="text-left font-bold">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">חוזה נשלח</p>
                                    <p className="text-sm text-amber-500">
                                        {new Date(editingCollab.contractSentAt).toLocaleDateString('he-IL')}
                                    </p>
                                </div> : null}
                        </div> : null}
                </div>
            </NeonModal>

            {/* QR Code Modal */}
            <NeonModal
                isOpen={!!qrModalCollab}
                onClose={() => setQrModalCollab(null)}
                title="קוד הפניה"
                maxWidth="max-w-md"
                hideFooter
            >
                {qrModalCollab && (
                    <div className="text-center">
                        <div className="h-20 w-20 rounded-[2rem] bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-900 mx-auto mb-6 shadow-xl shadow-amber-500/20">
                            <QrCode size={40} />
                        </div>
                        <p className="text-slate-400 mb-8 font-bold italic">שתף את הקוד עם <span className="text-amber-500">{qrModalCollab.name}</span></p>

                        {/* QR Code */}
                        <div className="bg-white border-8 border-slate-900 rounded-[2.5rem] p-8 inline-block mb-10 shadow-inner group transition-all hover:scale-[1.02] cursor-none relative">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getReferralUrl(qrModalCollab.referralCode || ''))}`}
                                alt="QR Code"
                                className="w-56 h-56"
                            />
                        </div>

                        {/* URL */}
                        <div className="bg-[#0d1326] border-2 border-slate-800 rounded-[2rem] p-6 mb-8">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">קישור ישיר להפניה</p>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text" 
                                    value={getReferralUrl(qrModalCollab.referralCode || '')}
                                    readOnly
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-amber-500 outline-none"
                                    dir="ltr"
                                />
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyToClipboard(getReferralUrl(qrModalCollab.referralCode || ''))}
                                    className="h-11 px-5 rounded-xl border-slate-800 hover:bg-amber-500 hover:text-slate-900 gap-2 transition-all"
                                >
                                    <Copy size={16} />
                                    העתק
                                </Button>
                            </div>
                        </div>

                        {/* Code */}
                        <div className="flex items-center justify-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-6 group cursor-copy active:scale-95 transition-all" onClick={() => copyToClipboard(qrModalCollab.referralCode || '')}>
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">קוד אישי:</span>
                            <span className="font-mono text-3xl font-black text-white tracking-widest">{qrModalCollab.referralCode}</span>
                            <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-amber-500 group-hover:text-slate-900 transition-colors">
                                <Copy size={20} />
                            </div>
                        </div>
                    </div>
                )}
            </NeonModal>

            {/* Collaborator Details Modal - Leads & Stats */}
            <NeonModal
                isOpen={!!detailsCollab}
                onClose={() => setDetailsCollab(null)}
                title={detailsCollab?.name || ""}
                maxWidth="max-w-4xl"
                hideFooter
            >
                {detailsCollab && (() => {
                    const stats = getCollabStats(detailsCollab);
                    return (
                        <div className="space-y-8">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <NeonCard className="border-blue-500/30 p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">סה״כ לידים</p>
                                    <p className="text-4xl font-black text-white italic font-display">{stats.totalLeads}</p>
                                </NeonCard>
                                <NeonCard className="border-emerald-500/30 p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">נסגרו בהצלחה</p>
                                    <p className="text-4xl font-black text-emerald-500 italic font-display">{stats.closedLeads}</p>
                                </NeonCard>
                                <NeonCard className="border-amber-500/30 p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">סה״כ פרמיה</p>
                                    <p className="text-4xl font-black text-amber-500 italic font-display">₪{stats.totalPremium.toLocaleString()}</p>
                                </NeonCard>
                            </div>

                            {/* Analytics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* By Month */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUp size={16} className="text-blue-500" />
                                        ביצועים לפי חודש
                                    </h4>
                                    {Object.keys(stats.byMonth).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(stats.byMonth).map(([month, data]) => (
                                                <div key={month} className="flex items-center justify-between p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] group hover:border-blue-500/30 transition-all">
                                                    <span className="font-black text-slate-200">{month}</span>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-xs font-bold text-slate-500">{data.count} לידים</span>
                                                        <span className="font-black text-emerald-500">₪{data.premium.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-600 bg-slate-900/30 py-10 rounded-[1.5rem] border border-dashed border-slate-800 font-bold">אין נתוני חודשים</p>
                                    )}
                                </div>

                                {/* By Company */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={16} className="text-purple-500" />
                                        התפלגות לפי חברה
                                    </h4>
                                    {Object.keys(stats.byCompany).length > 0 ? (
                                        <div className="space-y-3">
                                            {Object.entries(stats.byCompany).map(([company, data]) => (
                                                <div key={company} className="flex items-center justify-between p-5 bg-slate-900/50 border border-slate-800 rounded-[1.5rem] group hover:border-purple-500/30 transition-all">
                                                    <span className="font-black text-slate-200">{company}</span>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-xs font-bold text-slate-500">{data.count} עסקאות</span>
                                                        <span className="font-black text-emerald-500">₪{data.premium.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-600 bg-slate-900/30 py-10 rounded-[1.5rem] border border-dashed border-slate-800 font-bold">אין נתוני חברות</p>
                                    )}
                                </div>
                            </div>

                            {/* Leads List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">רשימת לידים מלאה</h4>
                                {(detailsCollab.referredLeads?.length || 0) > 0 ? (
                                    <div className="space-y-3">
                                        {detailsCollab.referredLeads?.map(lead => (
                                            <div key={lead.id} className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-amber-500/30 hover:bg-slate-900 transition-all group">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black text-xl italic font-display">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-lg tracking-tight">{lead.name}</p>
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                                            {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lead.status === 'נסגר בהצלחה' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                                        {lead.status}
                                                    </Badge>
                                                    {lead.closedPremium ? <span className="font-black text-emerald-500 text-lg">₪{lead.closedPremium.toLocaleString()}</span> : null}
                                                    {lead.company ? <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{lead.company}</span> : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-[2.5rem]">
                                        <Users size={64} className="mx-auto mb-6 opacity-10" />
                                        <p className="font-black text-slate-600 uppercase tracking-[0.2em]">עדיין אין לידים משותף זה</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </NeonModal>
        </DashboardShell>
    );
}

