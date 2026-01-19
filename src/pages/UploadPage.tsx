import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeDocument } from '@/services/aiAnalysis';
import { addToHistory } from '@/services/historyService';
import { getStorageStats } from '@/services/storageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
// Components
import { PasswordDialog } from '@/components/PasswordDialog';
import { FileUpload } from '@/components/FileUpload';
import { logActivity } from '@/services/activityService';

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [storageFull, setStorageFull] = useState(false);

  // Password Handling State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File, resolve: (pw: string) => void, reject: () => void } | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      if (!user?.uid) return;
      const stats = await getStorageStats(user.uid);
      if (stats.used >= stats.limit) {
        setStorageFull(true);
      }
    };
    checkStorage();
  }, [user]);

  // We need to intercept the Password Request.
  // Since `FileUpload` likely calls `runOCR` internally, we need to pass a "passwordProvider" 
  // or handle the error inside FileUpload and bubbling it up.
  // Strategy: Update FileUpload to propagate the "PASSWORD_REQUIRED" error 
  // OR pass a callback `onRequestPassword` to FileUpload.

  const handlePasswordSubmit = (password: string) => {
    if (pendingFile) {
      pendingFile.resolve(password);
      setPasswordDialogOpen(false);
      setPendingFile(null);
    }
  };

  const handlePasswordCancel = () => {
    if (pendingFile) {
      pendingFile.reject(); // Cancel operation
      setPasswordDialogOpen(false);
      setPendingFile(null);
    }
  }

  const handleAnalyze = useCallback(async (content: string, fileName?: string) => {
    if (!user) {
      toast({ title: "Authentication Required", variant: "destructive" });
      return;
    }

    if (storageFull) {
      toast({
        title: "Storage Limit Reached",
        description: "Please upgrade your plan to process more documents.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200);

    try {
      const result: AnalysisResult = await analyzeDocument(content);

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));

      const historyId = await addToHistory(result, fileName || 'Untitled Document', content);

      // Log Activity (Private Creation)
      if (user?.uid) {
        // We import logActivity dynamically or at top. Let's assume top import.
        await logActivity(user.uid, user.displayName || 'User', 'create_checklist', {
          checklistId: historyId,
          checklistTitle: fileName || 'Untitled Document'
        });
      }

      toast({
        title: "Success!",
        description: `Extracted ${result.totalTasks} tasks.`,
      });

      navigate(`/checklist/${historyId}`);

    } catch (error: any) {
      clearInterval(progressInterval);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not process document",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [navigate, toast, user, storageFull]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden p-4 md:p-8">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-4xl z-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered OCR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Upload & <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">Analyze</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Turn your documents into actionable tasks instantly. Supports PDF, JPG, PNG.
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="p-8">
            {/* 
                   We need to pass 'onRequestPassword' to FileUpload to trigger the dialog 
                   if it encounters a protected PDF.
               */}
            <FileUpload
              onFileProcessed={handleAnalyze}
              isAnalyzing={isAnalyzing}
              progress={progress}
              onRequestPassword={(file, resolve, reject) => {
                setPendingFile({ file, resolve, reject });
                setPasswordDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <PasswordDialog
        isOpen={passwordDialogOpen}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        fileName={pendingFile?.file.name || "Document"}
      />
    </div>
  );
}