/**
 * ✅ Aurora Checklist Page (Redesign - Refactored)
 * Features: Deep Glassmorphism, Mobile-First UX, 3D Tilt Cards, Fluid Motion, Shared Components.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { HistoryItem, TaskGroup } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { motion, Variants } from 'framer-motion';
import { exportToPDF, exportToCSV, exportToJSON } from '@/services/exportService';

// Icons
import {
  Loader2, ListChecks, Download, CheckCircle, Copy, ArrowLeft,
  Milestone, BookOpen, ChevronDown, Sparkles, FileText, CheckSquare, PlusCircle, Clock
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// New Shared Components
import { EditableField } from '@/components/checklist/EditableField';
import { ChecklistBoard } from '@/components/checklist/ChecklistBoard';
import { ShareDialog } from '@/components/checklist/ShareDialog';

/* ============================= Aurora Styles & Motion ============================= */

const card3DVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 200 } },
  hover: {
    scale: 1.02,
    rotateY: 2,
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

/* ============================= Utilities ============================= */

type FilterStatus = 'all' | 'active' | 'completed';

/* ============================= Dialogs ============================= */

const ViewTextDialog: React.FC<{ text: string }> = ({ text }) => {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Text copied to clipboard." });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300">
          <FileText className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">View Raw</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl glass-panel">
        <DialogHeader>
          <DialogTitle>Original extracted Text</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 text-sm font-mono whitespace-pre-wrap max-h-[60vh]">
          {text || "No text content available."}
        </div>
        <DialogFooter>
          <Button onClick={handleCopy} variant="outline" className="glass-button">
            <Copy className="w-4 h-4 mr-2" /> Copy Text
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Header: React.FC<{
  historyItem: HistoryItem,
  saveStatus: string,
  updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void;
  navigate: (path: string) => void;
}> = ({ historyItem, saveStatus, updateHistoryItem, navigate }) => {
  const { toast } = useToast();

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      toast({ description: `Generating ${format.toUpperCase()}...` });
      if (format === 'json') await exportToJSON(historyItem);
      else if (format === 'csv') await exportToCSV(historyItem);
      else await exportToPDF(historyItem);
    } catch {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/history')} className="text-slate-600 hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Share Button Component */}
          <ShareDialog historyItem={historyItem} />

          <ViewTextDialog text={historyItem.originalText || ''} />

          <div className="text-xs font-medium px-3 py-1 rounded-full bg-white/30 backdrop-blur text-slate-700 border border-white/20 shadow-sm">
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>
            ) : (
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> Saved</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="glass-button h-8 rounded-full border-white/40">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel">
              <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-1 px-1">
        <EditableField
          value={historyItem.title}
          onSave={val => updateHistoryItem(p => ({ ...p, title: val }))}
          className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          placeholder="Document Title"
        />
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          src: {historyItem.fileName} <span className="w-1 h-1 rounded-full bg-slate-300" /> {new Date(historyItem.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

/* ============================= Dashboard & Stats ============================= */

const Dashboard: React.FC<{ historyItem: HistoryItem }> = ({ historyItem }) => {
  const stats = useMemo(() => {
    const allTasks = historyItem.analysisResult.groups.flatMap(g => g.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    const total = allTasks.length;
    const totalTime = allTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    return {
      completion: total > 0 ? (completed / total) * 100 : 0,
      completed,
      total,
      totalTime
    };
  }, [historyItem]);

  const cards = [
    {
      title: 'Progress',
      value: `${stats.completion.toFixed(0)}%`,
      desc: 'Overall Completion',
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
      color: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-200/50"
    },
    {
      title: 'Tasks',
      value: stats.total,
      desc: `${stats.completed} Completed`,
      icon: <ListChecks className="w-5 h-5 text-blue-500" />,
      color: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-200/50"
    },
    {
      title: 'Est. Time',
      value: `${(stats.totalTime / 60).toFixed(1)}h`,
      desc: `${stats.totalTime} Minutes`,
      icon: <Clock className="w-5 h-5 text-violet-500" />,
      color: "from-violet-500/10 to-violet-500/5",
      border: "border-violet-200/50"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((item, index) => (
        <motion.div
          key={index}
          variants={card3DVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          transition={{ delay: index * 0.1 }}
          style={{ perspective: 1000 }}
        >
          <div className={`
            relative overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-5 shadow-sm
            ${item.color} ${item.border}
          `}>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white/40 rounded-lg backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                {item.icon}
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{item.value}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/* ============================= Main Content ============================= */

const SummarySection: React.FC<{
  summary: HistoryItem['analysisResult']['summary'],
  updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void
}> = ({ summary, updateHistoryItem }) => {
  if (!summary) return null;

  return (
    <Collapsible className="mb-6 group">
      <CollapsibleTrigger asChild>
        <div className="glass-card rounded-2xl p-4 cursor-pointer hover:bg-white/40 transition-colors border border-white/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Executive Summary
            </h3>
            <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-5 glass-panel rounded-2xl border-white/20"
        >
          <EditableField
            isTextarea
            value={summary.projectDescription}
            onSave={val => updateHistoryItem(p => ({
              ...p,
              analysisResult: { ...p.analysisResult, summary: { ...p.analysisResult.summary!, projectDescription: val } }
            }))}
            className="text-slate-700 leading-relaxed whitespace-pre-wrap"
          />

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/30 rounded-xl p-4 backdrop-blur-sm">
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-slate-500">
                <Milestone className="w-4 h-4" /> Key Milestones
              </h4>
              <ul className="space-y-2">
                {summary.milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/30 rounded-xl p-4 backdrop-blur-sm">
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-slate-500">
                <BookOpen className="w-4 h-4" /> Recommended Resources
              </h4>
              <ul className="space-y-2">
                {summary.resources.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const MobileActionBar: React.FC<{
  onAddGroup: () => void;
  filter: FilterStatus;
  setFilter: (f: FilterStatus) => void;
}> = ({ onAddGroup, filter, setFilter }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-white/20 z-50 pb-safe sm:hidden">
      <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-full">
          <Button size="icon" variant={filter === 'all' ? 'default' : 'ghost'} className="rounded-full w-10 h-10" onClick={() => setFilter('all')}><ListChecks className="w-4 h-4" /></Button>
          <Button size="icon" variant={filter === 'active' ? 'default' : 'ghost'} className="rounded-full w-10 h-10" onClick={() => setFilter('active')}><CircleIcon /></Button>
          <Button size="icon" variant={filter === 'completed' ? 'default' : 'ghost'} className="rounded-full w-10 h-10" onClick={() => setFilter('completed')}><CheckCircle className="w-4 h-4" /></Button>
        </div>
        <Button className="h-12 rounded-full px-6 bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25" onClick={onAddGroup}>
          <PlusCircle className="w-5 h-5 mr-2" /> New Group
        </Button>
      </div>
    </div>
  );
}
// Helper icon
const CircleIcon = () => <div className="w-4 h-4 rounded-full border-2 border-current" />

/* ============================= Main Page Wrapper ============================= */

const ChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const { toast } = useToast();



  useEffect(() => {
    if (!id || !user) {
      if (!user) navigate('/login');
      return;
    }
    const fetch = async () => {
      try {
        // 1. Try fetching directly as Private History ID
        const docRef = doc(db, `users/${user.uid}/history`, id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setHistoryItem({ id: snap.id, uid: user.uid, ...snap.data() } as HistoryItem);
        } else {
          // 2. Not found as Private ID.
          // Check if this is actually a SHARE ID that belongs to one of our private docs.
          // (Reverse Lookup: Find private doc where shareId == id)
          const historyQuery = query(
            collection(db, `users/${user.uid}/history`),
            where('shareId', '==', id)
          );
          const historySnap = await getDocs(historyQuery);

          if (!historySnap.empty) {
            // Found the private doc! Redirect to it using its proper Private ID.
            const privateId = historySnap.docs[0].id;
            toast({ title: "Redirecting...", description: "Opening your workspace." });
            navigate(`/checklist/${privateId}`, { replace: true });
            return;
          }

          // 3. Fallback: It's a Shared Checklist ID and we don't have a local copy linked.
          // Redirect to public shared view.
          const publicSnap = await getDoc(doc(db, 'publicChecklists', id));
          if (publicSnap.exists()) {
            toast({ title: "Redirecting...", description: "Opening shared view." });
            navigate(`/checklist/public/${id}`, { replace: true });
          } else {
            setHistoryItem(null); // Truly not found
          }
        }
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error loading checklist" });
      }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, user, navigate, toast]);

  // Debounced Auto-Save & Sync to Public Doc
  useEffect(() => {
    if (saveStatus !== 'saving' || !historyItem || !user) return;
    const t = setTimeout(async () => {
      try {
        const { id: itemId, uid, ...data } = historyItem;

        // 1. Update Private Doc
        await updateDoc(doc(db, `users/${user.uid}/history`, id!), data);

        // 2. Sync to Public Doc if Shared
        if (historyItem.shareId) {
          try {
            const publicRef = doc(db, 'publicChecklists', historyItem.shareId);
            // Verify it exists before writing to avoid zombie docs, or just merge update
            // We only update the content fields (title, analysisResult), NOT permissions/viewCount
            await updateDoc(publicRef, {
              title: historyItem.title,
              analysisResult: historyItem.analysisResult
              // Do NOT overwrite permissions or other metadata here
            });
          } catch (err) {
            console.warn("Failed to sync to public doc", err);
          }
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch { setSaveStatus('idle'); }
    }, 1500);
    return () => clearTimeout(t);
  }, [historyItem, saveStatus, id, user]);

  const updateHistoryItem = (fn: (p: HistoryItem) => HistoryItem) => {
    setHistoryItem(p => p ? fn(p) : null);
    setSaveStatus('saving');
  };

  const handleCreateGroup = () => {
    const newGroup: TaskGroup = { id: uuidv4(), name: "New Group", expanded: true, tasks: [] };
    updateHistoryItem(p => ({ ...p, analysisResult: { ...p.analysisResult, groups: [newGroup, ...p.analysisResult.groups] } }));
    toast({ title: "Group Created", description: "Start adding tasks!" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-violet-50"><Loader2 className="animate-spin text-violet-600" /></div>;
  if (!historyItem) return <div className="p-8 text-center">Checklist not found</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] font-sans text-slate-900 dark:text-slate-100 relative overflow-x-hidden selection:bg-violet-200 selection:text-violet-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        :root { font-family: 'Outfit', sans-serif; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .glass-panel {
          background: rgba(17, 24, 39, 0.45);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .glass-button {
           background: rgba(255, 255, 255, 0.2);
           backdrop-filter: blur(4px);
           transition: all 0.2s;
        }
        .glass-button:hover { background: rgba(255, 255, 255, 0.4); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-indigo-400/20 blur-[140px]" />
      </div>

      <div className="relative z-10 container mx-auto max-w-5xl p-4 sm:p-6 lg:p-10 pb-32 sm:pb-10">
        <Header
          historyItem={historyItem}
          saveStatus={saveStatus}
          updateHistoryItem={updateHistoryItem}
          navigate={navigate}
        />

        <Dashboard historyItem={historyItem} />

        <SummarySection
          summary={historyItem.analysisResult.summary}
          updateHistoryItem={updateHistoryItem}
        />

        <ChecklistBoard
          groups={historyItem.analysisResult.groups}
          updateHistoryItem={updateHistoryItem}
          filter={filter}
          setFilter={setFilter}
        />
      </div>

      <MobileActionBar
        onAddGroup={handleCreateGroup}
        filter={filter}
        setFilter={setFilter}
      />
    </div>
  );
};

export default ChecklistPage;