'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Users, User, ArrowRight, Sparkles } from 'lucide-react';

type UserRole = 'admin' | 'agent' | 'client';

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { demoLogin } = useAuth();

    const handleDemoLogin = () => {
        if (!selectedRole) {
            toast.error('אנא בחר סוג משתמש');
            return;
        }
        toast.success('מתחבר במצב Demo...');
        demoLogin(selectedRole);
    };

    const roles = [
        {
            id: 'admin' as UserRole,
            title: 'כניסת מנהלים',
            description: 'גישה מלאה לכל המערכת',
            icon: Shield,
            color: 'from-amber-500 to-orange-500',
        },
        {
            id: 'agent' as UserRole,
            title: 'כניסת סוכנים',
            description: 'ניהול לקוחות ומכירות',
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            id: 'client' as UserRole,
            title: 'כניסת לקוחות',
            description: 'צפייה בפוליסות ומסמכים',
            icon: User,
            color: 'from-green-500 to-emerald-500',
        },
    ];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) { toast.error('אנא בחר סוג משתמש'); return; }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error('משתמש לא נמצא במערכת');
            const userData = userDoc.data();
            if (userData.role !== selectedRole) { await auth.signOut(); throw new Error('תפקיד לא תואם'); }
            localStorage.setItem('userRole', userData.role);
            localStorage.setItem('userId', userCredential.user.uid);
            toast.success('התחברת בהצלחה!');
            router.push(userData.role === 'admin' ? '/admin' : userData.role === 'agent' ? '/agent' : '/client');
        } catch (error: any) {
            toast.error(error.message || 'שגיאה בהתחברות');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4"></div>
                    <h1 className="text-4xl font-bold text-white mb-2">מגן זהב CRM</h1>
                    <p className="text-gray-400">מערכת ניהול לסוכנויות ביטוח</p>
                </div>
                {!selectedRole ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((role, index) => (
                            <motion.button key={role.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => setSelectedRole(role.id)} className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all text-right overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                <div className="relative z-10">
                                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${role.color} mb-4`}><role.icon className="w-8 h-8 text-white" /></div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{role.title}</h3>
                                    <p className="text-gray-400 mb-6">{role.description}</p>
                                    <div className="flex items-center justify-end text-amber-500 font-medium"><span>המשך</span><ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" /></div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
                            <div className="text-center mb-6">
                                {roles.find((r) => r.id === selectedRole) && (() => {
                                    const role = roles.find((r) => r.id === selectedRole)!;
                                    return (<><div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${role.color} mb-3`}><role.icon className="w-6 h-6 text-white" /></div><h2 className="text-2xl font-bold text-white mb-1">{role.title}</h2><p className="text-gray-400 text-sm">{role.description}</p></>);
                                })()}
                            </div>
                            <button onClick={() => { setSelectedRole(null); setEmail(''); setPassword(''); }} className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2"><ArrowRight className="w-4 h-4 rotate-180" />חזור</button>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div><label className="block text-sm font-medium text-gray-300 mb-2">אימייל</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="your@email.com" required /></div>
                                <div><label className="block text-sm font-medium text-gray-300 mb-2">סיסמה</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="" required /></div>
                                <button type="submit" disabled={loading} className="w-full bg-amber-500 text-black font-bold py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? 'מתחבר...' : 'התחבר'}</button>
                            </form>
                            
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-transparent text-gray-500">או</span>
                                </div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={handleDemoLogin}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                כניסה מהירה (Demo)
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
