import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Scan, CheckSquare, ArrowRight, Check, ChevronLeft, Sparkles,
  GraduationCap, Briefcase, Building2
} from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Clarity OCR',
    description: 'Turn your physical documents into digital data instantly. No more manual typing.',
    icon: <Scan className="w-16 h-16 text-sky-600 dark:text-sky-400" />,
    color: 'bg-sky-500/10',
    ring: 'ring-sky-500/20'
  },
  {
    id: 'extract',
    title: 'AI Smart Extraction',
    description: 'Upload invoices or contracts. Our AI automatically identifies dates, totals, and key terms.',
    icon: <CheckSquare className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />,
    color: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/20'
  }
];

// Role Selection Step Data
const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, description: 'Notes & Research' },
  { id: 'professional', label: 'Professional', icon: Briefcase, description: 'Productivity & Docs' },
  { id: 'business', label: 'Business', icon: Building2, description: 'Teams & Workflow' }
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  })
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  // Total steps = Intro Steps + Role Step
  const totalSteps = steps.length + 1;

  const paginate = useCallback((newDirection: number) => {
    const nextStep = currentStep + newDirection;
    if (nextStep >= 0 && nextStep < totalSteps) {
      setDirection(newDirection);
      setCurrentStep(nextStep);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [currentStep, totalSteps]);

  const handleFinish = async () => {
    if (!selectedRole && currentStep === totalSteps - 1) return; // Prevent finishing without role

    setIsCompleting(true);
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]);

    try {
      // 1. Save Role Preference
      if (user && selectedRole) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          usageIntent: selectedRole,
          lastActive: new Date()
        });
      }

      // 2. Complete Onboarding
      await completeOnboarding();
      navigate('/');
    } catch (error) {
      console.error("Onboarding failed", error);
      setIsCompleting(false);
    }
  };

  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipeConfidenceThreshold = 10000;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeConfidenceThreshold) {
      if (currentStep < totalSteps - 1) paginate(1);
    } else if (swipePower > swipeConfidenceThreshold) {
      if (currentStep > 0) paginate(-1);
    }
  };

  const isRoleStep = currentStep === steps.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020817] p-4 font-sans relative overflow-hidden text-slate-900 dark:text-slate-50">

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-sky-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-3xl z-10 relative flex flex-col min-h-[100dvh] md:min-h-0 md:h-auto justify-center px-4 md:px-0 py-8">

        {/* Progress Indicator */}
        <div className="flex gap-3 mb-10 px-6">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="relative h-2 flex-1 rounded-full overflow-hidden bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <motion.div
                initial={false}
                animate={{ width: index <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute left-0 top-0 h-full w-full ${index <= currentStep ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : ''}`}
              />
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden flex-1 md:flex-none min-h-[500px] md:min-h-[550px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag={!isRoleStep ? "x" : false} // Disable drag on role step to prevent accidental swipes
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute w-full h-full touch-pan-y"
            >
              <Card className="h-full border border-white/20 dark:border-slate-700/30 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)] bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center text-center p-8 md:p-14 h-full">

                  {!isRoleStep ? (
                    // Standard Intro Steps
                    <div className="flex flex-col items-center justify-center h-full w-full max-w-xl mx-auto">
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className={`relative p-10 md:p-12 rounded-[2.5rem] mb-12 ${steps[currentStep].color} ring-1 ${steps[currentStep].ring}`}
                      >
                        <div className="absolute inset-0 bg-white/40 dark:bg-white/5 rounded-[2.5rem] blur-xl" />
                        <div className="relative z-10 scale-125 md:scale-150">{steps[currentStep].icon}</div>
                        {currentStep === 0 && <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse" />}
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl md:text-5xl font-bold font-sora mb-6 tracking-tight text-slate-800 dark:text-white"
                      >
                        {steps[currentStep].title}
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-600 dark:text-slate-400 text-lg md:text-xl leading-relaxed max-w-md mx-auto"
                      >
                        {steps[currentStep].description}
                      </motion.p>
                    </div>
                  ) : (
                    // Role Selection Step
                    <div className="w-full h-full flex flex-col justify-center">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-sora mb-3">How will you use Clarity?</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">We'll customize your dashboard experience.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl mx-auto px-2">
                          {ROLES.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => setSelectedRole(role.id)}
                              className={`relative w-full p-6 md:p-8 rounded-3xl border flex flex-col items-center text-center transition-all duration-300 group ${
                                selectedRole === role.id
                                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/20 ring-2 ring-sky-500 shadow-xl shadow-sky-500/10 scale-105'
                                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-sky-200 hover:scale-[1.02]'
                              }`}
                            >
                              <div className={`p-4 rounded-full mb-4 transition-colors ${selectedRole === role.id ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600'}`}>
                                <role.icon className="w-8 h-8 md:w-10 md:h-10" />
                              </div>
                              <div className="w-full">
                                <div className={`font-bold text-lg md:text-xl mb-2 ${selectedRole === role.id ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>{role.label}</div>
                                <div className="text-sm md:text-base text-slate-500">{role.description}</div>
                              </div>
                              {selectedRole === role.id && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4">
                                  <Check className="w-6 h-6 text-sky-500" />
                                </motion.div>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex flex-col md:flex-row-reverse gap-4 px-6 md:px-2 md:items-center">
          <Button
            size="lg"
            onClick={() => isRoleStep ? handleFinish() : paginate(1)}
            className={`w-full md:w-auto md:min-w-[200px] h-14 md:h-16 text-lg rounded-full shadow-xl transition-all duration-300 ${
              isRoleStep
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:scale-[1.02] hover:shadow-sky-500/25 text-white'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
            }`}
            disabled={isCompleting || (isRoleStep && !selectedRole)}
          >
            {isRoleStep ? (
              <span className="flex items-center justify-center gap-2 font-bold w-full">
                Get Started <Check className="w-6 h-6" />
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 font-bold w-full">
                Continue <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </Button>

          <div className="flex justify-center md:justify-start items-center h-10 flex-1">
            {currentStep > 0 && (
              <button
                onClick={() => paginate(-1)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-widest"
                disabled={isCompleting}
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}