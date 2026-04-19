"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useState } from "react";

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("הכל");

    const documents = [
        {
            id: 1,
            name: "פוליסת ביטוח בריאות - הראל 2023",
            category: "פוליסות",
            date: "2023-01-15",
            size: "2.4 MB",
            type: "PDF",
            icon: "📄",
            color: "text-red-500 bg-red-50"
        },
        {
            id: 2,
            name: "אישור ביטוח רכב - הפניקס",
            category: "אישורים",
            date: "2024-05-01",
            size: "1.1 MB",
            type: "PDF",
            icon: "📋",
            color: "text-blue-500 bg-blue-50"
        },
        {
            id: 3,
            name: "דוח שנתי פנסיה 2023",
            category: "דוחות",
            date: "2024-01-10",
            size: "3.8 MB",
            type: "PDF",
            icon: "📊",
            color: "text-emerald-500 bg-emerald-50"
        },
        {
            id: 4,
            name: "תעודת זהות - עותק",
            category: "מסמכים אישיים",
            date: "2023-11-20",
            size: "0.8 MB",
            type: "JPG",
            icon: "🆔",
            color: "text-purple-500 bg-purple-50"
        },
        {
            id: 5,
            name: "טופס תביעה - ביטוח בריאות",
            category: "טפסים",
            date: "2024-02-14",
            size: "0.5 MB",
            type: "PDF",
            icon: "📝",
            color: "text-amber-500 bg-amber-50"
        },
        {
            id: 6,
            name: "חוזה ביטוח דירה - מנורה",
            category: "פוליסות",
            date: "2023-08-15",
            size: "1.9 MB",
            type: "PDF",
            icon: "📄",
            color: "text-red-500 bg-red-50"
        },
        {
            id: 7,
            name: "אישור תשלום פרמיות 2023",
            category: "אישורים",
            date: "2024-01-05",
            size: "0.6 MB",
            type: "PDF",
            icon: "📋",
            color: "text-blue-500 bg-blue-50"
        },
        {
            id: 8,
            name: "רישיון רכב - עותק",
            category: "מסמכים אישיים",
            date: "2024-03-10",
            size: "0.4 MB",
            type: "JPG",
            icon: "🆔",
            color: "text-purple-500 bg-purple-50"
        }
    ];

    const categories = ["הכל", "פוליסות", "אישורים", "דוחות", "מסמכים אישיים", "טפסים"];

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "הכל" || doc.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-linear-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">המסמכים שלי</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            כל המסמכים, הפוליסות והאישורים שלך במקום אחד מאובטח. גישה מהירה וקלה לכל מה שאתה צריך.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך מסמכים", value: documents.length, icon: "📁", color: "from-blue-600 to-indigo-700" },
                        { label: "פוליסות", value: documents.filter(d => d.category === "פוליסות").length, icon: "📄", color: "from-emerald-600 to-teal-700" },
                        { label: "אישורים", value: documents.filter(d => d.category === "אישורים").length, icon: "✅", color: "from-purple-600 to-indigo-700" },
                        { label: "דוחות", value: documents.filter(d => d.category === "דוחות").length, icon: "📊", color: "from-amber-500 to-orange-600" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-linear-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Search and Filter */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="חפש מסמך..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === category
                                            ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Documents Grid */}
                <div className="grid gap-4">
                    {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                            <Card key={doc.id} className="border-none shadow-md bg-white hover:shadow-xl transition-all group">
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`h-14 w-14 rounded-2xl ${doc.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                            {doc.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-black text-primary group-hover:text-accent transition-colors">{doc.name}</h3>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                                                    {doc.category}
                                                </Badge>
                                                <span className="text-xs font-bold text-slate-400">{doc.date}</span>
                                                <span className="text-xs font-bold text-slate-400">{doc.size}</span>
                                                <span className="text-xs font-bold text-slate-400">{doc.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="px-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </Button>
                                        <Button variant="outline" size="sm" className="px-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                        </Button>
                                        <Button variant="outline" size="sm" className="px-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="border-none shadow-md bg-slate-50 p-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-2xl mx-auto mb-4">
                                🔍
                            </div>
                            <h3 className="text-lg font-black text-slate-400 mb-2">לא נמצאו מסמכים</h3>
                            <p className="text-sm text-slate-400">נסה לשנות את החיפוש או הסינון</p>
                        </Card>
                    )}
                </div>

                {/* Upload Section */}
                <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer group">
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                        📤
                    </div>
                    <h3 className="text-lg font-black text-primary mb-2">העלה מסמך חדש</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6 max-w-md mx-auto">
                        גרור ושחרר קבצים כאן או לחץ לבחירת קבצים מהמחשב
                    </p>
                    <Button variant="secondary" className="shadow-xl shadow-accent/20">
                        בחר קבצים
                    </Button>
                </Card>
            </div>
        </DashboardShell>
    );
}
