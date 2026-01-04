"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { useState, useEffect } from "react";
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle, Handshake, FileText, Send, X, Phone, CreditCard, QrCode, Link2, Copy, Users, TrendingUp, Building2 } from "lucide-react";

import { firestoreService } from "@/lib/firebase/firestore-service";
import { createUser } from "@/app/actions/users";
import { sendEmail } from "@/app/actions/email";
import { toast } from "sonner";
import { handleError, showSuccess } from "@/lib/error-handler";
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
        if (!formData.firstName || !formData.lastName || !formData.email) return;

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
        if (!collabFormData.name || !collabFormData.email) {
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
        if (!collab.phone || !collab.idNumber || !collab.terms) {
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
                <!DOCTYPE html>
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
        if (!collab.referralCode) {
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
            if (!byMonth[month]) byMonth[month] = { count: 0, premium: 0 };
            byMonth[month].count++;
            if (lead.closedPremium) byMonth[month].premium += lead.closedPremium;
        });

        // Group by company
        const byCompany: { [key: string]: { count: number; premium: number } } = {};
        closedLeads.forEach(lead => {
            const company = lead.company || 'לא ידוע';
            if (!byCompany[company]) byCompany[company] = { count: 0, premium: 0 };
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
                <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black font-display leading-none mb-4">ניהול משתמשים</h1>
                            <p className="text-sm font-medium text-white/80 max-w-2xl">
                                ניהול מלא של משתמשי המערכת, הרשאות ותפקידים
                            </p>
                        </div>
                        {activeTab === 'agents' ? (
                            <Button
                                variant="glass"
                                className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
                                onClick={() => openModal()}
                            >
                                <UserPlus size={18} />
                                משתמש חדש
                            </Button>
                        ) : (
                            <Button
                                variant="glass"
                                className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
                                onClick={() => openCollabModal()}
                            >
                                <Handshake size={18} />
                                שיתוף פעולה חדש
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg border border-slate-100">
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'agents'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <UserPlus size={18} />
                        סוכנים ומשתמשים
                    </button>
                    <button
                        onClick={() => setActiveTab('collaborations')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                            activeTab === 'collaborations'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Handshake size={18} />
                        שיתוף פעולה
                    </button>
                </div>

                {activeTab === 'agents' ? (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "סך משתמשים", value: stats.total, icon: "👥", color: "from-blue-600 to-indigo-700" },
                                { label: "מנהלים", value: stats.admins, icon: "👑", color: "from-purple-600 to-indigo-700" },
                                { label: "סוכנים", value: stats.agents, icon: "💼", color: "from-emerald-600 to-teal-700" },
                                { label: "לקוחות", value: stats.clients, icon: "🤝", color: "from-amber-500 to-orange-600" }
                            ].map((stat, i) => (
                                <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
                                    <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                        <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                                    </div>
                                </Card>
                            ))}
                        </div>

                {/* Search and Filters */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="חפש משתמש לפי שם או אימייל..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-5 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 h-full"
                                >
                                    <option>הכל</option>
                                    <option value="admin">מנהלים</option>
                                    <option value="agent">סוכנים</option>
                                    <option value="client">לקוחות</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Users Table */}
                <Card className="border-none shadow-xl bg-white overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">משתמש</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">תפקיד</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">סטטוס</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">כניסה אחרונה</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-110 transition-transform">
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
                                                <div className={`h-2 w-2 rounded-full ${user.status === "פעיל" ? "bg-currentColor animate-pulse" : "bg-slate-400"}`}></div>
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
                </Card>
                    </>
                ) : (
                    /* Collaborations Tab Content */
                    <>
                        {/* Collaboration Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "סה״כ שיתופים", value: collaborations.length, icon: "🤝", color: "from-indigo-600 to-purple-700" },
                                { label: "טיוטות", value: collaborations.filter(c => c.status === 'טיוטה').length, icon: "📝", color: "from-slate-500 to-slate-600" },
                                { label: "חוזים שנשלחו", value: collaborations.filter(c => c.status === 'נשלח חוזה').length, icon: "📧", color: "from-amber-500 to-orange-600" },
                                { label: "פעילים", value: collaborations.filter(c => c.status === 'פעיל').length, icon: "✅", color: "from-emerald-500 to-teal-600" }
                            ].map((stat, i) => (
                                <Card key={i} className={`border-none p-6 text-white bg-gradient-to-br ${stat.color} shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform`}>
                                    <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                        <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Collaborations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collaborations.map((collab) => (
                                <Card key={collab.id} className="border-none shadow-lg bg-white p-6 group hover:-translate-y-1 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                                                <Handshake size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900">{collab.name}</h4>
                                                <p className="text-xs font-medium text-slate-400">{collab.type}</p>
                                            </div>
                                        </div>
                                        <Badge className={`${getCollabStatusBadge(collab.status).color} border`}>
                                            {collab.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-slate-400">📧</span>
                                            <span className="font-medium text-slate-600">{collab.email}</span>
                                        </div>
                                        {collab.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-400">📱</span>
                                                <span className="font-medium text-slate-600">{collab.phone}</span>
                                            </div>
                                        )}
                                        {collab.idNumber && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-slate-400">🪪</span>
                                                <span className="font-medium text-slate-600">{collab.idNumber}</span>
                                            </div>
                                        )}
                                        {collab.terms && (
                                            <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                                                <p className="text-xs font-bold text-slate-500 mb-1">תנאי ההסכם:</p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">{collab.terms}</p>
                                            </div>
                                        )}
                                        
                                        {/* Referral Code Badge */}
                                        {collab.referralCode && (
                                            <div className="mt-3 p-3 bg-indigo-50 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <QrCode size={16} className="text-indigo-600" />
                                                    <span className="text-xs font-bold text-indigo-600">קוד הפניה פעיל</span>
                                                </div>
                                                <span className="text-xs font-mono bg-indigo-100 px-2 py-1 rounded text-indigo-700">{collab.referralCode}</span>
                                            </div>
                                        )}
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
                                </Card>
                            ))}

                            {/* Empty State */}
                            {collaborations.length === 0 && (
                                <Card className="border-none shadow-lg bg-white p-12 col-span-full text-center">
                                    <div className="text-6xl mb-4">🤝</div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">אין שיתופי פעולה עדיין</h3>
                                    <p className="text-slate-500 mb-6">התחל להוסיף שיתופי פעולה חדשים</p>
                                    <Button 
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg gap-2"
                                        onClick={() => openCollabModal()}
                                    >
                                        <Handshake size={18} />
                                        הוסף שיתוף פעולה ראשון
                                    </Button>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                        <h3 className="text-2xl font-black font-display text-slate-900 mb-6">
                            {editingUser ? "עריכת משתמש" : "הוספת משתמש חדש"}
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">שם פרטי</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="ישראל"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">שם משפחה</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="ישראלי"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 block">אימייל</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="hidden">
                                <label className="text-xs font-black text-slate-500 mb-1 block">סוכנות</label>
                                <input
                                    type="text"
                                    value={formData.agency}
                                    onChange={e => setFormData({ ...formData, agency: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="שם הסוכנות (אופציונלי)"
                                    disabled
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">תפקיד</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="admin">מנהל</option>
                                        <option value="agent">סוכן</option>
                                        <option value="client">לקוח</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">סטטוס</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="פעיל">פעיל</option>
                                        <option value="לא פעיל">לא פעיל</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="ghost" onClick={closeModal}>ביטול</Button>
                            <Button onClick={handleSaveUser} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                {editingUser ? "שמור שינויים" : "צור משתמש"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collaboration Modal */}
            {isCollabModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        
                        <button 
                            onClick={closeCollabModal}
                            className="absolute top-4 left-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                <Handshake size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black font-display text-slate-900">
                                    {editingCollab ? "עריכת שיתוף פעולה" : "שיתוף פעולה חדש"}
                                </h3>
                                <p className="text-sm text-slate-500">מלא את הפרטים ליצירת הסכם</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">שם מלא *</label>
                                    <input
                                        type="text"
                                        value={collabFormData.name}
                                        onChange={e => setCollabFormData({ ...collabFormData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="ישראל ישראלי"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 mb-1 block">סוג שיתוף</label>
                                    <select
                                        value={collabFormData.type}
                                        onChange={e => setCollabFormData({ ...collabFormData, type: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="סוכן">סוכן</option>
                                        <option value="נציג">נציג</option>
                                        <option value="שיתוף פעולה">שיתוף פעולה</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 block">אימייל *</label>
                                <input
                                    type="email"
                                    value={collabFormData.email}
                                    onChange={e => setCollabFormData({ ...collabFormData, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>

                            {/* Contact Info for Contract */}
                            <div className="border-t border-slate-100 pt-4 mt-4">
                                <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-500" />
                                    פרטים להפקת חוזה
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-500 mb-1 flex items-center gap-1">
                                            <Phone size={12} />
                                            טלפון נייד *
                                        </label>
                                        <input
                                            type="tel"
                                            value={collabFormData.phone}
                                            onChange={e => setCollabFormData({ ...collabFormData, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="050-1234567"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-500 mb-1 flex items-center gap-1">
                                            <CreditCard size={12} />
                                            תעודת זהות *
                                        </label>
                                        <input
                                            type="text"
                                            value={collabFormData.idNumber}
                                            onChange={e => setCollabFormData({ ...collabFormData, idNumber: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="123456789"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div>
                                <label className="text-xs font-black text-slate-500 mb-1 flex items-center gap-1">
                                    <FileText size={12} />
                                    תנאי ההסכם *
                                </label>
                                <p className="text-xs text-slate-400 mb-2">פרט את התנאים שסוכמו עם השותף - אחוזי עמלה, תחומי אחריות וכו׳</p>
                                <textarea
                                    value={collabFormData.terms}
                                    onChange={e => setCollabFormData({ ...collabFormData, terms: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px] resize-y"
                                    placeholder={`לדוגמה:
• עמלת הפניה: 10% מהעמלה על כל לקוח שמופנה
• תחום פעילות: ביטוח חיים ופנסיה
• תקופת ההסכם: שנה עם אפשרות הארכה
• תנאי תשלום: העברה בנקאית עד ל-10 לכל חודש`}
                                />
                            </div>

                            {editingCollab && (
                                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500">סטטוס נוכחי</p>
                                        <Badge className={`${getCollabStatusBadge(editingCollab.status).color} border mt-1`}>
                                            {editingCollab.status}
                                        </Badge>
                                    </div>
                                    {editingCollab.contractSentAt && (
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-slate-500">חוזה נשלח בתאריך</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {new Date(editingCollab.contractSentAt).toLocaleDateString('he-IL')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 border-t border-slate-100 pt-6">
                            <Button variant="ghost" onClick={closeCollabModal}>ביטול</Button>
                            <Button 
                                onClick={handleSaveCollab} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2"
                            >
                                {editingCollab ? "שמור שינויים" : "צור שיתוף פעולה"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {qrModalCollab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setQrModalCollab(null)}
                            className="absolute top-4 left-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>

                        <div className="text-center">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4">
                                <QrCode size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">קוד הפניה</h3>
                            <p className="text-slate-500 mb-6">שתף את הקוד עם {qrModalCollab.name}</p>

                            {/* QR Code */}
                            <div className="bg-white border-4 border-slate-100 rounded-2xl p-6 inline-block mb-6">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getReferralUrl(qrModalCollab.referralCode || ''))}`}
                                    alt="QR Code"
                                    className="w-48 h-48"
                                />
                            </div>

                            {/* URL */}
                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <p className="text-xs font-bold text-slate-500 mb-2">קישור להפניה:</p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={getReferralUrl(qrModalCollab.referralCode || '')}
                                        readOnly
                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600"
                                        dir="ltr"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => copyToClipboard(getReferralUrl(qrModalCollab.referralCode || ''))}
                                        className="gap-1"
                                    >
                                        <Copy size={14} />
                                        העתק
                                    </Button>
                                </div>
                            </div>

                            {/* Code */}
                            <div className="flex items-center justify-center gap-3 bg-indigo-50 rounded-xl p-4">
                                <span className="text-sm font-bold text-indigo-600">קוד:</span>
                                <span className="font-mono text-lg font-black text-indigo-700">{qrModalCollab.referralCode}</span>
                                <button 
                                    onClick={() => copyToClipboard(qrModalCollab.referralCode || '')}
                                    className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collaborator Details Modal - Leads & Stats */}
            {detailsCollab && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setDetailsCollab(null)}
                            className="absolute top-4 left-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{detailsCollab.name}</h3>
                                <p className="text-slate-500">לידים והפניות</p>
                            </div>
                        </div>

                        {(() => {
                            const stats = getCollabStats(detailsCollab);
                            return (
                                <>
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <Card className="border-none bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white">
                                            <p className="text-xs font-bold text-white/70 mb-1">סה״כ לידים</p>
                                            <p className="text-3xl font-black">{stats.totalLeads}</p>
                                        </Card>
                                        <Card className="border-none bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
                                            <p className="text-xs font-bold text-white/70 mb-1">נסגרו בהצלחה</p>
                                            <p className="text-3xl font-black">{stats.closedLeads}</p>
                                        </Card>
                                        <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white">
                                            <p className="text-xs font-bold text-white/70 mb-1">סה״כ פרמיה</p>
                                            <p className="text-3xl font-black">₪{stats.totalPremium.toLocaleString()}</p>
                                        </Card>
                                    </div>

                                    {/* By Month & Company */}
                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        {/* By Month */}
                                        <Card className="border-none shadow-md bg-white p-5">
                                            <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                                <TrendingUp size={18} className="text-indigo-600" />
                                                לפי חודש
                                            </h4>
                                            {Object.keys(stats.byMonth).length > 0 ? (
                                                <div className="space-y-2">
                                                    {Object.entries(stats.byMonth).map(([month, data]) => (
                                                        <div key={month} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                                            <span className="font-bold text-slate-700">{month}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-slate-500">{data.count} לידים</span>
                                                                <span className="font-bold text-emerald-600">₪{data.premium.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-slate-400 py-4">אין נתונים</p>
                                            )}
                                        </Card>

                                        {/* By Company */}
                                        <Card className="border-none shadow-md bg-white p-5">
                                            <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                                <Building2 size={18} className="text-purple-600" />
                                                לפי חברה
                                            </h4>
                                            {Object.keys(stats.byCompany).length > 0 ? (
                                                <div className="space-y-2">
                                                    {Object.entries(stats.byCompany).map(([company, data]) => (
                                                        <div key={company} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                                            <span className="font-bold text-slate-700">{company}</span>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-slate-500">{data.count} עסקאות</span>
                                                                <span className="font-bold text-emerald-600">₪{data.premium.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-slate-400 py-4">אין נתונים</p>
                                            )}
                                        </Card>
                                    </div>

                                    {/* Leads List */}
                                    <Card className="border-none shadow-md bg-white p-5">
                                        <h4 className="font-black text-slate-900 mb-4">כל הלידים</h4>
                                        {(detailsCollab.referredLeads?.length || 0) > 0 ? (
                                            <div className="space-y-3">
                                                {detailsCollab.referredLeads?.map(lead => (
                                                    <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black">
                                                                {lead.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{lead.name}</p>
                                                                <p className="text-xs text-slate-400">
                                                                    {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <Badge className={lead.status === 'נסגר בהצלחה' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}>
                                                                {lead.status}
                                                            </Badge>
                                                            {lead.closedPremium && (
                                                                <span className="font-bold text-emerald-600">₪{lead.closedPremium.toLocaleString()}</span>
                                                            )}
                                                            {lead.company && (
                                                                <span className="text-sm text-slate-500">{lead.company}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-slate-400">
                                                <Users size={48} className="mx-auto mb-4 opacity-30" />
                                                <p className="font-bold">עדיין אין לידים משותף זה</p>
                                            </div>
                                        )}
                                    </Card>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}

