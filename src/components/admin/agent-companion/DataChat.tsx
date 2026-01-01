"use client";

import { Card, Button } from "@/components/ui/base";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { generateWithGemini } from "@/app/actions/gemini";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function DataChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'שלום! אני ה-AI של הסוכנות. אתה יכול לשאול אותי שאלות על לקוחות, פוליסות, או לבקש ניתוח נתונים.' }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (userMsg: string) => {
        const trimmed = userMsg.trim();
        if (!trimmed) return;

        setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
        setIsLoading(true);

        try {
            const prompt = `Act as an expert CRM assistant for an insurance agency. Answer the following question based on general knowledge or simulated data (since you don't have real DB access yet). Keep it short and helpful in Hebrew. Question: ${trimmed}`;
            const result = await generateWithGemini(prompt);

            const responseText = result.error
                ? `שגיאה: ${result.error}`
                : (result.text || "סליחה, לא הצלחתי לעבד את הבקשה.");

            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "התרחשה שגיאה בתקשורת עם השרת." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        const userMsg = input;
        setInput("");
        await sendMessage(userMsg);
    };

    useEffect(() => {
        const onVoiceCommand = (event: Event) => {
            const custom = event as CustomEvent<{ text?: string }>;
            const text = custom?.detail?.text;
            if (typeof text !== "string") return;
            void sendMessage(text);
        };

        window.addEventListener("magen:voiceCommand", onVoiceCommand as EventListener);
        return () => window.removeEventListener("magen:voiceCommand", onVoiceCommand as EventListener);
    }, []);

    return (
        <Card className="bg-white border-none shadow-xl flex flex-col h-[500px] overflow-hidden rounded-[2rem] relative">
            <div className="bg-indigo-600 p-4 flex items-center gap-3 shadow-lg z-10">
                <div className="bg-white/20 p-2 rounded-xl text-white backdrop-blur-md">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-black text-white text-lg leading-tight">עוזר אישי (Data Chat)</h3>
                    <p className="text-indigo-200 text-xs font-medium">מחובר לבסיס הנתונים</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center shrink-0
                            ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}
                        `}>
                            {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`
                            p-3 rounded-2xl max-w-[80%] text-sm font-medium shadow-sm leading-relaxed
                            ${m.role === 'user'
                                ? 'bg-white text-slate-800 rounded-tr-none border border-slate-100'
                                : 'bg-indigo-600 text-white rounded-tl-none shadow-indigo-200'}
                        `}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Bot size={14} />
                        </div>
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tl-none shadow-indigo-200 flex items-center gap-1.5 h-10">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
                >
                    <input
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                        placeholder="שאל אותי משהו..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !input.trim()}
                        className="rounded-full h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shrink-0"
                    >
                        <Send size={16} />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
