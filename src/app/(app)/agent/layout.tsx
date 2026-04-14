export const metadata = {
    title: "מגן זהב - אזור סוכנים",
    description: "מערכת ניהול לסוכני ביטוח",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="agent-portal-root">
            {children}
        </div>
    );
}
