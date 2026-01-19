import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  Plus,
  Loader2,
  Grid,
  List as ListIcon,
  Calendar,
  HardDrive
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserDocuments, deleteDocument, getDocument } from '@/services/documentService';
import { ClarityDocument, ProcessingStatus } from '@/types/schema';

// --- Aurora Styles ---
const AURORA_BACKGROUND = (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/10 blur-[120px] animate-pulse" />
    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-400/10 blur-[100px]" />
    <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-indigo-400/10 blur-[140px]" />
  </div>
);

// --- Status Badge ---
const StatusBadge = ({ status }: { status: ProcessingStatus }) => {
  const styles = {
    queued: 'bg-slate-100/50 text-slate-600 border-slate-200',
    processing: 'bg-blue-100/50 text-blue-700 border-blue-200 animate-pulse',
    extracting_tasks: 'bg-purple-100/50 text-purple-700 border-purple-200 animate-pulse',
    completed: 'bg-emerald-100/50 text-emerald-700 border-emerald-200',
    error: 'bg-red-100/50 text-red-700 border-red-200',
  };

  const labels = {
    queued: 'Queued',
    processing: 'OCR Scanning',
    extracting_tasks: 'AI Extraction',
    completed: 'Ready',
    error: 'Failed',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]} backdrop-blur-sm`}>
      {labels[status]}
    </span>
  );
};

export default function DocumentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [docs, setDocs] = useState<ClarityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load Docs
  const loadDocs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserDocuments(user.uid);
      setDocs(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load documents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [user]);

  // Handle Delete
  const handleDelete = async (doc: ClarityDocument) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDocument(doc);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: "Deleted", description: "Document removed successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete document", variant: "destructive" });
    }
  };

  // Handle Download (Refreshes URL)
  const handleDownload = async (docId: string, originalUrl: string) => {
    try {
      const freshDoc = await getDocument(docId);
      const url = freshDoc?.fileUrl || originalUrl;
      window.open(url, '_blank');
    } catch (e) {
      console.error("Download failed:", e);
      window.open(originalUrl, '_blank');
    }
  };

  // Filter Logic
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.extractedText?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.processingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#030712] text-violet-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden selection:bg-violet-200 selection:text-violet-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        :root { font-family: 'Outfit', sans-serif; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .glass-panel {
          background: rgba(17, 24, 39, 0.45);
          border-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {AURORA_BACKGROUND}

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 mb-2">
              Documents
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Manage, search, and organize your intelligent documents.
            </p>
          </div>
          <Button
            onClick={() => navigate('/upload')}
            className="h-12 px-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Upload New
          </Button>
        </div>

        {/* Toolbar */}
        <div className="glass-panel p-2 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-none bg-transparent focus-visible:ring-0 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-2 md:pt-0 pl-0 md:pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-3 text-slate-600 dark:text-slate-300">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{statusFilter === 'all' ? 'All Status' : statusFilter}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-panel">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('processing')}>Processing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('error')}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="bg-slate-200/50 dark:bg-slate-700/50 w-[1px] h-6 mx-1" />

            <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
              <Button
                size="icon"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className={`w-7 h-7 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600 dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className={`w-7 h-7 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600 dark:bg-slate-700 dark:text-white' : 'text-slate-400'}`}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredDocs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-4 glass-panel rounded-3xl border-dashed"
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No documents found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              No documents match your current filters. Upload a new file to get started with Clarity OCR.
            </p>
            <Button onClick={() => navigate('/upload')} variant="outline" className="mt-6 glass-button">
              Upload Document
            </Button>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
            <AnimatePresence mode='popLayout'>
              {filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`
                    group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300
                    ${viewMode === 'grid' ? 'rounded-2xl p-5 flex flex-col' : 'rounded-xl p-4 flex items-center gap-6'}
                  `}
                >
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/0 via-transparent to-cyan-500/0 group-hover:from-violet-500/5 group-hover:to-cyan-500/5 transition-all duration-500 pointer-events-none" />

                  {/* Icon section */}
                  <div className={`
                        flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-800 shadow-inner
                        ${viewMode === 'grid' ? 'w-12 h-12 mb-4' : 'w-12 h-12 flex-shrink-0'}
                    `}>
                    <FileText className="w-6 h-6 text-violet-500" />
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3
                        className="font-semibold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                      >
                        {doc.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.createdAt ? format(doc.createdAt.toDate(), 'MMM d') : 'Now'}
                      </span>
                    </div>
                  </div>

                  {/* Footer / Actions */}
                  <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800' : 'gap-3 flex-shrink-0'}`}>
                    <StatusBadge status={doc.processingStatus} />

                    {viewMode === 'list' && doc.ocrConfidence > 0 && (
                      <Badge variant="outline" className={`${doc.ocrConfidence > 80 ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'} w-16 justify-center hidden sm:flex`}>
                        {doc.ocrConfidence}%
                      </Badge>
                    )}

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/20" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel">
                          <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.fileUrl)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-400 focus:text-red-500 focus:bg-red-50" onClick={() => handleDelete(doc)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}