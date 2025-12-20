"use client";

import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";
import { useState } from "react";
import { generateGeminiContent } from "@/lib/gemini-client";

export default function AIToolsPage() {
    const [apiKey, setApiKey] = useState("");
    const [hasApiKey, setHasApiKey] = useState(false);
    const [activeTab, setActiveTab] = useState("סיכום שיחה");
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [loading, setLoading] = useState(false);

    useState(() => {
        const savedKey = localStorage.getItem("gemini_api_key");
        if (savedKey) {
            setApiKey(savedKey);
            setHasApiKey(true);
        }
    });

    const saveApiKey = () => {
        localStorage.setItem("gemini_api_key", apiKey);
        setHasApiKey(true);
    };

    const tools = [
        { id: "סיכום שיחה", icon: "📞", description: "סכם שיחה עם לקוח אוטומטית", color: "from-blue-600 to-indigo-700" },
        { id: "כתיבת מייל", icon: "✉️", description: "כתוב מייל מקצועי ללקוח", color: "from-emerald-600 to-teal-700" },
        { id: "ניתוח צרכים", icon: "🎯", description: "נתח צרכי ביטוח של לקוח", color: "from-purple-600 to-indigo-700" },
        { id: "המלצות מוצרים", icon: "💡", description: "קבל המלצות למוצרי ביטוח", color: "from-amber-500 to-orange-600" },
    ];

    const handleGenerate = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        setOutputText("");

        const prompts: Record<string, string> = {
            "סיכום שיחה": `סכם את השיחה הבאה עם לקוח בצורה מקצועית ותמציתית בעברית. כלול: נושאים עיקריים, החלטות, משימות המשך.\n\nתוכן השיחה:\n${inputText}`,
            "כתיבת מייל": `כתוב מייל מקצועי ואדיב בעברית על בסיס ההנחיות הבאות:\n\n${inputText}`,
            "ניתוח צרכים": `נתח את צרכי הביטוח של הלקוח על בסיס המידע הבא והמלץ על מוצרים מתאימים בעברית:\n\n${inputText}`,
            "המלצות מוצרים": `על בסיס פרופיל הלקוח הבא, המלץ על 3 מוצרי ביטוח מתאימים עם הסבר קצר לכל אחד בעברית:\n\n${inputText}`
        };

        try {
            const result = await generateGeminiContent(prompts[activeTab], apiKey);
            if (result.error) {
                setOutputText(`שגיאה: ${result.error}`);
            } else {
                setOutputText(result.text);
            }
        } catch (error) {
            setOutputText("אירעה שגיאה בעיבוד הבקשה");
        } finally {
            setLoading(false);
        }
    };

    if (!hasApiKey) {
        return (
            <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
                <div className="min-h-[600px] flex items-center justify-center" dir="rtl">
                    <Card className="border-none shadow-2xl bg-white p-12 max-w-2xl w-full text-center">
                        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center text-accent text-4xl mx-auto mb-6 animate-pulse">
                            🤖
                        </div>
                        <h2 className="text-3xl font-black text-primary mb-4">כלי AI מתקדמים</h2>
                        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
                            כדי להשתמש בכלי AI, אנא הזן את מפתח ה-API של Gemini שלך
                        </p>
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="הזן Gemini API Key..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                            <Button variant="secondary" className="w-full py-4 shadow-xl shadow-accent/20" onClick={saveApiKey}>
                                שמור והמשך
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-6">
                            המפתח נשמר באופן מקומי בדפדפן שלך בלבד
                        </p>
                    </Card>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">כלי AI</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            השתמש בבינה מלאכותית כדי לחסוך זמן ולשפר את העבודה שלך. סיכומים, כתיבה, וניתוחים אוטומטיים.
                        </p>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTab(tool.id)}
                            className={`text-right transition-all ${activeTab === tool.id ? 'scale-105' : 'hover:scale-105'
                                }`}
                        >
                            <Card className={`border-none p-6 text-white bg-gradient-to-br ${tool.color} shadow-xl h-full ${activeTab === tool.id ? 'ring-4 ring-accent/50' : ''
                                }`}>
                                <div className="text-4xl mb-4">{tool.icon}</div>
                                <h3 className="text-base font-black mb-2">{tool.id}</h3>
                                <p className="text-xs text-white/80 font-medium">{tool.description}</p>
                            </Card>
                        </button>
                    ))}
                </div>

                {/* Main Tool */}
                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-xl bg-white p-8">
                        <h2 className="text-2xl font-black text-primary mb-6">{activeTab}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pr-2 mb-2 block">
                                    קלט
                                </label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={
                                        activeTab === "סיכום שיחה" ? "הדבק כאן את תוכן השיחה..." :
                                            activeTab === "כתיבת מייל" ? "תאר מה תרצה לכתוב במייל..." :
                                                activeTab === "ניתוח צרכים" ? "תאר את פרופיל הלקוח..." :
                                                    "תאר את הלקוח ואת צרכיו..."
                                    }
                                    rows={12}
                                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full py-4 shadow-xl shadow-accent/20"
                                onClick={handleGenerate}
                                disabled={loading || !inputText.trim()}
                            >
                                {loading ? "מעבד..." : "🤖 צור עם AI"}
                            </Button>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl bg-slate-50 p-8">
                        <h2 className="text-2xl font-black text-primary mb-6">תוצאה</h2>
                        <div className="min-h-[400px] p-6 bg-white rounded-2xl border border-slate-100">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin text-4xl mb-4">🤖</div>
                                        <p className="text-sm font-bold text-slate-400">מעבד את הבקשה...</p>
                                    </div>
                                </div>
                            ) : outputText ? (
                                <div className="prose prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-medium text-primary text-sm leading-relaxed">
                                        {outputText}
                                    </pre>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center">
                                    <div>
                                        <div className="text-6xl mb-4 opacity-20">✨</div>
                                        <p className="text-sm font-bold text-slate-400">התוצאה תופיע כאן</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {outputText && !loading && (
                            <div className="flex gap-3 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => navigator.clipboard.writeText(outputText)}
                                >
                                    📋 העתק
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setOutputText("")}
                                >
                                    🗑️ נקה
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Tips */}
                <Card className="border-none shadow-xl bg-slate-900 text-white p-8">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                        <span className="text-accent">💡</span> טיפים לשימוש יעיל
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "היה ספציפי", desc: "ככל שתספק יותר פרטים, התוצאה תהיה טובה יותר" },
                            { title: "בדוק ותקן", desc: "תמיד בדוק את התוצאה ותקן אם צריך לפני שליחה ללקוח" },
                            { title: "שמור דוגמאות", desc: "שמור תוצאות טובות כדי לשפר את העבודה בעתיד" }
                        ].map((tip, i) => (
                            <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="text-base font-black mb-2">{tip.title}</h4>
                                <p className="text-sm text-slate-300 font-medium">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
