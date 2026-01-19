
import {
  useState,
  useRef,
  useCallback,
  FC,
  useReducer,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react"; // Only used for the close button
import { collection, addDoc } from "firebase/firestore";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// Custom Hooks & Contexts
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Services & Firebase
import { db } from "@/firebase";
import { uploadFileToSupabase, getSignedUrl } from "@/services/supabase"; // Supabase Migration
import { registerProcessedDocument } from "@/services/documentService";
import { compressImage } from "@/utils/imageProcessing";
import {
  extractTextFromFile,
  OcrResult,
  getFileTypeInfo,
  estimateProcessingTime,
} from "@/services/ocrService";
import { getStorageStats } from "@/services/storageService";

// --- Import the new 3D Icons ---
import {
  IconUpload,
  IconFileText,
  IconFileCode,
  IconFileImage,
  IconCheckCircle,
  IconAlertCircle,
  IconLoader
} from "@/components/ui/3d-icons";

// --- Constants ---
const ALLOWED_EXTENSIONS = [
  ".pdf", ".docx", ".txt", ".md", ".markdown",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp",
];

// --- Type Definitions ---
interface FileUploadProps {
  onFileProcessed: (content: string, fileName?: string, imageBase64?: string, fileSize?: number) => Promise<void>;
  isAnalyzing: boolean;
  progress?: number;
  onRequestPassword?: (file: File, resolve: (pw: string) => void, reject: () => void) => void;
}

// --- Main FileUpload Component ---
interface State {
  uploadStatus: "idle" | "processing" | "success" | "error";
  fileInfo: { name: string; size: string; type: string; icon: ReactNode } | null;
  ocrResult: OcrResult | null;
  uploadProgress: number;
  errorDetails: string | null;
  estimatedTime: number;
  processingStartTime: number;
}

type Action =
  | { type: "RESET" }
  | { type: "START_PROCESSING"; payload: { fileInfo: State["fileInfo"]; estimatedTime: number } }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "SET_SUCCESS"; payload: OcrResult }
  | { type: "SET_ERROR"; payload: { errorDetails: string; fileInfo?: State["fileInfo"] } };

// --- Reducer for complex state management ---
const initialState: State = {
  uploadStatus: "idle",
  fileInfo: null,
  ocrResult: null,
  uploadProgress: 0,
  errorDetails: null,
  estimatedTime: 0,
  processingStartTime: 0,
};

function fileUploadReducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "START_PROCESSING":
      return {
        ...initialState,
        uploadStatus: "processing",
        fileInfo: action.payload.fileInfo,
        estimatedTime: action.payload.estimatedTime,
        processingStartTime: Date.now(),
      };
    case "SET_PROGRESS":
      return { ...state, uploadProgress: action.payload };
    case "SET_SUCCESS":
      return {
        ...state,
        uploadStatus: "success",
        ocrResult: action.payload,
        uploadProgress: 100,
      };
    case "SET_ERROR":
      return {
        ...state,
        uploadStatus: "error",
        errorDetails: action.payload.errorDetails,
        fileInfo: action.payload.fileInfo || state.fileInfo,
      };
    default:
      return state;
  }
}

// --- Helper Functions ---

/**
 * Maps a file type string from the service to its corresponding 3D icon component.
 */
const getIconForFileType = (iconName: string): ReactNode => {
  switch (iconName) {
    case "FileCode":
      return <IconFileCode className="w-8 h-8" />;
    case "FileImage":
      return <IconFileImage className="w-8 h-8" />;
    default:
      return <IconFileText className="w-8 h-8" />;
  }
};

/**
 * Formats a file size in bytes into a readable string (KB, MB, GB).
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// --- Main FileUpload Component ---
export const FileUpload: FC<FileUploadProps> = ({
  onFileProcessed,
  isAnalyzing,
  progress = 0,
  onRequestPassword,
}) => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  const {
    uploadStatus,
    fileInfo,
    ocrResult,
    uploadProgress,
    errorDetails,
    estimatedTime,
    processingStartTime,
  } = state;

  const [textInput, setTextInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isProcessing = uploadStatus === "processing" || isAnalyzing;
  const elapsedTime =
    processingStartTime > 0
      ? Math.round((Date.now() - processingStartTime) / 1000)
      : 0;

  const resetState = useCallback(() => {
    dispatch({ type: "RESET" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const saveTaskToHistory = useCallback(
    async (uploadedFile: File, result: OcrResult) => {
      if (!user?.uid) return;
      try {
        await addDoc(collection(db, `users/${user.uid}/tasks`), {
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
          fileType: result.fileType,
          strategyUsed: result.strategyUsed, // New Field
          confidence: result.confidence ?? null,
          pages: result.pages ?? null,
          processingTime: result.processingTime ?? null,
          timestamp: Date.now(),
          content: result.text, // Full text extracted
        });
      } catch (firestoreError) {
        console.error("Firestore Write Error:", firestoreError);
        toast({
          title: "Note",
          description: "Could not save this task to your history.",
          variant: "default",
        });
      }
    },
    [user, toast]
  );

  const handleFileUpload = useCallback(
    async (file: File, password?: string) => {
      // If retrying with password, don't reset fully, just keep status processing
      if (!password) resetState();

      if (!user?.uid) {
        toast({ title: "Error", description: "You must be logged in to upload.", variant: "destructive" });
        return;
      }

      const fileTypeInfo = getFileTypeInfo(file.name);
      const fileInfoPayload = {
        name: file.name,
        size: formatFileSize(file.size),
        type: fileTypeInfo.type,
        icon: getIconForFileType(fileTypeInfo.icon),
      };

      try {
        // 0. Compress Image (if applicable)
        let fileToProcess = file;
        try {
          if (file.type.startsWith('image/')) {
            fileToProcess = await compressImage(file);
          }
        } catch (err) {
          console.warn("Compression failed, using original:", err);
        }

        dispatch({
          type: "START_PROCESSING",
          payload: {
            fileInfo: fileInfoPayload,
            estimatedTime: Math.round(estimateProcessingTime(fileToProcess)),
          },
        });

        // --- CHECK STORAGE LIMIT FIRST ---
        if (user?.uid) {
          const stats = await getStorageStats(user.uid);
          if (stats.used + fileToProcess.size > stats.limit) {
            toast({
              title: "Storage Limit Exceeded",
              description: `You have reached your ${stats.limit / (1024 * 1024 * 1024)}GB storage limit. Please upgrade to upload more.`,
              variant: "destructive"
            });
            dispatch({
              type: "SET_ERROR",
              payload: { errorDetails: "Storage limit exceeded. Upgrade to unlock more space.", fileInfo: fileInfoPayload }
            });
            return;
          }
        }

        // --- PARALLEL EXECUTION STRATEGY ---
        // Task 1: Upload to Supabase Storage (Migration Fix)
        const storageUploadPromise = (async () => {
          try {
            // New Supabase Helper:
            const path = await uploadFileToSupabase('raw_uploads', fileToProcess);

            // Get Signed URL for 1 hour to allow immediate processing/viewing
            const signedUrl = await getSignedUrl('raw_uploads', path);
            return signedUrl;
          } catch (storageError) {
            console.warn("Supabase Upload Silent Failure:", storageError);
            return "";
          }
        })();

        // Task 2: Extract Text (Helper internal function to handle password)
        const extractWithPassword = async () => {
          return extractTextFromFile(fileToProcess, (p) =>
            dispatch({ type: "SET_PROGRESS", payload: Math.round(p) }),
            password
          );
        };

        const result = await extractWithPassword();

        if (!result.text || result.text.trim().length < 10) {
          throw new Error("Could not extract enough readable text from the file.");
        }

        // Wait for upload
        const downloadUrl = await storageUploadPromise;

        // 3. Register & Proceed
        try {
          await registerProcessedDocument(user.uid, file, result.text, result.confidence || 0, downloadUrl);
          if (!downloadUrl) {
            toast({
              title: "Storage Skipped",
              description: "Analysis complete, but cloud backup failed. Proceeding...",
              variant: "default",
            });
          }
        } catch (regError) {
          console.error("Failed to register document:", regError);
        }

        dispatch({ type: "SET_SUCCESS", payload: result });
        await onFileProcessed(result.text, file.name, result.imageBase64, file.size);
        await saveTaskToHistory(file, result);

      } catch (error: any) {
        // Handle Password Requirement (Initial or Incorrect)
        if ((error.message === 'PASSWORD_REQUIRED' || error.message === 'INCORRECT_PASSWORD') && onRequestPassword) {

          if (error.message === 'INCORRECT_PASSWORD') {
            toast({ title: "Incorrect Password", description: "Please try again.", variant: "destructive" });
          }

          console.log("Password required, requesting from user...");
          new Promise<string>((resolve, reject) => {
            onRequestPassword(file, resolve, reject);
          }).then((pw) => {
            // Retry recursively with password
            handleFileUpload(file, pw);
          }).catch(() => {
            dispatch({
              type: "SET_ERROR",
              payload: { errorDetails: "Password entry cancelled.", fileInfo: fileInfoPayload },
            });
          });
          return;
        }

        const errorMessage = error.message || "An unknown error occurred during processing.";
        dispatch({
          type: "SET_ERROR",
          payload: { errorDetails: errorMessage, fileInfo: fileInfoPayload },
        });
        toast({
          title: "Processing Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [resetState, onFileProcessed, saveTaskToHistory, toast, user, onRequestPassword]
  );

  const handleTextAnalyze = async () => {
    if (textInput.trim().length < 10) {
      toast({
        title: "Text is too short",
        description: "Please enter at least 10 characters to analyze.",
        variant: "destructive",
      });
      return;
    }
    await onFileProcessed(textInput.trim(), "Pasted Text");
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isProcessing || !e.dataTransfer.files?.[0]) return;
      handleFileUpload(e.dataTransfer.files[0]);
    },
    [isProcessing, handleFileUpload]
  );

  return (
    <div className="max-w-4xl w-full mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Text Input Card */}
        <motion.div whileHover={{ scale: 1.02 }} className="h-full">
          <Card className="p-1 rounded-[24px] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-xl h-full backdrop-blur-sm overflow-hidden group">
            <div className="bg-white/95 dark:bg-slate-900/95 h-full p-6 rounded-[22px] flex flex-col transition-colors duration-300 group-hover:bg-white dark:group-hover:bg-slate-900">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                  <IconFileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Paste Text</h3>
                  <div className="h-1 w-12 bg-indigo-500 rounded-full mt-1" />
                </div>
              </div>

              <Textarea
                placeholder="Paste your document text, meeting notes, or raw content here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="flex-grow min-h-[180px] mb-6 text-base bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/50 rounded-xl resize-none p-4 transition-all"
                disabled={isProcessing}
              />

              <Button
                onClick={handleTextAnalyze}
                disabled={!textInput.trim() || isProcessing}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isAnalyzing && !fileInfo ? (
                  <span className="flex items-center gap-2">
                    <IconLoader className="h-5 w-5 animate-spin" /> Analyzing...
                  </span>
                ) : (
                  "Analyze Text"
                )}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* File Upload Card */}
        <motion.div whileHover={{ scale: 1.02 }} className="h-full">
          <Card className="p-1 rounded-[24px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 shadow-xl h-full backdrop-blur-sm overflow-hidden group cursor-pointer"
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <div className="bg-white/80 dark:bg-slate-900/80 h-full p-6 rounded-[22px] flex flex-col relative overflow-hidden transition-all duration-300 group-hover:bg-white/90 dark:group-hover:bg-slate-900/90">
              {/* Dashed Border Overlay */}
              <div className={`absolute inset-4 rounded-[18px] border-2 border-dashed transition-all duration-300 pointer-events-none
                ${isDragging ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[0.98]" : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-400 group-hover:scale-[0.99]"}
            `} />

              <div className="relative z-10 flex flex-col h-full"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                    <IconUpload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Upload File</h3>
                    <div className="h-1 w-12 bg-purple-500 rounded-full mt-1" />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  disabled={isProcessing}
                  className="hidden"
                  accept={ALLOWED_EXTENSIONS.join(",")}
                />

                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                  <DropzoneContent
                    isAnalyzing={isAnalyzing}
                    uploadStatus={uploadStatus}
                    uploadProgress={uploadProgress}
                    estimatedTime={estimatedTime}
                    elapsedTime={elapsedTime}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* File Info & Progress Card */}
      <AnimatePresence>
        {fileInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="mt-6"
          >
            <Card className="p-4 rounded-2xl shadow-lg overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                  {fileInfo?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate" title={fileInfo?.name}>
                    {fileInfo?.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                    <span>{fileInfo?.size}</span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                    <span>{fileInfo?.type}</span>
                  </div>
                </div>
                <button
                  onClick={resetState}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(uploadStatus === "processing" || isAnalyzing) && (
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {isAnalyzing ? "AI Analysis" : "Text Extraction"}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {isAnalyzing ? progress : uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                      className="h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${isAnalyzing ? progress : uploadProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{
                        backgroundColor: isAnalyzing ? "#8b5cf6" : "#4f46e5",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Confidence: {ocrResult?.confidence ?? 0}%
                </span>
                {/* <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                  {ocrResult?.strategyUsed || "Unknown"}
                </span> */}
                {ocrResult?.pages && (
                  <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {ocrResult?.pages} page{ocrResult?.pages !== 1 ? "s" : ""}
                  </span>
                )}
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  {ocrResult?.text?.length?.toLocaleString() ?? 0} characters
                </span>
              </div>

              {uploadStatus === "error" && errorDetails && (
                <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md">
                  {errorDetails}
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Component for Dropzone Content ---
const DropzoneContent: FC<{
  isAnalyzing: boolean;
  uploadStatus: State["uploadStatus"];
  uploadProgress: number;
  estimatedTime: number;
  elapsedTime: number;
}> = ({
  isAnalyzing,
  uploadStatus,
  uploadProgress,
  estimatedTime,
  elapsedTime,
}) => {
    const iconSize = "w-20 h-20 mx-auto";

    if (isAnalyzing) {
      return (
        <>
          <IconLoader className={`${iconSize} animate-spin`} />
          <p className="mt-4 font-semibold text-gray-800">Analyzing Content...</p>
          <p className="text-sm text-gray-500">This may take just a moment.</p>
        </>
      );
    }
    switch (uploadStatus) {
      case "processing":
        if (uploadProgress === 100) {
          return (
            <>
              <IconLoader className={`${iconSize} animate-spin text-indigo-500`} />
              <p className="mt-4 font-semibold text-indigo-700">Finalizing Analysis...</p>
              <p className="text-sm text-gray-500">Syncing with cloud storage...</p>
            </>
          );
        }
        return (
          <>
            <IconLoader className={`${iconSize} animate-spin`} />
            <p className="mt-4 font-semibold text-gray-800">Extracting Text...</p>
            <p className="text-sm text-gray-500">
              {uploadProgress}% complete • Est. ~{Math.max(0, estimatedTime - elapsedTime)}s left
            </p>
          </>
        );
      case "success":
        return (
          <>
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <IconCheckCircle className={iconSize} />
            </motion.div>
            <p className="mt-4 font-semibold text-green-700">Text Extracted</p>
            <p className="text-sm text-gray-500">Handing off to AI for analysis...</p>
          </>
        );
      case "error":
        return (
          <>
            <motion.div initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}>
              <IconAlertCircle className={iconSize} />
            </motion.div>
            <p className="mt-4 font-semibold text-red-700">Processing Failed</p>
            <p className="text-sm text-gray-500">Please try another file.</p>
          </>
        );
      case "idle":
      default:
        return (
          <>
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <IconUpload className={iconSize} />
            </motion.div>
            <p className="mt-4 font-medium text-gray-700">
              Drop your file here or{" "}
              <span className="font-semibold text-indigo-600 cursor-pointer">browse</span>
            </p>
            <p className="text-sm text-gray-500">Max File Size: 50MB</p>
          </>
        );
    }
  };