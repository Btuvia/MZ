"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";

interface FileUploadProps {
    onUpload: (file: File) => void;
    accept?: string;
    label?: string;
}

export function FileUpload({ onUpload, accept = ".pdf,.doc,.docx", label = "גרור קובץ לכאן או לחץ להעלאה" }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setFile(file);
        onUpload(file);
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group ${dragActive ? "border-accent bg-accent/5 scale-[1.02]" : "border-slate-200 hover:border-accent/50 hover:bg-slate-50"
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleChange}
            />

            <div className="flex flex-col items-center justify-center gap-4">
                {file ? (
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4 animate-in fade-in zoom-in-50 duration-300">
                        <div className="h-12 w-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
                            <FileText size={24} />
                        </div>
                        <div className="text-right">
                            <p className="font-black text-primary text-sm truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-slate-400 font-bold">PDF Document</p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-500 ${dragActive ? "bg-accent/20 text-accent" : "bg-slate-100 text-slate-400 group-hover:bg-accent/10 group-hover:text-accent group-hover:scale-110"
                            }`}>
                            <UploadCloud size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-primary mb-1">{label}</p>
                            <p className="text-xs font-medium text-slate-400">PDF, DOCX עד 10MB</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
