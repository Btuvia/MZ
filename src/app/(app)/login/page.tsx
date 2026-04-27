'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, ArrowRight, Sparkles, Lock, Mail, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { NeonCard, NeonButton, NeonInput } from '@/components/ui/neon-form';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth, db } from '@/lib/firebase/firebase';

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
        toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
            loading: 'מתחבר למערכת ה-Demo...',
            success: () => {
                demoLogin(selectedRole!);
                return 'התחברת בהצלחה!';
            },
            error: 'שגיאה בהתחברות'
        });
    };

    const roles = [
        {
            id: 'admin' as UserRole,
            title: 'ניהול מערכת',
            description: 'גישה מלאה למנהלי הסוכנות',
            icon: Shield,
            color: 'amber',
        },
        {
            id: 'agent' as UserRole,
            title: 'אזור סוכנים',
            description: 'ניהול תיקי לקוחות ומכירות',
            icon: Users,
            color: 'blue',
        },
        {
            id: 'client' as UserRole,
            title: 'אזור לקוחות',
            description: 'צפייה בתיק הביטוח האישי',
            icon: User,
            color: 'purple',
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
        <div className="min-h-screen bg-[#050810] flex items-center justify-center p-6 selection:bg-amber-500/30 overflow-hidden relative" dir="rtl">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl w-full relative z-10">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-amber-600 via-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-3xl shadow-[0_0_30px_rgba(245,158,11,0.4)] italic">Z</div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter">
                            מגדל <span className="text-amber-500">זהב</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold tracking-[0.2em] uppercase text-xs">Premium CRM Interface</p>
                </div>

                <AnimatePresence mode="wait">
                    {!selectedRole ? (
                        <motion.div 
                            key="role-selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8"
                        >
                            {roles.map((role, index) => (
                                <button 
                                    key={role.id} 
                                    onClick={() => setSelectedRole(role.id)}
                                    className="group relative"
                                >
                                    <NeonCard className="p-10! text-right h-full border-slate-800/80 group-hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2">
                                        <div className={`h-16 w-16 rounded-2xl bg-${role.color}-500/10 border border-${role.color}-500/20 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform`}>
                                            <role.icon className={`w-8 h-8 text-${role.color === 'amber' ? 'amber-500' : role.color === 'blue' ? 'blue-400' : 'purple-400'}`} />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-3 italic tracking-tight">{role.title}</h3>
                                        <p className="text-slate-500 font-bold leading-relaxed mb-8">{role.description}</p>
                                        <div className="flex items-center gap-2 text-amber-500 font-black italic text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                            <span>כניסה למערכת</span>
                                            <ArrowRight size={16} className="rotate-180" />
                                        </div>
                                    </NeonCard>
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="login-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="max-w-md mx-auto"
                        >
                            <NeonCard className="p-12! border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                                <div className="flex items-center justify-between mb-10">
                                    <button 
                                        onClick={() => { setSelectedRole(null); setEmail(''); setPassword(''); }} 
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                    <div className="text-right">
                                        <h2 className="text-2xl font-black text-white italic tracking-tighter">
                                            {roles.find(r => r.id === selectedRole)?.title}
                                        </h2>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mt-1">Authentication Required</p>
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-8">
                                    <NeonInput 
                                        label="אימייל" 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        placeholder="your@email.com" 
                                        required 
                                        autoFocus
                                    />
                                    <NeonInput 
                                        label="סיסמה" 
                                        type="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        placeholder="••••••••" 
                                        required 
                                    />
                                    
                                    <NeonButton 
                                        type="submit" 
                                        disabled={loading} 
                                        className="w-full py-6! text-lg! shadow-xl shadow-amber-500/20"
                                    >
                                        {loading ? 'מתחבר...' : 'התחבר למערכת'}
                                    </NeonButton>
                                </form>
                                
                                <div className="relative my-10">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="px-4 bg-[#0a0e1a] text-slate-600">Access Mode</span></div>
                                </div>
                                
                                <NeonButton
                                    type="button"
                                    onClick={handleDemoLogin}
                                    variant="secondary"
                                    className="w-full py-6! text-lg! border-blue-500!/30 text-blue-400! hover:border-blue-500! shadow-xl shadow-blue-500/10 group"
                                >
                                    <Sparkles className="w-5 h-5 ml-2 group-hover:scale-125 transition-transform" />
                                    כניסה מהירה (Demo)
                                </NeonButton>
                            </NeonCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
