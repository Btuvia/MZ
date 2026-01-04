# הנחיות Copilot עבור InsurCRM

## סקירת הפרויקט

**InsurCRM** היא מערכת CRM לניהול סוכנויות ביטוח, בנויה ב-Next.js 16.1 (App Router), Firebase ו-Gemini AI. המערכת תומכת בשלושה תפקידים: `admin` (מנהל), `agent` (סוכן), ו-`client` (לקוח).

---

## 🏗️ ארכיטקטורה

### מבנה תיקיות ראשי

```
src/
├── app/                    # נתיבי Next.js (App Router)
│   ├── admin/              # 23 מודולים לניהול סוכנות
│   ├── agent/              # 7 מודולים לסוכנים
│   ├── client/             # 6 מודולים ללקוחות
│   ├── actions/            # Server Actions (כתיבה ל-Firebase)
│   └── api/                # נתיבי API
├── components/             # קומפוננטות React
│   ├── ui/                 # רכיבי UI בסיסיים (base.tsx)
│   ├── admin/              # קומפוננטות ספציפיות למנהל
│   └── modals/             # חלונות קופצים
├── lib/                    # לוגיקה עסקית ושירותים
│   ├── automation/         # ⚡ מערכת האוטומציות
│   ├── firebase/           # חיבור Firebase
│   ├── ai/                 # שירותי AI
│   ├── contexts/           # React Contexts
│   ├── hooks/              # Custom Hooks
│   └── services/           # שירותים עסקיים
└── types/                  # טיפוסי TypeScript
```

---

## ⚡ מערכת האוטומציות (חשוב!)

### קבצים מרכזיים ב-`src/lib/automation/`:

| קובץ                     | תפקיד                                                 |
| ------------------------ | ----------------------------------------------------- |
| `workflow-automation.ts` | מנוע התהליכים - יצירת משימות אוטומטית, מעבר בין שלבים |
| `notifications.ts`       | מערכת התראות - שליחה, קריאה, ספירת הודעות             |
| `sla-tracker.ts`         | מעקב SLA - זיהוי איחורים, חישוב זמנים                 |

### דפוס Workflow (תהליך עבודה):

```typescript
// להתחיל תהליך חדש
import { startWorkflowAutomation } from '@/lib/automation/workflow-automation';
await startWorkflowAutomation(workflowId, clientId, clientName, startedBy);

// לבדוק משימות באיחור
import { checkOverdueTasks } from '@/lib/automation/sla-tracker';
const overdueTasks = await checkOverdueTasks();

// לשלוח התראה
import { sendNotification } from '@/lib/automation/notifications';
await sendNotification(userId, { type: 'task_assigned', title: '...', message: '...' });
```

### טיפוסי Workflow ב-`src/types/workflow.ts`:

- `Workflow` - הגדרת תהליך עם שלבים
- `WorkflowStep` - שלב בודד (SLA, סוג משימה, הקצאה)
- `WorkflowInstance` - מופע רץ של תהליך

---

## 🔥 Firebase - דפוס עבודה

### שני סוגי חיבור:

```typescript
// 1. קריאות (צד לקוח) - src/lib/firebase/firestore-service.ts
import { firestoreService } from '@/lib/firebase/firestore-service';
const clients = await firestoreService.getClients();
const tasks = await firestoreService.getTasksForClient(clientId);

// 2. כתיבות (Server Actions) - src/app/actions/
import { createClientAction } from '@/app/actions/clients';
const result = await createClientAction(data);
```

### אוספי Firestore:

`clients`, `users`, `tasks`, `leads`, `deals`, `workflows`, `notifications`, `financial_products`, `communications`

---

## 🤖 שירותי AI

### שימוש ב-Gemini:

```typescript
// Server Action עם מטמון
import { generateWithGemini } from '@/app/actions/gemini';
const response = await generateWithGemini(prompt, { base64, mimeType });

// ניתוח מסמכי ביטוח
import { analyzeInsuranceDocument } from '@/lib/ai/ai-service';
const result = await analyzeInsuranceDocument(file);
```

### פרומפטים - תמיד בעברית עם JSON חוזר!

---

## 🎨 קונבנציות קוד

### קומפוננטות:

- **"use client"** - חובה לכל קומפוננטה אינטראקטיבית
- רכיבי UI: `Card`, `Button`, `Badge` מ-`@/components/ui/base`
- פריסת דשבורד: `DashboardShell` מ-`@/components/ui/dashboard-shell`

### עיצוב (Tailwind v4):

```css
/* אפקטים מיוחדים - globals.css */
.glass          /* רקע זכוכית */
.glass-card     /* כרטיס זכוכית */
.neon-gold      /* זוהר זהב */
.text-gradient  /* טקסט גרדיאנט */
```

### RTL:

- כל הדפים: `dir="rtl"`
- טקסט UI בעברית
- אייקונים מ-`lucide-react`

---

## 📋 מערכת משימות

### 10 סוגי משימות (`TaskType`):

`call`, `task`, `meeting`, `meeting_summary`, `documentation`, `email_out`, `email_in`, `letter`, `sms`, `fax`

### סטטוסים (`TaskStatus`):

`new` → `pending` → `in_progress` → `completed` | `overdue` | `cancelled` | `transferred`

### הרשאות (`src/lib/permissions.ts`):

```typescript
hasPermission(userRole, 'canEditAll');
canPerformTaskAction(userRole, 'edit', isOwnTask);
```

---

## 🛠️ פיתוח

### פקודות:

```bash
cd pulsing-chromosphere
npm run dev      # פיתוח
npm run build    # בנייה
npm run lint     # בדיקת קוד
```

### משתני סביבה (`.env.local`):

```
NEXT_PUBLIC_FIREBASE_*   # Firebase Client (6 משתנים)
FIREBASE_ADMIN_*         # Firebase Admin
GEMINI_API_KEY           # Google AI
RESEND_API_KEY           # אימיילים
```

---

## 📁 קונבנציות שמות קבצים

| סוג           | דוגמה                     | מיקום                 |
| ------------- | ------------------------- | --------------------- |
| עמוד          | `page.tsx`                | `src/app/.../`        |
| קומפוננטה     | `SmartTaskModal.tsx`      | `src/components/`     |
| Server Action | `clients.ts`              | `src/app/actions/`    |
| שירות         | `workflow-automation.ts`  | `src/lib/automation/` |
| טיפוסים       | `workflow.ts`             | `src/types/`          |
| Hook          | `useSpeechRecognition.ts` | `src/lib/hooks/`      |

---

## 🎯 עקרונות לשיפור קוד

1. **הפרדת אחריות** - לוגיקה ב-`lib/`, תצוגה ב-`components/`
2. **Server Actions** - כל כתיבה ל-DB דרך `src/app/actions/`
3. **טיפוסים חזקים** - להשתמש בטיפוסים מ-`src/types/`
4. **שימוש חוזר** - להעדיף קומפוננטות מ-`ui/base.tsx`
5. **עברית** - כל טקסט UI והודעות שגיאה בעברית

---

## ✅ תיקונים שבוצעו (ינואר 2026)

### 1. ✅ טיפוסי TypeScript ב-Firestore Service

- הוחלפו `any` בטיפוסים חזקים: `Client`, `Task`, `Lead`, `Deal`
- נוספו ממשקים חדשים: `LeadStatus`, `TaskStatus`, `LeadSource`, `DocumentFilter`
- **קובץ:** `src/lib/firebase/firestore-service.ts`

### 2. ✅ SLA Monitoring - API Route

- הוסר `setInterval` הבעייתי
- נוצר API Route חדש: `src/app/api/cron/sla-check/route.ts`
- תומך ב-Vercel Cron או שירות Cron חיצוני
- **להוסיף ל-.env.local:** `CRON_SECRET=your-secret-here`

### 3. ✅ מניעת התראות כפולות

- נוסף מנגנון מעקב עם `Set` למניעת שליחת התראות כפולות
- ניקוי אוטומטי אחרי 24 שעות
- **קובץ:** `src/lib/automation/sla-tracker.ts`

### 4. ✅ Error Boundaries

- נוסף `src/app/error.tsx` - טיפול גלובלי בשגיאות
- נוסף `src/app/admin/error.tsx` - טיפול בשגיאות באזור האדמין
- עיצוב RTL + עברית

### 5. ✅ מימוש getAutomationLogs

- הפונקציה עכשיו עובדת עם פילטרים
- נוספה פונקציה `getAutomationSummary()` לסיכום יומי
- **קובץ:** `src/lib/automation/workflow-automation.ts`

### 6. ✅ טיפוסים חדשים

- נוספו `Lead` ו-`Deal` interfaces ל-`src/types/index.ts`
- `LeadStatus` ו-`DealStage` type unions

---

## 🔄 עדיין לטיפול

### קוד כפול ב-Firestore Service

להחליף את הפונקציות הכפולות בשימוש ב-`addDocument`/`getDocuments` הגנריים

### Mock Data בדף האוטומציות

לחבר את `src/app/admin/automation/page.tsx` לפונקציות האמיתיות:

```typescript
import { getAutomationLogs, getAutomationSummary } from '@/lib/automation/workflow-automation';
```

---

## ✅ מה עובד טוב

- ✅ מבנה תיקיות ברור ומאורגן
- ✅ הפרדה בין Client/Server Firebase
- ✅ מערכת הרשאות מוגדרת היטב
- ✅ טיפוסי TypeScript מקיפים ב-`types/`
- ✅ UI Components עם Variants
- ✅ תמיכה מלאה ב-RTL
- ✅ Error Boundaries
- ✅ API Route ל-Cron Jobs
- ✅ מניעת התראות כפולות
