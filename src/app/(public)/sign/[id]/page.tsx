'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Lock, 
    FileText, 
    CheckCircle2, 
    PenTool, 
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { NeonButton, NeonCard, NeonInput } from '@/components/ui/neon-form';
import { SignatureCanvas } from '@/components/ui/SignatureCanvas';
import { formSigningService, FormTemplate, SigningSession, FormField } from '@/lib/services/form-signing-service';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ClientSigningPage() {
    const { id } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<SigningSession | null>(null);
    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
    const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const sessionData = await formSigningService.getSession(id as string);
            if (!sessionData) {
                toast.error('הקישור אינו תקף');
                return;
            }
            setSession(sessionData);

            if (!sessionData.password) {
                setIsAuthenticated(true);
                await loadTemplateAndPDF(sessionData.templateId);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadTemplateAndPDF = async (templateId: string) => {
        const templates = await formSigningService.getTemplates();
        const template = templates.find(t => t.id === templateId);
        if (!template) throw new Error('Template not found');
        setTemplate(template);

        const loadingTask = pdfjsLib.getDocument(template.pdfUrl);
        const pdf = await loadingTask.promise;
        const pageImages: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context!, viewport }).promise;
            pageImages.push(canvas.toDataURL());
        }
        setPages(pageImages);
    };

    const handleAuth = async () => {
        if (passwordInput === session?.password) {
            setIsAuthenticated(true);
            setLoading(true);
            await loadTemplateAndPDF(session!.templateId);
            setLoading(false);
        } else {
            toast.error('סיסמה שגויה');
        }
    };

    const handleComplete = async () => {
        // Validate required fields
        const missing = template?.fields.filter(f => f.required && !fieldValues[f.id]);
        if (missing?.length) {
            toast.error(`נא למלא את כל שדות החובה (${missing[0].label})`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Updated session with values
            await formSigningService.updateSessionStatus(id as string, 'signed');
            // Normally we'd pass all field values to the service
            // For now, assume single signature
            const signatureField = template?.fields.find(f => f.type === 'signature');
            if (signatureField) {
                await formSigningService.generateSignedPdf(id as string, fieldValues[signatureField.id]);
            }
            toast.success('המסמך נחתם ונשלח בהצלחה!');
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בשליחת המסמך');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <Loader2 className="text-amber-500 animate-spin" size={48} />
                <p className="text-white font-black text-xl animate-pulse">מכין את המסמכים לחתימה...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <NeonCard className="max-w-md w-full p-10 text-center border-amber-500/30">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-8">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">מסמך מוגן</h1>
                    <p className="text-slate-500 font-medium mb-8 text-sm">הזן את הסיסמה שקיבלת מהסוכן כדי לצפות ולחתום על המסמך.</p>
                    
                    <div className="space-y-6">
                        <NeonInput 
                            type="password"
                            label="סיסמת גישה"
                            placeholder="****"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                        />
                        <NeonButton onClick={handleAuth} className="w-full py-4">
                            פתח מסמך <ShieldCheck size={20} className="mr-2" />
                        </NeonButton>
                    </div>
                </NeonCard>
            </div>
        );
    }

    if (session?.status === 'signed') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <NeonCard className="max-w-md w-full p-12 border-emerald-500/30">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-8">
                        <CheckCircle2 size={56} />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-4">תודה רבה!</h1>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                        המסמך נחתם בהצלחה והועבר להמשך טיפול במשרדנו. עותק חתום יישלח אליך בהקדם.
                    </p>
                    <NeonButton onClick={() => window.close()} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black">
                        סגור חלון
                    </NeonButton>
                </NeonCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-black/80 backdrop-blur-md border-b border-white/5 p-4 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black">
                        <PenTool size={20} />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-sm leading-tight">{template?.name}</h2>
                        <p className="text-[10px] text-slate-500 font-bold">חתימה דיגיטלית מאובטחת</p>
                    </div>
                </div>
                <NeonButton onClick={handleComplete} isLoading={isSubmitting} className="py-2 px-6 text-xs h-auto">
                    סיום ושליחה
                </NeonButton>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center gap-8 custom-scrollbar">
                <div className="max-w-4xl w-full space-y-8">
                    {pages.map((pageImg, idx) => (
                        <div 
                            key={idx} 
                            className="relative shadow-2xl rounded-xl overflow-hidden bg-white w-full aspect-[1/1.41]"
                        >
                            <img src={pageImg} alt={`Page ${idx + 1}`} className="w-full h-full pointer-events-none" />
                            
                            {/* Overlay Fields */}
                            {template?.fields.filter(f => f.page === idx + 1).map(field => (
                                <SigningField 
                                    key={field.id}
                                    field={field}
                                    value={fieldValues[field.id]}
                                    onClick={() => {
                                        if (field.type === 'signature') setShowSignatureModal(field.id);
                                    }}
                                    onChange={(val) => setFieldValues({ ...fieldValues, [field.id]: val })}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </main>

            {/* Signature Modal */}
            <AnimatePresence>
                {showSignatureModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg bg-white rounded-[2.5rem] p-10"
                        >
                            <h3 className="text-2xl font-black text-black mb-8 text-center italic">חתימה דיגיטלית</h3>
                            <SignatureCanvas 
                                onSave={(data) => {
                                    setFieldValues({ ...fieldValues, [showSignatureModal]: data });
                                }}
                                onClear={() => {
                                    setFieldValues({ ...fieldValues, [showSignatureModal]: null });
                                }}
                            />
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button 
                                    onClick={() => setShowSignatureModal(null)}
                                    className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                >
                                    ביטול
                                </button>
                                <button 
                                    onClick={() => setShowSignatureModal(null)}
                                    className="py-4 bg-amber-500 text-black rounded-2xl font-black text-sm hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    אשר חתימה
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const SigningField: React.FC<{ 
    field: FormField, 
    value: any, 
    onClick: () => void,
    onChange: (val: any) => void 
}> = ({ field, value, onClick, onChange }) => {
    return (
        <div 
            onClick={onClick}
            className={`absolute flex items-center justify-center border-2 transition-all cursor-pointer ${
                value ? 'border-emerald-500 bg-emerald-500/10' : 'border-amber-500 bg-amber-500/10 animate-pulse'
            } rounded-md`}
            style={{
                left: `${field.x}%`,
                top: `${100 - field.y}%`,
                width: `${field.width}%`,
                height: `${field.height}%`
            }}
        >
            {field.type === 'signature' && (
                value ? <img src={value} className="w-full h-full object-contain" /> : <PenTool size={16} className="text-amber-500" />
            )}
            {field.type === 'text' && (
                <input 
                    className="w-full h-full bg-transparent text-[10px] px-1 focus:outline-none text-black font-medium"
                    placeholder={field.label}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {field.type === 'checkbox' && (
                <div 
                    className="w-full h-full flex items-center justify-center"
                    onClick={() => onChange(!value)}
                >
                    {value && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
            )}
        </div>
    );
};
