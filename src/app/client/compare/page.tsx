"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { 
    Scale, Check, X, ChevronDown, Star, Shield, Heart, 
    Car, Home, Plane, Baby, Briefcase, Info, Phone,
    ArrowRight, Sparkles, Calculator, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface InsuranceProduct {
    id: string;
    name: string;
    company: string;
    companyLogo: string;
    type: string;
    monthlyPrice: number;
    coverage: string;
    rating: number;
    features: { name: string; included: boolean; details?: string }[];
    highlights: string[];
    recommended?: boolean;
}

export default function ComparePage() {
    const [selectedType, setSelectedType] = useState<string>('health');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    const insuranceTypes = [
        { id: 'health', name: 'ביטוח בריאות', icon: Heart, color: 'red' },
        { id: 'car', name: 'ביטוח רכב', icon: Car, color: 'blue' },
        { id: 'home', name: 'ביטוח דירה', icon: Home, color: 'emerald' },
        { id: 'life', name: 'ביטוח חיים', icon: Shield, color: 'purple' },
        { id: 'travel', name: 'ביטוח נסיעות', icon: Plane, color: 'amber' },
        { id: 'pension', name: 'פנסיה', icon: Briefcase, color: 'green' },
    ];

    const products: InsuranceProduct[] = [
        // Health Insurance
        {
            id: 'h1',
            name: 'בריאות פרימיום',
            company: 'הראל',
            companyLogo: '🏛️',
            type: 'health',
            monthlyPrice: 450,
            coverage: '2,000,000 ₪',
            rating: 4.8,
            recommended: true,
            features: [
                { name: 'ניתוחים פרטיים', included: true, details: 'ללא הגבלה' },
                { name: 'תרופות מחוץ לסל', included: true, details: 'עד 50,000 ₪ לשנה' },
                { name: 'רופאים מומחים', included: true, details: 'בחירה חופשית' },
                { name: 'השתלות בחו"ל', included: true, details: 'כיסוי מלא' },
                { name: 'רפואה משלימה', included: true, details: '12 טיפולים לשנה' },
                { name: 'Second Opinion', included: true },
                { name: 'טיפולי שיניים', included: false },
            ],
            highlights: ['דירוג גבוה', 'שירות 24/7', 'אישורים מהירים']
        },
        {
            id: 'h2',
            name: 'בריאות בסיסי פלוס',
            company: 'מגדל',
            companyLogo: '🏢',
            type: 'health',
            monthlyPrice: 280,
            coverage: '1,000,000 ₪',
            rating: 4.5,
            features: [
                { name: 'ניתוחים פרטיים', included: true, details: 'עד 500,000 ₪' },
                { name: 'תרופות מחוץ לסל', included: true, details: 'עד 30,000 ₪ לשנה' },
                { name: 'רופאים מומחים', included: true, details: 'מתוך רשימה' },
                { name: 'השתלות בחו"ל', included: false },
                { name: 'רפואה משלימה', included: true, details: '6 טיפולים לשנה' },
                { name: 'Second Opinion', included: true },
                { name: 'טיפולי שיניים', included: false },
            ],
            highlights: ['מחיר תחרותי', 'רשת רופאים גדולה']
        },
        {
            id: 'h3',
            name: 'בריאות מושלם',
            company: 'הפניקס',
            companyLogo: '🔥',
            type: 'health',
            monthlyPrice: 520,
            coverage: '3,000,000 ₪',
            rating: 4.7,
            features: [
                { name: 'ניתוחים פרטיים', included: true, details: 'ללא הגבלה' },
                { name: 'תרופות מחוץ לסל', included: true, details: 'ללא הגבלה' },
                { name: 'רופאים מומחים', included: true, details: 'בחירה חופשית' },
                { name: 'השתלות בחו"ל', included: true, details: 'כיסוי מלא + לינה' },
                { name: 'רפואה משלימה', included: true, details: 'ללא הגבלה' },
                { name: 'Second Opinion', included: true },
                { name: 'טיפולי שיניים', included: true, details: '5,000 ₪ לשנה' },
            ],
            highlights: ['הכיסוי המקיף ביותר', 'VIP Service']
        },
        // Car Insurance
        {
            id: 'c1',
            name: 'רכב מקיף פלטינום',
            company: 'איילון',
            companyLogo: '🦌',
            type: 'car',
            monthlyPrice: 380,
            coverage: 'מקיף + צד ג\'',
            rating: 4.6,
            recommended: true,
            features: [
                { name: 'נזק עצמי', included: true },
                { name: 'גניבה', included: true },
                { name: 'אש ונזקי טבע', included: true },
                { name: 'רכב חלופי', included: true, details: '14 ימים' },
                { name: 'גרר 24/7', included: true },
                { name: 'ביטול השתתפות עצמית', included: true },
                { name: 'נזק מכאני', included: false },
            ],
            highlights: ['רכב חלופי מורחב', 'אפליקציה לדיווח נזק']
        },
        {
            id: 'c2',
            name: 'רכב מקיף סטנדרט',
            company: 'ביטוח ישיר',
            companyLogo: '📱',
            type: 'car',
            monthlyPrice: 290,
            coverage: 'מקיף + צד ג\'',
            rating: 4.3,
            features: [
                { name: 'נזק עצמי', included: true },
                { name: 'גניבה', included: true },
                { name: 'אש ונזקי טבע', included: true },
                { name: 'רכב חלופי', included: true, details: '7 ימים' },
                { name: 'גרר 24/7', included: true },
                { name: 'ביטול השתתפות עצמית', included: false },
                { name: 'נזק מכאני', included: false },
            ],
            highlights: ['המחיר הזול ביותר', 'הכל אונליין']
        },
        // Home Insurance
        {
            id: 'hm1',
            name: 'דירה פרימיום',
            company: 'מנורה',
            companyLogo: '🕯️',
            type: 'home',
            monthlyPrice: 150,
            coverage: '2,000,000 ₪',
            rating: 4.5,
            recommended: true,
            features: [
                { name: 'מבנה', included: true, details: 'עד 2M ₪' },
                { name: 'תכולה', included: true, details: 'עד 500K ₪' },
                { name: 'נזקי מים', included: true },
                { name: 'פריצה וגניבה', included: true },
                { name: 'רעידת אדמה', included: true },
                { name: 'אחריות כלפי צד ג\'', included: true },
                { name: 'נזקי חשמל', included: true },
            ],
            highlights: ['כיסוי רחב', 'שמאי מהיר']
        },
    ];

    const filteredProducts = products.filter(p => p.type === selectedType);
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));

    const toggleProductSelection = (productId: string) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(prev => prev.filter(id => id !== productId));
        } else if (selectedProducts.length < 3) {
            setSelectedProducts(prev => [...prev, productId]);
        } else {
            toast.error('ניתן להשוות עד 3 מוצרים');
        }
    };

    const handleGetQuote = (product: InsuranceProduct) => {
        toast.success(`מחשבים הצעת מחיר עבור ${product.name}...`);
    };

    const handleContactAgent = () => {
        toast.info('הסוכן שלך יצור איתך קשר בהקדם');
    };

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="space-y-6" dir="rtl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-amber-100 flex items-center gap-3">
                            <Scale className="text-amber-400" />
                            השוואת מוצרים
                        </h1>
                        <p className="text-slate-400 mt-1">השווה בין מוצרי ביטוח ומצא את ההתאמה המושלמת עבורך</p>
                    </div>
                    
                    {selectedProducts.length >= 2 && (
                        <Button 
                            onClick={() => setShowCompareModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                            <Scale size={18} className="ml-2" />
                            השווה ({selectedProducts.length})
                        </Button>
                    )}
                </div>

                {/* Insurance Type Tabs */}
                <div className="flex flex-wrap gap-2">
                    {insuranceTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSelectedType(type.id);
                                    setSelectedProducts([]);
                                }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                                    selectedType === type.id
                                        ? 'bg-amber-500 text-slate-900'
                                        : 'bg-slate-700/50 text-slate-400 hover:text-amber-400'
                                }`}
                            >
                                <Icon size={18} />
                                {type.name}
                            </button>
                        );
                    })}
                </div>

                {/* Products Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className={`p-6 relative overflow-hidden transition-all ${
                                selectedProducts.includes(product.id)
                                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                                    : 'hover:border-amber-500/30'
                            }`}>
                                {/* Recommended Badge */}
                                {product.recommended && (
                                    <div className="absolute top-0 left-0 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-br-xl">
                                        מומלץ ⭐
                                    </div>
                                )}

                                {/* Selection Checkbox */}
                                <button
                                    onClick={() => toggleProductSelection(product.id)}
                                    className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        selectedProducts.includes(product.id)
                                            ? 'bg-amber-500 border-amber-500 text-slate-900'
                                            : 'border-slate-600 hover:border-amber-500'
                                    }`}
                                >
                                    {selectedProducts.includes(product.id) && <Check size={14} />}
                                </button>

                                {/* Company */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-3xl">{product.companyLogo}</div>
                                    <div>
                                        <h3 className="font-bold text-amber-100">{product.name}</h3>
                                        <p className="text-sm text-slate-500">{product.company}</p>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className={i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                                        />
                                    ))}
                                    <span className="text-sm text-slate-400">{product.rating}</span>
                                </div>

                                {/* Price */}
                                <div className="mb-4 p-4 bg-slate-700/30 rounded-xl">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-amber-400">₪{product.monthlyPrice}</span>
                                        <span className="text-slate-500">/ חודש</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">כיסוי: {product.coverage}</p>
                                </div>

                                {/* Highlights */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {product.highlights.map((highlight, index) => (
                                        <Badge key={index} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                            {highlight}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Key Features */}
                                <div className="space-y-2 mb-6">
                                    {product.features.slice(0, 4).map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            {feature.included ? (
                                                <Check size={16} className="text-emerald-400" />
                                            ) : (
                                                <X size={16} className="text-red-400" />
                                            )}
                                            <span className={feature.included ? 'text-slate-300' : 'text-slate-500'}>
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                    {product.features.length > 4 && (
                                        <p className="text-xs text-slate-500">+{product.features.length - 4} פיצ'רים נוספים</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button 
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                                        onClick={() => handleGetQuote(product)}
                                    >
                                        <Calculator size={16} className="ml-2" />
                                        קבל הצעה
                                    </Button>
                                    <Button variant="outline" onClick={handleContactAgent}>
                                        <Phone size={16} />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <Card className="p-12 text-center">
                        <Scale size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 mb-2">אין מוצרים בקטגוריה זו</h3>
                        <p className="text-sm text-slate-500">נסה לבחור קטגוריה אחרת</p>
                    </Card>
                )}

                {/* Compare Modal */}
                <AnimatePresence>
                    {showCompareModal && selectedProductsData.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowCompareModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-5xl max-h-[85vh] overflow-y-auto glass-card rounded-3xl border border-amber-500/20 p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black text-amber-100">השוואת מוצרים</h2>
                                    <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-amber-400">
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Comparison Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                <th className="text-right p-3 text-slate-500 font-bold">תכונה</th>
                                                {selectedProductsData.map(product => (
                                                    <th key={product.id} className="p-3 text-center">
                                                        <div className="text-2xl mb-2">{product.companyLogo}</div>
                                                        <div className="font-bold text-amber-100">{product.name}</div>
                                                        <div className="text-sm text-slate-500">{product.company}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Price Row */}
                                            <tr className="border-t border-slate-700/50">
                                                <td className="p-3 font-bold text-slate-300">מחיר חודשי</td>
                                                {selectedProductsData.map(product => (
                                                    <td key={product.id} className="p-3 text-center">
                                                        <span className="text-xl font-black text-amber-400">₪{product.monthlyPrice}</span>
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Coverage Row */}
                                            <tr className="border-t border-slate-700/50">
                                                <td className="p-3 font-bold text-slate-300">כיסוי</td>
                                                {selectedProductsData.map(product => (
                                                    <td key={product.id} className="p-3 text-center text-slate-300">
                                                        {product.coverage}
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Rating Row */}
                                            <tr className="border-t border-slate-700/50">
                                                <td className="p-3 font-bold text-slate-300">דירוג</td>
                                                {selectedProductsData.map(product => (
                                                    <td key={product.id} className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Star size={16} className="text-amber-400 fill-amber-400" />
                                                            <span className="text-slate-300">{product.rating}</span>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                            {/* Features */}
                                            {selectedProductsData[0].features.map((feature, index) => (
                                                <tr key={index} className="border-t border-slate-700/50">
                                                    <td className="p-3 text-slate-400">{feature.name}</td>
                                                    {selectedProductsData.map(product => {
                                                        const productFeature = product.features[index];
                                                        return (
                                                            <td key={product.id} className="p-3 text-center">
                                                                {productFeature?.included ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <Check size={20} className="text-emerald-400" />
                                                                        {productFeature.details && (
                                                                            <span className="text-xs text-slate-500 mt-1">{productFeature.details}</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <X size={20} className="text-red-400 mx-auto" />
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700/50">
                                    <Button 
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                                        onClick={handleContactAgent}
                                    >
                                        <MessageSquare size={16} className="ml-2" />
                                        דבר עם הסוכן שלי
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowCompareModal(false)}>
                                        סגור
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI Recommendation */}
                <Card className="p-6 border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Sparkles size={24} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-purple-400 mb-2">המלצה חכמה</h3>
                            <p className="text-slate-400 mb-4">
                                על בסיס הפרופיל שלך והפוליסות הקיימות, אנו ממליצים לך על "בריאות פרימיום" של הראל - 
                                הוא מספק את הכיסוי הרחב ביותר במחיר תחרותי.
                            </p>
                            <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                                <Info size={16} className="ml-2" />
                                למד עוד
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
