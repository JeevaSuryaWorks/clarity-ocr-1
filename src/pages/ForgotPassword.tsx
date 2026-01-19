import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { sendPasswordResetEmail, AuthError } from 'firebase/auth';
import { auth } from '@/firebase';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      const authError = error as AuthError;
      let errorMessage = "An unexpected error occurred.";
      if (authError.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans p-4 relative overflow-hidden">

      {/* --- Global Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[20%] right-[-20%] w-[80vw] h-[80vw] bg-sky-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute bottom-[20%] left-[-20%] w-[80vw] h-[80vw] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group transition-transform hover:scale-105">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            C
          </div>
          <span className="text-2xl font-bold font-sora tracking-tight text-slate-900 dark:text-white">Clarity<span className="text-sky-600 dark:text-sky-400">OCR</span></span>
        </Link>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-2xl shadow-sky-900/5 ring-1 ring-white/20">
            <CardHeader className="text-center p-8 pb-4">
              <CardTitle className="text-2xl font-bold font-sora mb-2">Reset Password</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Enter your email to receive recovery instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-5">

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl flex flex-col items-center text-center border border-green-500/20"
                  >
                    <CheckCircle2 className="h-10 w-10 mb-2 text-green-500" />
                    <p className="font-semibold">Email Send!</p>
                    <p className="text-sm mt-1">Check your inbox for the password reset link.</p>
                    <Button variant="outline" className="mt-4 w-full border-green-500/30 hover:bg-green-500/10" onClick={() => setSuccess(false)}>
                      Resend Email
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-2 border border-red-500/20">
                          <AlertCircle className="h-5 w-5 flex-shrink-0" /> <p>{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 ml-1">Email Address</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`pl-11 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 ${error ? 'border-red-500' : ''}`}
                          placeholder="name@example.com"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                    </Button>
                  </form>
                )}
              </AnimatePresence>

            </CardContent>
            <CardFooter className="p-6 justify-center bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 rounded-b-3xl">
              <Link to="/login" className="flex items-center text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}