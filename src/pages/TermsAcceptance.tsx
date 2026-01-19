import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function TermsAcceptancePage() {
    const { acceptTerms, logout, user } = useAuth();
    const navigate = useNavigate();
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleAccept = async () => {
        if (!accepted) return;
        setLoading(true);
        try {
            await acceptTerms();
            toast.success("Welcome to Clarity OCR!");
            navigate('/onboarding'); // or dashboard depending on flow
        } catch (error) {
            console.error("Failed to accept terms:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans p-4 relative overflow-hidden">

            {/* --- Global Background Effects --- */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
            </div>

            <div className="w-full max-w-2xl relative z-10">

                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
                        C
                    </div>
                    <span className="text-2xl font-bold font-sora tracking-tight text-slate-900 dark:text-white">Clarity<span className="text-sky-600 dark:text-sky-400">OCR</span></span>
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-2xl shadow-sky-900/5 ring-1 ring-white/20">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className="mx-auto w-14 h-14 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-4 text-sky-600 dark:text-sky-400">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <CardTitle className="text-2xl font-bold font-sora">Terms of Service</CardTitle>
                            <CardDescription className="text-lg text-slate-500 dark:text-slate-400">
                                Please review and accept our terms to continue using Clarity OCR.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-2 space-y-6">

                            <ScrollArea className="h-[300px] w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">1. Acceptance of Terms</h3>
                                <p className="mb-4">By accessing and using Clarity OCR, you accept and agree to be bound by the terms and provision of this agreement.</p>

                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">2. Privacy & Data Handling</h3>
                                <p className="mb-4">We take your privacy seriously. Documents uploaded for OCR are processed securely and deleted from our active processing servers immediately after result generation. We do not use your private documents to train our public models without explicit consent.</p>

                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">3. User Conduct</h3>
                                <p className="mb-4">You agree not to use the service to process illegal or malicious content. We reserve the right to terminate accounts that violate these policies.</p>

                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">4. Disclaimer</h3>
                                <p className="mb-4">The OCR service is provided "as is". While we strive for high accuracy, we cannot guarantee 100% correctness of extracted text.</p>

                                <p className="text-slate-400 italic">Last updated: December 2024</p>
                            </ScrollArea>

                            <div className="flex items-start space-x-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                                <Checkbox
                                    id="terms"
                                    checked={accepted}
                                    onCheckedChange={(checked) => setAccepted(checked as boolean)}
                                    className="mt-1 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="terms"
                                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        I Accept the Terms & Conditions
                                    </label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        You must accept the terms to access your dashboard.
                                    </p>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="p-8 pt-0 flex gap-4">
                            <Button variant="outline" onClick={logout} className="flex-1 h-12 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                                <LogOut className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                            <Button onClick={handleAccept} disabled={!accepted || loading} className="flex-1 h-12 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Dashboard"}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
