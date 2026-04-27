'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo2 } from 'lucide-react';

interface SignatureCanvasProps {
    onSave: (dataUrl: string) => void;
    onClear: () => void;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onClear }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Handle window resize
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            // Clear on resize (could be improved to store strokes)
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
        };

        window.addEventListener('resize', resize);
        resize();

        return () => window.removeEventListener('resize', resize);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (isEmpty) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsEmpty(false);
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
            onClear();
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative aspect-video bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full touch-none"
                />
                
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-bold italic">
                        חתום כאן...
                    </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                    <button 
                        onClick={clear}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shadow-sm"
                        title="נקה חתימה"
                    >
                        <Eraser size={18} />
                    </button>
                </div>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center font-bold">
                בחתימה על גבי מסמך זה אני מאשר את נכונות הפרטים
            </p>
        </div>
    );
};
