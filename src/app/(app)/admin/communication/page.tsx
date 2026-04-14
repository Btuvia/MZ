"use client";

import { MessageSquare, Phone, Mail, Search, Paperclip, Send, MoreVertical, CheckCheck, Bot, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { sendEmail } from "@/app/actions/email";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useClients, useMessages, useSendMessage, useLastMessagesPerClient } from "@/lib/hooks/useQueryHooks";

export default function CommunicationCenter() {
    const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
    const [messageInput, setMessageInput] = useState("");
    const [sending, setSending] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [channelFilter, setChannelFilter] = useState<'all' | 'unread' | 'whatsapp' | 'email' | 'sms'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Firebase data
    const { data: clients = [], isLoading: loadingClients } = useClients();
    const { data: messages = [], isLoading: loadingMessages } = useMessages(selectedClientId || undefined);
    const { data: lastMessagesMap } = useLastMessagesPerClient();
    const sendMessage = useSendMessage();

    // Get selected client
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId);
    }, [clients, selectedClientId]);

    // Build conversations list from clients + last messages
    const conversations = useMemo(() => {
        return clients.map(client => {
            const lastMsg = lastMessagesMap?.get(client.id!);
            return {
                id: client.id!,
                name: client.name,
                phone: client.phone,
                email: client.email,
                lastMessage: lastMsg?.text || "אין הודעות עדיין",
                time: lastMsg?.time ? formatTime(lastMsg.time) : "",
                unread: lastMsg?.unreadCount || 0,
                avatar: getAvatar(client.name),
                channel: lastMsg?.channel || "whatsapp"
            };
        }).filter(conv => {
            // Search filter
            if (searchQuery && !conv.name.includes(searchQuery)) return false;
            // Channel filter
            if (channelFilter === 'unread' && conv.unread === 0) return false;
            if (channelFilter === 'whatsapp' && conv.channel !== 'whatsapp') return false;
            if (channelFilter === 'email' && conv.channel !== 'email') return false;
            if (channelFilter === 'sms' && conv.channel !== 'sms') return false;
            return true;
        });
    }, [clients, lastMessagesMap, searchQuery, channelFilter]);

    // Auto-select first client if none selected
    useEffect(() => {
        if (!selectedClientId && conversations.length > 0) {
            setSelectedClientId(conversations[0].id);
        }
    }, [conversations, selectedClientId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function formatTime(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
            return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        } else if (daysDiff === 1) {
            return "אתמול";
        } else if (daysDiff < 7) {
            return `לפני ${daysDiff} ימים`;
        } else {
            return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
        }
    }

    function getAvatar(name: string): string {
        const avatars = ["👨‍💼", "👩‍💼", "🤵", "👩‍🏫", "👷", "👨‍⚕️", "👩‍⚕️", "👨‍🎓", "👩‍🎓"];
        const index = name.charCodeAt(0) % avatars.length;
        return avatars[index];
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedClientId) return;

        setSending(true);

        try {
            // Handle email specifically
            if (activeChannel === 'email' && selectedClient?.email) {
                const res = await sendEmail(selectedClient.email, "הודעה מ-InsurCRM", messageInput);
                if (!res.success) {
                    alert("שגיאה בשליחת מייל: " + res.error);
                    setSending(false);
                    return;
                }
            }

            // Save message to Firebase
            sendMessage.mutate({
                clientId: selectedClientId,
                text: messageInput,
                sender: 'me',
                channel: activeChannel
            });

            setMessageInput("");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("שגיאה בשליחת ההודעה");
        } finally {
            setSending(false);
        }
    };

    const handleAiSuggest = () => {
        const clientName = selectedClient ? selectedClient.name.split(' ')[0] : "לקוח";
        setMessageInput(`בשמחה ${clientName}, אני מכין את המסמכים לחתימה ושולח אליך בדקות הקרובות. תודה שבחרת בנו! 🙏`);
    };

    const isLoading = loadingClients;

    if (isLoading) {
        return (
            <DashboardShell role="מנהל">
                <div className="flex items-center justify-center h-[calc(100vh-140px)]">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            </DashboardShell>
        );
    }

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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-accent/20 text-sm font-bold"
                            />
                            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                        </div>
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                            <button 
                                onClick={() => setChannelFilter('all')}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${channelFilter === 'all' ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                הכל ({clients.length})
                            </button>
                            <button 
                                onClick={() => setChannelFilter('unread')}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${channelFilter === 'unread' ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                לא נקראו
                            </button>
                            <button 
                                onClick={() => setChannelFilter('whatsapp')}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${channelFilter === 'whatsapp' ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                וואטסאפ 💬
                            </button>
                            <button 
                                onClick={() => setChannelFilter('email')}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${channelFilter === 'email' ? 'bg-accent text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                מייל 📧
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {conversations.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                <MessageSquare className="mx-auto mb-2 opacity-50" size={32} />
                                <p className="text-sm font-medium">אין שיחות להצגה</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div 
                                    key={conv.id} 
                                    onClick={() => setSelectedClientId(conv.id)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all hover:bg-slate-50 flex gap-4 ${
                                        conv.id === selectedClientId ? 'bg-primary/5 border border-primary/10 shadow-sm' : ''
                                    }`}
                                >
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
                            ))
                        )}
                    </div>
                </Card>

                {/* Main Chat Area */}
                <Card className="flex-1 flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white/60 backdrop-blur-2xl relative">
                    {selectedClient ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg ring-4 ring-white">
                                        {getAvatar(selectedClient.name)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-primary">{selectedClient.name}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <span>{selectedClient.phone}</span>
                                            {selectedClient.email ? <>
                                                    <span>•</span>
                                                    <span>{selectedClient.email}</span>
                                                </> : null}
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
                                {loadingMessages ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <MessageSquare size={48} className="mb-4 opacity-30" />
                                        <p className="text-sm font-medium">אין הודעות עם לקוח זה</p>
                                        <p className="text-xs">התחל שיחה על ידי שליחת הודעה</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Date Divider */}
                                        <div className="flex justify-center">
                                            <span className="bg-slate-200/50 backdrop-blur text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                היסטוריית שיחה
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
                                                        <span>{formatTime(msg.createdAt)}</span>
                                                        {msg.sender === 'me' && (
                                                            <span>
                                                                {msg.status === 'read' ? <CheckCheck size={12} /> : <CheckCheck size={12} className="opacity-50" />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
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
                                    </div>
                                )}

                                <div className="flex items-end gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
                                    <button className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-slate-200">
                                        <Paperclip size={20} />
                                    </button>
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="כתוב הודעה..."
                                        className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[44px] py-3 text-sm font-medium"
                                        rows={1}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        size="sm"
                                        className={`rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all ${messageInput.trim() ? 'bg-accent shadow-lg shadow-accent/30 scale-100' : 'bg-slate-300 scale-90 opacity-70'
                                            }`}
                                        disabled={!messageInput.trim() || sending}
                                    >
                                        {sending ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} className={messageInput.trim() ? 'ml-0.5' : ''} />
                                        )}
                                    </Button>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by MagenAI™</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare size={64} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-slate-500">בחר שיחה להתחיל</h3>
                            <p className="text-sm">בחר לקוח מהרשימה משמאל כדי לצפות בשיחה</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardShell>
    );
}
