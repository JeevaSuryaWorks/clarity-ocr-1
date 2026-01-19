import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { z } from 'zod';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

// --- Interactive 3D Binocular Icon ---
const InteractiveBinocularIcon = () => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateY = useTransform(springX, [-0.5, 0.5], ['-25deg', '25deg']);
  const rotateX = useTransform(springY, [-0.5, 0.5], ['25deg', '-25deg']);

  const shadowX = useTransform(springX, [-0.5, 0.5], ['-15px', '15px']);
  const shadowY = useTransform(springY, [-0.5, 0.5], ['-15px', '15px']);

  const glareX = useTransform(springX, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['5%', '95%']);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => { x.set(0); y.set(0); };

    const currentRef = ref.current;
    if (currentRef) {
      currentRef.addEventListener('mousemove', handleMouseMove);
      currentRef.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('mousemove', handleMouseMove);
        currentRef.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [x, y]);

  return (
    <div ref={ref} className="w-full h-24 md:h-28 flex items-center justify-center mb-2 cursor-grab perspective-1000">
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-24 h-16 md:w-32 md:h-24"
      >
        <motion.div
          className="absolute inset-0 bg-sky-500/30 dark:bg-sky-500/20 rounded-full blur-3xl transform translate-y-4"
          style={{ x: shadowX, y: shadowY }}
        />
        <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full drop-shadow-2xl" style={{ transform: 'translateZ(25px)' }}>
          <defs>
            <radialGradient id="lens-glare" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.6)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0)', stopOpacity: 1 }} />
            </radialGradient>
            <linearGradient id="body-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <path d="M10 20 L2 35 V 65 L10 75 H35 L42 65 V 35 L35 20 H10 Z M65 20 L58 35 V 65 L65 75 H90 L98 65 V 35 L90 20 H65 Z" fill="url(#body-gradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <path d="M42 45 H 58 V 55 H 42 Z" fill="#334155" />
          <circle cx="50" cy="15" r="3" fill="#334155" />
          <g>
            <circle cx="23.5" cy="48" r="16" fill="#1e293b" />
            <motion.circle cx={glareX} cy={glareY} r="8" fill="url(#lens-glare)" />
          </g>
          <g>
            <circle cx="76.5" cy="48" r="16" fill="#1e293b" />
            <motion.circle cx={glareX} cy={glareY} r="8" fill="url(#lens-glare)" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormErrors = { email?: string; password?: string; general?: string };
type LoadingState = 'idle' | 'email-password' | 'google' | 'initializing';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('initializing');
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithGoogle } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = location.state?.from?.pathname || redirectParam || '/';

  // Check auth state and handle redirect
  useEffect(() => {
    if (user) {
      if (!user.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      // If no user, check remember me
      const rememberedEmail = localStorage.getItem('clarityOcrRememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
      setLoadingState('idle');
    }
  }, [user, navigate, from]);

  const handleGoogleLogin = async () => {
    setLoadingState('google');
    try {
      await loginWithGoogle();
      // Navigation handled by useEffect
    } catch (error) {
      setErrors({ general: "Failed to sign in with Google." });
      setLoadingState('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach(issue => { fieldErrors[issue.path[0] as keyof FormErrors] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    setLoadingState('email-password');
    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        localStorage.setItem('clarityOcrRememberedEmail', email);
      } else {
        localStorage.removeItem('clarityOcrRememberedEmail');
      }
      // Navigation handled by useEffect
    } catch (error: any) {
      const authError = error as AuthError;
      let errorMessage = "An unexpected error occurred.";
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Try again later.";
          break;
      }
      setErrors({ general: errorMessage });
      setLoadingState('idle');
    }
  };

  if (loadingState === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020817]">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans p-4 relative overflow-hidden">

      {/* --- Global Background Effects --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-sky-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Branding Header */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group transition-transform hover:scale-105">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
            C
          </div>
          <span className="text-2xl font-bold font-sora tracking-tight text-slate-900 dark:text-white">Clarity<span className="text-sky-600 dark:text-sky-400">OCR</span></span>
        </Link>

        {/* Login Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-2xl shadow-sky-900/5 ring-1 ring-white/20">
            <CardHeader className="text-center p-8 pb-4">
              <InteractiveBinocularIcon />
              <CardTitle className="text-2xl font-bold font-sora mb-2">Welcome Back</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Enter your credentials to access your workspace</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-5">

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-medium transition-all"
                onClick={handleGoogleLogin}
                disabled={loadingState !== 'idle'}
              >
                {loadingState === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#0F1629] px-3 py-1 rounded text-slate-400">Or continue with</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {errors.general && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-sm p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-2 border border-red-500/20">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" /> <p>{errors.general}</p>
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
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-11 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 ${errors.email ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="name@example.com"
                      disabled={loadingState !== 'idle'}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 mt-1 ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pl-11 pr-11 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-sky-500/20 ${errors.password ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      placeholder="••••••••"
                      disabled={loadingState !== 'idle'}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1 ml-1">{errors.password}</p>}
                </div>

                <div className="flex items-center space-x-2 ml-1">
                  <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(c) => setRememberMe(!!c)} />
                  <Label htmlFor="remember-me" className="text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer">Remember me for 30 days</Label>
                </div>

                <Button type="submit" size="lg" className="w-full h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loadingState !== 'idle'}>
                  {loadingState === 'email-password' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="p-6 justify-center bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 rounded-b-3xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">Don't have an account? <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">Get started for free</Link></p>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

// Helper checkbox component if not imported
function Checkbox({ id, checked, onCheckedChange }: { id: string, checked: boolean, onCheckedChange: (c: boolean) => void }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onCheckedChange(e.target.checked)}
      className="peer h-4 w-4 shrink-0 rounded border border-slate-300 dark:border-slate-600 focus-visible:outline-none focus:ring-2 focus:ring-sky-500 checked:bg-sky-600 checked:border-sky-600 cursor-pointer"
    />
  )
}
