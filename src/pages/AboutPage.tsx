import { motion } from 'framer-motion';
import { Target, Users, Zap } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-50 font-sans selection:bg-sky-500/30">
      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-sky-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sky-500 font-bold tracking-wider uppercase text-sm mb-4 block">Our Mission</span>
            <h1 className="text-4xl md:text-7xl font-bold font-sora mb-6 text-slate-900 dark:text-white">
              Making documents <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600">intelligible</span> again.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              We're building the intelligence layer for your files. Clarity OCR transforms static documents into dynamic, actionable data for modern teams.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Values Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Speed First", desc: "We believe in instant results. No queuing, no waiting." },
            { icon: Target, title: "Precision", desc: "99.9% accuracy isn't a goal, it's our baseline standard." },
            { icon: Users, title: "User Centric", desc: "Built for humans, powered by state-of-the-art AI." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-sky-500/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-sky-500/10 group-hover:text-sky-500 flex items-center justify-center mb-6 transition-colors text-slate-600 dark:text-slate-400">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-sora">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-slate-100 dark:bg-slate-900/30 py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-bold font-sora">Our Story</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Started as a final year project at K.S.Rangasamy College of Technology, Clarity OCR was born from a simple frustration: why represents document data extraction is so hard?
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                What began as a simple text extraction tool has evolved into a comprehensive platform handling thousands of documents, powered by advanced machine learning models.
              </p>
              <div className="pt-4 flex items-center gap-4">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-500">Trusted by 500+ users</span>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-3xl blur-2xl opacity-20 transform rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                alt="Team working"
                className="relative rounded-3xl shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;