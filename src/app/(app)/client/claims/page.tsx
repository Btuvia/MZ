"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
    FileWarning, Plus, Search, Clock, CheckCircle, XCircle,
    AlertCircle, Upload, Calendar, FileText, Camera, 
    ChevronRight, ChevronDown, Phone, MessageSquare, Eye,
    Send, ArrowRight, RefreshCw, Sparkles, Info, DollarSign
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";

interface Claim {
    id: string;
    type: string;
    policyName: string;
    policyNumber: string;
    date: string;
    status: 'draft' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';
    amount?: number;
    description: string;
    documents: string[];
    timeline: {label: string; date: string; completed: boolean}[];
}

type ClaimType = {
    id: string;
    name: string;
    icon: string;
    description: string;
    requiredDocs: string[];
};

export default function ClaimsPage() {
    const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [newClaimStep, setNewClaimStep] = useState(1);
    const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
    const [claimForm, setClaimForm] = useState({
        description: '',
        amount: '',
        date: '',
        documents: [] as File[]
    });

    const claims: Claim[] = [
        {
            id: '1',
            type: 'תאונה',
            policyName: 'ביטוח רכב מקיף',
            policyNumber: 'CAR-123456',
            date: '2025-12-15',
            status: 'processing',
            amount: 8500,
            description: 'נזק לפגוש האחורי כתוצאה מתאונה בחניה',
            documents: ['תמונות נזק', 'דוח משטרה'],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-12-15', completed: true },
                { label: 'קבלת מסמכים', date: '2025-12-16', completed: true },
                { label: 'בדיקת שמאי', date: '2025-12-20', completed: false },
                { label: 'אישור תשלום', date: '', completed: false },
            ]
        },
        {
            id: '2',
            type: 'ביטוח בריאות',
            policyName: 'ביטוח בריאות פרימיום',
            policyNumber: 'HLT-789012',
            date: '2025-11-28',
            status: 'approved',
            amount: 3200,
            description: 'החזר עבור ניתוח פלסטי רפואי',
            documents: ['אישור רופא', 'חשבונית'],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-11-28', completed: true },
                { label: 'בדיקת מסמכים', date: '2025-11-30', completed: true },
                { label: 'אישור רפואי', date: '2025-12-05', completed: true },
                { label: 'תשלום בביצוע', date: '2025-12-10', completed: false },
            ]
        },
        {
            id: '3',
            type: 'נזק לדירה',
            policyName: 'ביטוח דירה',
            policyNumber: 'HOM-345678',
            date: '2025-10-10',
            status: 'paid',
            amount: 12000,
            description: 'נזקי הצפה בחדר האמבטיה',
            documents: ['תמונות נזק', 'הצעת מחיר לתיקון', 'דוח אינסטלטור'],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-10-10', completed: true },
                { label: 'שמאי ביקר', date: '2025-10-15', completed: true },
                { label: 'אישור תביעה', date: '2025-10-20', completed: true },
                { label: 'תשלום הועבר', date: '2025-10-25', completed: true },
            ]
        },
        {
            id: '4',
            type: 'ביטוח בריאות',
            policyName: 'ביטוח בריאות פרימיום',
            policyNumber: 'HLT-789012',
            date: '2025-08-15',
            status: 'rejected',
            amount: 1500,
            description: 'בקשה להחזר עבור טיפולי ספא',
            documents: ['חשבונית'],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-08-15', completed: true },
                { label: 'בדיקת מסמכים', date: '2025-08-17', completed: true },
                { label: 'תביעה נדחתה', date: '2025-08-20', completed: true },
            ]
        }
    ];

    const claimTypes: ClaimType[] = [
        { 
            id: 'car', 
            name: 'ביטוח רכב', 
            icon: '🚗', 
            description: 'תאונות, גניבה, נזקים לרכב',
            requiredDocs: ['תמונות של הנזק', 'דוח משטרה (אם רלוונטי)', 'רישיון רכב']
        },
        { 
            id: 'health', 
            name: 'ביטוח בריאות', 
            icon: '🏥', 
            description: 'ניתוחים, בדיקות, תרופות',
            requiredDocs: ['אישור רפואי', 'חשבוניות', 'מרשם (אם יש)']
        },
        { 
            id: 'home', 
            name: 'ביטוח דירה', 
            icon: '🏠', 
            description: 'נזקי מים, שריפה, פריצה',
            requiredDocs: ['תמונות נזק', 'הצעת מחיר לתיקון', 'דוח מומחה']
        },
        { 
            id: 'travel', 
            name: 'ביטוח נסיעות', 
            icon: '✈️', 
            description: 'ביטול טיסה, אבדן מזוודות, חירום רפואי',
            requiredDocs: ['אישור ביטול', 'קבלות', 'אישור רפואי']
        },
        { 
            id: 'life', 
            name: 'ביטוח חיים', 
            icon: '❤️', 
            description: 'תביעות אובדן כושר עבודה',
            requiredDocs: ['אישורים רפואיים', 'תלושי שכר', 'טפסי תביעה']
        },
    ];

    const getStatusConfig = (status: Claim['status']) => {
        switch (status) {
            case 'draft': return { color: 'slate', label: 'טיוטה', icon: FileText };
            case 'submitted': return { color: 'blue', label: 'הוגש', icon: Send };
            case 'processing': return { color: 'amber', label: 'בטיפול', icon: Clock };
            case 'approved': return { color: 'emerald', label: 'אושר', icon: CheckCircle };
            case 'rejected': return { color: 'red', label: 'נדחה', icon: XCircle };
            case 'paid': return { color: 'green', label: 'שולם', icon: DollarSign };
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setClaimForm(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
        toast.success(`${files.length} קבצים נוספו`);
    };

    const handleSubmitClaim = () => {
        toast.success('התביעה הוגשה בהצלחה! נעדכן אותך בהתקדמות.');
        setActiveTab('list');
        setNewClaimStep(1);
        setSelectedType(null);
        setClaimForm({ description: '', amount: '', date: '', documents: [] });
    };

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                            <FileWarning className="text-amber-400" />
                            הגשת תביעות
                        </h1>
                        <p className="text-slate-400 mt-1">הגש תביעה חדשה או עקוב אחרי תביעות קיימות</p>
                    </div>
                    
                    <Button 
                        onClick={() => setActiveTab('new')}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                        <Plus size={18} className="ml-2" />
                        תביעה חדשה
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            activeTab === 'list'
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-700/50 text-slate-400 hover:text-amber-400'
                        }`}
                    >
                        התביעות שלי ({claims.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${
                            activeTab === 'new'
                                ? 'bg-amber-500 text-slate-900'
                                : 'bg-slate-700/50 text-slate-400 hover:text-amber-400'
                        }`}
                    >
                        הגש תביעה חדשה
                    </button>
                </div>

                {/* Claims List View */}
                {activeTab === 'list' && (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'סה"כ תביעות', value: claims.length, color: 'blue' },
                                { label: 'בטיפול', value: claims.filter(c => c.status === 'processing').length, color: 'amber' },
                                { label: 'אושרו', value: claims.filter(c => ['approved', 'paid'].includes(c.status)).length, color: 'emerald' },
                                { label: 'סה"כ שולם', value: `₪${claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}`, color: 'green' },
                            ].map((stat) => (
                                <Card key={stat.label} className="p-4">
                                    <div className="text-2xl font-black text-amber-100">{stat.value}</div>
                                    <div className="text-sm text-slate-500">{stat.label}</div>
                                </Card>
                            ))}
                        </div>

                        {/* Claims */}
                        {claims.map((claim) => {
                            const statusConfig = getStatusConfig(claim.status);
                            const StatusIcon = statusConfig.icon;
                            
                            return (
                                <Card 
                                    key={claim.id} 
                                    className="p-5 hover:border-amber-500/30 transition-all cursor-pointer"
                                    onClick={() => setSelectedClaim(selectedClaim?.id === claim.id ? null : claim)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl">
                                                {claimTypes.find(t => claim.type.includes(t.name.split(' ')[1]) || claim.type === t.name.split(' ')[1])?.icon || '📄'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-200">{claim.policyName}</h3>
                                                <p className="text-sm text-slate-500">{claim.description}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span>{claim.policyNumber}</span>
                                                    <span>•</span>
                                                    <span>{claim.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {claim.amount ? <div className="text-left">
                                                    <div className="text-xl font-black text-amber-400">₪{claim.amount.toLocaleString()}</div>
                                                    <div className="text-xs text-slate-500">סכום התביעה</div>
                                                </div> : null}
                                            <Badge className={`bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400 border-${statusConfig.color}-500/30`}>
                                                <StatusIcon size={14} className="ml-1" />
                                                {statusConfig.label}
                                            </Badge>
                                            <ChevronDown 
                                                size={20} 
                                                className={`text-slate-500 transition-transform ${selectedClaim?.id === claim.id ? 'rotate-180' : ''}`} 
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded View */}
                                    <AnimatePresence>
                                        {selectedClaim?.id === claim.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-6 pt-6 border-t border-slate-700/50"
                                            >
                                                {/* Timeline */}
                                                <div className="mb-6">
                                                    <h4 className="font-bold text-slate-300 mb-4">מעקב התביעה</h4>
                                                    <div className="relative">
                                                        <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-slate-700" />
                                                        {claim.timeline.map((step, index) => (
                                                            <div key={index} className="relative pr-8 pb-4">
                                                                <div className={`absolute right-0 w-4 h-4 rounded-full border-2 ${
                                                                    step.completed 
                                                                        ? 'bg-emerald-500 border-emerald-500' 
                                                                        : 'bg-slate-800 border-slate-600'
                                                                }`}>
                                                                    {step.completed ? <CheckCircle size={12} className="text-white m-0.5" /> : null}
                                                                </div>
                                                                <div className={step.completed ? 'text-slate-300' : 'text-slate-500'}>
                                                                    <div className="font-bold">{step.label}</div>
                                                                    {step.date ? <div className="text-xs">{step.date}</div> : null}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Documents */}
                                                <div className="mb-4">
                                                    <h4 className="font-bold text-slate-300 mb-2">מסמכים שהוגשו</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {claim.documents.map((doc, index) => (
                                                            <Badge key={index} className="bg-slate-700/50">
                                                                <FileText size={14} className="ml-1" />
                                                                {doc}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        <MessageSquare size={16} className="ml-2" />
                                                        צור קשר
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Upload size={16} className="ml-2" />
                                                        הוסף מסמך
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* New Claim Form */}
                {activeTab === 'new' && (
                    <div className="space-y-6">
                        {/* Progress */}
                        <div className="flex items-center justify-between">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                        newClaimStep >= step
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'bg-slate-700 text-slate-500'
                                    }`}>
                                        {step}
                                    </div>
                                    {step < 3 && (
                                        <div className={`w-24 h-1 mx-2 rounded ${
                                            newClaimStep > step ? 'bg-amber-500' : 'bg-slate-700'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Select Type */}
                        {newClaimStep === 1 && (
                            <Card className="p-6">
                                <h2 className="text-xl font-bold text-amber-100 mb-6">בחר סוג תביעה</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {claimTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setSelectedType(type);
                                                setNewClaimStep(2);
                                            }}
                                            className={`p-5 rounded-xl border-2 text-right transition-all hover:border-amber-500/50 hover:bg-amber-500/5 ${
                                                selectedType?.id === type.id
                                                    ? 'border-amber-500 bg-amber-500/10'
                                                    : 'border-slate-700'
                                            }`}
                                        >
                                            <div className="text-3xl mb-3">{type.icon}</div>
                                            <h3 className="font-bold text-slate-200 mb-1">{type.name}</h3>
                                            <p className="text-sm text-slate-500">{type.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Step 2: Details */}
                        {newClaimStep === 2 && selectedType ? <Card className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setNewClaimStep(1)} className="text-slate-400 hover:text-amber-400">
                                        <ArrowRight size={20} />
                                    </button>
                                    <h2 className="text-xl font-bold text-amber-100">פרטי התביעה - {selectedType.name}</h2>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-2">תיאור האירוע</label>
                                        <textarea
                                            value={claimForm.description}
                                            onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="תאר את האירוע בפירוט..."
                                            rows={4}
                                            className="w-full px-4 py-3 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2">תאריך האירוע</label>
                                            <input
                                                type="date"
                                                value={claimForm.date}
                                                onChange={(e) => setClaimForm(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full px-4 py-3 glass-card border border-amber-500/20 rounded-xl text-slate-200 focus:border-amber-500/40 focus:outline-none bg-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-400 mb-2">סכום משוער (₪)</label>
                                            <input
                                                type="number"
                                                value={claimForm.amount}
                                                onChange={(e) => setClaimForm(prev => ({ ...prev, amount: e.target.value }))}
                                                placeholder="0"
                                                className="w-full px-4 py-3 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Required Documents Info */}
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <Info size={20} className="text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-blue-400 mb-2">מסמכים נדרשים:</p>
                                                <ul className="text-sm text-slate-400 space-y-1">
                                                    {selectedType.requiredDocs.map((doc, index) => (
                                                        <li key={index}>• {doc}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setNewClaimStep(1)}>
                                            חזור
                                        </Button>
                                        <Button 
                                            onClick={() => setNewClaimStep(3)}
                                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                                            disabled={claimForm!.description || claimForm!.date}
                                        >
                                            המשך להעלאת מסמכים
                                            <ChevronRight size={18} className="mr-2" />
                                        </Button>
                                    </div>
                                </div>
                            </Card> : null}

                        {/* Step 3: Upload Documents */}
                        {newClaimStep === 3 && selectedType ? <Card className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <button onClick={() => setNewClaimStep(2)} className="text-slate-400 hover:text-amber-400">
                                        <ArrowRight size={20} />
                                    </button>
                                    <h2 className="text-xl font-bold text-amber-100">העלאת מסמכים</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Upload Area */}
                                    <label className="block border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-all">
                                        <Upload size={40} className="mx-auto text-slate-600 mb-4" />
                                        <p className="text-lg font-bold text-slate-300 mb-2">גרור קבצים או לחץ לבחירה</p>
                                        <p className="text-sm text-slate-500">PDF, תמונות, Word (עד 10MB)</p>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                    </label>

                                    {/* Uploaded Files */}
                                    {claimForm.documents.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-slate-300">קבצים שנבחרו:</h4>
                                            {claimForm.documents.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={20} className="text-amber-400" />
                                                        <span className="text-slate-300">{file.name}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setClaimForm(prev => ({
                                                            ...prev,
                                                            documents: prev.documents.filter((_, i) => i !== index)
                                                        }))}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Camera Option */}
                                    <button className="w-full p-4 border border-slate-700 rounded-xl flex items-center justify-center gap-3 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all">
                                        <Camera size={24} />
                                        <span className="font-bold">צלם מסמך מהנייד</span>
                                    </button>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setNewClaimStep(2)}>
                                            חזור
                                        </Button>
                                        <Button 
                                            onClick={handleSubmitClaim}
                                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                                        >
                                            <Send size={18} className="ml-2" />
                                            הגש תביעה
                                        </Button>
                                    </div>
                                </div>
                            </Card> : null}

                        {/* Help Box */}
                        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <Phone size={20} className="text-amber-400" />
                                <div>
                                    <p className="font-bold text-amber-400">צריך עזרה?</p>
                                    <p className="text-sm text-slate-500">צור קשר עם הסוכן שלך או התקשר ל-*8989</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
