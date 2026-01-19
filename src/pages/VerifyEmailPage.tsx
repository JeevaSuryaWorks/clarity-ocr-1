import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sendEmailVerification, reload } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Poll for verification status
    const interval = setInterval(async () => {
      if (user && !user.emailVerified) {
        try {
          await reload(user);
          if (user.emailVerified) {
            clearInterval(interval);
            // Let the AuthContext/useEffect redirect naturally or force it
            navigate('/dashboard');
          }
        } catch (e) {
          console.error("Error reloading user", e);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleResendEmail = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setEmailSent(true);
      // Reset success message after 5 seconds
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a moment.");
      } else {
        setError("Failed to resend email. Tru again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!user) return;
    setVerifying(true);
    try {
      await reload(user);
      if (user.emailVerified) {
        navigate('/dashboard');
      } else {
        setError("Email not verified yet.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Failed to check status.");
    } finally {
      setVerifying(false);
    }
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans p-4 relative overflow-hidden">

      {/* --- Global Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[30%] w-[60vw] h-[60vw] bg-sky-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute bottom-[20%] left-[10%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            C
          </div>
          <span className="text-2xl font-bold font-sora tracking-tight text-slate-900 dark:text-white">Clarity<span className="text-sky-600 dark:text-sky-400">OCR</span></span>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-2xl shadow-sky-900/5 ring-1 ring-white/20">
            <CardHeader className="text-center p-8 pb-4">
              <div className="mx-auto w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-4 text-sky-600 dark:text-sky-400">
                <Mail className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold font-sora mb-2">Verify your Email</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                We've encryped a verification link to <span className="font-semibold text-slate-900 dark:text-slate-200">{user.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 border border-red-500/20 justify-center">
                    <AlertCircle className="h-4 w-4" /> {error}
                  </motion.div>
                )}
                {emailSent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2 border border-green-500/20 justify-center">
                    <CheckCircle2 className="h-4 w-4" /> Email sent successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <Button onClick={handleManualCheck} className="w-full h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-xl shadow-sky-500/20" disabled={verifying}>
                {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "I've Verified My Email"}
              </Button>

              <Button variant="outline" onClick={handleResendEmail} className="w-full h-12 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={loading || emailSent}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (emailSent ? `Sent!` : 'Resend Verification Email')}
              </Button>

            </CardContent>
            <CardFooter className="p-6 justify-center bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 rounded-b-3xl">
              <button onClick={logout} className="flex items-center text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}