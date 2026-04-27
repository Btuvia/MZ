"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    FileWarning, Search, Filter, AlertCircle, CheckCircle, 
    XCircle, Clock, FileText, ChevronDown, Eye, EyeOff, Plus
} from "lucide-react";
import { toast } from "sonner";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { Claim, ClaimDocument } from "@/types/claim";

export default function AdminClaimsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

    // Mock data based on the new Claim type
    const [claims, setClaims] = useState<Claim[]>([
        {
            id: '1',
            clientId: 'client_1',
            clientName: 'ישראל ישראלי',
            type: 'תאונה',
            policyName: 'ביטוח רכב מקיף',
            policyNumber: 'CAR-123456',
            date: '2025-12-15',
            status: 'processing',
            amount: 8500,
            description: 'נזק לפגוש האחורי כתוצאה מתאונה בחניה',
            missingDocuments: ['אישור משטרה מקורי', 'רישיון נהיגה'],
            documents: [
                { id: 'd1', name: 'תמונות נזק', isVisibleToClient: true, uploadedAt: '2025-12-15' },
                { id: 'd2', name: 'דוח שמאי פנימי', isVisibleToClient: false, uploadedAt: '2025-12-16' }
            ],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-12-15', completed: true },
                { label: 'קבלת מסמכים', date: '2025-12-16', completed: true },
                { label: 'בדיקת שמאי', date: '2025-12-20', completed: false },
                { label: 'אישור תשלום', date: '', completed: false },
            ]
        },
        {
            id: '2',
            clientId: 'client_2',
            clientName: 'דנה כהן',
            type: 'ביטוח בריאות',
            policyName: 'ביטוח בריאות פרימיום',
            policyNumber: 'HLT-789012',
            date: '2025-11-28',
            status: 'approved',
            amount: 3200,
            description: 'החזר עבור ניתוח פלסטי רפואי',
            missingDocuments: [],
            documents: [
                { id: 'd3', name: 'אישור רופא', isVisibleToClient: true, uploadedAt: '2025-11-28' },
                { id: 'd4', name: 'חשבונית', isVisibleToClient: true, uploadedAt: '2025-11-28' },
                { id: 'd4_internal', name: 'התכתבות עם חברת הביטוח', isVisibleToClient: false, uploadedAt: '2025-11-29' }
            ],
            timeline: [
                { label: 'הגשת תביעה', date: '2025-11-28', completed: true },
                { label: 'בדיקת מסמכים', date: '2025-11-30', completed: true },
                { label: 'אישור רפואי', date: '2025-12-05', completed: true },
                { label: 'תשלום בביצוע', date: '2025-12-10', completed: false },
            ]
        }
    ]);

    const getStatusConfig = (status: Claim['status']) => {
        switch (status) {
            case 'draft': return { color: 'slate', label: 'טיוטה', icon: FileText };
            case 'submitted': return { color: 'blue', label: 'הוגש', icon: FileWarning };
            case 'processing': return { color: 'amber', label: 'בטיפול', icon: Clock };
            case 'approved': return { color: 'emerald', label: 'אושר', icon: CheckCircle };
            case 'rejected': return { color: 'red', label: 'נדחה', icon: XCircle };
            case 'paid': return { color: 'green', label: 'שולם', icon: CheckCircle };
        }
    };

    const getTrafficLightColor = (status: Claim['status']) => {
        if (['approved', 'paid'].includes(status)) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
        if (['processing', 'submitted'].includes(status)) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
        if (['rejected'].includes(status)) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        return 'bg-slate-500';
    };

    const toggleDocumentVisibility = (claimId: string, docId: string) => {
        setClaims(claims.map(claim => {
            if (claim.id === claimId) {
                return {
                    ...claim,
                    documents: claim.documents.map(doc => 
                        doc.id === docId ? { ...doc, isVisibleToClient: !doc.isVisibleToClient } : doc
                    )
                };
            }
            return claim;
        }));
    };

    const handleAddRequirement = (claimId: string) => {
        const docName = window.prompt("הכנס את שם המסמך החסר (לדוגמה: 'חתימת לקוח'):");
        if (!docName || docName.trim() === '') return;

        setClaims(claims.map(claim => {
            if (claim.id === claimId) {
                return {
                    ...claim,
                    missingDocuments: [...claim.missingDocuments, docName],
                    workflowStatus: 'waiting_for_agent'
                };
            }
            return claim;
        }));

        toast.success("ריג'קט עודכן: נשלח אימייל ללקוח ולסוכן, ומשימה נוצרה", {
            description: `נדרש: ${docName}`
        });
    };

    const handleRejectHandled = (claimId: string) => {
        setClaims(claims.map(claim => {
            if (claim.id === claimId) {
                return {
                    ...claim,
                    missingDocuments: [], // Clear missing docs
                    workflowStatus: 'waiting_for_ops'
                };
            }
            return claim;
        }));

        toast.success("הריג'קט טופל", {
            description: "המשימה הועברה חזרה לצוות תפעול להמשך מול חברת הביטוח"
        });
    };

    const filteredClaims = claims.filter(c => 
        c.clientName.includes(searchQuery) || 
        c.policyNumber.includes(searchQuery) ||
        c.id.includes(searchQuery)
    );

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                            <FileWarning className="text-amber-400" />
                            ניהול תביעות
                        </h1>
                        <p className="text-slate-400 mt-1">מערכת ניהול, מעקב ובקרת תביעות</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="חיפוש לפי שם, ת.ז או פוליסה..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-4 pr-10 py-2 glass-card border border-amber-500/20 rounded-xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none"
                            />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter size={18} />
                            סינון מתקדם
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'תביעות פתוחות', value: claims.filter(c => ['submitted', 'processing'].includes(c.status)).length, color: 'blue' },
                        { label: 'ממתין למסמכים', value: claims.filter(c => c.missingDocuments.length > 0).length, color: 'amber' },
                        { label: 'תביעות שאושרו החודש', value: claims.filter(c => ['approved', 'paid'].includes(c.status)).length, color: 'emerald' },
                        { label: 'סה"כ שולם החודש', value: `₪${claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}`, color: 'green' },
                    ].map((stat) => (
                        <Card key={stat.label} className="p-4">
                            <div className="text-2xl font-black text-amber-100">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.label}</div>
                        </Card>
                    ))}
                </div>

                {/* Claims List */}
                <div className="space-y-4">
                    {filteredClaims.map((claim) => {
                        const statusConfig = getStatusConfig(claim.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                            <Card 
                                key={claim.id} 
                                className="p-5 hover:border-amber-500/30 transition-all cursor-pointer"
                            >
                                <div 
                                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                    onClick={() => setSelectedClaim(selectedClaim?.id === claim.id ? null : claim)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl font-bold text-amber-400">
                                            {claim.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-200">{claim.clientName}</h3>
                                            <p className="text-sm text-slate-400">{claim.policyName} ({claim.policyNumber})</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span>{claim.type}</span>
                                                <span>•</span>
                                                <span>תאריך הגשה: {claim.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        {claim.missingDocuments.length > 0 && (
                                            <div className="flex items-center gap-2 text-red-400 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                                <AlertCircle size={14} />
                                                חסרים {claim.missingDocuments.length} מסמכים
                                            </div>
                                        )}

                                        {claim.amount ? <div className="text-left">
                                                <div className="text-xl font-black text-amber-400">₪{claim.amount.toLocaleString()}</div>
                                            </div> : null}
                                            
                                        {/* Traffic Light */}
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700">
                                            <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(claim.status)}`} />
                                            <span className={`text-sm font-bold text-${statusConfig.color}-400`}>{statusConfig.label}</span>
                                        </div>
                                        
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
                                            className="mt-6 pt-6 border-t border-slate-700/50 grid lg:grid-cols-2 gap-8"
                                        >
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="font-bold text-slate-300 mb-2">תיאור האירוע</h4>
                                                    <p className="text-sm text-slate-400 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                                        {claim.description}
                                                    </p>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-bold text-slate-300">מסמכים מצורפים</h4>
                                                        <Button size="sm" variant="outline" className="h-8">
                                                            <Plus size={14} className="ml-1" />
                                                            העלאת מסמך
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {claim.documents.map((doc) => (
                                                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                                                                        <FileText size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-200">{doc.name}</div>
                                                                        <div className="text-xs text-slate-500">{doc.uploadedAt}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); toggleDocumentVisibility(claim.id, doc.id); }}
                                                                        className={`p-2 rounded-lg transition-all ${
                                                                            doc.isVisibleToClient 
                                                                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                                        }`}
                                                                        title={doc.isVisibleToClient ? "גלוי ללקוח" : "מוסתר מהלקוח (פנימי)"}
                                                                    >
                                                                        {doc.isVisibleToClient ? <Eye size={16} /> : <EyeOff size={16} />}
                                                                    </button>
                                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                                                        ...
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-bold text-slate-300">דרישת מסמכים חסרים</h4>
                                                            {claim.workflowStatus === 'waiting_for_agent' && (
                                                                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                                                    ממתין לטיפול סוכן
                                                                </Badge>
                                                            )}
                                                            {claim.workflowStatus === 'waiting_for_ops' && (
                                                                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                                    חזר לטיפול תפעול
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {claim.workflowStatus === 'waiting_for_agent' && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline" 
                                                                    className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                                    onClick={() => handleRejectHandled(claim.id)}
                                                                >
                                                                    <CheckCircle size={14} className="ml-1" />
                                                                    ריג'קט טופל
                                                                </Button>
                                                            )}
                                                            <Button 
                                                                size="sm" 
                                                                className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-900"
                                                                onClick={() => handleAddRequirement(claim.id)}
                                                            >
                                                                <Plus size={14} className="ml-1" />
                                                                הוסף דרישה
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {claim.missingDocuments.length === 0 ? (
                                                        <div className="text-sm text-slate-500 text-center py-4">לא הוגדרו מסמכים חסרים</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {claim.missingDocuments.map((doc, idx) => (
                                                                <div key={idx} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                                                    <div className="flex items-center gap-2 text-sm text-red-300/80">
                                                                        <AlertCircle size={14} className="text-red-400" />
                                                                        {doc}
                                                                    </div>
                                                                    <button className="text-slate-500 hover:text-red-400 transition-colors">
                                                                        <XCircle size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h4 className="font-bold text-slate-300 mb-4">ציר זמן (סטטוס)</h4>
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
                                                                    <div className="font-bold flex items-center justify-between">
                                                                        {step.label}
                                                                        {!step.completed && (
                                                                            <button className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                                                סמן כהושלם
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {step.date ? <div className="text-xs">{step.date}</div> : null}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </DashboardShell>
    );
}
