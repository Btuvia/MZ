"use client";
import { useState } from "react";

// ============================================
// Insurance Coverage Grid Component
// Shows emoji cards per insurance type with hover tooltips
// ============================================

type Policy = {
    id: string;
    type: string;
    company?: string;
    status?: string;
    [key: string]: unknown;
};

type InsuranceProduct = {
    id: string;
    productType: string;
    company?: string;
    [key: string]: unknown;
};

type PensionProduct = {
    id: string;
    type: string;
    company?: string;
    [key: string]: unknown;
};

interface InsuranceCoverageGridProps {
    policies: Policy[];
    insuranceSales: InsuranceProduct[];
    pensionSales: PensionProduct[];
}

const INSURANCE_CATALOG = [
    {
        key: "life",
        label: "ביטוח חיים",
        emoji: "❤️",
        color: "from-red-500 to-pink-600",
        glow: "shadow-red-500/40",
        border: "border-red-400/30",
        tip: "🛡️ הגנה חיונית לבעלי משפחה ומשכנתה",
        description: [
            "💰 סכום חד-פעמי למשפחה במקרה פטירה",
            "🏠 מכסה תשלומי משכנתה ומחויבויות",
            "👨‍👩‍👧 מבטיח יציבות כלכלית לאהובים",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("חיים") || p.type === "Life")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("חיים")),
    },
    {
        key: "health",
        label: "ביטוח בריאות",
        emoji: "🏥",
        color: "from-emerald-500 to-teal-600",
        glow: "shadow-emerald-500/40",
        border: "border-emerald-400/30",
        tip: "🩺 כיסוי פרטי מלא",
        description: [
            "🔬 ניתוחים פרטיים בלי תור",
            "👨‍⚕️ ייעוץ מומחים ופרופסורים",
            "💊 תרופות מחוץ לסל הבסיסי",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("בריאות") || p.type === "Health")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("בריאות")),
    },
    {
        key: "pension",
        label: "קרן פנסיה",
        emoji: "🏦",
        color: "from-blue-500 to-indigo-600",
        glow: "shadow-blue-500/40",
        border: "border-blue-400/30",
        tip: "📈 חיסכון לפרישה עם ביטוח נלווה",
        description: [
            "💼 צבירה לגיל פרישה",
            "🏥 כולל ביטוח נכות ושארים",
            "📊 תשואה מנוהלת לאורך שנים",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("פנסיה") || p.type === "Pension")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("פנסיה")),
    },
    {
        key: "disability",
        label: "אובדן כושר עבודה",
        emoji: "💼",
        color: "from-purple-500 to-violet-600",
        glow: "shadow-purple-500/40",
        border: "border-purple-400/30",
        tip: "🔐 מחליף שכר בעת פגיעה",
        description: [
            "💰 60-80% משכרך אם נפצעת",
            "⏱️ מגן מפני אובדן הכנסה ממושך",
            "🩹 מכסה מחלות ותאונות",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("נכות") || p.type.includes("כשר") || p.type === "Disability")) ||
            ("productType" in p && typeof p.productType === "string" && (p.productType.includes("נכות") || p.productType.includes("כשר"))),
    },
    {
        key: "nursing",
        label: "ביטוח סיעוד",
        emoji: "🛌",
        color: "from-orange-500 to-amber-600",
        glow: "shadow-orange-500/40",
        border: "border-orange-400/30",
        tip: "👴 גמלה חודשית במצב תלות",
        description: [
            "🏠 טיפול בבית או במוסד",
            "💊 מכסה עלויות סיעוד יומיות",
            "👨‍👩‍👧 להורים קשישים ובני משפחה",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && p.type.includes("סיעוד")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("סיעוד")),
    },
    {
        key: "car",
        label: "ביטוח רכב",
        emoji: "🚗",
        color: "from-cyan-500 to-sky-600",
        glow: "shadow-cyan-500/40",
        border: "border-cyan-400/30",
        tip: "🛡️ כיסוי מלא לרכב ולצד שלישי",
        description: [
            "🔧 נזקים לרכב בתאונות וגניבה",
            "👥 אחריות כלפי צד שלישי",
            "🌪️ אסונות טבע ונזקי מזג אוויר",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("רכב") || p.type === "Car")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("רכב")),
    },
    {
        key: "home",
        label: "ביטוח דירה",
        emoji: "🏠",
        color: "from-yellow-500 to-lime-600",
        glow: "shadow-yellow-500/40",
        border: "border-yellow-400/30",
        tip: "🏡 הגנה על הבית ותכולתו",
        description: [
            "🏗️ מבנה הבית מנזקים ואסונות",
            "📦 תכולה וחפצי ערך",
            "⚖️ אחריות כלפי שכנים וצד ג'",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("דירה") || p.type.includes("בית") || p.type === "Home")) ||
            ("productType" in p && typeof p.productType === "string" && (p.productType.includes("דירה") || p.productType.includes("בית"))),
    },
    {
        key: "savings",
        label: "קרן השתלמות",
        emoji: "📊",
        color: "from-fuchsia-500 to-pink-600",
        glow: "shadow-fuchsia-500/40",
        border: "border-fuchsia-400/30",
        tip: "💎 חיסכון עם הטבות מס ייחודיות",
        description: [
            "🏖️ חיסכון נזיל לכל מטרה",
            "💡 הטבות מס משמעותיות",
            "📈 תשואה גבוהה מאשר בבנק",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("השתלמות") || p.type === "Savings")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("השתלמות")),
    },
    {
        key: "managers",
        label: "ביטוח מנהלים",
        emoji: "👔",
        color: "from-slate-600 to-slate-800",
        glow: "shadow-slate-500/40",
        border: "border-slate-400/30",
        tip: "🏆 פנסיה אישית עם גמישות מקסימלית",
        description: [
            "🎯 פנסיה אישית וניידת",
            "📑 גמישות בהשקעות",
            "👔 מתאים במיוחד למנהלים בכירים",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && p.type.includes("מנהלים")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("מנהלים")),
    },
    {
        key: "critical",
        label: "מחלות קשות",
        emoji: "🫀",
        color: "from-red-600 to-rose-700",
        glow: "shadow-rose-500/40",
        border: "border-rose-400/30",
        tip: "🆘 תשלום חד-פעמי באבחנת מחלה קשה",
        description: [
            "🎗️ אונקולוגיה, לב, שבץ ועוד",
            "💰 סכום חד-פעמי לטיפולים",
            "✈️ כולל טיפול בחו\"ל אם נדרש",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("קשה") || p.type.includes("אונקולוגי"))) ||
            ("productType" in p && typeof p.productType === "string" && (p.productType.includes("קשה") || p.productType.includes("אונקולוגי"))),
    },
    {
        key: "business",
        label: "ביטוח עסק",
        emoji: "🏢",
        color: "from-teal-500 to-cyan-700",
        glow: "shadow-teal-500/40",
        border: "border-teal-400/30",
        tip: "💼 הגנה מקצועית על העסק",
        description: [
            "🔒 נכסי העסק מנזקים ואש",
            "⚖️ אחריות מקצועית כלפי לקוחות",
            "💸 אובדן הכנסה עסקית",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && (p.type.includes("עסק") || p.type === "Business")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("עסק")),
    },
    {
        key: "travel",
        label: "ביטוח נסיעות",
        emoji: "✈️",
        color: "from-sky-400 to-blue-600",
        glow: "shadow-sky-500/40",
        border: "border-sky-400/30",
        tip: "🌍 כיסוי רפואי בחו\"ל",
        description: [
            "🏥 טיפול רפואי חירום בחו\"ל",
            "🧳 ביטול טיסה ואובדן מזוודות",
            "🚑 פינוי רפואי חדר לחדר",
        ],
        match: (p: Policy | InsuranceProduct | PensionProduct) =>
            ("type" in p && typeof p.type === "string" && p.type.includes("נסיעות")) ||
            ("productType" in p && typeof p.productType === "string" && p.productType.includes("נסיעות")),
    },
];

export default function InsuranceCoverageGrid({
    policies,
    insuranceSales,
    pensionSales,
}: InsuranceCoverageGridProps) {
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const allProducts = [
        ...policies,
        ...insuranceSales,
        ...pensionSales,
    ];

    const getCoverage = (insurance: typeof INSURANCE_CATALOG[0]) => {
        const match = allProducts.find((p) => insurance.match(p as Policy | InsuranceProduct | PensionProduct));
        if (!match) return null;
        // Get company name
        const company = (match as Policy).company || "";
        return { company };
    };

    const active = INSURANCE_CATALOG.filter((ins) => getCoverage(ins));
    const missing = INSURANCE_CATALOG.filter((ins) => !getCoverage(ins));

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
                            🛡️
                        </div>
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            מפת כיסוי ביטוחי
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {active.length} ביטוחים פעילים · {missing.length} חסרים
                        </p>
                    </div>
                </div>
                {/* Summary badges */}
                <div className="flex gap-2">
                    <span className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full">
                        ✅ {active.length} קיים
                    </span>
                    <span className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-black rounded-full">
                        ❌ {missing.length} חסר
                    </span>
                </div>
            </div>

            {/* Coverage Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {INSURANCE_CATALOG.map((insurance) => {
                    const coverage = getCoverage(insurance);
                    const hasIt = !!coverage;
                    const isHovered = hoveredKey === insurance.key;

                    return (
                        <div
                            key={insurance.key}
                            className="relative"
                            onMouseEnter={() => setHoveredKey(insurance.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                        >
                            {/* Main Card */}
                            <div
                                className={`
                                    relative rounded-2xl p-4 text-center cursor-pointer
                                    border-2 transition-all duration-300
                                    ${hasIt
                                        ? `bg-linear-to-br ${insurance.color} border-transparent shadow-lg ${insurance.glow} shadow-xl scale-100 hover:scale-105`
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md scale-100 hover:scale-105 opacity-50 hover:opacity-75"
                                    }
                                `}
                            >
                                {/* Neon glow layer for active */}
                                {hasIt ? <div className={`absolute inset-0 rounded-2xl bg-linear-to-br ${insurance.color} opacity-20 blur-sm -z-10`} /> : null}

                                {/* Status indicator */}
                                <div className={`
                                    absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full border-2 border-white
                                    flex items-center justify-center text-[9px] font-black
                                    ${hasIt ? "bg-emerald-400 text-white shadow-emerald-300/50 shadow-md" : "bg-slate-300 text-slate-600"}
                                `}>
                                    {hasIt ? "✓" : "×"}
                                </div>

                                {/* Emoji */}
                                <div className={`text-3xl mb-2 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
                                    {insurance.emoji}
                                </div>

                                {/* Label */}
                                <p className={`text-[10px] font-black leading-tight ${hasIt ? "text-white/90" : "text-slate-500"}`}>
                                    {insurance.label}
                                </p>

                                {/* Company if active */}
                                {hasIt && coverage ? <p className="text-[9px] text-white/60 mt-1 font-bold truncate">
                                        {coverage.company}
                                    </p> : null}
                            </div>

                            {/* Hover Tooltip */}
                            {isHovered ? <div
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-64 animate-in fade-in zoom-in-95 duration-200"
                                    dir="rtl"
                                >
                                    <div className={`
                                        rounded-2xl p-5 shadow-2xl border border-white/20
                                        ${hasIt
                                            ? `bg-linear-to-br ${insurance.color} text-white`
                                            : "bg-slate-900 text-slate-100 border-slate-700"
                                        }
                                    `}>
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-2xl">{insurance.emoji}</span>
                                            <div>
                                                <p className="font-black text-sm">{insurance.label}</p>
                                                <p className={`text-[10px] font-bold ${hasIt ? "text-white/70" : "text-slate-400"}`}>
                                                    {insurance.tip}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className={`
                                            px-3 py-1.5 rounded-xl text-[10px] font-black mb-3 inline-flex items-center gap-1.5
                                            ${hasIt
                                                ? "bg-white/20 text-white"
                                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                            }
                                        `}>
                                            {hasIt ? (
                                                <>✅ קיים אצל {coverage?.company}</>
                                            ) : (
                                                <>⚡ הזדמנות מכירה! חסר ללקוח</>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <ul className="space-y-1.5">
                                            {insurance.description.map((line, i) => (
                                                <li key={i} className={`text-[11px] font-medium flex items-start gap-1.5 ${hasIt ? "text-white/85" : "text-slate-300"}`}>
                                                    {line}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Tooltip Arrow */}
                                    <div className={`
                                        w-3 h-3 rotate-45 mx-auto -mt-1.5
                                        ${hasIt ? `bg-linear-to-br ${insurance.color}` : "bg-slate-900"}
                                    `} />
                                </div> : null}
                        </div>
                    );
                })}
            </div>

            {/* Missing coverage alert */}
            {missing.length > 0 && (
                <div className="p-5 bg-linear-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-lg shadow-amber-300/50">
                        ⚡
                    </div>
                    <div>
                        <p className="font-black text-amber-900 text-sm mb-1.5">הזדמנויות מכירה פוטנציאליות</p>
                        <div className="flex flex-wrap gap-2">
                            {missing.slice(0, 5).map((ins) => (
                                <span key={ins.key} className="px-3 py-1 bg-amber-200/60 text-amber-800 text-[10px] font-black rounded-full border border-amber-300 flex items-center gap-1">
                                    {ins.emoji} {ins.label}
                                </span>
                            ))}
                            {missing.length > 5 && (
                                <span className="px-3 py-1 bg-amber-200/60 text-amber-800 text-[10px] font-black rounded-full border border-amber-300">
                                    +{missing.length - 5} נוספים
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
