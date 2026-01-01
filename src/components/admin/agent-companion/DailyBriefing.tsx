"use client";

import { Card } from "@/components/ui/base";
import { Sun, Mic, PlayCircle } from "lucide-react";

export default function DailyBriefing() {
    return (
        <Card className="bg-gradient-to-r from-indigo-900/90 to-slate-900/90 backdrop-blur-xl text-white border-none shadow-2xl p-6 relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-yellow-300 shadow-inner">
                        <Sun size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-1">בוקר טוב, מנהל!</h2>
                        <p className="text-indigo-200 font-medium text-sm leading-relaxed max-w-xl">
                            היום צפוי להיות עמוס. יש לך <span className="text-white font-bold decoration-wavy underline decoration-indigo-400">3 פגישות</span> ו-<span className="text-white font-bold decoration-wavy underline decoration-indigo-400">5 פוליסות לחידוש</span> דחוף.
                            שווי פוטנציאלי להיום: <span className="text-emerald-300 font-bold">₪150,000</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-colors border border-white/10 text-xs font-bold">
                        <PlayCircle size={16} />
                        השמע תדריך
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 text-xs font-bold">
                        <Mic size={16} />
                        פקודה קולית
                    </button>
                </div>
            </div>
        </Card>
    );
}
