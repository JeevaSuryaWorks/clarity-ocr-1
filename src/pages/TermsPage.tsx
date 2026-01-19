import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Gavel, UserCheck, AlertTriangle, Scale, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const sections = [
  { id: 'acceptance', title: 'Acceptance', icon: UserCheck },
  { id: 'service', title: 'The Service', icon: ScrollText },
  { id: 'responsibilities', title: 'Use of Service', icon: Scale },
  { id: 'ip', title: 'Intellectual Property', icon: ShieldCheck },
  { id: 'liability', title: 'Liability', icon: AlertTriangle },
  { id: 'termination', title: 'Termination', icon: Gavel },
];

const TermsPage = () => {
  const [activeSection, setActiveSection] = useState('acceptance');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans selection:bg-amber-500/30">
      {/* Header */}
      <div className="relative bg-[#0B1121] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-orange-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 mx-auto bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
              <Scale className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-sora mb-6">Terms of Service</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using Clarity OCR.
            </p>
            <p className="text-sm text-amber-500 mt-4 font-mono uppercase tracking-wider">
              Last Updated: December 30, 2025
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4 hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Contents</p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === section.id
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:w-3/4">
            <ScrollArea className="h-full">
              <div className="space-y-16">
                <motion.section
                  id="acceptance"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">01</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Acceptance of Terms</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      By accessing or using Clarity OCR (the "Service"), you agree to be bound by these Terms.
                      If you disagree with any part of the terms, then you may not access the Service.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="service"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">02</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">The Service</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      Clarity OCR provides advanced document analysis using Artificial Intelligence.
                      We operate on a "best effort" basis to provide accurate extractions, but we cannot guarantee 100% accuracy due to the nature of machine learning.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="responsibilities"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">03</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">User Responsibilities</h2>
                  </div>
                  <div className="pl-14 space-y-4">
                    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <h3 className="text-red-600 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Prohibited Actions
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
                        <li>Uploading malware, viruses, or malicious code</li>
                        <li>Processing illegal or non-consensual content</li>
                        <li>Attempting to reverse engineer the AI models</li>
                        <li>Sharing accounts or bypassing payment systems</li>
                      </ul>
                    </div>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="ip"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">04</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Intellectual Property</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      The Service and its original content (excluding Content provided by you or other users), features and functionality are and will remain the exclusive property of Jeevasurya & Team.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="liability"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">05</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Liability</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      In no event shall Clarity OCR, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="termination"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">06</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Termination</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="contact"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">07</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Questions?</h2>
                  </div>
                  <div className="pl-14">
                    <div className="bg-[#0B1121] text-white p-8 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                      <h3 className="text-xl font-bold mb-4 relative z-10">Usage & Licensing Inquiries</h3>
                      <p className="text-slate-400 mb-6 relative z-10">
                        For enterprise licensing or legal questions, please reach out to our legal team.
                      </p>
                      <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold border-0">
                        Contact Legal Team <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.section>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;