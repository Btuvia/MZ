"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/agent/dashboard");
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <div className="text-white text-xl">טוען...</div>
        </div>
    );
}
