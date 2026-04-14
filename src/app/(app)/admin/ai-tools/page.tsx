"use client";

import { useState, useEffect } from "react";
import { generateWithGemini } from "@/app/actions/gemini";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import { Copy, Check, Download, History, X, Wand2 } from "lucide-react";

export default function AIToolsPage() {
    const [activeTool, setActiveTool] = useState("quote");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiOutput, setAiOutput] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [outputHistory, setOutputHistory] = useState<{ id: number, date: string, type: string, content: string }[]>([]);
    const [copied, setCopied] = useState(false);

    // Input States
    const [quoteInputs, setQuoteInputs] = useState({ name: "", type: "ביטוח חיים", details: "" });
    const [marketingInputs, setMarketingInputs] = useState({ topic: "", audience: "הורים צעירים", tone: "סמכותי ומקצועי" });

    // Calculator State
    const [calculatorInputs, setCalculatorInputs] = useState({
        age: 30,
        hasSpouse: false,
        company: "הראל",
        product: "ביטוח בריאות"
    });
    const [uploadedFile, setUploadedFile] = useState<{ base64: string, name: string, type: string } | null>(null);

    // Templates
    const templates = {
        marketing: [
            { label: "חשיבות ביטוח בריאות", topic: "למה ביטוח בריאות פרטי זה חובה", audience: "משפחות וילדים", tone: "סמכותי ומקצועי" },
            { label: "טיפ לפני נסיעה לחו״ל", topic: "טיפים לביטוח נסיעות לפני טסים בזול", audience: "צעירים ותרמילאים", tone: "חברי וקליל" },
            { label: "חסכון פנסיוני נכון", topic: "איך להגדיל את הפנסיה ב-30% בפעולה אחת", audience: "שכירים בני 30-40", tone: "מקצועי ואינפורמטיבי" }
        ],
        quote: [
            { label: "הצעה סטנדרטית למשפחה", type: "ביטוח בריאות", details: "זוג + 2 ילדים, ללא רקע רפואי, מעוניינים בכיסוי מורחב + תרופות מחוץ לסל." },
            { label: "ביטוח משכנתא זוגי", type: "ביטוח חיים", details: "זוג בני 30, לא מעשנים, משכנתא של 1.5M ש״ח ל-25 שנה." }
        ]
    };

    useEffect(() => {
        const savedHistory = localStorage.getItem("ai_history");
        if (savedHistory) setOutputHistory(JSON.parse(savedHistory));
    }, []);

    const addToHistory = (type: string, content: string) => {
        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleString("he-IL"),
            type: tools.find(t => t.id === type)?.title || type,
            content
        };
        const updatedHistory = [newEntry, ...outputHistory].slice(0, 50); // Keep last 50
        setOutputHistory(updatedHistory);
        localStorage.setItem("ai_history", JSON.stringify(updatedHistory));
    };

    const tools = [
        { id: "ocr", title: "סורק מסמכים חכם", icon: "📟", color: "bg-slate-100 dark:bg-slate-800" },
        { id: "calculator", title: "מחשבון הנחות", icon: "🔢", color: "bg-emerald-50" },
        { id: "marketing", title: "יוצר תוכן שיווקי", icon: "📢", color: "bg-pink-50" },
        { id: "pension", title: "ניתוח פנסיוני", icon: "📉", color: "bg-indigo-50" },
        { id: "quote", title: "מחולל הצעות מחיר", icon: "📜", color: "bg-blue-50" },
    ];

    const copyToClipboard = () => {
        navigator.clipboard.writeText(aiOutput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([aiOutput], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "ai-result.txt";
        document.body.appendChild(element);
        element.click();
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setAiOutput("Thinking...");

        let prompt = "";
        let fileData = undefined;

        if ((activeTool === 'ocr' || activeTool === 'calculator') && uploadedFile) {
            fileData = { base64: uploadedFile.base64, mimeType: uploadedFile.type };
        }

        switch (activeTool) {
            case "quote":
                prompt = `Act as an expert insurance agent. Generate a professional price quote and proposal for a client named "${quoteInputs.name}".
                Policy Type: ${quoteInputs.type}.
                Client Details: ${quoteInputs.details}.
                
                Structure the response in Hebrew with:
                1. Professional Introduction
                2. Coverage Details (Bullet points)
                3. Estimated Price Calculation
                4. Call to Action`;
                break;
            case "marketing":
                prompt = `Write a short, engaging social media post (Hebrew) for an insurance agency.
                Topic: ${marketingInputs.topic}
                Target Audience: ${marketingInputs.audience}
                Tone: ${marketingInputs.tone}
                Include hashtags.`;
                break;
            case "pension":
                prompt = `Analyze a pension scenario (Simulated):
                Age: 30, Salary: 10,000, Management Fee: 0.9%.
                Provide a quick summary of potential savings if moved to an optimized fund in Hebrew.`;
                break;
            case "calculator":
                prompt = `Act as an insurance discount algorithm. 
                Based on the attached document (if any) or general knowledge of Israeli insurance companies, calculate the estimated discount.
                
                Client Details:
                - Age: ${calculatorInputs.age}
                - Spouse Policy included: ${calculatorInputs.hasSpouse ? "Yes" : "No"}
                - Company: ${calculatorInputs.company}
                - Product: ${calculatorInputs.product}

                If a document is provided, extract the specific rule for this age/company/product.
                If no document, provide a general broad estimate but mention you need the specific rule file.
                
                Output in Hebrew:
                1. Analysis of the Client Profile
                2. Applicable Discount Rule (cite the document if present)
                3. Final Discount Calculation (%)
                4. Recommendation`;
                break;
            case "ocr":
                prompt = `Analyze this document. Extract key figures, dates, and names. Summarize the purpose of the document in Hebrew.`;
                break;
            default:
                prompt = "Explain why AI is useful for insurance agents in 1 sentence (Hebrew).";
        }

        const result = await generateWithGemini(prompt, fileData);

        if (result.error) {
            setAiOutput(`Error: ${result.error}`);
        } else {
            const fullText = result.text;
            setAiOutput("");
            let i = 0;
            const interval = setInterval(() => {
                setAiOutput((prev) => prev + (fullText[i] || ""));
                i++;
                if (i >= fullText.length) {
                    clearInterval(interval);
                    setIsGenerating(false);
                    addToHistory(activeTool, fullText);
                }
            }, 10);
            return;
        }
        setIsGenerating(false);
    };

    return (
        <DashboardShell role="מנהל" navItems={ADMIN_NAV_ITEMS}>
            <div className="space-y-12 animate-in fade-in duration-1000 relative" dir="rtl">
                <header className="text-center space-y-4">
                    <h1 className="text-4xl font-black text-primary font-display tracking-tight italic bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">Generative AI Studio</h1>
                    <p className="text-slate-500 font-medium">חליפת כלי ה-AI המתקדמת לסוכן העתיד</p>
                </header>

                <div className="flex justify-center gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap shadow-sm border ${activeTool === tool.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            <span className="text-lg">{tool.icon}</span>
                            {tool.title}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start pb-20">
                    {/* Left: AI Output Console */}
                    <Card className="relative overflow-hidden border-none shadow-2xl bg-slate-900 aspect-square lg:aspect-auto lg:h-[700px] rounded-[3rem] p-8 flex flex-col group">
                        <div className="absolute top-6 right-8 flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">AI Output</span>
                            <div className={`h-1.5 w-1.5 rounded-full animate-pulse transition-colors ${isGenerating ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
                        </div>

                        {/* Util Buttons */}
                        {aiOutput && !isGenerating && (
                            <div className="absolute top-6 left-8 flex gap-2">
                                <button onClick={copyToClipboard} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors" title="העתק">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                                <button onClick={downloadTxt} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors" title="הורד">
                                    <Download size={16} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 mt-10 font-mono text-sm leading-relaxed text-slate-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                            {aiOutput || (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700">
                                    <div className="text-6xl mb-4">🪄</div>
                                    <p className="font-black italic">התוצאה תופיע כאן</p>
                                    <p className="text-xs uppercase tracking-[0.2em]">Ready for input</p>
                                </div>
                            )}
                        </div>

                        {isGenerating && (
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 animate-[progress_2s_infinite]"></div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Right: Tool Controls */}
                    <Card className="border-none shadow-2xl bg-slate-50/50 backdrop-blur-sm rounded-[3rem] p-10 min-h-[700px] flex flex-col relative">
                        {/* History Toggle */}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="absolute top-10 left-10 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 text-xs font-bold"
                        >
                            <History size={16} />
                            היסטוריה
                        </button>

                        <div className="mb-10 flex items-center gap-4 border-b border-slate-200 pb-6">
                            <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl border border-slate-50">
                                {tools.find(t => t.id === activeTool)?.icon}
                            </div>
                            <h3 className="text-xl font-black text-primary italic">
                                {tools.find(t => t.id === activeTool)?.title}
                            </h3>
                        </div>

                        <div className="flex-1 space-y-8">
                            {/* Templates Section */}
                            {(activeTool === "marketing" || activeTool === "quote") && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {(activeTool === "marketing" ? templates.marketing : templates.quote).map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (activeTool === "marketing") {
                                                    setMarketingInputs(t as any);
                                                } else {
                                                    setQuoteInputs(t as any);
                                                }
                                            }}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black whitespace-nowrap hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center gap-2"
                                        >
                                            <Wand2 size={12} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTool === "quote" && (
                                <div className="space-y-6 animate-in slide-in-from-left-5 duration-500">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">שם הלקוח</label>
                                        <input
                                            type="text"
                                            placeholder="הכנס שם מלא..."
                                            value={quoteInputs.name}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, name: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">סוג פוליסה</label>
                                        <select
                                            value={quoteInputs.type}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, type: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                        >
                                            <option>ביטוח חיים</option>
                                            <option>ביטוח בריאות</option>
                                            <option>רכב</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">פרטים נוספים</label>
                                        <textarea
                                            rows={4}
                                            placeholder="למשל: בן 30, מעשן, עובד הייטק..."
                                            value={quoteInputs.details}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, details: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {activeTool === "pension" && (
                                <div className="space-y-6 animate-in slide-in-from-left-5 duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">גיל</label>
                                            <input type="number" defaultValue={30} className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">שכר חודשי</label>
                                            <input type="number" defaultValue={10000} className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none text-center" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">דמי ניהול %</label>
                                            <input type="number" step="0.1" defaultValue={0.9} className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none text-center" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">צבירה נוכחית</label>
                                            <input type="number" defaultValue={50000} className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none text-center" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTool === "calculator" && (
                                <div className="space-y-6 animate-in slide-in-from-left-5 duration-500">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">גיל המבוטח</label>
                                            <input
                                                type="number"
                                                value={calculatorInputs.age}
                                                onChange={(e) => setCalculatorInputs({ ...calculatorInputs, age: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">חברת ביטוח</label>
                                            <select
                                                value={calculatorInputs.company}
                                                onChange={(e) => setCalculatorInputs({ ...calculatorInputs, company: e.target.value })}
                                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none"
                                            >
                                                <option>הראל</option>
                                                <option>מנורה</option>
                                                <option>הפניקס</option>
                                                <option>איילון</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">סוג מוצר</label>
                                        <select
                                            value={calculatorInputs.product}
                                            onChange={(e) => setCalculatorInputs({ ...calculatorInputs, product: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm outline-none"
                                        >
                                            <option>ביטוח בריאות</option>
                                            <option>ביטוח חיים (ריסק)</option>
                                            <option>מחלות קשות</option>
                                            <option>סיעוד</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer" onClick={() => setCalculatorInputs(p => ({ ...p, hasSpouse: !p.hasSpouse }))}>
                                        <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${calculatorInputs.hasSpouse ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                            {calculatorInputs.hasSpouse && <span className="text-xs font-black">✓</span>}
                                        </div>
                                        <span className="text-sm font-bold text-primary">כולל בן/בת זוג? (הנחה זוגית)</span>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pr-1">קובץ חוקים / תקנון (אופציונלי)</p>
                                        <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-white transition-all">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf,image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const base64 = reader.result as string;
                                                            // Remove prefix data:application/pdf;base64,
                                                            const base64Data = base64.split(',')[1];
                                                            setUploadedFile({
                                                                base64: base64Data,
                                                                name: file.name,
                                                                type: file.type
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            {uploadedFile ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <span className="text-lg">📄</span>
                                                    <span className="text-xs font-bold truncate max-w-[200px]">{uploadedFile.name}</span>
                                                    <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full">מוכן</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-indigo-500 text-xl">📎</span>
                                                    <span className="text-xs font-bold text-slate-500">צרף קובץ הנחות (PDF)</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTool === "ocr" && (
                                <div className="space-y-10 animate-in slide-in-from-left-5 duration-500">
                                    <div className="border-2 border-dashed border-slate-200 bg-white/50 rounded-[2rem] p-12 text-center group hover:border-indigo-500 hover:bg-white transition-all cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="application/pdf,image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const base64 = reader.result as string;
                                                        const base64Data = base64.split(',')[1];
                                                        setUploadedFile({
                                                            base64: base64Data,
                                                            name: file.name,
                                                            type: file.type
                                                        });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        {uploadedFile ? (
                                            <div>
                                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg">✓</div>
                                                <p className="text-sm font-black text-primary italic">{uploadedFile.name}</p>
                                                <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-widest">קובץ נטען בהצלחה</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📤</div>
                                                <p className="text-sm font-black text-primary italic">גרור קובץ לכאן או לחץ לבחירה</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">תמונות או PDF</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTool === "marketing" && (
                                <div className="space-y-6 animate-in slide-in-from-left-5 duration-500">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2">נושא הפוסט</label>
                                        <input
                                            type="text"
                                            placeholder="למשל: חשיבות ביטוח חיים למשפחות צעירות..."
                                            value={marketingInputs.topic}
                                            onChange={(e) => setMarketingInputs({ ...marketingInputs, topic: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">קהל יעד</label>
                                            <select
                                                value={marketingInputs.audience}
                                                onChange={(e) => setMarketingInputs({ ...marketingInputs, audience: e.target.value })}
                                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-[10px] font-black shadow-sm outline-none"
                                            >
                                                <option>הורים צעירים</option>
                                                <option>עצמאיים</option>
                                                <option>פנסיונרים</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-2 text-right">טון כתיבה</label>
                                            <select
                                                value={marketingInputs.tone}
                                                onChange={(e) => setMarketingInputs({ ...marketingInputs, tone: e.target.value })}
                                                className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-[10px] font-black shadow-sm outline-none"
                                            >
                                                <option>סמכותי ומקצועי</option>
                                                <option>חברי ומרגש</option>
                                                <option>הומוריסטי</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-6 rounded-2xl font-black italic tracking-tighter text-base shadow-2xl transition-all duration-500 mt-10 ${isGenerating
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-500/20'
                                }`}
                        >
                            {isGenerating ? "מייצר קסם... ✨" : "✨ צור הצעה מנצחת"}
                        </Button>
                    </Card>
                </div >

                {/* History Slider / Drawer */}
                {showHistory && (
                    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black font-display text-slate-900">היסטוריית תוצאות</h3>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                            {outputHistory.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 font-medium">אין היסטוריה עדיין.</p>
                            ) : (
                                outputHistory.map((item) => (
                                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group" onClick={() => setAiOutput(item.content)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="bg-white text-[10px] px-2">{item.type}</Badge>
                                            <span className="text-[10px] text-slate-400 font-bold">{item.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {showHistory && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowHistory(false)}></div>}
            </div >
        </DashboardShell >
    );
}
