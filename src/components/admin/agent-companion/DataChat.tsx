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
        { role: 'assistant', content: 'שלום! שאל אותי על לקוחות, פוליסות או בקש ניתוח נתונים.' }
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
        <Card className="bg-slate-900/90 backdrop-blur-xl border-indigo-500/30 shadow-xl flex flex-col h-[420px] overflow-hidden rounded-2xl relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 flex items-center gap-3 shadow-lg z-10 shrink-0">
                <div className="bg-white/20 p-2 rounded-xl text-white backdrop-blur-md shrink-0">
                    <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight truncate">עוזר AI</h3>
                    <p className="text-indigo-200 text-[10px] font-medium truncate">מחובר לנתונים</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/50 custom-scrollbar" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`
                            w-7 h-7 rounded-full flex items-center justify-center shrink-0
                            ${m.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}
                        `}>
                            {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <div className={`
                            p-2.5 rounded-xl max-w-[85%] text-xs font-medium shadow-sm leading-relaxed break-words
                            ${m.role === 'user'
                                ? 'bg-slate-800 text-slate-200 rounded-tr-sm border border-slate-700'
                                : 'bg-indigo-600 text-white rounded-tl-sm'}
                        `}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Bot size={12} />
                        </div>
                        <div className="bg-indigo-600 text-white p-2.5 rounded-xl rounded-tl-sm flex items-center gap-1 h-8">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:75ms]"></span>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms]"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-800/50 border-t border-slate-700/50 shrink-0">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700 focus-within:border-indigo-500 transition-all"
                >
                    <input
                        className="flex-1 min-w-0 bg-transparent border-none outline-none px-3 text-xs font-medium text-slate-200 placeholder:text-slate-500"
                        placeholder="שאל אותי..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !input.trim()}
                        className="rounded-lg h-8 w-8 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shrink-0 p-0 flex items-center justify-center"
                    >
                        <Send size={14} />
                    </Button>
                </form>
            </div>
        </Card>
    );
}
