import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '@/firebase';
import {
    applyActionCode,
    verifyPasswordResetCode,
    confirmPasswordReset,
    checkActionCode
} from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

type ActionState = 'verifying' | 'success' | 'error' | 'reset-password';
type ActionMode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | null;

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.').regex(/[A-Z]/, 'Must contain an uppercase letter.').regex(/[0-9]/, 'Must contain a number.');

export default function AuthActionHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [state, setState] = useState<ActionState>('verifying');
    const [mode, setMode] = useState<ActionMode>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset Password States
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passError, setPassError] = useState<string | null>(null);

    const oobCode = searchParams.get('oobCode');
    const actionMode = searchParams.get('mode') as ActionMode;

    useEffect(() => {
        const processAction = async () => {
            if (!oobCode || !actionMode) {
                setErrorMsg('The link is invalid or incomplete.');
                setState('error');
                return;
            }

            setMode(actionMode);

            try {
                switch (actionMode) {
                    case 'verifyEmail':
                        await applyActionCode(auth, oobCode);
                        setState('success');
                        break;

                    case 'resetPassword':
                        const resetEmail = await verifyPasswordResetCode(auth, oobCode);
                        setEmail(resetEmail);
                        setState('reset-password');
                        break;

                    case 'recoverEmail':
                        // Optional: Handle email recovery if needed
                        const info = await checkActionCode(auth, oobCode);
                        setEmail(info.data.email || '');
                        await applyActionCode(auth, oobCode);
                        setState('success');
                        break;

                    default:
                        setErrorMsg('Unsupported authentication action.');
                        setState('error');
                }
            } catch (err: any) {
                console.error("Auth action error:", err);
                let msg = 'This link has expired or has already been used.';
                if (err.code === 'auth/invalid-action-code') msg = 'The security code is invalid.';
                if (err.code === 'auth/expired-action-code') msg = 'The link has expired. Please request a new one.';
                setErrorMsg(msg);
                setState('error');
            }
        };

        processAction();
    }, [oobCode, actionMode, navigate]);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError(null);

        if (newPassword !== confirmPassword) {
            setPassError('Passwords do not match.');
            return;
        }

        const result = passwordSchema.safeParse(newPassword);
        if (!result.success) {
            setPassError(result.error.issues[0].message);
            return;
        }

        if (!oobCode) return;

        setIsSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setState('success');
            toast({ title: "Success", description: "Your password has been reset successfully." });
        } catch (err: any) {
            setErrorMsg('Failed to update password. Please try again.');
            setState('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817] p-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={state}
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full max-w-md"
                >
                    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl overflow-hidden rounded-[2rem]">
                        <CardHeader className="text-center pt-10 pb-6 px-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                                    <ShieldCheck className="w-10 h-10" />
                                </div>
                            </div>

                            <CardTitle className="text-3xl font-bold text-white font-sora tracking-tight">
                                {state === 'verifying' && "Checking Secure Link"}
                                {state === 'success' && (mode === 'verifyEmail' ? "Email Verified" : "Password Reset")}
                                {state === 'error' && "Action Failed"}
                                {state === 'reset-password' && "New Password"}
                            </CardTitle>

                            <CardDescription className="text-slate-400 text-lg mt-2">
                                {state === 'verifying' && "Please wait while we validate your credentials."}
                                {state === 'success' && "Your account security has been updated."}
                                {state === 'reset-password' && `Creating a new password for ${email}`}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-10">
                            {state === 'verifying' && (
                                <div className="flex flex-col items-center py-8">
                                    <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
                                    <p className="text-slate-500 italic">Authenticating...</p>
                                </div>
                            )}

                            {state === 'success' && (
                                <div className="text-center space-y-6 py-4">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <p className="text-slate-300 leading-relaxed">
                                        Success! {mode === 'verifyEmail' ? "Your email is confirmed." : "Your password is corrected."} You can now access your dashboard.
                                    </p>
                                    <Button
                                        className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-500/20"
                                        onClick={() => navigate('/login')}
                                    >
                                        Continue to Login <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {state === 'error' && (
                                <div className="text-center space-y-6 py-4">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                                        <AlertCircle className="w-10 h-10" />
                                    </div>
                                    <p className="text-red-400 font-medium">
                                        {errorMsg}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 transition-all font-bold"
                                        onClick={() => navigate('/login')}
                                    >
                                        Return to Login
                                    </Button>
                                </div>
                            )}

                            {state === 'reset-password' && (
                                <form onSubmit={handlePasswordReset} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 ml-1">New Password</Label>
                                        <div className="relative group">
                                            <Input
                                                type={showPassword ? 'text' : 'password'}
                                                className="h-14 bg-slate-950/50 border-slate-800 rounded-xl focus:border-sky-500 focus:ring-sky-500/20 text-white pr-12 transition-all"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-300 ml-1">Confirm Password</Label>
                                        <Input
                                            type="password"
                                            className="h-14 bg-slate-950/50 border-slate-800 rounded-xl focus:border-sky-500 focus:ring-sky-500/20 text-white transition-all"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {passError && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {passError}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-14 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-xl shadow-sky-500/20 mt-4"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Secure Account"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>

                        <CardFooter className="bg-white/[0.02] border-t border-slate-800 h-16 flex items-center justify-center">
                            <p className="text-slate-500 text-sm">
                                Need help? <a href="/contact" className="text-sky-500 hover:text-sky-400 font-medium">Contact Support</a>
                            </p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
