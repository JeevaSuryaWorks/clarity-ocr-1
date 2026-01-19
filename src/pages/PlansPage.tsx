
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function PlansPage() {
    const [isYearly, setIsYearly] = useState(false);
    const navigate = useNavigate();

    const plans = [
        {
            name: "Starter",
            price: "Free",
            description: "Perfect for students and individuals.",
            features: [
                "50 Documents / month",
                "Basic OCR (Text Only)",
                "No API Access",
                "Email Support"
            ],
            current: true,
            buttonText: "Current Plan",
            gradient: "from-slate-500/20 to-slate-700/20"
        },
        {
            name: "Pro",
            price: isYearly ? "₹299" : "₹29",
            period: isYearly ? "/year" : "/mo",
            description: "For professionals who need power.",
            features: [
                "Unlimited Documents",
                "AI Analysis (Groq + Gemini)",
                "Vision OCR (Handwriting)",
                "Deepseek Integration",
                "Storage: 1GB",
                "Priority Support"
            ],
            current: false,
            popular: true,
            buttonText: "Upgrade to Pro",
            gradient: "from-indigo-500/20 to-purple-500/20",
            border: "border-indigo-500/50"
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For teams requiring ultimate control.",
            features: [
                "Custom API Limits",
                "Dedicated Server",
                "SLA Guarantee",
                "Storage: 10GB+",
                "24/7 Phone Support"
            ],
            current: false,
            buttonText: "Contact Sales",
            gradient: "from-blue-500/20 to-cyan-500/20"
        }
    ];

    return (
        <div className="min-h-screen p-8 flex flex-col items-center">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-6xl space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400">
                        Upgrade to unlock the full power of AI Analysis and Vision OCR.
                    </p>

                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-indigo-600' : 'text-slate-500'}`}>Monthly</span>
                        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={`text-sm font-medium ${isYearly ? 'text-indigo-600' : 'text-slate-500'}`}>Yearly (Save 20%)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="h-full"
                        >
                            <Card className={`relative h-full p-8 rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-slate-800 ${plan.border || ''} hover:border-indigo-400 transition-all duration-300 group`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[24px]`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                                        <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{plan.description}</p>
                                    </div>

                                    <div className="my-8">
                                        <div className="flex items-baseline">
                                            <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                                            {plan.period && <span className="text-slate-500 ml-1">{plan.period}</span>}
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <Check className="w-3 h-3 text-indigo-500" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full h-12 rounded-xl font-semibold shadow-lg transition-transform hover:-translate-y-0.5
                                   ${plan.current
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'}`}
                                        disabled={plan.current}
                                        onClick={() => !plan.current && navigate('/billing')}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
