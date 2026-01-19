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

      <div className="w-full max-w-lg z-10 relative flex flex-col h-[90vh] md:h-auto justify-center">

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8 px-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="relative h-1.5 flex-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
              <motion.div
                initial={false}
                animate={{ width: index <= currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute left-0 top-0 h-full w-full ${index <= currentStep ? 'bg-sky-600 dark:bg-sky-500' : ''}`}
              />
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden min-h-[500px]">
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
              <Card className="h-full border border-slate-200/50 dark:border-slate-700/50 shadow-2xl bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardContent className="flex flex-col items-center text-center p-8 h-full">

                  {!isRoleStep ? (
                    // Standard Intro Steps
                    <>
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className={`relative p-8 rounded-[2rem] mb-10 ${steps[currentStep].color} ring-1 ${steps[currentStep].ring}`}
                      >
                        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 rounded-[2rem] blur-sm" />
                        <div className="relative z-10">{steps[currentStep].icon}</div>
                        {currentStep === 0 && <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400 fill-yellow-400 animate-pulse" />}
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold font-sora mb-6 tracking-tight"
                      >
                        {steps[currentStep].title}
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed"
                      >
                        {steps[currentStep].description}
                      </motion.p>
                    </>
                  ) : (
                    // Role Selection Step
                    <>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full flex flex-col">
                        <h2 className="text-2xl font-bold font-sora mb-2">How will you use Clarity?</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">We'll customize your experience.</p>

                        <div className="flex-1 space-y-3">
                          {ROLES.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => setSelectedRole(role.id)}
                              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 ${selectedRole === role.id
                                ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-900/20 ring-1 ring-sky-500 shadow-md scale-[1.02]'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                              <div className={`p-3 rounded-lg ${selectedRole === role.id ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                <role.icon className="w-6 h-6" />
                              </div>
                              <div className="text-left">
                                <div className={`font-bold ${selectedRole === role.id ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>{role.label}</div>
                                <div className="text-xs text-slate-500">{role.description}</div>
                              </div>
                              {selectedRole === role.id && <Check className="ml-auto w-5 h-5 text-sky-600 dark:text-sky-400" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex flex-col gap-4 px-2">
          <Button
            size="lg"
            onClick={() => isRoleStep ? handleFinish() : paginate(1)}
            className={`w-full h-14 text-lg rounded-full shadow-xl transition-all duration-300 ${isRoleStep
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:scale-[1.02] hover:shadow-sky-500/25 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
            disabled={isCompleting || (isRoleStep && !selectedRole)}
          >
            {isRoleStep ? (
              <span className="flex items-center gap-2 font-bold">
                Get Started <Check className="w-5 h-5" />
              </span>
            ) : (
              <span className="flex items-center gap-2 font-bold">
                Continue <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          <div className="flex justify-between items-center h-10 px-2">
            {currentStep > 0 ? (
              <button
                onClick={() => paginate(-1)}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                disabled={isCompleting}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
          </div>
        </div>

      </div>
    </div>
  );
}