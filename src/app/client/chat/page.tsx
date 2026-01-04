"use client";

import { useState, useRef, useEffect } from "react";
import DashboardShell from "@/components/ui/dashboard-shell";
import { Card, Button, Badge } from "@/components/ui/base";
import { CLIENT_NAV_ITEMS } from "@/lib/navigation-config";
import { 
    MessageSquare, Send, Paperclip, Image, Smile, 
    Phone, Video, MoreVertical, Check, CheckCheck,
    Clock, ArrowRight, Bot, User, Sparkles, FileText,
    Camera, Mic, X, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
    id: string;
    content: string;
    sender: 'client' | 'agent' | 'system';
    timestamp: Date;
    status: 'sending' | 'sent' | 'delivered' | 'read';
    type: 'text' | 'image' | 'file' | 'voice';
    attachmentUrl?: string;
    attachmentName?: string;
}

interface QuickReply {
    id: string;
    text: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            content: 'שלום! אני דני, הסוכן שלך במגן זהב. איך אוכל לעזור לך היום? 😊',
            sender: 'agent',
            timestamp: new Date(Date.now() - 3600000),
            status: 'read',
            type: 'text'
        },
        {
            id: '2',
            content: 'היי דני! רציתי לשאול לגבי הפוליסה שלי',
            sender: 'client',
            timestamp: new Date(Date.now() - 3500000),
            status: 'read',
            type: 'text'
        },
        {
            id: '3',
            content: 'בטח! איזו פוליסה - ביטוח הבריאות או ביטוח הרכב?',
            sender: 'agent',
            timestamp: new Date(Date.now() - 3400000),
            status: 'read',
            type: 'text'
        }
    ]);
    
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const quickReplies: QuickReply[] = [
        { id: '1', text: 'מה הכיסוי שלי?' },
        { id: '2', text: 'מתי מתחדשת הפוליסה?' },
        { id: '3', text: 'איך מגישים תביעה?' },
        { id: '4', text: 'רוצה לתאם פגישה' },
    ];

    const agentInfo = {
        name: 'דני כהן',
        role: 'סוכן ביטוח בכיר',
        avatar: '👨‍💼',
        status: 'online',
        responseTime: 'בדרך כלל עונה תוך דקות'
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: 'client',
            timestamp: new Date(),
            status: 'sending',
            type: 'text'
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        setShowQuickReplies(false);

        // Simulate sending
        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m
            ));
        }, 500);

        // Simulate agent typing
        setIsTyping(true);
        
        // Simulate agent response
        setTimeout(() => {
            setIsTyping(false);
            const responses = [
                'קיבלתי! אני בודק את זה עכשיו ואחזור אליך מיד.',
                'תודה על הפנייה! הנה המידע שביקשת...',
                'אני כאן כדי לעזור! בוא נבדוק את זה יחד.',
                'מצוין! אני מטפל בזה. יש לך שאלות נוספות?'
            ];
            
            const agentResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: responses[Math.floor(Math.random() * responses.length)],
                sender: 'agent',
                timestamp: new Date(),
                status: 'read',
                type: 'text'
            };
            
            setMessages(prev => [...prev, agentResponse]);
            setMessages(prev => prev.map(m => 
                m.id === newMessage.id ? { ...m, status: 'read' as const } : m
            ));
        }, 2000 + Math.random() * 2000);
    };

    const handleQuickReply = (reply: QuickReply) => {
        setInputMessage(reply.text);
        setShowQuickReplies(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newMessage: Message = {
                id: Date.now().toString(),
                content: `📎 ${file.name}`,
                sender: 'client',
                timestamp: new Date(),
                status: 'sent',
                type: 'file',
                attachmentName: file.name
            };
            setMessages(prev => [...prev, newMessage]);
            setShowAttachMenu(false);
            toast.success('הקובץ נשלח בהצלחה');
        }
    };

    const handleCall = () => {
        toast.info('מתקשר לסוכן...');
    };

    const handleVideoCall = () => {
        toast.info('מתחיל שיחת וידאו...');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusIcon = (status: Message['status']) => {
        switch (status) {
            case 'sending': return <Clock size={12} className="text-slate-500" />;
            case 'sent': return <Check size={12} className="text-slate-500" />;
            case 'delivered': return <CheckCheck size={12} className="text-slate-500" />;
            case 'read': return <CheckCheck size={12} className="text-blue-400" />;
        }
    };

    return (
        <DashboardShell role="לקוח" navItems={CLIENT_NAV_ITEMS}>
            <div className="h-[calc(100vh-120px)] flex flex-col" dir="rtl">
                {/* Chat Header */}
                <Card className="p-4 rounded-b-none border-b-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl">
                                    {agentInfo.avatar}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-800 ${
                                    agentInfo.status === 'online' ? 'bg-emerald-500' : 'bg-slate-500'
                                }`} />
                            </div>
                            <div>
                                <h2 className="font-bold text-amber-100">{agentInfo.name}</h2>
                                <p className="text-sm text-slate-400">{agentInfo.role}</p>
                                <p className="text-xs text-emerald-400">{agentInfo.status === 'online' ? 'מחובר עכשיו' : agentInfo.responseTime}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleCall}
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                                <Phone size={18} />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleVideoCall}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                                <Video size={18} />
                            </Button>
                            <Button variant="outline" size="sm">
                                <MoreVertical size={18} />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto glass-card rounded-none p-4 space-y-4">
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[75%] ${message.sender === 'client' ? 'order-1' : 'order-2'}`}>
                                <div className={`rounded-2xl px-4 py-2.5 ${
                                    message.sender === 'client'
                                        ? 'bg-amber-500 text-slate-900 rounded-br-md'
                                        : 'bg-slate-700/80 text-slate-100 rounded-bl-md'
                                }`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 text-xs text-slate-500 ${
                                    message.sender === 'client' ? '' : 'justify-end'
                                }`}>
                                    <span>{formatTime(message.timestamp)}</span>
                                    {message.sender === 'client' && getStatusIcon(message.status)}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex justify-end"
                            >
                                <div className="bg-slate-700/80 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <AnimatePresence>
                    {showQuickReplies && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="glass-card rounded-none px-4 py-3 border-t border-slate-700/50"
                        >
                            <p className="text-xs text-slate-500 mb-2">תשובות מהירות:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickReplies.map((reply) => (
                                    <button
                                        key={reply.id}
                                        onClick={() => handleQuickReply(reply)}
                                        className="px-3 py-1.5 text-sm bg-slate-700/50 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-full border border-slate-600/50 hover:border-amber-500/30 transition-all"
                                    >
                                        {reply.text}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <Card className="p-4 rounded-t-none border-t-0">
                    <div className="flex items-end gap-3">
                        {/* Attachment Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAttachMenu(!showAttachMenu)}
                                className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-amber-400 transition-all"
                            >
                                <Paperclip size={20} />
                            </button>
                            
                            <AnimatePresence>
                                {showAttachMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full right-0 mb-2 glass-card border border-amber-500/20 rounded-xl py-2 w-48"
                                    >
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-4 py-2 text-right text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-3"
                                        >
                                            <FileText size={18} />
                                            מסמך
                                        </button>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-4 py-2 text-right text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-3"
                                        >
                                            <Image size={18} />
                                            תמונה
                                        </button>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-4 py-2 text-right text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 flex items-center gap-3"
                                        >
                                            <Camera size={18} />
                                            צלם עכשיו
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept="image/*,.pdf,.doc,.docx"
                            />
                        </div>

                        {/* Message Input */}
                        <div className="flex-1 relative">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="כתוב הודעה..."
                                rows={1}
                                className="w-full px-4 py-3 glass-card border border-amber-500/20 rounded-2xl text-slate-200 placeholder-slate-500 focus:border-amber-500/40 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim()}
                            className={`p-3 rounded-xl transition-all ${
                                inputMessage.trim()
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
