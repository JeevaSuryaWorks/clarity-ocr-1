import React, { useEffect } from 'react';
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, Sparkles, ArrowLeft, Home, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock } from 'lucide-react';

// --- Animations & Variants ---

const containerVar = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const itemVar: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 50,
            damping: 20
        }
    }
};

// --- Components ---

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
}

const TiltCard = ({ children, className = "" }: TiltCardProps) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }
    // ... (rest of code)

    // ...

    return (
        <div
            className={`group relative border border-white/10 bg-white/5 overflow-hidden rounded-xl ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
        radial-gradient(
          650px circle at ${mouseX}px ${mouseY}px,
          rgba(14, 165, 233, 0.15),
          transparent 80%
        )
      `,
                }}
            />
            {children}
        </div>
    );
};

const GuidePage: React.FC = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [paymentStatus, setPaymentStatus] = React.useState<Record<string, boolean>>({});

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        // Real-time listener
        const unsub = onSnapshot(doc(db, "settings", "team_payment_status"), (doc) => {
            if (doc.exists()) {
                setPaymentStatus(doc.data() as Record<string, boolean>);
            }
        });

        // Initial "Birthday Boom" Confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#0ea5e9', '#6366f1', '#a855f7']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#0ea5e9', '#6366f1', '#a855f7']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        // Big boom in the center after a slight delay
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0ea5e9', '#6366f1', '#a855f7', '#FFD700']
            });
        }, 800);

        return () => unsub();

    }, []);

    return (
        <div className="min-h-screen bg-[#020817] text-slate-100 font-sans selection:bg-sky-500/30 overflow-x-hidden">

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 origin-left z-[100]"
                style={{ scaleX }}
            />

            {/* --- Navigation --- */}
            <nav className="fixed top-0 left-0 right-0 p-6 z-50 flex justify-between items-center bg-transparent pointer-events-none">
                <div className="pointer-events-auto">
                    <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white hover:bg-white/5" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>
                <div className="pointer-events-auto">
                    <Button variant="outline" className="gap-2 border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/10 text-white" onClick={() => navigate('/')}>
                        <Home className="w-4 h-4" /> Home
                    </Button>
                </div>
            </nav>

            {/* --- Background Effects --- */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-sky-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <main className="relative max-w-7xl mx-auto px-6 py-32 space-y-32">

                {/* --- Hero Section --- */}
                <header className="text-center space-y-8 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-400 text-sm font-medium"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Final Year Project 2025</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-bold tracking-tight"
                    >
                        Meet the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">Visionaries</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                        Crafting the future of document intelligence with passion, precision, and chaos-extracting code.
                    </motion.p>
                </header>

                {/* --- Mentors Section --- */}
                <motion.section
                    variants={containerVar}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="space-y-16"
                >
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
                            <GraduationCap className="w-8 h-8 text-indigo-400" />
                            Our Mentors
                        </h2>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            The guiding lights who transformed our wild ideas into a structured reality.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Faculty Guide */}
                        <TiltCard className="h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                            <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-2xl shadow-indigo-500/20">
                                    <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center overflow-hidden">
                                        <motion.img
                                            src="/mentors/parvatham.png"
                                            alt="Mrs. K. Parvatham"
                                            className="w-full h-full object-cover object-top"
                                            initial={{ scale: 1.2, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Mrs. K. Parvatham M.E.</h3>
                                    <p className="text-indigo-400 font-medium">Faculty Guide</p>
                                </div>
                                <div className="space-y-3 w-full pt-6 border-t border-white/5">
                                    <p className="text-slate-400 italic">"Expert Supervision & Project Architecture"</p>
                                    <div className="flex justify-center gap-3">
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">System Design</div>
                                        <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">Quality Assurance</div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>

                        {/* Project Incharge */}
                        <TiltCard className="h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                            <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-[2px] shadow-2xl shadow-purple-500/20">
                                    <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center overflow-hidden">
                                        <motion.img
                                            src="/mentors/ashok.png"
                                            alt="Mr. K. Ashok Kumar"
                                            className="w-full h-full object-cover object-top"
                                            initial={{ scale: 1.2, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Mr. K. Ashok Kumar B.E.</h3>
                                    <p className="text-purple-400 font-medium">Project Incharge</p>
                                </div>
                                <div className="space-y-3 w-full pt-6 border-t border-white/5">
                                    <p className="text-slate-400 italic">"Technical Strategy & Resource Management"</p>
                                    <div className="flex justify-center gap-3">
                                        <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">Tech Stack</div>
                                        <div className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-300 text-xs border border-pink-500/20">Deployment</div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>
                    </div>
                </motion.section>

                {/* --- Team Section --- */}
                <motion.section
                    variants={containerVar}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="space-y-16"
                >
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
                            <Users className="w-8 h-8 text-sky-400" />
                            The Builders
                        </h2>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            Four minds, thousands of lines of code, one shared vision.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <TeamMember
                            name="Jeevasurya"
                            role="Team Lead & Full Stack"
                            id="24506375"
                            initials="JS"
                            color="amber"
                            isLead={true}
                            isPaid={!!paymentStatus["24506375"]}
                        />
                        <TeamMember
                            name="Gokul S"
                            role="Developer"
                            id="24506364"
                            initials="GS"
                            color="indigo"
                            delay={0.1}
                            isPaid={!!paymentStatus["24506364"]}
                        />
                        <TeamMember
                            name="Gokulsanjay V"
                            role="Developer"
                            id="24506365"
                            initials="GV"
                            color="violet"
                            delay={0.2}
                            isPaid={!!paymentStatus["24506365"]}
                        />
                        <TeamMember
                            name="Gokulraj M"
                            role="Developer"
                            id="24506366"
                            initials="GM"
                            color="fuchsia"
                            delay={0.3}
                            isPaid={!!paymentStatus["24506366"]}
                        />
                    </div>
                </motion.section>

            </main>
        </div>
    );
};

// --- Sub-components ---

// --- Sub-components ---

const TeamMember = ({ name, role, id, initials, color, isLead = false, isPaid = false }: any) => {
    // Dynamic color classes map
    const colorMap: any = {
        sky: "from-sky-500 to-cyan-500 shadow-sky-500/20 text-sky-400",
        indigo: "from-indigo-500 to-blue-600 shadow-indigo-500/20 text-indigo-400",
        violet: "from-violet-500 to-purple-600 shadow-violet-500/20 text-violet-400",
        fuchsia: "from-fuchsia-500 to-pink-600 shadow-fuchsia-500/20 text-fuchsia-400",
        amber: "from-amber-400 to-orange-600 shadow-amber-500/30 text-amber-400" // Premium Gold
    };

    const gradient = colorMap[color] || colorMap.sky;
    const borderColor = isLead ? "border-amber-500/30 bg-amber-500/5" : "bg-white/[0.02]";

    // Logic for Locked State
    // If NOT paid:
    // - Name -> "Amount Not Paid"
    // - Role -> "Pay 950 Rupees to Enable name"
    // - Initials -> "$"
    // - Show Lock Icon

    const displayName = isPaid ? name : "Amount Not Paid";
    const displayRole = isPaid ? role : "Pay 980 Rupees to Enable name";
    const displayInitials = isPaid ? initials : "$";

    // Derived styles for locked state
    const lockedGradient = "from-red-900/20 to-red-950/30 shadow-red-500/5 text-red-500/50";
    const currentGradient = isPaid ? gradient : lockedGradient;
    const lockedBorder = "border-red-500/20 bg-red-500/5 hover:bg-red-500/10";
    const currentBorder = isPaid ? borderColor : lockedBorder;

    return (
        <motion.div variants={itemVar} className="h-full relative">
            {isLead && isPaid && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="flex items-center gap-1 bg-amber-500 text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-lg shadow-amber-500/40 animate-pulse">
                        <Crown className="w-3 h-3" /> Team Lead
                    </span>
                </div>
            )}
            <TiltCard className={`h-full ${currentBorder} transition-colors group/card`}>
                <div className="p-6 flex flex-col items-center text-center h-full pt-8">

                    <div className="mb-6 relative group">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${currentGradient} blur-xl opacity-20 group-hover:opacity-60 transition-opacity`} />
                        <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${currentGradient} p-[2px] mb-2`}>
                            <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center text-xl font-bold text-white relative overflow-hidden">
                                {displayInitials}
                                {!isPaid && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[2px] gap-2">
                                        <Lock className="w-6 h-6 text-red-500" />
                                        <span className="text-[10px] font-mono text-red-400/80 uppercase tracking-wider">Locked</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1 w-full">
                        <h3 className={`text-xl font-bold ${isPaid ? (isLead ? 'text-amber-100' : 'text-white') : 'text-red-500 font-mono tracking-tight'} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all`}>
                            {displayName}
                        </h3>
                        <div className={`px-3 py-2 rounded-lg ${isPaid ? '' : 'bg-red-500/10 border border-red-500/20'}`}>
                            <p className={`text-sm font-medium ${isPaid ? (isLead ? 'text-amber-400' : gradient.split(" ").pop()) : 'text-red-400'}`}>
                                {displayRole}
                            </p>
                        </div>
                    </div>

                    <div className="w-full pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span className="opacity-50">Register Number</span>
                        <span className="text-slate-300">{id}</span>
                    </div>
                </div>
            </TiltCard>
        </motion.div>
    );
}


export default GuidePage;
