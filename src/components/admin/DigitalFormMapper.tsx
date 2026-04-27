'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Type, 
    PenTool, 
    CheckSquare, 
    Save, 
    Plus, 
    Trash2, 
    Settings2,
    Users,
    Shield,
    X
} from 'lucide-react';
import { NeonButton, NeonCard, NeonInput, NeonSelect } from '../ui/neon-form';
import { formSigningService, FormField, FormTemplate } from '../../lib/services/form-signing-service';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

// Set up worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const DigitalFormMapper: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFile(file);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);

        // Render PDF pages to images for mapping
        const loadingTask = pdfjsLib.getDocument(url);
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

    const addField = (type: FormField['type']) => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            role: 'client',
            x: 10,
            y: 10,
            width: type === 'signature' ? 20 : 15,
            height: type === 'signature' ? 10 : 3,
            label: `שדה ${fields.length + 1}`,
            required: true,
            page: 1
        };
        setFields([...fields, newField]);
        setSelectedField(newField.id);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        setSelectedField(null);
    };

    const handleSave = async () => {
        if (!file || !templateName) {
            toast.error('נא להזין שם תבנית ולהעלות קובץ');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Upload PDF to Storage
            const storageRef = ref(storage, `form_templates/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);

            // 2. Create Template in Firestore
            await formSigningService.createTemplate({
                name: templateName,
                pdfUrl: downloadUrl,
                fields,
                createdBy: 'admin' // Should be current user
            });

            toast.success('התבנית נשמרה בהצלחה!');
            // Reset
            setFile(null);
            setPages([]);
            setFields([]);
            setTemplateName('');
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בשמירת התבנית');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar Tools */}
            <div className="w-80 border-l border-white/10 p-6 flex flex-col gap-8 bg-slate-900/50">
                <div>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                        <Settings2 className="text-amber-500" /> הגדרות תבנית
                    </h2>
                    <NeonInput 
                        label="שם הטופס"
                        placeholder="לדוגמה: הצהרת בריאות מנורה"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">הוספת שדות</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <ToolButton icon={<Type size={18} />} label="טקסט" onClick={() => addField('text')} />
                        <ToolButton icon={<PenTool size={18} />} label="חתימה" onClick={() => addField('signature')} />
                        <ToolButton icon={<CheckSquare size={18} />} label="תיבת סימון" onClick={() => addField('checkbox')} />
                    </div>
                </div>

                {selectedField && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 pt-6 border-t border-white/10"
                    >
                        <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">עריכת שדה</h3>
                        <NeonInput 
                            label="תווית שדה"
                            value={fields.find(f => f.id === selectedField)?.label || ''}
                            onChange={(e) => updateField(selectedField, { label: e.target.value })}
                        />
                        <NeonSelect 
                            label="מי חותם/ממלא?"
                            value={fields.find(f => f.id === selectedField)?.role || 'client'}
                            onChange={(e) => updateField(selectedField, { role: e.target.value as any })}
                            options={[
                                { value: 'client', label: 'לקוח' },
                                { value: 'spouse', label: 'בן/בת זוג' },
                                { value: 'employer', label: 'מעסיק' },
                                { value: 'agent', label: 'סוכן' },
                                { value: 'other', label: 'אחר' }
                            ]}
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => deleteField(selectedField)}
                                className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 font-black text-xs hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> מחק שדה
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="mt-auto">
                    <NeonButton 
                        onClick={handleSave} 
                        isLoading={isSaving}
                        className="w-full py-4"
                        disabled={!file || fields.length === 0}
                    >
                        <Save size={18} className="ml-2" /> שמור תבנית דיגיטלית
                    </NeonButton>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 overflow-auto p-12 bg-slate-950 flex flex-col items-center gap-8 custom-scrollbar">
                {!file ? (
                    <label className="w-full max-w-2xl aspect-video border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-4 hover:border-amber-500/30 hover:bg-white/5 transition-all cursor-pointer group">
                        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Plus size={40} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-white">העלה טופס PDF להפיכה לדיגיטלי</p>
                            <p className="text-slate-500 font-medium">גרור קובץ לכאן או לחץ לבחירה</p>
                        </div>
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                    </label>
                ) : (
                    <div className="space-y-12">
                        {pages.map((pageImg, idx) => (
                            <div 
                                key={idx} 
                                className="relative shadow-2xl rounded-lg overflow-hidden bg-white"
                                style={{ width: '800px', height: '1131px' }} // A4 aspect ratio at 1.5 scale
                            >
                                <img src={pageImg} alt={`Page ${idx + 1}`} className="w-full h-full pointer-events-none" />
                                
                                {/* Overlay Fields for this page */}
                                {fields.filter(f => f.page === idx + 1).map(field => (
                                    <DraggableField 
                                        key={field.id}
                                        field={field}
                                        isSelected={selectedField === field.id}
                                        onSelect={() => setSelectedField(field.id)}
                                        onUpdate={(updates) => updateField(field.id, updates)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ToolButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const DraggableField: React.FC<{ 
    field: FormField, 
    isSelected: boolean, 
    onSelect: () => void,
    onUpdate: (updates: Partial<FormField>) => void 
}> = ({ field, isSelected, onSelect, onUpdate }) => {
    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => {
                // Calculate new percentage position
                // This is a simplified version, should account for container size
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            className={`absolute flex items-center justify-center border-2 cursor-move group ${
                isSelected ? 'border-amber-500 bg-amber-500/20 z-50' : 'border-blue-500/50 bg-blue-500/10 z-40'
            } rounded-md shadow-lg`}
            style={{
                left: `${field.x}%`,
                top: `${100 - field.y}%`, // Convert from bottom-origin to top-origin for display
                width: `${field.width}%`,
                height: `${field.height}%`
            }}
        >
            <div className="absolute -top-6 right-0 bg-slate-900 text-[8px] font-black px-2 py-1 rounded text-white whitespace-nowrap uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                {field.label} ({field.role})
            </div>
            {field.type === 'signature' && <PenTool size={16} className={isSelected ? 'text-amber-500' : 'text-blue-500'} />}
            {field.type === 'text' && <Type size={16} className={isSelected ? 'text-amber-500' : 'text-blue-500'} />}
            {field.type === 'checkbox' && <CheckSquare size={16} className={isSelected ? 'text-amber-500' : 'text-blue-500'} />}
        </motion.div>
    );
};
