"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Phone, Mail, FileText, Clock, AlertTriangle, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Button, Badge } from "@/components/ui/base";
import { ReminderPicker } from "@/components/ui/ReminderPicker";
import { useAuth } from "@/lib/contexts/AuthContext";
import { firestoreService } from "@/lib/firebase/firestore-service";
import { ClientQuickActions } from "@/components/clients/ClientQuickActions";

export interface FocusItem {
    id: string;
    type: 'call' | 'email' | 'review' | 'urgent';
    priorityScore: number; // 0-100
    title: string;
    description: string;
    clientName: string;
    clientId: string;
    clientPhone: string;
    clientEmail: string;
    timeAgo: string;
    context?: string;
}

export default function FocusFeed() {
    const { user } = useAuth();
    const [items, setItems] = useState<FocusItem[]>([
        {
            id: '1',
            type: 'urgent',
            priorityScore: 98,
            title: 'סיכון נטישה גבוה',
            description: 'פוליסת ביטוח רכב מסתיימת בעוד 3 ימים ללא חידוש.',
            clientName: 'ישראל ישראלי',
            clientId: 'client-1',
            clientPhone: '0501234567',
            clientEmail: 'israel@example.com',
            timeAgo: 'לפני 10 דקות',
            context: 'הלקוח צפה בטופס ביטול פעמיים היום.'
        },
        {
            id: '2',
            type: 'call',
            priorityScore: 85,
            title: 'שיחה חוזרת - ליד חם',
            description: 'השאיר פרטים בקמפיין פייסבוק "ביטוח בריאות".',
            clientName: 'דנה כהן',
            clientId: 'client-2',
            clientPhone: '0529876543',
            clientEmail: 'dana@example.com',
            timeAgo: 'לפני שעה',
        },
        {
            id: '3',
            type: 'review',
            priorityScore: 72,
            title: 'אישור מסמכים',
            description: 'התקבלו מסמכי בקרת זיהוי (KYC). נדרש אישור סופי.',
            clientName: 'רון לוי',
            clientId: 'client-3',
            clientPhone: '0545554433',
            clientEmail: 'ron@example.com',
            timeAgo: 'לפני שעתיים',
        }
    ]);

    // Reminder picker state
    const [reminderPickerOpen, setReminderPickerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FocusItem | null>(null);

    const handleComplete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success("המשימה הושלמה בהצלחה! כל הכבוד 🎉");
    };

    const handleOpenReminder = (item: FocusItem) => {
        setSelectedItem(item);
        setReminderPickerOpen(true);
    };

    const handleSetReminder = async (reminderTime: Date) => {
        if (selectedItem! || user!) return;

        try {
            await firestoreService.addReminder({
                userId: user.uid,
                title: selectedItem.title,
                description: `${selectedItem.description} - ${selectedItem.clientName}`,
                itemId: selectedItem.id,
                itemType: 'focus',
                reminderTime,
            });

            // Format the time for display
            const timeStr = reminderTime.toLocaleString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
            });

            // Remove from current list
            setItems(prev => prev.filter(item => item.id !== selectedItem.id));
            
            toast.success(
                <div className="space-y-1">
                    <p className="font-bold">התזכורת נקבעה! ⏰</p>
                    <p className="text-sm opacity-80">{timeStr}</p>
                </div>
            );
        } catch (error) {
            console.error("Error setting reminder:", error);
            toast.error("שגיאה בהגדרת התזכורת");
        }
    };

    const getIcon = (type: FocusItem['type']) => {
        switch (type) {
            case 'call': return <Phone size={18} />;
            case 'email': return <Mail size={18} />;
            case 'review': return <FileText size={18} />;
            case 'urgent': return <AlertTriangle size={18} />;
        }
    };

    const getColor = (type: FocusItem['type']) => {
        switch (type) {
            case 'call': return 'bg-blue-100 text-blue-600';
            case 'email': return 'bg-purple-100 text-purple-600';
            case 'review': return 'bg-slate-100 text-slate-600';
            case 'urgent': return 'bg-red-100 text-red-600';
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="bg-linear-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-md text-sm">FOCUS MODE</span>
                הדברים החשובים להיום
            </h3>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} layout>
                            <Card className="p-12 text-center bg-white/5 border-dashed border-2 border-white/10 text-slate-400">
                                <div className="flex justify-center mb-4 text-6xl">🎉</div>
                                <h4 className="text-xl font-black text-white">אין משימות פתוחות!</h4>
                                <p>סיימת את כל הדברים הדחופים לעכשיו.</p>
                            </Card>
                        </motion.div>
                    ) : (
                        items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <Card className="border-none shadow-xl bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-all group relative overflow-hidden">
                                    {/* Progress Bar based on score */}
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-emerald-400 to-blue-500"
                                        style={{ opacity: item.priorityScore / 100 }}
                                     />

                                    <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${getColor(item.type)}`}>
                                                {getIcon(item.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-white">{item.title}</h4>
                                                    <Badge variant="outline" className="bg-slate-700/50 text-slate-300 border-none text-[10px]">
                                                        {item.priorityScore} נק' חשיבות
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-400 text-sm mb-2">{item.description}</p>
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {item.timeAgo}</span>
                                                    <span>•</span>
                                                    <span className="text-indigo-400">{item.clientName}</span>
                                                </div>
                                                {item.context ? <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-xs text-red-300 flex items-center gap-2">
                                                        <AlertTriangle size={12} />
                                                        {item.context}
                                                    </div> : null}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <ClientQuickActions 
                                                    clientId={item.clientId}
                                                    clientName={item.clientName}
                                                    phone={item.clientPhone}
                                                    email={item.clientEmail}
                                                    variant="grid"
                                                />
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                            <Button
                                                variant="outline"
                                                className="flex-1 md:w-auto text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-amber-500/50 font-bold"
                                                onClick={() => handleOpenReminder(item)}
                                            >
                                                <Bell size={18} className="ml-2" />
                                                הזכר
                                            </Button>
                                            <Button
                                                className="flex-1 md:w-auto bg-indigo-600 hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20"
                                                onClick={() => handleComplete(item.id)}
                                            >
                                                <CheckCircle2 size={18} className="ml-2" />
                                                טפל וסיים
                                            </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Reminder Picker Modal */}
            <ReminderPicker
                isOpen={reminderPickerOpen}
                onClose={() => {
                    setReminderPickerOpen(false);
                    setSelectedItem(null);
                }}
                onSelect={handleSetReminder}
                itemTitle={selectedItem?.title || ""}
            />
        </div>
    );
}
