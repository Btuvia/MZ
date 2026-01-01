export const metadata = {
    title: "מגן זהב - אזור אישי",
    description: "האזור האישי שלך לניהול תיק הביטוח",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="client-portal-root">
            {children}
        </div>
    );
}
