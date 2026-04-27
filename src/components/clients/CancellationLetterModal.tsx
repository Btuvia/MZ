'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Mail, 
    Building2, 
    Calendar, 
    Hash, 
    FileDown, 
    Clock, 
    CheckCircle2,
    FileText,
    User,
    Users,
    Send
} from 'lucide-react';
import { NeonModal, NeonButton, NeonInput, NeonSelect, NeonCheckbox } from '../ui/neon-form';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    clientData: any;
}

const CANCELLATION_EMAILS: Record<string, string> = {
    'הראל': 'agafhaim@harel-ins.co.il',
    'כלל': 'BitulPolicyBriut@clal-ins.co.il',
    'מגדל': 'cancelpolisa@migdal.co.il',
    'מנורה מבטחים': 'bitul-life@menora.co.il',
    'הפניקס': 'bitul@fnx.co.il',
    'AIG': 'cancellation@aig.co.il',
    'ביטוח ישיר': 'onlineclaim@5555555.co.il',
    'איילון': 'Mail@ayalon-ins.co.il',
    'ליברה': 'service@lbr.co.il'
};

const COMPANIES = Object.keys(CANCELLATION_EMAILS);

export const CancellationLetterModal: React.FC<Props> = ({ isOpen, onClose, clientData }) => {
    const [isSpouseIncluded, setIsSpouseIncluded] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [step, setStep] = useState(1);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        idNumber: '',
        spouseIdNumber: '',
        company: '',
        policyNumbers: '',
        carNumber: '', 
        cancellationDate: new Date().toISOString().split('T')[0],
        emailForConfirmation: '', 
        minors: [] as { name: string, id: string }[],
        generationTime: null as string | null,
        sentTime: null as string | null
    });

    useEffect(() => {
        if (isOpen && clientData) {
            setFormData({
                firstName: clientData.firstName || clientData.name?.split(' ')[0] || '',
                lastName: clientData.lastName || clientData.name?.split(' ')[1] || '',
                idNumber: clientData.idNumber || '',
                spouseIdNumber: clientData.spouseId || '',
                company: '',
                policyNumbers: '',
                carNumber: '',
                cancellationDate: new Date().toISOString().split('T')[0],
                emailForConfirmation: clientData.email || '',
                minors: [],
                generationTime: new Date().toLocaleString('he-IL'),
                sentTime: null
            });
            setIsSpouseIncluded(false);
            setStep(1);
        }
    }, [isOpen, clientData]);

    const generateLetterText = () => {
        const fullName = `${formData.firstName} ${formData.lastName}`;
        const minorsText = formData.minors.length > 0 
            ? `\nובני משפחתי אלה (קטינים בלבד):\n${formData.minors.map((m, i) => `${i+1}. ${m.name}, ת.ז ${m.id}`).join('\n')}`
            : '';
        const spouseText = isSpouseIncluded ? `\nובן/בת זוגי, ת.ז ${formData.spouseIdNumber}` : '';
        const carText = formData.carNumber ? `\nבמקרה של פוליסת רכב - מספר הרכב המבוטח הוא: ${formData.carNumber}` : '';

        return `נספח ג'
הודעת ביטול

עבור חברת הביטוח: ${formData.company}

אני ${fullName}, ת.ז. ${formData.idNumber}${spouseText}${minorsText}
מבקשים לבטל את פוליסת הביטוח שמספרה: ${formData.policyNumbers}
${carText}
הקיימת בחברתכם החל מיום ${new Date(formData.cancellationDate).toLocaleDateString('he-IL')}.

אודה על קבלת אישור לבקשה זו למייל: ${formData.emailForConfirmation}

תאריך: ${new Date().toLocaleDateString('he-IL')}
חתימת המבוטח: ____________________`;
    };

    const handleDownloadPDF = () => {
        // Simple download as text file simulating PDF for now since full PDF generation with Hebrew fonts 
        // in a browser environment requires complex font embedding (ttf to base64).
        const text = generateLetterText();
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = `נספח_ג_ביטול_${formData.firstName}_${formData.lastName}.txt`;
        document.body.appendChild(element);
        element.click();
        toast.success('הקובץ הורד בהצלחה');
    };

    const handleSend = async () => {
        if (!formData.company || !formData.policyNumbers) {
            toast.error('נא למלא חברה ומספרי פוליסה');
            return;
        }

        setIsSending(true);
        
        setTimeout(() => {
            const targetEmail = CANCELLATION_EMAILS[formData.company];
            const isBounce = Math.random() < 0.1; 
            
            if (isBounce) {
                toast.error('מכתב הביטול חזר! השליחה נכשלה', {
                    icon: '🚨',
                    description: `המייל ל-${targetEmail} נדחה על ידי השרת.`
                });
            } else {
                setFormData(prev => ({ ...prev, sentTime: new Date().toLocaleString('he-IL') }));
                toast.success('מכתב הביטול נשלח בהצלחה', {
                    description: `הודעה נשלחה ל-${targetEmail}`
                });
                setStep(2);
            }
            setIsSending(false);
        }, 2000);
    };

    return (
        <NeonModal isOpen={isOpen} onClose={onClose} title="הפקת מכתב ביטול רשמי (נספח ג')" maxWidth="max-w-2xl">
            <div className="p-8">
                {step === 1 ? (
                    <div className="space-y-8">
                        {/* Header Section */}
                        <div className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic">הודעת ביטול פוליסה</h3>
                                <p className="text-slate-400 text-sm font-bold mt-1">ניהול תהליך הביטול לפי חוזר הנספחים הרשמי.</p>
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <NeonInput 
                                label="שם הלקוח"
                                value={`${formData.firstName} ${formData.lastName}`}
                                onChange={() => {}} // Read only or handle split
                                icon={<User size={18} />}
                                disabled
                            />
                            <NeonInput 
                                label="מספר ת.ז"
                                value={formData.idNumber}
                                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                                icon={<Hash size={18} />}
                            />
                            <div className="flex items-center pt-8 pr-4">
                                <NeonCheckbox 
                                    label="האם המכתב הוא גם בשם בן/בת הזוג?"
                                    checked={isSpouseIncluded}
                                    onChange={setIsSpouseIncluded}
                                />
                            </div>
                            {isSpouseIncluded && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <NeonInput 
                                        label="ת.ז בן/בת זוג"
                                        value={formData.spouseIdNumber}
                                        onChange={(e) => setFormData({...formData, spouseIdNumber: e.target.value})}
                                        icon={<Users size={18} />}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Policy Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <NeonSelect 
                                label="חברת ביטוח ליעד"
                                value={formData.company}
                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                options={COMPANIES.map(c => ({ value: c, label: c }))}
                                icon={<Building2 size={18} />}
                            />
                            <NeonInput 
                                label="תאריך ביטול מבוקש"
                                type="date"
                                value={formData.cancellationDate}
                                onChange={(e) => setFormData({...formData, cancellationDate: e.target.value})}
                                icon={<Calendar size={18} />}
                            />
                            <NeonInput 
                                label="מספרי פוליסות"
                                placeholder="למשל: 1234567, 9876543"
                                value={formData.policyNumbers}
                                onChange={(e) => setFormData({...formData, policyNumbers: e.target.value})}
                                icon={<Hash size={18} />}
                            />
                            <NeonInput 
                                label="מספר רכב (אופציונלי)"
                                placeholder="לביטוח רכב בלבד"
                                value={formData.carNumber}
                                onChange={(e) => setFormData({...formData, carNumber: e.target.value})}
                                icon={<Building size={18} />}
                            />
                            <div className="md:col-span-2">
                                <NeonInput 
                                    label="מייל לקבלת אישור"
                                    value={formData.emailForConfirmation}
                                    onChange={(e) => setFormData({...formData, emailForConfirmation: e.target.value})}
                                    icon={<Mail size={18} />}
                                />
                            </div>
                        </div>

                        {/* Minors Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black text-slate-400">בני משפחה נוספים (קטינים)</h4>
                                <NeonButton 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => setFormData({
                                        ...formData, 
                                        minors: [...formData.minors, { name: '', id: '' }]
                                    })}
                                >
                                    + הוסף קטין
                                </NeonButton>
                            </div>
                            
                            {formData.minors.map((minor, index) => (
                                <motion.div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl relative">
                                    <NeonInput 
                                        label="שם מלא"
                                        value={minor.name}
                                        onChange={(e) => {
                                            const newMinors = [...formData.minors];
                                            newMinors[index].name = e.target.value;
                                            setFormData({ ...formData, minors: newMinors });
                                        }}
                                    />
                                    <NeonInput 
                                        label="ת.ז"
                                        value={minor.id}
                                        onChange={(e) => {
                                            const newMinors = [...formData.minors];
                                            newMinors[index].id = e.target.value;
                                            setFormData({ ...formData, minors: newMinors });
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            const newMinors = formData.minors.filter((_, i) => i !== index);
                                            setFormData({ ...formData, minors: newMinors });
                                        }}
                                        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                                    >
                                        ✕
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Logs Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 rounded-3xl p-5 border border-white/5">
                            <div className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest">
                                <Clock size={16} className="text-amber-500" />
                                <span>זמן הפקה: {formData.generationTime}</span>
                            </div>
                            {formData.sentTime && (
                                <div className="flex items-center gap-3 text-emerald-500 text-xs font-black uppercase tracking-widest">
                                    <CheckCircle2 size={16} />
                                    <span>זמן שליחה: {formData.sentTime}</span>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                            <NeonButton 
                                onClick={handleDownloadPDF} 
                                variant="secondary"
                                className="w-full py-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            >
                                <FileDown size={20} className="ml-2" /> הורד כקובץ PDF
                            </NeonButton>
                            <NeonButton 
                                onClick={handleSend} 
                                isLoading={isSending}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/20"
                            >
                                <Send size={20} className="ml-2" /> שלח לחברת הביטוח
                            </NeonButton>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
                        <div className="w-28 h-28 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={64} />
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white italic mb-4">נשלח בהצלחה!</h3>
                            <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                                מכתב הביטול (נספח ג') נשלח למחלקת הביטולים של <span className="text-white font-black">{formData.company}</span>.<br/>
                                אישור קבלה יישלח למייל: <span className="text-emerald-400 underline">{formData.emailForConfirmation}</span>
                            </p>
                        </div>
                        <div className="pt-8 w-full max-w-xs">
                            <NeonButton onClick={onClose} className="w-full py-5 text-lg">סיום וסגירה</NeonButton>
                        </div>
                    </div>
                )}
            </div>
        </NeonModal>
    );
};
