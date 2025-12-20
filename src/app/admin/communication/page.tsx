"use client";

import { useState } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { MessageSquare, Phone, Mail, Search, Paperclip, Send, MoreVertical, CheckCheck, Clock, Bot } from "lucide-react";
import { sendEmail } from "@/app/actions/email";

export default function CommunicationCenter() {
    const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
    const [messageInput, setMessageInput] = useState("");
    const [sending, setSending] = useState(false);
    const conversations = [
        { id: 1, name: "ישראל ישראלי", lastMessage: "תודה רבה על העזרה!", time: "10:30", unread: 2, avatar: "👨‍💼", channel: "whatsapp" },
        { id: 2, name: "שרה כהן", lastMessage: "מתי מסתיים הביטוח שלי?", time: "09:15", unread: 0, avatar: "👩‍💼", channel: "whatsapp" },
        { id: 3, name: "דני לוי", lastMessage: "שלחתי לך את המסמכים במייל", time: "אתמול", unread: 0, avatar: "🤵", channel: "email" },
        { id: 4, name: "מיכל אהרוני", lastMessage: "אשמח להצעת מחיר לרכב", time: "אתמול", unread: 1, avatar: "👩‍🏫", channel: "sms" },
        { id: 5, name: "יוסי בניון", lastMessage: "תאשר לי שקיבלת", time: "20/12", unread: 0, avatar: "👷", channel: "whatsapp" },
    ];

    // Mock Messages for the active view
    const [messages, setMessages] = useState([
        { id: 1, text: "היי ישראל, ראיתי שהביטוח שלך מסתיים בעוד חודש. רוצה שנבדוק אפשרויות לחידוש?", sender: "me", time: "10:00", status: "read" },
        { id: 2, text: "היי, כן אשמח. המחיר נשאר אותו דבר?", sender: "them", time: "10:15", status: "read" },
        { id: 3, text: "בדקתי לך ויש אפילו הוזלה קטנה של 50 ש״ח לחודש אם נעבור להראל.", sender: "me", time: "10:20", status: "read" },
        { id: 4, text: "מעולה! בוא נתקדם עם זה.", sender: "them", time: "10:25", status: "read" },
        { id: 5, text: "תודה רבה על העזרה!", sender: "them", time: "10:30", status: "read" },
    ]);

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        setSending(true);

        // --- EMAIL LOGIC ---
        if (activeChannel === 'email') {
            const res = await sendEmail("test@example.com", "הודעה מ-InsurCRM", messageInput);
            if (!res.success) {
                alert("שגיאה בשליחת מייל: " + res.error);
                setSending(false);
                return;
            }
            if (res.isMock) {
                alert("המייל נשלח בהצלחה! (מצב דמו - בדוק את הלוגים)");
            } else {
                alert("המייל נשלח בהצלחה!");
            }
        } else if (activeChannel === 'sms' || activeChannel === 'whatsapp') {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert(`הודעת ${activeChannel === 'sms' ? 'SMS' : 'WhatsApp'} נשלחה בהצלחה! (סימולציה)`);
        }

        const newMessage = {
            id: messages.length + 1,
            text: messageInput,
            sender: "me",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sent"
        };

        setMessages([...messages, newMessage]);
        setMessageInput("");
        setSending(false);
    };

    const handleAiSuggest = () => {
        setMessageInput("בשמחה ישראל, אני מכין את המסמכים לחתימה ושולח אליך בדקות הקרובות. תודה שבחרת בנו! 🙏");
    };

    return (
        <DashboardShell role="מנהל">
            <div className="h-[calc(100vh-140px)] flex gap-6" dir="rtl">

                {/* Sidebar - Conversations List */}
                <Card className="w-1/3 flex flex-col p-0 overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-2">
                            <span className="bg-accent/10 p-2 rounded-xl text-accent"><MessageSquare size={24} /></span>
                            מרכז תקשורת
                        </h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="חיפוש שיחה..."
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-accent/20 text-sm font-bold"
                            />
                            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                        </div>
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                            <Badge variant="primary" className="cursor-pointer whitespace-nowrap">הכל</Badge>
                            <Badge variant="outline" className="cursor-pointer whitespace-nowrap bg-white">לא נקראו</Badge>
                            <Badge variant="outline" className="cursor-pointer whitespace-nowrap bg-white">וואטסאפ 💬</Badge>
                            <Badge variant="outline" className="cursor-pointer whitespace-nowrap bg-white">מייל 📧</Badge>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {conversations.map((conv) => (
                            <div key={conv.id} className={`p-4 rounded-2xl cursor-pointer transition-all hover:bg-slate-50 flex gap-4 ${conv.id === 1 ? 'bg-primary/5 border border-primary/10 shadow-sm' : ''}`}>
                                <div className="relative">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shadow-inner">
                                        {conv.avatar}
                                    </div>
                                    {conv.channel === 'whatsapp' && <span className="absolute -bottom-1 -right-1 bg-[#25D366] text-white p-0.5 rounded-full text-[10px]"><MessageSquare size={10} fill="currentColor" /></span>}
                                    {conv.channel === 'email' && <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full text-[10px]"><Mail size={10} fill="currentColor" /></span>}
                                    {conv.channel === 'sms' && <span className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-0.5 rounded-full text-[10px]"><Phone size={10} fill="currentColor" /></span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-black text-primary truncate">{conv.name}</h4>
                                        <span className="text-[10px] font-bold text-slate-400">{conv.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate font-medium">{conv.lastMessage}</p>
                                </div>
                                {conv.unread > 0 && (
                                    <div className="flex flex-col justify-center">
                                        <span className="h-5 w-5 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-accent/30">
                                            {conv.unread}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Main Chat Area */}
                <Card className="flex-1 flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white/60 backdrop-blur-2xl relative">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg ring-4 ring-white">
                                👨‍💼
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-primary">ישראל ישראלי</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    מחובר כעת
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveChannel('whatsapp')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeChannel === 'whatsapp' ? 'bg-white shadow-sm text-[#25D366]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <MessageSquare size={14} /> וואטסאפ
                            </button>
                            <button
                                onClick={() => setActiveChannel('sms')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeChannel === 'sms' ? 'bg-white shadow-sm text-purple-500' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Phone size={14} /> SMS
                            </button>
                            <button
                                onClick={() => setActiveChannel('email')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeChannel === 'email' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Mail size={14} /> מייל
                            </button>
                        </div>

                        <Button variant="ghost" size="sm" className="rounded-full h-10 w-10 p-0 flex items-center justify-center">
                            <MoreVertical size={18} />
                        </Button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/chat-pattern.png')] bg-repeat opacity-95">
                        {/* Date Divider */}
                        <div className="flex justify-center">
                            <span className="bg-slate-200/50 backdrop-blur text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                היום, 20 בדצמבר
                            </span>
                        </div>

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm relative group ${msg.sender === 'me'
                                    ? 'bg-accent text-white rounded-tl-none'
                                    : 'bg-white text-primary rounded-tr-none'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                    <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] font-bold ${msg.sender === 'me' ? 'text-white/70' : 'text-slate-400'}`}>
                                        <span>{msg.time}</span>
                                        {msg.sender === 'me' && (
                                            <span>
                                                {msg.status === 'read' ? <CheckCheck size={12} /> : <CheckCheck size={12} className="opacity-50" />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        {/* AI Suggestion Chip */}
                        {messageInput === "" && (
                            <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={handleAiSuggest}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 px-4 py-2 rounded-full text-xs font-black hover:scale-105 transition-transform border border-violet-200 shadow-sm"
                                >
                                    <Bot size={14} />
                                    הצעה לניסוח: אישור סגירת עסקה
                                </button>
                                <button className="flex items-center gap-2 bg-slate-50 text-slate-500 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-100 border border-slate-200">
                                    <Clock size={14} />
                                    תזמן הודעה
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-slate-200">
                                <Paperclip size={20} />
                            </button>
                            <textarea
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="כתוב הודעה..."
                                className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[44px] py-3 text-sm font-medium"
                                rows={1}
                            />
                            <Button
                                onClick={handleSendMessage}
                                size="sm"
                                className={`rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all ${messageInput.trim() ? 'bg-accent shadow-lg shadow-accent/30 scale-100' : 'bg-slate-300 scale-90 opacity-70'
                                    }`}
                                disabled={!messageInput.trim()}
                            >
                                <Send size={18} className={messageInput.trim() ? 'ml-0.5' : ''} />
                            </Button>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by MagenAI™</span>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
