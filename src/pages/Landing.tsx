import { useState, useEffect } from 'react';
import { Menu, X, Star, ArrowRight, Sparkles, ChevronRight, Zap, Shield, Globe, ScanLine, Wand2, Github, Linkedin, Twitter, ThumbsUp, HelpCircle, CreditCard, Lock, Zap as Lightning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import Hyperspeed from '@/components/ui/Hyperspeed';
import { hyperspeedPresets } from '@/components/ui/HyperSpeedPresets';
import Marquee from '@/components/ui/marquee';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// --- Constants & Data ---
const FEATURES_DATA = [
    {
        icon: Zap,
        title: "Lightning Fast OCR",
        description: "Transform documents into text in milliseconds. Our optimized engine handles bulk uploads with zero lag.",
        className: "md:col-span-2",
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        details: {
            title: "Performance & Scale",
            longDescription: "Clarity OCR utilizes high-speed transformer-based models optimized for throughput. Whether you're processing a single receipt or a 500-page manual, our architecture ensures results are delivered in the blink of an eye.",
            benefits: ["Sub-100ms per page extraction", "Multi-threaded batch processing", "Native hardware acceleration support"]
        }
    },
    {
        icon: Shield,
        title: "Bank-Grade Security",
        description: "AES-256 encryption. Your data is processed in memory and wiped immediately.",
        className: "md:col-span-1",
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        details: {
            title: "Security & Privacy",
            longDescription: "Your privacy is our priority. We employ industry-standard encryption and follow strict data handling protocols. We never store your documents permanently unless explicitly requested.",
            benefits: ["AES-256 end-to-end encryption", "SOC2 Type II compliant infrastructure", "In-memory processing - no disk traces"]
        }
    },
    {
        icon: Globe,
        title: "Global Language Support",
        description: "Recognizes 30+ languages, including complex scripts and handwriting.",
        className: "md:col-span-1",
        bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        details: {
            title: "Global Compatibility",
            longDescription: "Break language barriers with support for over 30 languages, including right-to-left scripts and complex characters. Our models are trained on diverse datasets to handle handwriting and degraded scans with high accuracy.",
            benefits: ["Latin, Cyrillic, and Asian script support", "Handwriting recognition (ICR)", "Automatic language detection"]
        }
    },
    {
        icon: Wand2,
        title: "Contextual AI Analysis",
        description: "Don't just extract text. Understand it. Automatically categorize receipts, invoices, and legal docs.",
        className: "md:col-span-2",
        bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        details: {
            title: "Intelligent Extraction",
            longDescription: "Raw text is just the beginning. Our intelligent layer identifies the type of document and extracts key-value pairs like dates, totals, and line items, transforming scans into structured JSON data.",
            benefits: ["Automated document categorization", "Intelligent entity extraction", "Export directly to ERP/Accounting tools"]
        }
    }
];

const TESTIMONIALS = [
    { name: "Sarah Jenkins", role: "Product Manager", content: "Clarity OCR saved my team 15+ hours a week. It's not just OCR; it's a productivity superpower.", rating: 5, bg: "bg-pink-100 dark:bg-pink-900/20" },
    { name: "Ashwin Kumar", role: "Data Scientist", content: "The API is incredibly robust. We integrated it into our pipeline in less than an hour.", rating: 5, bg: "bg-cyan-100 dark:bg-cyan-900/20" },
    { name: "David Ross", role: "Legal Consultant", content: "Finding clauses in scanned contracts used to take days. Now it takes seconds.", rating: 5, bg: "bg-violet-100 dark:bg-violet-900/20" }
];

const REAL_COMPANIES = [
    { name: "Google", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/google.svg" },
    { name: "Amazon", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/amazon.svg" },
    { name: "Netflix", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/netflix.svg" },
    { name: "OpenAI", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/openai.svg" },
    { name: "Adobe", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/adobe.svg" },
    { name: "Apple", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/apple.svg" },
    { name: "Salesforce", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/salesforce.svg" },
    { name: "Uber", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/uber.svg" },
    { name: "Spotify", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/spotify.svg" },
    { name: "Airbnb", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/airbnb.svg" },
    { name: "Stripe", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/stripe.svg" },
    { name: "Oracle", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/oracle.svg" },
    { name: "Intel", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/intel.svg" },
];

const FAQ_CATEGORIES = [
    {
        id: "product",
        name: "Product & Technology",
        icon: Lightning,
        items: [
            {
                question: "How accurate is the OCR?",
                answer: "We leverage state-of-the-art transformer models to achieve 99%+ accuracy on printed text. Our engine is specifically tuned for complex layouts, table extraction, and even challenging handwriting that traditional legacy OCR tools often miss."
            },
            {
                question: "What file formats do you support?",
                answer: "Clarity OCR supports all major document and image formats including PDF, JPG, PNG, TIFF, BMP, and WEBP. You can export results to structured JSON, plain text, or searchable PDF formats."
            },
            {
                question: "Does it support handwriting?",
                answer: "Yes, our Intelligent Character Recognition (ICR) engine is trained on millions of handwritten samples across 20+ languages, enabling it to extract text from notes, forms, and signatures with high fidelity."
            }
        ]
    },
    {
        id: "security",
        name: "Security & Privacy",
        icon: Lock,
        items: [
            {
                question: "Is my data secure?",
                answer: "Security is baked into our DNA. We use enterprise-grade AES-256 encryption for data at rest and TLS 1.3 for data in transit. We are SOC2 Type II compliant and offer data residency options for enterprise customers."
            },
            {
                question: "Do you store processing data?",
                answer: "By default, we follow a 'privacy-first' approach. Files are processed in volatile memory and purged immediately after extraction. We do not use your private documents to train our public models."
            }
        ]
    },
    {
        id: "billing",
        name: "Billing & Plans",
        icon: CreditCard,
        items: [
            {
                question: "Can I try it for free?",
                answer: "Absolutely! Our Free Tier includes 10 document credits per month so you can test our extraction quality. No credit card is required to start, and you can upgrade or downgrade at any time."
            },
            {
                question: "Do you offer API access?",
                answer: "Yes, our Developer and Enterprise plans include full API access with dedicated documentation and SDKs for Python, Node.js, and Go. Integrate document intelligence directly into your workflow."
            }
        ]
    }
];

export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeFaqCategory, setActiveFaqCategory] = useState("product");
    const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});

    const handleHelpful = (id: string) => {
        setHelpfulFeedback(prev => ({ ...prev, [id]: true }));
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // Check on mount
        window.addEventListener('resize', handleResize);

        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleGetStarted = () => navigate(user ? '/dashboard' : '/register');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans selection:bg-sky-500/30 overflow-x-hidden">

            {/* --- Global Background Effects (Optimized for Mobile) --- */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                {/* On mobile, use simpler/smaller blobs or CSS gradients to reduce GPU load */}
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] md:w-[70vw] md:h-[70vw] bg-sky-500/10 rounded-full blur-[60px] md:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] md:w-[70vw] md:h-[70vw] bg-indigo-500/10 rounded-full blur-[60px] md:blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
                <div className="hidden md:block absolute top-[20%] right-[20%] w-[50vw] h-[50vw] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            {/* --- Navbar --- */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-[#020817]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform duration-300">
                            <ScanLine className="w-5 h-5 absolute" />
                        </div>
                        <span className="text-xl font-bold font-sora tracking-tight">Clarity<span className="text-sky-600 dark:text-sky-400">OCR</span></span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {['Features', 'Testimonials', 'FAQ'].map((item) => (
                                <button key={item} onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors relative group">
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-sky-600 transition-all duration-300 group-hover:w-full"></span>
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800">
                            {user ? (
                                <Button onClick={() => navigate('/dashboard')} className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all">
                                    Dashboard <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate('/login')}>Sign In</Button>
                                    <Button onClick={() => navigate('/register')} className="rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 transition-all duration-300">
                                        Get Started
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Toggle */}
                    <button className="md:hidden p-2 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform" onClick={() => setMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-white dark:bg-[#020817] md:hidden flex flex-col"
                    >
                        <div className="p-4 h-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-xl font-sora">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={24} /></button>
                        </div>
                        <div className="flex-1 p-6 flex flex-col gap-6">
                            <nav className="flex flex-col gap-2 text-lg font-medium">
                                {['Features', 'Testimonials', 'FAQ'].map((item) => (
                                    <button key={item} onClick={() => { setMobileMenuOpen(false); document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-4 px-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-colors">
                                        {item}
                                    </button>
                                ))}
                            </nav>
                            <div className="mt-auto flex flex-col gap-3">
                                <Button onClick={handleGetStarted} className="w-full h-12 text-lg bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg shadow-sky-500/20">
                                    {user ? 'Go to Dashboard' : 'Get Started Free'}
                                </Button>
                                {!user && (
                                    <Button variant="outline" className="w-full h-12 text-lg rounded-xl border-slate-200 dark:border-slate-700" onClick={() => navigate('/login')}>
                                        Log In
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main>
                {/* --- Hero Section --- */}
                <section className="relative pt-24 pb-16 md:pt-48 md:pb-32 px-4 overflow-hidden bg-black text-white">
                    {/* Hyperspeed Background - Preset 'One' (Pink/Cyan) matches reference */}
                    <div className="absolute -top-[50%] bottom-0 inset-x-0 z-0 opacity-100 pointer-events-auto cursor-pointer">
                        <Hyperspeed effectOptions={isMobile ? hyperspeedPresets.mobile : hyperspeedPresets.one} />
                    </div>

                    {/* Gradient overlay for better text readability at edges if needed */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/0 via-black/0 to-black/80 pointer-events-none" />

                    <div className="container mx-auto max-w-7xl relative z-10 flex flex-col items-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-center max-w-5xl mx-auto pointer-events-auto"
                        >
                            <Badge variant="outline" className="mb-8 py-2 px-6 rounded-full border-white/10 bg-white/5 backdrop-blur-md text-white/90 text-sm font-semibold shadow-2xl ring-1 ring-white/20 animate-fade-in">
                                <Sparkles className="w-3.5 h-3.5 mr-2 inline-block text-amber-300" />
                                <span className="tracking-wide">Now with Enterprise-Grade AI Models</span>
                            </Badge>

                            <h1 className="text-4xl sm:text-5xl md:text-8xl lg:text-[7rem] font-extrabold font-sora tracking-tighter mb-6 md:mb-8 leading-[1.1] text-white drop-shadow-2xl">
                                Extract Truth from <br className="hidden md:block" />
                                <span className="relative whitespace-nowrap">
                                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-white to-sky-300 animate-gradient bg-[length:200%_auto]">
                                        Chaos
                                    </span>
                                </span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light drop-shadow-lg">
                                Stop manually typing data. Clarity OCR transforms PDFs, images, and scans into structured, actionable JSON in seconds.
                            </p>

                            <p className="text-sm text-slate-400 mb-8 animate-pulse font-mono tracking-widest uppercase opacity-70">
                                ( Click & hold screen to warp speed )
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                {/* Primary Button - White Pill */}
                                <Button size="lg" className="h-12 px-8 text-base md:h-14 md:px-10 md:text-lg rounded-full bg-white text-black font-bold hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]" onClick={handleGetStarted}>
                                    Get Started
                                </Button>
                                {/* Secondary Button - Glass Pill */}
                                <Button size="lg" variant="ghost" className="h-12 px-8 text-base md:h-14 md:px-10 md:text-lg rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:scale-105 backdrop-blur-md transition-all duration-300" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                                    Running Demo
                                </Button>
                            </div>
                        </motion.div>


                    </div>
                </section>

                {/* --- Trusted By Ticker --- */}
                <section className="py-12 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                    <div className="container mx-auto px-4 text-center mb-8">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trusted by innovative teams</p>
                    </div>

                    <div className="relative">
                        {/* Gradients for fade effect */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#020817] to-transparent z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#020817] to-transparent z-10" />

                        <Marquee pauseOnHover className="[--duration:40s] [--gap:5rem]">
                            {REAL_COMPANIES.map((company, i) => (
                                <div key={i} className="group/logo flex items-center gap-4 cursor-pointer px-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                    <img
                                        src={company.logo}
                                        alt={company.name}
                                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert group-hover/logo:dark:brightness-100 group-hover/logo:dark:invert-0 transition-all duration-300"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </Marquee>
                    </div>
                </section>

                {/* --- Features Section --- */}
                <section id="features" className="py-20 md:py-32 relative overflow-hidden">
                    {/* Background Ambience */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center mb-20 max-w-3xl mx-auto">
                            <Badge variant="outline" className="mb-6 py-1.5 px-4 border-sky-500/30 bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors">
                                <Sparkles className="w-3 h-3 mr-2" />
                                Capabilities
                            </Badge>
                            <h2 className="text-4xl md:text-6xl font-bold font-sora mb-6 text-slate-900 dark:text-white leading-tight">
                                Everything you need to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">go paperless</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xl leading-relaxed">
                                Stop wrestling with complex integrations. Clarity allows you to build your document workflows in minutes, not months.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {FEATURES_DATA.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className={`group relative p-1 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-b from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-sky-500/20 transition-all duration-500 ${feature.className}`}
                                >
                                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative h-full bg-white/50 dark:bg-[#0B1121]/80 rounded-[1.8rem] md:rounded-[2.2rem] p-6 md:p-10 flex flex-col overflow-hidden">
                                        {/* Hover Glow Blob */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 group-hover:bg-sky-500/20 group-hover:scale-150" />

                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                            <feature.icon className="w-7 h-7" />
                                        </div>

                                        <h3 className="text-2xl font-bold mb-4 font-sora text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                            {feature.title}
                                        </h3>

                                        <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg mb-8 flex-grow">
                                            {feature.description}
                                        </div>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="flex items-center text-sm font-bold text-slate-400 group-hover:text-sky-500 transition-colors uppercase tracking-widest outline-none">
                                                    <span>Learn more</span>
                                                    <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] rounded-3xl border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                                                <DialogHeader>
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feature.bg}`}>
                                                        <feature.icon className="w-6 h-6" />
                                                    </div>
                                                    <DialogTitle className="text-3xl font-bold font-sora mb-2">{feature.details.title}</DialogTitle>
                                                    <DialogDescription className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        {feature.details.longDescription}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        <Zap className="w-4 h-4 text-sky-500" />
                                                        Key Capabilities
                                                    </h4>
                                                    <ul className="grid grid-cols-1 gap-3">
                                                        {feature.details.benefits.map((benefit, idx) => (
                                                            <li key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                                {benefit}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="mt-8 flex justify-end">
                                                    <Button onClick={handleGetStarted} className="rounded-full px-8 bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20">
                                                        Start Trial Now
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- Social Proof --- */}
                <section id="testimonials" className="py-20 md:py-32 bg-slate-50/50 dark:bg-[#0B1121]/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-center mb-6 font-sora">Loved by Professionals</h2>
                            <p className="text-slate-500 text-lg">Don't just take our word for it.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {TESTIMONIALS.map((t, i) => (
                                <Card key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300 rounded-3xl">
                                    <CardContent className="pt-10 px-10 pb-10">
                                        <div className="flex gap-1 mb-8">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                                        </div>
                                        <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium">"{t.content}"</p>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${t.bg} text-slate-900 dark:text-white`}>
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">{t.name}</div>
                                                <div className="text-slate-500">{t.role}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- FAQ --- */}
                <section id="faq" className="py-20 md:py-32 relative overflow-hidden bg-white dark:bg-[#020817]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent dark:via-sky-900/5 pointer-events-none" />

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center mb-16">
                            <Badge variant="outline" className="mb-4 py-1.5 px-4 rounded-full border-sky-500/20 bg-sky-500/5 text-sky-500">
                                <HelpCircle className="w-3.5 h-3.5 mr-2" />
                                Support Center
                            </Badge>
                            <h2 className="text-3xl md:text-5xl font-bold font-sora mb-6">Frequently Asked Questions</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                                Explore our comprehensive guide to common queries about our technology, security, and pricing.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-12">
                            {/* FAQ Sidebar/Categories */}
                            <div className="md:w-1/3 shrink-0">
                                <div className="sticky top-32 space-y-2">
                                    {FAQ_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveFaqCategory(cat.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left border ${activeFaqCategory === cat.id
                                                    ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/25 scale-105'
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl ${activeFaqCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                <cat.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* FAQ Accordion */}
                            <div className="flex-1">
                                <motion.div
                                    key={activeFaqCategory}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                        {FAQ_CATEGORIES.find(c => c.id === activeFaqCategory)?.items.map((faq, i) => (
                                            <AccordionItem
                                                key={i}
                                                value={`item-${i}`}
                                                className="border border-slate-200 dark:border-slate-800 rounded-2xl px-6 bg-white dark:bg-slate-900/60 backdrop-blur-sm transition-all duration-300 data-[state=open]:border-sky-500/50 data-[state=open]:ring-4 data-[state=open]:ring-sky-500/10 data-[state=open]:shadow-xl group"
                                            >
                                                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline py-6 text-slate-800 dark:text-slate-100 [&[data-state=open]]:text-sky-600 dark:[&[data-state=open]]:text-sky-400">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 dark:text-slate-400 text-base leading-relaxed pb-6">
                                                    <div className="space-y-6">
                                                        <p>{faq.answer}</p>
                                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                            <span className="text-sm font-medium text-slate-400 italic">Was this helpful?</span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleHelpful(`${activeFaqCategory}-${i}`); }}
                                                                disabled={helpfulFeedback[`${activeFaqCategory}-${i}`]}
                                                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${helpfulFeedback[`${activeFaqCategory}-${i}`]
                                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-500 hover:text-white border border-transparent'
                                                                    }`}
                                                            >
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                                {helpfulFeedback[`${activeFaqCategory}-${i}`] ? 'Thank you!' : 'Yes'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </motion.div>
                            </div>
                        </div>

                        {/* --- Support CTA --- */}
                        <div className="mt-20 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-sky-500/5 to-indigo-500/5 border border-sky-500/10 text-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-120" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center mb-6">
                                    <HelpCircle className="w-8 h-8 text-sky-500" />
                                </div>
                                <h4 className="text-2xl md:text-3xl font-bold mb-3 font-sora">Still have questions?</h4>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                                    Can't find the answer you're looking for? Our documentation and support team are here to help you get the most out of Clarity OCR.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button className="rounded-full px-10 h-14 text-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-all shadow-xl" onClick={() => navigate('/contact')}>
                                        Get in touch
                                    </Button>
                                    <Button variant="ghost" className="rounded-full px-10 h-14 text-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50 transition-all" onClick={() => navigate('/guide')}>
                                        View Documentation
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Master CTA --- */}
                <section className="py-16 md:py-24 px-4 pb-32 md:pb-48">
                    <div className="container mx-auto max-w-6xl">
                        <div className="rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-32 text-center relative overflow-hidden group bg-slate-900 dark:bg-white shadow-2xl shadow-sky-900/50">
                            {/* Animated Background Mesh */}
                            <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-1000">
                                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-500 rounded-full blur-[120px] mix-blend-screen animate-blob" />
                                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-7xl font-bold font-sora mb-6 md:mb-8 text-white dark:text-slate-900 tracking-tight leading-tight">
                                    Ready to automate <br /> your workflow?
                                </h2>
                                <p className="text-sky-100 dark:text-slate-500 text-lg md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto">
                                    Join thousands of teams who have switched to Clarity OCR.
                                </p>
                                <Button size="lg" className="h-14 px-8 text-lg md:h-20 md:px-12 md:text-2xl rounded-full bg-white text-slate-900 dark:bg-slate-900 dark:text-white hover:scale-105 transition-all duration-300 shadow-2xl shadow-white/20 dark:shadow-slate-900/20" onClick={handleGetStarted}>
                                    Get Started for Free
                                </Button>
                                <p className="mt-6 text-slate-400 dark:text-slate-500 text-sm">No credit card required • Cancel anytime</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* --- Footer --- */}
            <footer className="relative bg-[#020817] pt-24 pb-12 overflow-hidden border-t border-white/5">
                {/* Background Gradients */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-0 left-[-10%] w-[30vw] h-[30vw] bg-sky-600/5 rounded-full blur-[100px]" />
                    <div className="absolute top-0 right-[-10%] w-[30vw] h-[30vw] bg-indigo-600/5 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-1 space-y-6">
                            <div className="flex items-center gap-2 text-white">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                    <span className="font-bold text-lg text-white">C</span>
                                </div>
                                <span className="font-bold text-2xl font-sora tracking-tight">Clarity</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed text-sm max-w-xs">
                                Transforming chaos into structure. The intelligent document processing platform for modern engineering teams.
                            </p>
                            <div className="flex gap-4 pt-2">
                                {/* Socials */}
                                <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:scale-110 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2] transition-all duration-300">
                                    <Twitter className="w-4 h-4 fill-current" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:scale-110 hover:bg-white/10 hover:border-white/50 hover:text-white transition-all duration-300">
                                    <Github className="w-4 h-4 fill-current" />
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:scale-110 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50 hover:text-[#0A66C2] transition-all duration-300">
                                    <Linkedin className="w-4 h-4 fill-current" />
                                </a>
                            </div>
                        </div>

                        {/* Product Links */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-white text-lg">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><a href="#features" className="hover:text-sky-400 transition-colors">Features</a></li>
                                <li><a href="#testimonials" className="hover:text-sky-400 transition-colors">Customers</a></li>
                                <li><a href="#faq" className="hover:text-sky-400 transition-colors">FAQ</a></li>
                                <li><Link to="/guide" className="text-amber-400 font-medium hover:underline decoration-amber-400/30 underline-offset-4">Project Guide <span className="text-[10px] ml-1 bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded-full">NEW</span></Link></li>
                            </ul>
                        </div>

                        {/* Platform Links */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-white text-lg">Platform</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><Link to="/dashboard" className="hover:text-sky-400 transition-colors">Dashboard</Link></li>
                                <li><Link to="/documents" className="hover:text-sky-400 transition-colors">Documents</Link></li>
                                <li><Link to="/checklist/new" className="hover:text-sky-400 transition-colors">Checklists</Link></li>
                                <li><Link to="/tasks" className="hover:text-sky-400 transition-colors">Tasks</Link></li>
                                <li><Link to="/integrations" className="hover:text-sky-400 transition-colors">Integrations</Link></li>
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div className="space-y-6">
                            <h4 className="font-bold text-white text-lg">Company</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li><Link to="/about" className="hover:text-sky-400 transition-colors">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-sky-400 transition-colors">Contact</Link></li>
                                <li><Link to="/privacy" className="hover:text-sky-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-sky-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
                        <div>© {new Date().getFullYear()} Clarity OCR Inc. All rights reserved.</div>
                        <div className="flex gap-8">
                            <span>Status: <span className="text-emerald-500">Operational</span></span>
                            <span>v2.5.0-beta</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div >
    );
}
