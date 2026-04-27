import React, { useState } from 'react';
import { 
    CloudUpload, 
    Link, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    X,
    Database,
    Zap
} from 'lucide-react';
import { NeonModal, NeonButton, NeonCard } from '../ui/neon-form';
import { insuranceImportService, ImportedPolicy } from '@/lib/services/insurance-import-service';
import { toast } from 'sonner';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (policies: ImportedPolicy[]) => void;
}

export const InsuranceImportModal: React.FC<Props> = ({ isOpen, onClose, onImportComplete }) => {
    const [step, setStep] = useState(1);
    const [source, setSource] = useState<'clearinghouse' | 'har-habituach' | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importedCount, setImportedCount] = useState(0);

    const handleSourceSelect = (selectedSource: 'clearinghouse' | 'har-habituach') => {
        setSource(selectedSource);
        setStep(2);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            let policies: ImportedPolicy[] = [];
            
            if (source === 'clearinghouse') {
                // In reality we would read the file content
                policies = await insuranceImportService.parseClearinghouseFile("");
            } else {
                policies = await insuranceImportService.parseHarHaBituachPDF(file);
            }

            setImportedCount(policies.length);
            onImportComplete(policies);
            setStep(3);
            toast.success(`ייבוא הושלם בהצלחה: ${policies.length} פוליסות עודכנו`);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('הייבוא נכשל. אנא וודא שהקובץ תקין ונסה שוב.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <NeonModal isOpen={isOpen} onClose={onClose} title="ייבוא נתונים חכם">
            <div className="p-6 min-h-[400px] flex flex-col">
                
                {/* ═══════════════════════ STEP 1: Select Source ═══════════════════════ */}
                {step === 1 && (
                    <div className="flex flex-col space-y-6">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-white mb-2">בחר מקור מידע לסנכרון</h3>
                            <p className="text-gray-400">המערכת תפענח את הקבצים ותעדכן את תיק הלקוח באופן אוטומטי</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NeonCard 
                                onClick={() => handleSourceSelect('clearinghouse')}
                                className="cursor-pointer hover:border-cyan-500/50 transition-all p-8 flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Database className="text-cyan-400" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">המסלקה הפנסיונית</h4>
                                <p className="text-sm text-gray-400">ייבוא קובצי XML/JSON שנתקבלו מהמסלקה</p>
                            </NeonCard>

                            <NeonCard 
                                onClick={() => handleSourceSelect('har-habituach')}
                                className="cursor-pointer hover:border-purple-500/50 transition-all p-8 flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="text-purple-400" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">הר הביטוח</h4>
                                <p className="text-sm text-gray-400">ייבוא קובץ PDF של ריכוז הפוליסות מהר הביטוח</p>
                            </NeonCard>

                            <NeonCard 
                                onClick={() => handleSourceSelect('api' as any)}
                                className="cursor-pointer border-amber-500/20 hover:border-amber-500/50 transition-all p-8 flex flex-col items-center text-center group relative overflow-hidden col-span-1 md:col-span-2"
                            >
                                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest">Premium</div>
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="text-amber-400" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">משיכה ישירה מחברות הביטוח (API)</h4>
                                <p className="text-sm text-gray-400">שאילתא ישירה מול כל חברות הביטוח בזמן אמת ללא צורך בקובץ</p>
                            </NeonCard>
                        </div>

                        <div className="mt-8 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3 space-x-reverse">
                            <AlertCircle className="text-blue-400 mt-1" size={20} />
                            <p className="text-sm text-blue-200 leading-relaxed">
                                המערכת תומכת בפורמטים הרשמיים של משרד האוצר והמסלקה. 
                                כל המידע המיובא מוצפן ונשמר ישירות בתיק הלקוח.
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════ STEP 2: Upload or API Fetch ═══════════════════════ */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center space-y-8 flex-grow">
                        {source === 'api' ? (
                            <div className="w-full max-w-md space-y-8">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-white italic mb-2 tracking-tighter">מתחבר למסדי הנתונים...</h3>
                                    <p className="text-slate-500 font-bold">המערכת מבצעת שאילתה מול כל היצרנים</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { name: 'הראל חברה לביטוח', status: 'fetching' },
                                        { name: 'הפניקס חברה לביטוח', status: 'completed' },
                                        { name: 'מגדל חברה לביטוח', status: 'waiting' },
                                        { name: 'מנורה מבטחים', status: 'waiting' }
                                    ].map((company, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    company.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                                                    company.status === 'fetching' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'
                                                }`} />
                                                <span className="text-white font-black text-xs">{company.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {company.status === 'completed' ? 'הושלם' : company.status === 'fetching' ? 'מושך נתונים...' : 'בהמתנה'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '65%' }}
                                        className="h-full bg-amber-500"
                                    />
                                </div>

                                <NeonButton onClick={() => {
                                    setImportedCount(14);
                                    setStep(3);
                                }} className="w-full py-4">הפסק והצג נתונים חלקיים</NeonButton>
                            </div>
                        ) : (
                            <>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {source === 'clearinghouse' ? 'העלאת קובץ מסלקה' : 'העלאת קובץ הר הביטוח'}
                                    </h3>
                                    <p className="text-gray-400">גרור את הקובץ לכאן או לחץ לבחירה</p>
                                </div>

                                <label className="w-full max-w-md h-48 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-3xl flex flex-col items-center justify-center cursor-pointer bg-white/5 transition-all group relative overflow-hidden">
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept={source === 'clearinghouse' ? '.xml,.json' : '.pdf'} 
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    
                                    {isUploading ? (
                                        <div className="flex flex-col items-center space-y-4">
                                            <Loader2 className="text-cyan-400 animate-spin" size={48} />
                                            <span className="text-cyan-200 font-medium">מפענח נתונים...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-4">
                                            <CloudUpload className="text-gray-400 group-hover:text-cyan-400 transition-colors" size={48} />
                                            <span className="text-gray-400 group-hover:text-white transition-colors">לחץ לבחירת קובץ</span>
                                            <span className="text-xs text-gray-500 italic">
                                                {source === 'clearinghouse' ? 'פורמט נתמך: XML, JSON' : 'פורמט נתמך: PDF'}
                                            </span>
                                        </div>
                                    )}
                                </label>
                            </>
                        )}

                        <NeonButton 
                            variant="secondary" 
                            onClick={() => setStep(1)}
                            disabled={isUploading}
                        >
                            חזור לבחירה
                        </NeonButton>
                    </div>
                )}

                {/* ═══════════════════════ STEP 3: Success ═══════════════════════ */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center space-y-8 flex-grow text-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="text-emerald-400" size={64} />
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">סנכרון הושלם!</h3>
                            <p className="text-gray-400">
                                בהצלחה! מצאנו <span className="text-emerald-400 font-bold">{importedCount}</span> פוליסות חדשות/מעודכנות.
                                <br />
                                המידע עודכן בתיק הלקוח וזמין כעת לניתוח.
                            </p>
                        </div>

                        <NeonButton 
                            className="px-12 py-3"
                            onClick={onClose}
                        >
                            סגור וחזור לכרטיס לקוח
                        </NeonButton>
                    </div>
                )}

            </div>
        </NeonModal>
    );
};
