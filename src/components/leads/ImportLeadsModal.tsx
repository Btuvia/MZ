"use client";

import ExcelJS from "exceljs";
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2, X } from "lucide-react";
import Papa from "papaparse";
import { useState, useRef, useCallback } from "react";
import useDrivePicker from "react-google-drive-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/base";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { firestoreService } from "@/lib/firebase/firestore-service";

interface ImportLeadsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ParsedData = Record<string, any>[];

function normalizeHeader(value: unknown, fallback: string): string {
    const asString = typeof value === "string" ? value.trim() : "";
    return asString || fallback;
}

function isCsvLike(params: { fileName?: string; mimeType?: string }): boolean {
    const name = (params.fileName || "").toLowerCase();
    const mime = (params.mimeType || "").toLowerCase();
    return name.endsWith(".csv") || mime.includes("text/csv") || mime.includes("application/csv");
}

function stringifyCell(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value instanceof Date) return value.toISOString();
    // exceljs may return rich objects; try a best-effort string.
    try {
        return String((value as any).text ?? (value as any).result ?? JSON.stringify(value));
    } catch {
        return String(value);
    }
}

async function parseCsvText(text: string): Promise<{ headers: string[]; data: ParsedData }> {
    return new Promise((resolve, reject) => {
        const result = Papa.parse<Record<string, unknown>>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
        });

        if (result.errors?.length) {
            reject(new Error(result.errors[0].message));
            return;
        }

        const headers = result.meta.fields || [];
        const data = (result.data || []).filter(row => Object.values(row).some(v => v != null && String(v).trim() !== ""));
        resolve({ headers, data });
    });
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<{ headers: string[]; data: ParsedData }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return { headers: [], data: [] };

    const headerRow = worksheet.getRow(1);
    const headerValues = (headerRow.values || []) as unknown[];

    const headers: string[] = [];
    for (let col = 1; col < headerValues.length; col++) {
        headers.push(normalizeHeader(headerValues[col], `עמודה ${col}`));
    }

    const data: ParsedData = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const obj: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
            const cellValue = row.getCell(idx + 1).value as unknown;
            const str = stringifyCell(cellValue).trim();
            if (str) obj[header] = str;
        });

        if (Object.keys(obj).length > 0) data.push(obj);
    });

    return { headers, data };
}

const SYSTEM_FIELDS = [
    { key: "name", label: "שם מלא", required: true },
    { key: "phone", label: "טלפון", required: true },
    { key: "email", label: "אימייל", required: false },
    { key: "source", label: "מקור", required: false },
    { key: "status", label: "סטטוס", required: false },
    { key: "interest", label: "תחום עניין", required: false },
    { key: "notes", label: "הערות", required: false },
];

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }: ImportLeadsModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const [openPicker] = useDrivePicker(); // Initialize Picker Hook

    const handleGoogleDriveSelect = (data: any) => {
        if (data.action === 'picked') {
            const file = data.docs[0];
            const accessToken = data.oauthToken; // Token from the picker

            if (file) {
                const isGoogleSheet = file.mimeType === "application/vnd.google-apps.spreadsheet";
                const downloadUrl = isGoogleSheet
                    ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
                    : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

                // Fetch file content using the access token
                fetch(downloadUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
                    .then(res => res.arrayBuffer())
                    .then(async buffer => {
                        const parsed = isCsvLike({ fileName: file.name, mimeType: file.mimeType })
                            ? await parseCsvText(new TextDecoder().decode(buffer))
                            : await parseXlsxBuffer(buffer);

                        if (parsed.headers.length > 0) {
                            setHeaders(parsed.headers);
                            setParsedData(parsed.data);
                            autoMapColumns(parsed.headers);
                            setStep(2);
                        } else {
                            toast.error("לא נמצאו כותרות בקובץ");
                        }
                    })
                    .catch(err => {
                        console.error("Error downloading file from Drive:", err);
                        toast.error("שגיאה בהורדת הקובץ מ-Google Drive");
                    });
            }
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) void processFile(selectedFile);
    };

    const processFile = async (file: File) => {
        setFile(file);
        try {
            const parsed = isCsvLike({ fileName: file.name, mimeType: file.type })
                ? await parseCsvText(await file.text())
                : await parseXlsxBuffer(await file.arrayBuffer());

            if (parsed.headers.length > 0) {
                setHeaders(parsed.headers);
                setParsedData(parsed.data);
                autoMapColumns(parsed.headers);
                setStep(2);
            } else {
                toast.error("לא נמצאו כותרות בקובץ");
            }
        } catch (err) {
            console.error("Error parsing file:", err);
            toast.error("שגיאה בקריאת הקובץ. מומלץ לייצא ל-CSV או XLSX תקין");
        }
    };

    const autoMapColumns = (fileHeaders: string[]) => {
        const newMapping: Record<string, string> = {};
        fileHeaders.forEach(header => {
            const normalized = header.toLowerCase().trim();
            if (normalized.includes("name") || normalized.includes("שם")) newMapping[header] = "name";
            else if (normalized.includes("phone") || normalized.includes("טלפון") || normalized.includes("נייד")) newMapping[header] = "phone";
            else if (normalized.includes("email") || normalized.includes("מייל")) newMapping[header] = "email";
            else if (normalized.includes("source") || normalized.includes("מקור")) newMapping[header] = "source";
            else if (normalized.includes("status") || normalized.includes("סטטוס")) newMapping[header] = "status";
            else if (normalized.includes("note") || normalized.includes("הערות")) newMapping[header] = "notes";
        });
        setMapping(newMapping);
    };

    const handleImport = async () => {
        setImporting(true);
        setStep(3);
        let successCount = 0;

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const leadData: any = { createdAt: new Date().toISOString() };

            // Map fields
            Object.entries(mapping).forEach(([fileHeader, systemKey]) => {
                if (systemKey && row[fileHeader]) {
                    leadData[systemKey] = String(row[fileHeader]).trim();
                }
            });

            // Defaults
            if (!leadData.status) leadData.status = "חדש";
            if (!leadData.source) leadData.source = "יבוא מקו";

            if (leadData.name && leadData.phone) {
                try {
                    await firestoreService.addLead(leadData);
                    successCount++;
                } catch (err) {
                    console.error("Failed to import row", i, err);
                }
            }
            setProgress(Math.round(((i + 1) / parsedData.length) * 100));
        }

        toast.success(`יבוא הושלם! ${successCount} לידים נוספו.`);
        onSuccess();
        setTimeout(() => {
            handleClose();
        }, 1500);
    };

    const handleClose = () => {
        setStep(1);
        setFile(null);
        setParsedData([]);
        setMapping({});
        setImporting(false);
        setProgress(0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-800">
                        {step === 1 && "יבוא לידים מקובץ"}
                        {step === 2 && "התאמת עמודות"}
                        {step === 3 && "מבצע יבוא..."}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center gap-4"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-700">לחץ להעלאת קובץ Excel / CSV</h3>
                                    <p className="text-slate-500 text-sm mt-1">גרור לכאן או לחץ לבחירה</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx,.csv"
                                    onChange={handleFileUpload}
                                />
                                <div className="flex gap-2 mt-4">
                                    <span className="text-xs px-2 py-1 bg-white border rounded text-slate-400">.xlsx</span>
                                    <span className="text-xs px-2 py-1 bg-white border rounded text-slate-400">.csv</span>
                                </div>
                            </div>

                            <div className="relative flex items-center gap-4 py-2">
                                <div className="h-px bg-slate-200 flex-1" />
                                <span className="text-xs font-bold text-slate-400">או</span>
                                <div className="h-px bg-slate-200 flex-1" />
                            </div>

                            <Button
                                variant="outline"
                                className="w-full h-14 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 flex items-center justify-center gap-3"
                                onClick={() => {
                                    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
                                    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

                                    if (!apiKey || !clientId) {
                                        toast.error("חסרים מפתחות API (נדרש Client ID ו-API Key)");
                                        return;
                                    }

                                    openPicker({
                                        clientId: clientId,
                                        developerKey: apiKey,
                                        viewId: 'DOCS',
                                        showUploadView: true,
                                        showUploadFolders: true,
                                        supportDrives: true,
                                        multiselect: false,
                                        callbackFunction: handleGoogleDriveSelect,
                                    });
                                }}
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Google Drive" className="w-6 h-6" />
                                <span className="font-bold">בחר קובץ מ-Google Drive</span>
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 mb-4">המערכת זיהתה {parsedData.length} שורות. אנא התאם את העמודות מהקובץ לשדות במערכת:</p>

                            <div className="grid grid-cols-2 gap-4">
                                {headers.map((header) => (
                                    <div key={header} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                                        <label className="text-xs font-bold text-slate-400">{header}</label>
                                        <select
                                            className="w-full text-sm font-bold bg-white border-none rounded-lg focus:ring-2 ring-accent"
                                            value={mapping[header] || ""}
                                            onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                                        >
                                            <option value="">-- התעלם --</option>
                                            {SYSTEM_FIELDS.map(field => (
                                                <option key={field.key} value={field.key}>
                                                    {field.label} {field.required ? "*" : null}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setStep(1)}>חזרה</Button>
                                <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white">
                                    <Upload size={16} className="ml-2" />
                                    בצע יבוא
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-10 space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-slate-100 stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent" />
                                    <circle
                                        className="text-green-500 progress-ring__circle stroke-current transition-all duration-300"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                     />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-slate-700">
                                    {progress}%
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">מייבא נתונים...</h3>
                            <p className="text-slate-500">אנא המתן, זה עשוי לקחת מספר רגעים</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
