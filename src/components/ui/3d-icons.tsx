import {
  UploadCloud,
  FileText,
  FileCode,
  Image as LucideImage,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Clock,
  Gauge,
  Layout
} from "lucide-react";

export const IconAdvancedOCR = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full" />
    <Zap className="relative z-10 w-full h-full text-blue-600 drop-shadow-xl" />
  </div>
);

export const IconTaskExtraction = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-purple-500 blur-lg opacity-40 rounded-full" />
    <CheckCircle2 className="relative z-10 w-full h-full text-purple-600 drop-shadow-xl" />
  </div>
);

export const IconTimeEstimation = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-amber-500 blur-lg opacity-40 rounded-full" />
    <Clock className="relative z-10 w-full h-full text-amber-600 drop-shadow-xl" />
  </div>
);

export const IconFastProcessing = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 rounded-full" />
    <Gauge className="relative z-10 w-full h-full text-emerald-600 drop-shadow-xl" />
  </div>
);

export const IconMultiFormat = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-rose-500 blur-lg opacity-40 rounded-full" />
    <LucideImage className="relative z-10 w-full h-full text-rose-600 drop-shadow-xl" />
  </div>
);

export const IconIntuitiveUI = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 rounded-full" />
    <Layout className="relative z-10 w-full h-full text-indigo-600 drop-shadow-xl" />
  </div>
);

export const IconUpload = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-purple-500 blur-lg opacity-40 rounded-full" />
    <UploadCloud className="relative z-10 w-full h-full text-purple-600 drop-shadow-xl" />
  </div>
);

export const IconFileText = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 rounded-full" />
    <FileText className="relative z-10 w-full h-full text-indigo-600 drop-shadow-xl" />
  </div>
);

export const IconFileCode = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full" />
    <FileCode className="relative z-10 w-full h-full text-blue-600 drop-shadow-xl" />
  </div>
);

export const IconFileImage = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-pink-500 blur-lg opacity-40 rounded-full" />
    <LucideImage className="relative z-10 w-full h-full text-pink-600 drop-shadow-xl" />
  </div>
);

export const IconCheckCircle = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-green-500 blur-lg opacity-40 rounded-full" />
    <CheckCircle2 className="relative z-10 w-full h-full text-green-600 drop-shadow-xl" />
  </div>
);

export const IconAlertCircle = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <div className="absolute inset-0 bg-red-500 blur-lg opacity-40 rounded-full" />
    <AlertCircle className="relative z-10 w-full h-full text-red-600 drop-shadow-xl" />
  </div>
);

export const IconLoader = ({ className }: { className?: string }) => (
  <Loader2 className={`text-indigo-600 ${className}`} />
);