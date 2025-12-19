import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <header className="mb-12">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-primary">
          Insur<span className="text-accent">CRM</span>
        </h1>
        <p className="text-xl text-slate-600">
          הפתרון המושלם לניהול סוכנות ביטוח ופנסיה בעידן הדיגיטלי
        </p>
      </header>

      <main className="grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">ניהול לקוחות</h3>
          <p className="text-slate-500">ניהול מלא של תיקי לקוחות, קשרי משפחה והיסטוריית תקשורת.</p>
        </div>

        <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">פוליסות ביטוח</h3>
          <p className="text-slate-500">מעקב אחרי כל הפוליסות: חיים, בריאות, רכב ודירה במקום אחד.</p>
        </div>

        <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <h3 className="mb-2 text-xl font-bold">תיקי פנסיה</h3>
          <p className="text-slate-500">מעקב אחרי קרנות פנסיה, קופות גמל והשתלמות עם תצוגת יתרות חיה.</p>
        </div>
      </main>

      <footer className="mt-16">
        <div className="flex gap-4">
          <Link href="/login">
            <button className="rounded-full bg-accent px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer">
              התחברות למערכת
            </button>
          </Link>
          <Link href="/login">
            <button className="rounded-full border border-border bg-white px-8 py-3 font-semibold text-primary shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer">
              למידה נוספת
            </button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
