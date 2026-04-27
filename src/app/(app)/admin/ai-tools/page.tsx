"use client";

import { Copy, Check, Download, History, X, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { generateWithGemini } from "@/app/actions/gemini";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

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
                    <h1 className="text-5xl font-black font-display tracking-tight italic bg-clip-text text-transparent bg-linear-to-r from-amber-200 via-amber-400 to-orange-500">Generative AI Studio</h1>
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">חליפת כלי ה-AI המתקדמת לסוכן העתיד</p>
                </header>

                <div className="flex justify-center gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs transition-all whitespace-nowrap shadow-xl border ${activeTool === tool.id
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20'
                                : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                        >
                            <span className="text-lg">{tool.icon}</span>
                            {tool.title}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-10 items-start pb-20">
                    {/* Left: AI Output Console */}
                    <Card className="relative overflow-hidden border border-slate-800 shadow-2xl bg-slate-950/80 backdrop-blur-xl aspect-square lg:aspect-auto lg:min-h-[750px] rounded-[3rem] p-10 flex flex-col group">
                        <div className="absolute top-8 right-10 flex items-center gap-3">
                            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">AI Neural Engine</span>
                            <div className={`h-2 w-2 rounded-full shadow-[0_0_10px_currentColor] transition-colors ${isGenerating ? 'bg-amber-400 text-amber-400 animate-pulse' : 'bg-emerald-500 text-emerald-500'}`} />
                        </div>

                        {/* Util Buttons */}
                        {aiOutput && !isGenerating ? <div className="absolute top-8 left-10 flex gap-3">
                                <button onClick={copyToClipboard} className="p-3 bg-slate-800/50 hover:bg-amber-500 hover:text-slate-900 rounded-2xl text-slate-300 transition-all border border-slate-700" title="העתק">
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                <button onClick={downloadTxt} className="p-3 bg-slate-800/50 hover:bg-amber-500 hover:text-slate-900 rounded-2xl text-slate-300 transition-all border border-slate-700" title="הורד">
                                    <Download size={18} />
                                </button>
                            </div> : null}

                        <div className="flex-1 mt-12 font-mono text-sm leading-relaxed text-slate-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap px-2">
                            {aiOutput || (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-1000">
                                    <div className="text-8xl mb-4 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">🪄</div>
                                    <p className="font-black italic text-2xl text-white">התוצאה תופיע כאן</p>
                                    <p className="text-xs uppercase tracking-[0.4em] font-black">Neural Processor Active</p>
                                </div>
                            )}
                        </div>

                        {isGenerating ? <div className="mt-6 flex items-center gap-3">
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full bg-linear-to-r from-amber-500 to-orange-600 animate-[progress_2s_infinite] shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                </div>
                            </div> : null}
                    </Card>

                    {/* Right: Tool Controls */}
                    <Card className="border border-slate-800 shadow-2xl bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-12 min-h-[750px] flex flex-col relative">
                        {/* History Toggle */}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="absolute top-12 left-12 text-slate-500 hover:text-amber-500 transition-all flex items-center gap-2 text-[10px] font-black tracking-widest uppercase"
                        >
                            <History size={16} />
                            ארכיון פעולות
                        </button>

                        <div className="mb-12 flex items-center gap-5 border-b border-slate-800 pb-8">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-amber-500/10 shadow-lg flex items-center justify-center text-3xl border border-amber-500/20">
                                {tools.find(t => t.id === activeTool)?.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white italic tracking-tight">
                                    {tools.find(t => t.id === activeTool)?.title}
                                </h3>
                                <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Configure Parameters</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-10">
                            {/* Templates Section */}
                            {(activeTool === "marketing" || activeTool === "quote") && (
                                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
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
                                            className="px-5 py-2.5 bg-slate-800/50 text-slate-300 rounded-2xl text-[10px] font-black whitespace-nowrap hover:bg-amber-500 hover:text-slate-950 transition-all border border-slate-700 flex items-center gap-2"
                                        >
                                            <Wand2 size={12} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {activeTool === "quote" && (
                                <div className="grid gap-8 animate-in slide-in-from-left-8 duration-700">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3">שם הלקוח</label>
                                        <input
                                            type="text"
                                            placeholder="הכנס שם מלא..."
                                            value={quoteInputs.name}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, name: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3">סוג פוליסה</label>
                                        <select
                                            value={quoteInputs.type}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, type: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all appearance-none"
                                        >
                                            <option className="bg-slate-900">ביטוח חיים</option>
                                            <option className="bg-slate-900">ביטוח בריאות</option>
                                            <option className="bg-slate-900">רכב</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3">פרטים נוספים</label>
                                        <textarea
                                            rows={5}
                                            placeholder="למשל: בן 30, מעשן, עובד הייטק..."
                                            value={quoteInputs.details}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, details: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all resize-none placeholder:text-slate-700"
                                         />
                                    </div>
                                </div>
                            )}

                            {activeTool === "calculator" && (
                                <div className="grid gap-8 animate-in slide-in-from-left-8 duration-700">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3 text-right">גיל המבוטח</label>
                                            <input
                                                type="number"
                                                value={calculatorInputs.age}
                                                onChange={(e) => setCalculatorInputs({ ...calculatorInputs, age: parseInt(e.target.value) })}
                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-xl font-black text-white shadow-inner outline-none text-center"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3 text-right">חברת ביטוח</label>
                                            <select
                                                value={calculatorInputs.company}
                                                onChange={(e) => setCalculatorInputs({ ...calculatorInputs, company: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner outline-none"
                                            >
                                                <option className="bg-slate-900">הראל</option>
                                                <option className="bg-slate-900">מנורה</option>
                                                <option className="bg-slate-900">הפניקס</option>
                                                <option className="bg-slate-900">איילון</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3 text-right">סוג מוצר</label>
                                        <select
                                            value={calculatorInputs.product}
                                            onChange={(e) => setCalculatorInputs({ ...calculatorInputs, product: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner outline-none"
                                        >
                                            <option className="bg-slate-900">ביטוח בריאות</option>
                                            <option className="bg-slate-900">ביטוח חיים (ריסק)</option>
                                            <option className="bg-slate-900">מחלות קשות</option>
                                            <option className="bg-slate-900">סיעוד</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-5 bg-slate-950/50 p-6 rounded-2.5xl border border-slate-800 shadow-inner cursor-pointer group" onClick={() => setCalculatorInputs(p => ({ ...p, hasSpouse: !p!.hasSpouse }))}>
                                        <div className={`h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all ${calculatorInputs.hasSpouse ? 'bg-amber-500 border-amber-500 text-slate-900' : 'border-slate-700 group-hover:border-slate-500'}`}>
                                            {calculatorInputs.hasSpouse ? <span className="text-sm font-black">✓</span> : null}
                                        </div>
                                        <div>
                                            <span className="text-base font-black text-white">כולל בן/בת זוג?</span>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Dual Policy Discount</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 pr-3">קובץ חוקים / תקנון (אופציונלי)</p>
                                        <label className="flex flex-col items-center justify-center gap-3 w-full py-10 border-2 border-dashed border-slate-800 rounded-[2rem] cursor-pointer hover:border-amber-500/50 hover:bg-slate-900/50 transition-all group">
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
                                                <div className="flex flex-col items-center gap-3 text-emerald-400">
                                                    <span className="text-4xl">📄</span>
                                                    <div className="text-center">
                                                        <p className="text-xs font-black truncate max-w-[250px]">{uploadedFile.name}</p>
                                                        <p className="text-[10px] text-emerald-500/60 font-black mt-1 uppercase tracking-widest">Ready to Process</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-slate-600 text-4xl group-hover:scale-110 group-hover:text-amber-500 transition-all">📎</span>
                                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">צרף קובץ הנחות (PDF)</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTool === "ocr" && (
                                <div className="space-y-10 animate-in slide-in-from-left-8 duration-700">
                                    <div className="border-4 border-dashed border-slate-800 bg-slate-950/30 rounded-[3rem] py-20 text-center group hover:border-amber-500/50 hover:bg-slate-900/50 transition-all cursor-pointer relative">
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
                                                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 shadow-xl border border-emerald-500/20">✓</div>
                                                <p className="text-lg font-black text-white italic">{uploadedFile.name}</p>
                                                <p className="text-xs text-emerald-600 font-bold mt-2 uppercase tracking-[0.2em]">Upload Successful</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="h-20 w-20 bg-slate-800 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all">📤</div>
                                                <p className="text-lg font-black text-white italic">גרור קובץ לכאן או לחץ לבחירה</p>
                                                <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-[0.2em]">IMAGES OR PDF DOCUMENTS</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTool === "marketing" && (
                                <div className="grid gap-8 animate-in slide-in-from-left-8 duration-700">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3">נושא הפוסט</label>
                                        <input
                                            type="text"
                                            placeholder="למשל: חשיבות ביטוח חיים למשפחות צעירות..."
                                            value={marketingInputs.topic}
                                            onChange={(e) => setMarketingInputs({ ...marketingInputs, topic: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-base font-bold text-white shadow-inner focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-700"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3 text-right">קהל יעד</label>
                                            <select
                                                value={marketingInputs.audience}
                                                onChange={(e) => setMarketingInputs({ ...marketingInputs, audience: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-xs font-black text-white shadow-inner outline-none appearance-none"
                                            >
                                                <option className="bg-slate-900">הורים צעירים</option>
                                                <option className="bg-slate-900">עצמאיים</option>
                                                <option className="bg-slate-900">פנסיונרים</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pr-3 text-right">טון כתיבה</label>
                                            <select
                                                value={marketingInputs.tone}
                                                onChange={(e) => setMarketingInputs({ ...marketingInputs, tone: e.target.value })}
                                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2.5xl p-5 text-xs font-black text-white shadow-inner outline-none appearance-none"
                                            >
                                                <option className="bg-slate-900">סמכותי ומקצועי</option>
                                                <option className="bg-slate-900">חברי ומרגש</option>
                                                <option className="bg-slate-900">הומוריסטי</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className={`w-full py-8 rounded-2.5xl font-black italic tracking-tighter text-lg shadow-2xl transition-all duration-700 mt-12 overflow-hidden relative group/btn ${isGenerating
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-500 text-slate-950 hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/20'
                                }`}
                        >
                            <span className="relative z-10">{isGenerating ? "מייצר קסם... ✨" : "✨ צור הצעה מנצחת"}</span>
                            {!isGenerating && <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />}
                        </Button>
                    </Card>
                </div >

                {/* History Slider / Drawer */}
                <AnimatePresence>
                    {showHistory && (
                        <>
                            <motion.div 
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 right-0 w-[400px] bg-slate-950 border-l border-slate-800 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 p-8 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black font-display text-white italic">ארכיון פעולות</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Saved intelligence history</p>
                                    </div>
                                    <button onClick={() => setShowHistory(false)} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                                    {outputHistory.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                            <div className="text-4xl mb-4">📭</div>
                                            <p className="font-bold">אין היסטוריה עדיין</p>
                                        </div>
                                    ) : (
                                        outputHistory.map((item) => (
                                            <div 
                                                key={item.id} 
                                                className="p-5 bg-slate-900 border border-slate-800 rounded-3xl hover:border-amber-500/30 transition-all cursor-pointer group" 
                                                onClick={() => {
                                                    setAiOutput(item.content);
                                                    setShowHistory(false);
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] px-2 uppercase font-black">{item.type}</Badge>
                                                    <span className="text-[8px] text-slate-500 font-black tracking-tighter">{item.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed font-medium group-hover:text-slate-200">{item.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" 
                                onClick={() => setShowHistory(false)} 
                            />
                        </>
                    )}
                </AnimatePresence>
            </div >
        </DashboardShell >

    );
}
