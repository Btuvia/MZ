"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { useState, useEffect } from "react";
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";

import { firestoreService } from "@/lib/firebase/firestore-service";
import { createUser } from "@/app/actions/users";

type User = {
    id: string; // Changed from number to string for Firestore ID
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "agent" | "client";
    status: "פעיל" | "לא פעיל";
    lastLogin?: string; // Optional as it might not be tracked yet
    agency?: string;
};

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("הכל");
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", role: "agent", status: "פעיל", agency: ""
    });

    useEffect(() => {
        loadUsers();
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
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
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
                role: formData.role,
                agency: formData.agency
            });

            if (res.success) {
                alert(`משתמש נוסף בהצלחה! הזמנה נשלחה למייל.`);
                loadUsers(); // Reload list
                closeModal();
            } else {
                alert("שגיאה: " + res.error);
            }
        } catch (e: any) {
            alert("שגיאה בתקשורת: " + e.message);
        }
    };

    const handleDeleteUser = (id: string) => {
        if (confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
            setUsers(users.filter(u => u.id !== id));
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
                        <Button
                            variant="glass"
                            className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
                            onClick={() => openModal()}
                        >
                            <UserPlus size={18} />
                            משתמש חדש
                        </Button>
                    </div>
                </div>

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
                                            <Badge className={getRoleBadge(user.role).color}>
                                                {getRoleBadge(user.role).label}
                                            </Badge>
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
        </DashboardShell>
    );
}

