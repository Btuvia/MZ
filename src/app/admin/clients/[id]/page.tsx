"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { generateGeminiContent } from "@/lib/gemini-client";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { Edit2, Copy, Save, Trash2, Plus, X, Upload, Share2, Send } from "lucide-react";

// --- Types & Interfaces ---

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

type ClientData = {
    id: string;
    name: string;
    idNumber: string;
    phone: string;
    email: string;
    status: "פעיל" | "לא פעיל" | "נמכר";
    address: { city: string; street: string; num: string };
    employment: { status: string; occupation: string };
    family: FamilyMember[];
    policies: Policy[];
    tasks: Task[];
    pensionSales: PensionProduct[];
    insuranceSales: InsuranceProduct[];
    aiInsights?: any;
};

// --- Initial Data (Mock) ---

const INITIAL_CLIENT: ClientData = {
    id: "active",
    name: "שרה אולט בסמוט",
    idNumber: "329919617",
    phone: "0534261094",
    email: "sarabismot@gmail.com",
    status: "פעיל",
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
    insuranceSales: []
};

export default function ClientDetailsPage() {
    const params = useParams();
    const clientId = params.id as string || "active";
    const [activeTab, setActiveTab] = useState("פרטים אישיים");

    // Main Persisted State
    const [client, setClient] = useState<ClientData>(INITIAL_CLIENT);
    const [clientTasks, setClientTasks] = useState<any[]>([]); // New state for global tasks
    const [loading, setLoading] = useState(true);

    // AI State
    const [aiInsight, setAiInsight] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    // Modals & Forms
    const [editMode, setEditMode] = useState<{ type: string; item?: any } | null>(null);
    const [formData, setFormData] = useState<any>({});

    // Sales Forms State
    const [pensionForm, setPensionForm] = useState<Partial<PensionProduct>>({});
    const [insuranceForm, setInsuranceForm] = useState<Partial<InsuranceProduct>>({});
    const [showPlatinumSelect, setShowPlatinumSelect] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [showMarketModal, setShowMarketModal] = useState(false);

    // --- Persistence ---
    useEffect(() => {
        const loadClient = async () => {
            if (clientId === "new") {
                setClient({ ...INITIAL_CLIENT, id: "", name: "לקוח חדש" }); // Clear initial data for new
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

    const handleEdit = (type: string, item?: any) => {
        setFormData(item ? { ...item } : {});
        setEditMode({ type, item });
    };

    const handleSaveModal = async () => {
        if (!editMode) return;

        const { type } = editMode;

        if (type === "family") {
            const list = [...client.family];
            if (formData.id) {
                const idx = list.findIndex(i => i.id === formData.id);
                if (idx > -1) list[idx] = formData;
            } else {
                list.push({ ...formData, id: Date.now().toString() });
            }
            saveData("family", list);
        }
        else if (type === "policy") {
            const list = [...client.policies];
            if (formData.id) {
                const idx = list.findIndex(i => i.id === formData.id);
                if (idx > -1) list[idx] = formData;
            } else {
                list.push({ ...formData, id: Date.now().toString(), color: "from-slate-500 to-slate-700", icon: "📄" });
            }
            saveData("policies", list);
        }
        else if (type === "task") {
            const priorityMap: any = { "נמוכה": "low", "בינונית": "medium", "גבוהה": "high" };
            const statusMap: any = { "ממתינה": "pending", "בתהליך": "pending", "הושלמה": "completed" };

            const taskData = {
                title: formData.title,
                priority: priorityMap[formData.priority] || "medium",
                date: formData.dueDate,
                time: "10:00",
                type: "task",
                status: statusMap[formData.status] || "pending",
                client: client.name,
                clientId: client.id,
                assignee: formData.assignee || "admin"
            };

            if (formData.id) {
                await firestoreService.updateTask(formData.id, taskData);
                setClientTasks(prev => prev.map(t => t.id === formData.id ? { ...t, ...taskData } : t));
            } else {
                const newId = await firestoreService.addTask(taskData);
                setClientTasks(prev => [...prev, { ...taskData, id: newId }]);
            }
        }
        else if (type === "personal") {
            // Personal details update
            const updatedClient = { ...client, ...formData };
            setClient(updatedClient);

            // Check if status changed to "נמכר"
            if (formData.status === "נמכר" && client.status !== "נמכר") {
                handleSoldClientAutomation(formData);
            }

            // Sync with Firestore entire object or specific fields
            if (client.id && client.id !== "new" && client.id !== "active") {
                await firestoreService.updateClient(client.id, formData);
            }
        }

        setEditMode(null);
    };

    const handleSoldClientAutomation = async (data: any) => {
        if (!data.email) return alert("לא ניתן ליצור משתמש ללא אימייל");

        const password = Math.random().toString(36).slice(-8) + "Aa1!"; // Weak random password for demo

        try {
            const res = await fetch("/api/admin/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    password: password,
                    displayName: data.name,
                    role: "client"
                })
            });

            const result = await res.json();

            if (result.success) {
                // Determine gender for Hebrew text (naive check)
                const isFemale = data.name.split(" ")[0].endsWith("ה") || data.name.split(" ")[0].endsWith("ת");
                const dear = isFemale ? "יקרה" : "יקר";

                // Simulate Email Sending
                console.log(`
                📧 מייל נשלח ללקוח: ${data.email}
                -------------------------------------------------
                נושא: ברוכים הבאים למגן זהב! פרטי התחברות למערכת
                
                שלום ${data.name} ה${dear},
                
                אנו שמחים לבשר לך שתהליך ההצטרפות הושלם בהצלחה! 🥂
                כעת באפשרותך להיכנס לאזור האישי ולצפות בכל התיק הביטוחי שלך.
                
                פרטי ההתחברות שלך:
                שם משתמש: ${data.email}
                סיסמה זמנית: ${password}
                
                להתחברות: https://app.insurcrm.com/login
                
                בברכה,
                צוות מגן זהב
                -------------------------------------------------
                `);

                alert(`סטטוס שונה ל"נמכר"! \n\n✅ נוצר משתמש במערכת\n📧 נשלח מייל ללקוח עם הסיסמה: ${password}`);
            } else {
                console.error(result.error);
                alert("שגיאה ביצירת משתמש: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("שגיאה בתקשורת עם השרת");
        }
    };

    const deleteItem = async (key: "family" | "policies" | "tasks" | "pensionSales" | "insuranceSales", id: string) => {
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

    const handleReferral = (type: string) => {
        const isElementary = type === "ביטוח אלמנטרי";
        const recipient = isElementary ? "office@tlp-ins.co.il" : "hafnayot@tlp-ins.co.il";
        const cc = "btuvia6580@gmail.com";
        const subject = `הפניית לקוח - ${client.name} - ${type}`;
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
    const fetchAiInsights = async () => {
        const apiKey = localStorage.getItem("gemini_api_key");
        if (!apiKey) return;
        setLoadingAi(true);
        try {
            // Simulating context for AI
            const prompt = `Analyze insurance client: ${JSON.stringify(client)}. Return JSON: { "riskScore": 15, "analysis": "...", "opportunities": [{"text": "...", "impact": "..."}] }`;
            const res = await generateGeminiContent(prompt, apiKey);
            if (!res.error) {
                setAiInsight(JSON.parse(res.text.replace(/```json/g, '').replace(/```/g, '').trim()));
            }
        } catch (e) { console.error(e); } finally { setLoadingAi(false); }
    };

    useEffect(() => {
        if (activeTab === "תובנות AI" && !aiInsight) fetchAiInsights();
    }, [activeTab]);


    const tabs = ["סטטוס", "לביצוע מכירה", "פרטים אישיים", "אלמנטרי", "פוליסות", "מסמכים", "משימות", "תקשורת", "פיננסי", "הר הביטוח", "תובנות AI"];

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6 animate-in fade-in duration-700" dir="rtl">

                {/* Header */}
                <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    {/* Edit Button */}
                    <button onClick={() => handleEdit("personal", { name: client.name, phone: client.phone, email: client.email, status: client.status, idNumber: client.idNumber })} className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all">
                        <Edit2 size={16} />
                    </button>

                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6 text-right w-full md:w-auto">
                            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/30 shadow-xl">
                                {client.name.substring(0, 2)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black font-display leading-none mb-2">{client.name}</h1>
                                <p className="text-sm font-bold text-white/70 uppercase tracking-widest font-display">{client.idNumber} | {client.phone} | {client.email}</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${client.status === 'פעיל' ? 'bg-emerald-400/30 text-emerald-100' : 'bg-red-400/30 text-red-100'}`}>סטטוס: {client.status}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowReferralModal(true)}
                            className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-2xl shadow-lg font-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Share2 size={18} />
                            הפניית לקוח
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- Tab Content: Sales Execution --- */}
                {activeTab === "לביצוע מכירה" && (
                    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {/* Pension Sales Section */}
                        <Card className="border-none shadow-xl bg-white p-8">
                            <h4 className="text-xl font-black text-primary italic mb-6 border-b border-slate-50 pb-4 flex items-center gap-2">
                                <span className="bg-indigo-500/10 p-2 rounded-xl text-indigo-600">📈</span> מכירה פנסיונית
                            </h4>

                            {/* Pension Form */}
                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סוג המוצר</label>
                                        <select value={pensionForm.type || ""} onChange={e => setPensionForm({ ...pensionForm, type: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                            <option value="">בחר...</option><option>קופת גמל</option><option>קרן השתלמות</option><option>קרן פנסיה</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חברה מנהלת</label>
                                        <select value={pensionForm.company || ""} onChange={e => setPensionForm({ ...pensionForm, company: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                            <option value="">בחר...</option><option>אלטשולר שחם</option><option>הפניקס</option><option>הראל</option><option>כלל</option><option>מגדל</option><option>מיטב</option><option>מנורה</option><option>פסגות</option><option>מור</option><option>אינפיניטי</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">שם התוכנית</label>
                                        <input type="text" value={pensionForm.planName || ""} onChange={e => setPensionForm({ ...pensionForm, planName: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">דנ"ה מצבירה (%)</label>
                                        <input type="number" step="0.01" value={pensionForm.managementFeeAccumulation || ""} onChange={e => setPensionForm({ ...pensionForm, managementFeeAccumulation: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">דנ"ה מהפקה (%)</label>
                                        <input type="number" step="0.01" value={pensionForm.managementFeeDeposit || ""} onChange={e => setPensionForm({ ...pensionForm, managementFeeDeposit: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מועד הצטרפות</label>
                                        <input type="date" value={pensionForm.joinDate || ""} onChange={e => setPensionForm({ ...pensionForm, joinDate: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מספר קופה/עמית</label>
                                        <input type="text" value={pensionForm.fundNumber || ""} onChange={e => setPensionForm({ ...pensionForm, fundNumber: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">משכורת ממוצעת</label>
                                        <input type="number" value={pensionForm.avgSalary || ""} onChange={e => setPensionForm({ ...pensionForm, avgSalary: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <Button onClick={handleAddPension} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg font-black">➕ לטעינת מוצר נוסף</Button>
                                    <Button onClick={() => setShowMarketModal(true)} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white shadow-lg font-black flex items-center justify-center gap-2"><span>📊</span> ניתוח שוק (AI)</Button>
                                </div>
                            </div>

                            {/* List of Added Pension Products */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">מוצרים שנוספו ({client.pensionSales.length})</h5>
                                {client.pensionSales.map(item => (
                                    <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-sm flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-primary">{item.type} - {item.company}</p>
                                            <p className="text-xs text-slate-400">{item.fundNumber}</p>
                                        </div>
                                        <button onClick={() => deleteItem("pensionSales", item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Insurance Sales Section */}
                        <Card className="border-none shadow-xl bg-white p-8">
                            <h4 className="text-xl font-black text-primary italic mb-6 border-b border-slate-50 pb-4 flex items-center gap-2">
                                <span className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">🛡️</span> מכירת ביטוח
                            </h4>

                            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">חברת ביטוח</label>
                                        <select value={insuranceForm.company || ""} onChange={e => setInsuranceForm({ ...insuranceForm, company: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                            <option value="">בחר...</option><option>הראל</option><option>הפניקס</option><option>מנורה</option><option>איילון</option><option>הכשרה</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 bg-white p-3 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <label className="text-sm font-bold text-primary">מכירת פלטינום?</label>
                                            <div className="flex gap-2">
                                                <label className="flex items-center gap-1 text-xs"><input type="radio" name="plat" onChange={() => setShowPlatinumSelect(true)} checked={showPlatinumSelect} /> כן</label>
                                                <label className="flex items-center gap-1 text-xs"><input type="radio" name="plat" onChange={() => setShowPlatinumSelect(false)} checked={!showPlatinumSelect} /> לא</label>
                                            </div>
                                        </div>
                                        {showPlatinumSelect && (
                                            <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">בחר מוצרי פלטינום</label>
                                                <select multiple className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold h-24"
                                                    onChange={e => {
                                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                        setInsuranceForm({ ...insuranceForm, platinumProducts: selected });
                                                    }}
                                                >
                                                    <option>פלטינום בריאות</option><option>פלטינום פרימיום</option><option>רופא עד הבית</option><option>שיניים</option><option>רפואה אלטרנטיבית</option>
                                                </select>
                                                <p className="text-[10px] text-slate-400 mt-1">* ניתן לבחור מספר פריטים (Ctrl+Click)</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">מוצר ביטוח</label>
                                        <select value={insuranceForm.productType || ""} onChange={e => setInsuranceForm({ ...insuranceForm, productType: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                            <option value="">בחר...</option><option>בריאות</option><option>מחלות קשות</option><option>ריסק</option><option>תאונות אישיות</option><option>משכנתא</option><option>אכע</option><option>מטריה ביטוחית</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">סכום ביטוח</label>
                                        <input type="number" value={insuranceForm.amount || ""} onChange={e => setInsuranceForm({ ...insuranceForm, amount: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        <label className="text-sm font-bold text-primary">האם קיים שיעבוד?</label>
                                        <input type="checkbox" checked={insuranceForm.hasLien || false} onChange={e => setInsuranceForm({ ...insuranceForm, hasLien: e.target.checked })} className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">פרמיה</label>
                                        <input type="number" value={insuranceForm.premium || ""} onChange={e => setInsuranceForm({ ...insuranceForm, premium: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">כמה נפשות בפוליסה</label>
                                        <input type="number" value={insuranceForm.numInsured || 1} onChange={e => setInsuranceForm({ ...insuranceForm, numInsured: +e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm font-bold" />
                                    </div>
                                </div>
                                <Button onClick={handleAddInsurance} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg font-black">➕ הוסף ביטוח</Button>
                            </div>

                            {/* List of Added Insurance Products */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ביטוחים שנוספו ({client.insuranceSales.length})</h5>
                                {client.insuranceSales.map(item => (
                                    <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-sm flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-primary">{item.productType} - {item.company}</p>
                                            <p className="text-xs text-slate-400">{item.isPlatinum ? 'כולל פלטינום' : ''} • {item.premium}₪</p>
                                        </div>
                                        <button onClick={() => deleteItem("insuranceSales", item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- Tab Content: Personal --- */}
                {activeTab === "פרטים אישיים" && (
                    <div className="grid gap-8">
                        <Card className="border-none shadow-xl bg-white p-8">
                            <h4 className="text-base font-black text-primary italic mb-6 border-b border-slate-50 pb-4">📍 כתובת מגורים</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-black uppercase">עיר</span>
                                    <span className="font-bold text-primary">{client.address.city}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-black uppercase">רחוב</span>
                                    <span className="font-bold text-primary">{client.address.street} {client.address.num}</span>
                                </div>
                            </div>
                        </Card>
                        <Card className="border-none shadow-xl bg-white p-8">
                            <h4 className="text-base font-black text-primary italic mb-6 border-b border-slate-50 pb-4">💼 תעסוקה</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-black uppercase">סטטוס</span>
                                    <span className="font-bold text-primary">{client.employment.status}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <span className="text-[10px] text-slate-400 block font-black uppercase">עיסוק</span>
                                    <span className="font-bold text-primary">{client.employment.occupation}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- Tab Content: Elementary (Family) --- */}
                {activeTab === "אלמנטרי" && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <Card className="border-none shadow-xl bg-white p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-base font-black text-primary italic">👨‍👩‍👧‍👦 בני משפחה</h4>
                                <Button onClick={() => handleEdit("family")} size="sm" className="px-4 text-xs font-black">+ הוסף</Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {client.family.map((member, i) => (
                                    <div key={member.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => handleEdit("family", member)} className="text-slate-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteItem("family", member.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-black">{member.name[0]}</div>
                                            <div>
                                                <p className="font-black text-primary">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.relation} • {member.age}</p>
                                            </div>
                                        </div>
                                        <Badge variant={member.insured ? 'success' : 'error'} className="text-[10px]">{member.insured ? 'מבוטח' : 'לא מבוטח'}</Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- Tab Content: Policies --- */}
                {activeTab === "פוליסות" && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        <div className="flex justify-end"><Button onClick={() => handleEdit("policy")} className="bg-indigo-600 text-white rounded-xl shadow-lg px-6 py-2 font-black text-xs">+ הוסף פוליסה</Button></div>
                        <div className="grid gap-6">
                            {client.policies.map((policy) => (
                                <Card key={policy.id} className="border-none shadow-xl bg-white overflow-hidden group">
                                    <div className={`h-2 bg-gradient-to-r ${policy.color || 'from-indigo-500 to-purple-500'}`}></div>
                                    <div className="p-8 relative">
                                        <div className="absolute top-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button onClick={() => handleEdit("policy", policy)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><Edit2 size={16} className="text-slate-400" /></button>
                                            <button onClick={() => deleteItem("policies", policy.id)} className="p-2 bg-slate-50 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-400" /></button>
                                        </div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="text-4xl">{policy.icon || '📄'}</div>
                                                <div>
                                                    <h4 className="text-xl font-black text-primary">{policy.type}</h4>
                                                    <p className="text-sm font-bold text-slate-400">{policy.company} • {policy.policyNumber}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-slate-50">{policy.status}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">פרמיה</p><p className="text-xl font-black">{policy.premium}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">כיסוי</p><p className="text-xl font-black">{policy.coverage}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">תחולה</p><p className="text-sm font-bold">{policy.startDate}</p></div>
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase">חידוש</p><p className="text-sm font-bold">{policy.renewalDate}</p></div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Tab Content: Tasks --- */}
                {activeTab === "משימות" && (
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
                                            <div className={`mt-1 h-3 w-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
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
                )}

                {/* --- Modal Overlay --- */}
                {editMode && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
                            <button onClick={() => setEditMode(null)} className="absolute top-6 left-6 text-slate-300 hover:text-slate-600"><X /></button>
                            <h3 className="text-xl font-black italic mb-6 text-primary">
                                {editMode.type === 'family' ? 'עריכת בן משפחה' : editMode.type === 'policy' ? 'עריכת פוליסה' : editMode.type === 'task' ? 'עריכת משימה' : 'עריכת פרטים'}
                            </h3>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                                {editMode.type === 'family' && (
                                    <>
                                        <input placeholder="שם מלא" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <input placeholder="קירבה (ילד/בן זוג)" value={formData.relation || ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <div className="flex gap-4">
                                            <input type="number" placeholder="גיל" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: +e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                            <label className="flex items-center gap-2 font-bold text-sm text-slate-500"><input type="checkbox" checked={formData.insured || false} onChange={e => setFormData({ ...formData, insured: e.target.checked })} /> מבוטח?</label>
                                        </div>
                                    </>
                                )}
                                {editMode.type === 'policy' && (
                                    <>
                                        <select value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none">
                                            <option value="">סוג פוליסה</option><option>ביטוח חיים</option><option>ביטוח בריאות</option><option>פנסיה</option><option>ביטוח רכב</option><option>ביטוח דירה</option>
                                        </select>
                                        <input placeholder="חברה מבטחת" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <input placeholder="מספר פוליסה" value={formData.policyNumber || ''} onChange={e => setFormData({ ...formData, policyNumber: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <div className="flex gap-2">
                                            <input placeholder="פרמיה (₪)" value={formData.premium || ''} onChange={e => setFormData({ ...formData, premium: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                            <input placeholder="כיסוי (₪)" value={formData.coverage || ''} onChange={e => setFormData({ ...formData, coverage: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        </div>
                                    </>
                                )}
                                {editMode.type === 'task' && (
                                    <>
                                        <input placeholder="כותרת המשימה" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <div className="flex gap-2">
                                            <select value={formData.priority || 'נמוכה'} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none"><option>נמוכה</option><option>בינונית</option><option>גבוהה</option></select>
                                            <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        </div>
                                        <select value={formData.status || 'ממתינה'} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none"><option>ממתינה</option><option>בתהליך</option><option>הושלמה</option></select>
                                    </>
                                )}
                                {editMode.type === 'personal' && (
                                    <>
                                        <input placeholder="שם מלא" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <input placeholder="טלפון" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                        <input placeholder="אימייל" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none" />
                                    </>
                                )}
                            </div>

                            <Button onClick={handleSaveModal} className="w-full mt-6 bg-indigo-600 text-white rounded-xl py-4 font-black shadow-lg">שמור שינויים</Button>
                        </div>
                    </div>
                )}

                {/* --- Market Analysis Modal --- */}
                {showMarketModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
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
                    </div>
                )}
                {/* --- Referral Modal --- */}
                {showReferralModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                    </div>
                )}
            </div>
        </DashboardShell >
    );
}
