export const metadata = {
    title: "מגן זהב - ניהול מערכת",
    description: "מערכת ניהול למנהלים",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="admin-portal-root">
            {children}
        </div>
    );
}
