import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, Maximize2, Minimize2, ArrowLeft, Save, CloudOff, Eye, PenLine, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDocument, updateDocumentMetadata } from '@/services/documentService';
import { ClarityDocument } from '@/types/schema';
import { doc as firestoreDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
// import { motion, AnimatePresence } from 'framer-motion';

// --- Simple Markdown Viewer Component ---
const MarkdownViewer = ({ content }: { content: string }) => {
  if (!content) return <p className="text-slate-400 italic">No content to display.</p>;

  // Regex for inline styles
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm font-mono text-violet-600 dark:text-violet-400">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const parseLine = (line: string, i: number) => {
    // Headers
    if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-4 mt-8 pb-2 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">{parseInline(line.slice(2))}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mb-3 mt-6 text-slate-800 dark:text-slate-100">{parseInline(line.slice(3))}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mb-2 mt-5 text-slate-800 dark:text-slate-100">{parseInline(line.slice(4))}</h3>;
    if (line.startsWith('#### ')) return <h4 key={i} className="text-lg font-semibold mb-2 mt-4 text-slate-700 dark:text-slate-200 uppercase tracking-wide">{parseInline(line.slice(5))}</h4>;

    // Lists
    if (line.trim().startsWith('- ')) return <li key={i} className="ml-4 list-disc mb-1 pl-1 text-slate-700 dark:text-slate-300">{parseInline(line.trim().slice(2))}</li>;
    if (line.trim().match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal mb-1 pl-1 text-slate-700 dark:text-slate-300">{parseInline(line.trim().replace(/^\d+\. /, ''))}</li>;

    // Blockquotes
    if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-violet-400 pl-4 py-2 my-4 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 italic rounded-r">{parseInline(line.slice(2))}</blockquote>;

    // Code Blocks (simple detection)
    if (line.startsWith('```')) return null; // Skip fence lines for now in this simple parser

    // Empty lines
    if (!line.trim()) return <div key={i} className="h-2" />;

    // Paragraphs
    return <p key={i} className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300">{parseInline(line)}</p>;
  };

  return (
    <div className="prose dark:prose-invert max-w-none p-4 pb-20">
      {content.split('\n').map(parseLine)}
    </div>
  );
};

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState<ClarityDocument | null>(null);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const docRef = firestoreDoc(db, 'documents', id);
    const unsubscribe = onSnapshot(docRef, async (snap: any) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as ClarityDocument;

        // Use `getDocument` logic (via a temporary helper or direct logic) to refresh signed URL.
        // Since `getDocument` does `getDoc` internally, we can't reuse it cleanly inside onSnapshot without extra calls.
        // Ideal: Duplicate enrichment logic or extract it to a shared helper.
        // For now, let's call `getDocument(id)` triggers a fresh fetch + enrichment.
        // BUT calling `getDocument` inside onSnapshot is redundant for data but ESSENTIAL for URL.
        // better: use the data from snapshot and call enrichDocument helper if exported.
        // Since enrichDocument is not exported, let's just call `getDocument` to get the fresh URL version,
        // relying on onSnapshot mainly for STATUS updates.

        // Actually, let's just use `getDocument` for the URL refresh on initial load,
        // and onSnapshot for status updates.
        // IF status changes to 'completed', we might need to refresh URL if the file changed?
        // Usually file doesn't change, only status.

        // WAIT: If the file is private, we MUST sign the URL. The URL in Firestore might be expired.
        // So we ALWAYS need to sign it.

        // Let's import the `getSignedUrl` directly here or assume `getDocument` handles it.
        // Let's reload the whole doc using `getDocument` when snapshot fires?
        // That's 2x reads.

        // PROPER FIX:
        // We will just fetch the enriched doc.
        const enrichedDoc = await getDocument(id);
        if (enrichedDoc) {
          setDoc(enrichedDoc);
          // Verify if we need to update text (don't overwrite user edits if they are typing!)
          // Only overwrite if remote text changed AND local is empty/pristine? 
          // Or just sync extraction.
          if (enrichedDoc.extractedText) {
            setEditedText(prev => prev === enrichedDoc.extractedText || !prev ? enrichedDoc.extractedText : prev);
          }
        }

      } else {
        toast({ title: "Error", description: "Document not found", variant: "destructive" });
        navigate('/documents');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!doc || !id) return;
    setSaving(true);
    try {
      await updateDocumentMetadata(id, { extractedText: editedText });
      setDoc({ ...doc, extractedText: editedText });
      toast({ title: "Saved", description: "Changes saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc?.name || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewOriginal = async () => {
    if (!doc || !id) return;
    try {
      // Refresh the signed URL to prevent expiration errors
      const freshDoc = await getDocument(id);
      if (freshDoc?.fileUrl) {
        window.open(freshDoc.fileUrl, '_blank');
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    } catch (e) {
      console.error("Failed to refresh URL", e);
      window.open(doc.fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#030712] text-violet-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] dark:bg-[#030712] overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        :root { font-family: 'Outfit', sans-serif; }
      `}</style>

      {/* Aurora Accent */}
      <div className="absolute top-0 right-0 w-[50%] h-[20%] bg-violet-500/10 blur-[100px] pointer-events-none" />

      {/* Toolbar */}
      <div className="h-16 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 z-20 flex-shrink-0">
        <div className="flex items-center gap-4 min-w-0 flex-1 mr-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/documents')} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-white truncate text-lg md:text-xl" title={doc.name}>
              {doc.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`px-1.5 py-0.5 rounded-md ${doc.processingStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} flex-shrink-0`}>
                {doc.processingStatus}
              </span>
              <span className="flex-shrink-0">•</span>
              <span className="truncate">{doc.ocrConfidence}% Confidence</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg mr-2">
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              onClick={() => setViewMode('preview')}
              className={`h-7 px-3 text-xs rounded-md shadow-none ${viewMode === 'preview' ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Read
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              onClick={() => setViewMode('edit')}
              className={`h-7 px-3 text-xs rounded-md shadow-none ${viewMode === 'edit' ? 'bg-white text-violet-600 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}
            >
              <PenLine className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewOriginal}
            className="h-9 w-9 text-slate-500 hover:text-violet-600 mr-1"
            title="View Original File"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadText} className="hidden sm:flex h-9 border-slate-200 dark:border-slate-700">
            <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || editedText === doc.extractedText}
            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px] h-9 shadow-lg shadow-violet-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Document Preview (Collapsible) */}
        {!fullscreen && (
          <div className="w-[45%] border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-100/50 dark:bg-slate-950/50 relative flex flex-col hidden lg:flex">
            {/* Top Bar for Preview */}
            <div className="h-10 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Original File</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(z => Math.max(z - 10, 50))}>-</Button>
                <span className="text-xs w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(z => Math.min(z + 10, 200))}>+</Button>
              </div>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-100/50 dark:bg-slate-950/50 flex relative">
              <div className="m-auto ">
                {!doc.fileUrl ? (
                  <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-xs mx-auto">
                    <CloudOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Preview Unavailable</h3>
                    <p className="text-slate-500 text-xs mt-1">File not synced to cloud.</p>
                  </div>
                ) : (
                  <div className={`relative ${doc.fileType === 'application/pdf' ? 'w-full h-full' : ''} flex justify-center`}>
                    {doc.fileType === 'application/pdf' ? (
                      /* PDF: Full Height Iframe with Native Scrolling */
                      <div className="w-full h-[calc(100vh-140px)] bg-slate-100 dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden">
                        <iframe
                          src={doc.fileUrl}
                          className="w-full h-full border-none"
                          title="PDF Preview"
                        />
                      </div>
                    ) : doc.fileType && doc.fileType.startsWith('image/') ? (
                      /* Images: Auto Scale with Zoom */
                      <div style={{ width: `${zoom}%`, transition: 'width 0.2s' }}>
                        <img
                          src={doc.fileUrl}
                          alt="Document"
                          className="w-full h-auto rounded-lg shadow-md bg-white"
                        />
                      </div>
                    ) : (
                      /* Text/Markdown: Auto Scale with Zoom */
                      <div style={{ width: `${zoom}%`, minWidth: '300px', transition: 'width 0.2s' }}>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 h-10">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                              {doc.fileType === 'text/markdown' || doc.name.endsWith('.md') ? 'Markdown Source' : 'Extracted Text Preview'}
                            </span>
                            <FileText className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="p-8 bg-white text-left relative">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_2rem] pointer-events-none opacity-20" />
                            <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {doc.extractedText || "No text content available."}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right: Extracted Text / Markdown Editor */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col relative z-0">

          {/* Editor Top Bar */}
          <div className="h-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center px-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {viewMode === 'edit' ? 'Markdown Editor' : 'Reading View'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600 hidden lg:flex"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Restore Split View" : "Maximize Editor"}
            >
              {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
          </div>

          <div className="flex-1 overflow-auto relative">
            {viewMode === 'edit' ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full resize-none border-none focus-visible:ring-0 p-6 md:p-8 text-base md:text-lg leading-relaxed font-mono text-slate-800 dark:text-slate-200 bg-transparent"
                spellCheck={false}
                placeholder="# Start typing..."
              />
            ) : (
              <div className="p-6 md:p-8 max-w-3xl mx-auto">
                <MarkdownViewer content={editedText} />
              </div>
            )}
          </div>

          {/* Floating Toggle for Mobile */}
          <div className="fixed bottom-6 right-6 lg:hidden shadow-xl rounded-full bg-white dark:bg-slate-800 p-1 flex items-center border border-slate-200 dark:border-slate-700 z-50">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleViewOriginal}
              className="rounded-full shadow-none text-slate-500 hover:text-violet-600"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
            <Button
              size="icon"
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              onClick={() => setViewMode('preview')}
              className={`rounded-full shadow-none ${viewMode === 'preview' ? 'bg-violet-600 text-white' : ''}`}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              onClick={() => setViewMode('edit')}
              className={`rounded-full shadow-none ${viewMode === 'edit' ? 'bg-violet-600 text-white' : ''}`}
            >
              <PenLine className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}