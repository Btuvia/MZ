"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { AGENT_NAV_ITEMS } from "@/lib/navigation-config";

export default function TrainingPage() {
    const [selectedCategory, setSelectedCategory] = useState("הכל");

    const courses = [
        {
            id: 1,
            title: "יסודות ביטוח בריאות",
            category: "ביטוח בריאות",
            duration: "45 דקות",
            progress: 100,
            status: "הושלם",
            lessons: 8,
            icon: "🏥",
            color: "from-blue-600 to-indigo-700"
        },
        {
            id: 2,
            title: "מכירת ביטוח רכב מקיף",
            category: "ביטוח רכב",
            duration: "1 שעה",
            progress: 65,
            status: "בתהליך",
            lessons: 10,
            icon: "🚗",
            color: "from-emerald-600 to-teal-700"
        },
        {
            id: 3,
            title: "ייעוץ פנסיוני מתקדם",
            category: "פנסיה וחיסכון",
            duration: "2 שעות",
            progress: 30,
            status: "בתהליך",
            lessons: 15,
            icon: "💰",
            color: "from-purple-600 to-indigo-700"
        },
        {
            id: 4,
            title: "טכניקות מכירה מתקדמות",
            category: "מכירות",
            duration: "1.5 שעות",
            progress: 0,
            status: "חדש",
            lessons: 12,
            icon: "📈",
            color: "from-amber-500 to-orange-600"
        },
        {
            id: 5,
            title: "ביטוח חיים ומחלות קשות",
            category: "ביטוח חיים",
            duration: "1 שעה",
            progress: 0,
            status: "חדש",
            lessons: 9,
            icon: "❤️",
            color: "from-rose-600 to-pink-700"
        },
        {
            id: 6,
            title: "שימוש ב-AI בייעוץ ביטוחי",
            category: "טכנולוגיה",
            duration: "30 דקות",
            progress: 100,
            status: "הושלם",
            lessons: 5,
            icon: "🤖",
            color: "from-cyan-600 to-blue-700"
        }
    ];

    const categories = ["הכל", "ביטוח בריאות", "ביטוח רכב", "פנסיה וחיסכון", "ביטוח חיים", "מכירות", "טכנולוגיה"];

    const filteredCourses = courses.filter(course =>
        selectedCategory === "הכל" || course.category === selectedCategory
    );

    const stats = {
        total: courses.length,
        completed: courses.filter(c => c.status === "הושלם").length,
        inProgress: courses.filter(c => c.status === "בתהליך").length,
        totalHours: courses.reduce((sum, c) => sum + parseFloat(c.duration), 0)
    };

    const achievements = [
        { title: "מומחה ביטוח בריאות", icon: "🏆", date: "דצמבר 2024", color: "bg-amber-500" },
        { title: "10 קורסים הושלמו", icon: "🎓", date: "נובמבר 2024", color: "bg-blue-500" },
        { title: "סוכן החודש", icon: "⭐", date: "אוקטובר 2024", color: "bg-purple-500" }
    ];

    return (
        <DashboardShell role="סוכן" navItems={AGENT_NAV_ITEMS}>
            <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
                {/* Header */}
                <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black font-display leading-none mb-4">מרכז הדרכה</h1>
                        <p className="text-sm font-medium text-white/80 max-w-2xl">
                            שפר את הידע והמיומנויות שלך. קורסים מקצועיים, הדרכות וחומרי למידה לסוכנים.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: "סך קורסים", value: stats.total, icon: "📚", color: "from-blue-600 to-indigo-700" },
                        { label: "הושלמו", value: stats.completed, icon: "✅", color: "from-success to-emerald-600" },
                        { label: "בתהליך", value: stats.inProgress, icon: "⚡", color: "from-amber-500 to-orange-600" },
                        { label: "שעות למידה", value: Math.round(stats.totalHours), icon: "⏱️", color: "from-purple-600 to-indigo-700" }
                    ].map((stat, i) => (
                        <Card key={i} className={`border-none p-6 text-white bg-linear-to-br ${stat.color} shadow-xl relative overflow-hidden group`}>
                            <div className="absolute -left-4 -bottom-4 text-white/5 text-7xl font-black group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">{stat.label}</p>
                                <h4 className="text-4xl font-black tracking-tighter font-display">{stat.value}</h4>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Categories */}
                <Card className="border-none shadow-lg bg-white p-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all ${selectedCategory === category
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Courses Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="border-none shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all group">
                            <div className={`h-2 w-full bg-linear-to-r ${course.color}`} />
                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${course.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                                        {course.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-primary group-hover:text-accent transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 mt-1">{course.category}</p>
                                    </div>
                                    <Badge className={
                                        course.status === "הושלם" ? "bg-success/10 text-success border-success/20" :
                                            course.status === "בתהליך" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                                "bg-blue-100 text-blue-600 border-blue-200"
                                    }>
                                        {course.status}
                                    </Badge>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                        <span>התקדמות</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-linear-to-r ${course.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${course.progress}%` }}
                                         />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">שיעורים</p>
                                        <p className="text-sm font-bold text-primary">{course.lessons} שיעורים</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">משך</p>
                                        <p className="text-sm font-bold text-primary">{course.duration}</p>
                                    </div>
                                </div>

                                <Button
                                    variant={course.status === "הושלם" ? "outline" : "secondary"}
                                    className="w-full"
                                >
                                    {course.status === "הושלם" ? "צפה שוב" : course.status === "בתהליך" ? "המשך לימוד" : "התחל קורס"}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Achievements */}
                <Card className="border-none shadow-xl bg-slate-900 text-white p-8">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                        <span className="text-accent">🏆</span> ההישגים שלי
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {achievements.map((achievement, i) => (
                            <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-center">
                                <div className={`h-16 w-16 rounded-full ${achievement.color} flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl`}>
                                    {achievement.icon}
                                </div>
                                <h3 className="text-base font-black mb-2">{achievement.title}</h3>
                                <p className="text-xs text-slate-400 font-bold">{achievement.date}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recommended */}
                <Card className="border-2 border-accent/20 bg-accent/5 p-8">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent text-xl animate-pulse">
                            ✨
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-primary mb-2">מומלץ בשבילך</h3>
                            <p className="text-sm text-slate-600 font-medium mb-4">
                                על בסיס הביצועים שלך, אנחנו ממליצים להשלים את הקורס "טכניקות מכירה מתקדמות" כדי לשפר את שיעור ההמרה שלך.
                            </p>
                            <Button variant="secondary" className="shadow-xl shadow-accent/20">
                                התחל קורס
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardShell>
    );
}
