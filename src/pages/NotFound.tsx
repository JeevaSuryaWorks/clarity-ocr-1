import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-sky-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10 max-w-2xl mx-auto"
      >
        {/* 404 Glitch Effect */}
        <div className="relative mb-8">
          <h1 className="text-[9rem] md:text-[12rem] font-bold font-sora leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/5 opacity-50 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold font-sora text-white">
              Lost in Space?
            </h1>
          </div>
        </div>

        <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed">
          The page you are looking for doesn't exist or has been moved to another dimension.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-200 transition-colors font-medium text-base"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-12 px-8 rounded-full border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-base"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
