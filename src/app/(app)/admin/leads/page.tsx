"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Plus, Upload, Megaphone, Trash2, UserCheck, Edit3, Search } from "lucide-react";
import { toast } from "sonner";
import ImportLeadsModal from "@/components/leads/ImportLeadsModal";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useLeadStatuses } from "@/lib/hooks/useQueryHooks";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";
import type { Lead, LeadStatus as LeadStatusType } from "@/types";
import type { LeadStatus } from "@/types/statuses";

type Language = "he" | "en" | "ru";

type StatusLabels = Record<LeadStatusType, string>;

const LEAD_STATUS_LABELS: Record<Language, StatusLabels> = {
    he: {
        new: "חדש",
        contacted: "נוצר קשר",
        qualified: "ממויין",
        proposal: "הצעה",
        negotiation: "מו\"מ",
        won: "נסגר",
        lost: "אבוד",
    },
    en: {
        new: "New",
        contacted: "Contacted",
        qualified: "Qualified",
        proposal: "Proposal",
        negotiation: "Negotiation",
        won: "Won",
        lost: "Lost",
    },
    ru: {
        new: "Новый",
        contacted: "Связались",
        qualified: "Квалифицирован",
        proposal: "Предложение",
        negotiation: "Переговоры",
        won: "Выигран",
        lost: "Проигран",
    },
};

const T: Record<Language, Record<string, any>> = {
    he: {
        title: "ניהול לידים",
        subtitle: "מעקב אחרי לידים, סטטוסים ומקורות",
        addLead: "ליד חדש",
        importLeads: "ייבוא לידים",
        refresh: "רענן",
        broadcast: "ניהול קמפיינים",
        searchPlaceholder: "חפש לפי שם, טלפון או מייל...",
        name: "שם",
        source: "מקור",
        phone: "טלפון",
        email: "אימייל",
        status: "סטטוס",
        actions: "פעולות",
        edit: "ערוך",
        remove: "מחק",
        empty: "אין לידים להצגה",
        save: "שמור",
        cancel: "ביטול",
        add: "הוסף",
        convert: "המר ללקוח",
        deleteConfirm: "למחוק את הליד הזה?",
        convertConfirm: (name: string) => `להפוך את ${name} ללקוח פעיל?`,
        convertSuccess: (name: string) => `${name} הומר ללקוח בהצלחה`,
        errorConvert: "שגיאה בהמרת ליד",
        errorDelete: "שגיאה במחיקת ליד",
        loading: "טוען נתונים...",
        filtersAll: "כל הסטטוסים",
        statsTotal: "סה\"כ לידים",
        statsNew: "חדשים",
        statsContacted: "יוצר קשר",
        statsQualified: "ממויינים",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        notes: "הערות",
    },
    en: {
        title: "Lead Management",
        subtitle: "Track leads, statuses and sources",
        addLead: "New lead",
        importLeads: "Import leads",
        refresh: "Refresh",
        broadcast: "Campaigns",
        searchPlaceholder: "Search by name, phone or email...",
        name: "Name",
        source: "Source",
        phone: "Phone",
        email: "Email",
        status: "Status",
        actions: "Actions",
        edit: "Edit",
        remove: "Delete",
        empty: "No leads to show",
        save: "Save",
        cancel: "Cancel",
        add: "Add",
        convert: "Convert to client",
        deleteConfirm: "Delete this lead?",
        convertConfirm: (name: string) => `Convert ${name} to an active client?`,
        convertSuccess: (name: string) => `${name} converted successfully`,
        errorConvert: "Failed to convert lead",
        errorDelete: "Failed to delete lead",
        loading: "Loading data...",
        filtersAll: "All statuses",
        statsTotal: "Total leads",
        statsNew: "New",
        statsContacted: "Contacted",
        statsQualified: "Qualified",
        firstName: "First name",
        lastName: "Last name",
        notes: "Notes",
    },
    ru: {
        title: "Управление лидами",
        subtitle: "Отслеживание лидов, статусов и источников",
        addLead: "Новый лид",
        importLeads: "Импорт лидов",
        refresh: "Обновить",
        broadcast: "Кампании",
        searchPlaceholder: "Поиск по имени, телефону или email...",
        name: "Имя",
        source: "Источник",
        phone: "Телефон",
        email: "Email",
        status: "Статус",
        actions: "Действия",
        edit: "Редактировать",
        remove: "Удалить",
        empty: "Нет лидов для отображения",
        save: "Сохранить",
        cancel: "Отмена",
        add: "Добавить",
        convert: "Конвертировать в клиента",
        deleteConfirm: "Удалить этот лид?",
        convertConfirm: (name: string) => `Преобразовать ${name} в клиента?`,
        convertSuccess: (name: string) => `${name} успешно преобразован`,
        errorConvert: "Не удалось конвертировать лид",
        errorDelete: "Не удалось удалить лид",
        loading: "Загрузка данных...",
        filtersAll: "Все статусы",
        statsTotal: "Всего лидов",
        statsNew: "Новые",
        statsContacted: "Связались",
        statsQualified: "Квалифицированы",
        firstName: "Имя",
        lastName: "Фамилия",
        notes: "Заметки",
    },
};

export default function LeadsPage() {
    const [language, setLanguage] = useState<Language>("he");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    const { data: leads = [], isLoading, refetch } = useLeads();
    const { data: statusesRaw = [] } = useLeadStatuses();
    const createLead = useCreateLead();
    const updateLead = useUpdateLead();
    const deleteLead = useDeleteLead();

    const statuses = statusesRaw as LeadStatus[];

    const [newLead, setNewLead] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        source: "Facebook",
        status: "new" as LeadStatusType,
        notes: "",
    });

    useEffect(() => {
        const stored = (typeof window !== "undefined") ? (localStorage.getItem("crm_language") as Language | null) : null;
        if (stored && ["he", "en", "ru"].includes(stored)) {
            setLanguage(stored as Language);
        }

        const handler = (event: Event) => {
            const lang = (event as CustomEvent<Language>).detail;
            if (lang && ["he", "en", "ru"].includes(lang)) {
                setLanguage(lang);
            }
        };
        window.addEventListener("crm-language-change", handler);
        return () => window.removeEventListener("crm-language-change", handler);
    }, []);

    const t = T[language];
    const statusLabels = LEAD_STATUS_LABELS[language];
    const dir = language === "he" ? "rtl" : "ltr";
