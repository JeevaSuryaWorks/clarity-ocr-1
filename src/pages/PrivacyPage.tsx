import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const sections = [
  { id: 'intro', title: 'Introduction', icon: FileText },
  { id: 'collect', title: 'Information Collection', icon: Eye },
  { id: 'usage', title: 'How We Use Data', icon: ArrowRight },
  { id: 'security', title: 'Data Security', icon: Lock },
  { id: 'contact', title: 'Contact Us', icon: Shield },
];

const PrivacyPage = () => {
  const [activeSection, setActiveSection] = useState('intro');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <div className="relative bg-[#0B1121] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-sky-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-sora mb-6">Privacy Policy</h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We value your trust. Here's exactly how we protect your data.
            </p>
            <p className="text-sm text-emerald-500 mt-4 font-mono uppercase tracking-wider">
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
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
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
                  id="intro"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">01</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Introduction</h2>
                  </div>
                  <div className="pl-14 prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed">
                    <p>
                      At Clarity OCR ("we", "our", or "us"), privacy isn't an afterthought—it's a core principle.
                      We understand that you trust us with your documents, which often contain sensitive information.
                      This policy outlines our transparent approach to data handling.
                    </p>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="collect"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">02</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Information We Collect</h2>
                  </div>
                  <div className="pl-14 grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500" /> Account Data
                      </h3>
                      <p className="text-sm text-slate-500">
                        Basic information like your name, email, and authentication credentials required to maintain your account.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" /> Document Data
                      </h3>
                      <p className="text-sm text-slate-500">
                        Files you upload for processing. These are ephemeral and automatically purged.
                      </p>
                    </div>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="usage"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">03</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">How We Use Your Data</h2>
                  </div>
                  <div className="pl-14 space-y-4">
                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                      <h3 className="text-emerald-600 dark:text-emerald-400 font-bold mb-2">Our Promise</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        We <strong>never</strong> sell your data. We do not use your private documents to train our primary foundational models without your explicit opt-in consent.
                      </p>
                    </div>
                    <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc pl-5">
                      <li>To provide and maintain the Service</li>
                      <li>To notify you about changes to our Service</li>
                      <li>To provide customer support</li>
                      <li>To detect, prevent and address technical issues</li>
                    </ul>
                  </div>
                </motion.section>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-800" />

                <motion.section
                  id="security"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <span className="font-bold font-mono">04</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Data Security</h2>
                  </div>
                  <div className="pl-14">
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Security is our top priority. We employ banking-grade encryption standards.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        <Lock className="w-8 h-8 mx-auto text-sky-500 mb-4" />
                        <h4 className="font-bold mb-2">Encryption</h4>
                        <p className="text-xs text-slate-500">AES-256 at rest</p>
                      </div>
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        <Shield className="w-8 h-8 mx-auto text-indigo-500 mb-4" />
                        <h4 className="font-bold mb-2">Transmission</h4>
                        <p className="text-xs text-slate-500">TLS 1.3 in transit</p>
                      </div>
                      <div className="text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                        <Eye className="w-8 h-8 mx-auto text-emerald-500 mb-4" />
                        <h4 className="font-bold mb-2">Access Control</h4>
                        <p className="text-xs text-slate-500">Strict IAM policies</p>
                      </div>
                    </div>
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
                      <span className="font-bold font-mono">05</span>
                    </div>
                    <h2 className="text-2xl font-bold font-sora">Contact Us</h2>
                  </div>
                  <div className="pl-14">
                    <div className="bg-[#0B1121] text-white p-8 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl" />
                      <h3 className="text-xl font-bold mb-4 relative z-10">Have questions about privacy?</h3>
                      <p className="text-slate-400 mb-6 relative z-10">
                        Our Data Protection Officer is available to address any concerns you may have regarding your personal data.
                      </p>
                      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                        Contact Privacy Team <ArrowRight className="w-4 h-4 ml-2" />
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

export default PrivacyPage;