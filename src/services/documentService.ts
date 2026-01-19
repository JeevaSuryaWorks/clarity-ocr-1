import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { uploadFileToSupabase, getSignedUrl, getAuthenticatedSupabase } from "@/services/supabase";
import { ClarityDocument, OCRResult } from "@/types/schema";
import { runOCR } from "@/lib/ocrEngine";

import { compressImage } from "@/utils/imageProcessing";

const COLLECTION_NAME = "documents";

// --- Types ---
export interface DocumentFilter {
  status?: 'queued' | 'processing' | 'completed' | 'error';
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

/**
 * Upload and Process Logic (Preserved from Phase 2, ensures backward compatibility)
 */
export const uploadAndProcessDocument = async (
  originalFile: File,
  tags: string[] = [],
  onProgress?: (progress: number) => void
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  // 0. Compress Image (if applicable)
  let file = originalFile;
  try {
    if (file.type.startsWith('image/')) {
      if (onProgress) onProgress(5); // Initial progress
      file = await compressImage(file);
    }
  } catch (err) {
    console.warn("Image compression failed, proceeding with original file:", err);
  }

  // 1. Upload to Supabase Storage
  // Simulating progress since simple upload doesn't stream progress easily in this helper yet
  if (onProgress) onProgress(30);

  try {
    const path = await uploadFileToSupabase('raw_uploads', file);
    if (onProgress) onProgress(60);

    // For Documents, we might want a signed URL or just the path.
    // The original code stored a Download URL.
    // We will store the Signed URL (valid for 1 hour) AND the path in a new field?
    // Or just store the Signed URL in 'fileUrl' to keep frontend compatibility for now.
    // Ideally, we should store `storagePath` explicitly.
    const downloadUrl = await getSignedUrl('raw_uploads', path);

    // 2. Create Firestore Record
    const docData: Partial<ClarityDocument> = {
      uploaderId: user.uid,
      workspaceId: user.uid,
      name: file.name,
      fileUrl: downloadUrl, // Temporary Signed URL
      storagePath: path, // New field for permanent reference
      fileType: file.type,
      fileSize: file.size,
      docType: 'other',
      processingStatus: 'processing',
      ocrConfidence: 0,
      extractedText: '',
      pageCount: 1,
      language: 'eng',
      tags: tags,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    // 3. Run OCR (Client-Side for MVP)
    if (onProgress) onProgress(70);

    try {
      const ocrResult: OCRResult = await runOCR(file);
      if (onProgress) onProgress(90);

      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        extractedText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        pageCount: ocrResult.pages.length,
        processingStatus: 'completed',
        updatedAt: serverTimestamp(),
      });

      if (onProgress) onProgress(100);
      return docRef.id;

    } catch (ocrError: any) {
      console.error("OCR Failed:", ocrError);
      await updateDoc(doc(db, COLLECTION_NAME, docRef.id), {
        processingStatus: 'error',
        errorMsg: ocrError.message || "OCR Extraction Failed"
      });
      return docRef.id;
    }

  } catch (error) {
    console.error("Upload/Process Failed:", error);
    throw error;
  }
};

/**
 * Fetch All Documents for User
 */
export const getUserDocuments = async (userId: string, filter?: DocumentFilter): Promise<ClarityDocument[]> => {
  try {
    let q = query(
      collection(db, COLLECTION_NAME),
      where("uploaderId", "==", userId),
      orderBy("createdAt", "desc")
    );

    if (filter?.status && filter.status !== 'all' as any) {
      q = query(q, where("processingStatus", "==", filter.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClarityDocument));
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

/**
 * Fetch Single Document
 */
/**
 * Helper: Enrich Document with Fresh Signed URL
 */
const enrichDocument = async (docData: ClarityDocument): Promise<ClarityDocument> => {
  let path = docData.storagePath;
  let bucket: 'raw_uploads' | 'processed_docs' = 'raw_uploads';

  // Fallback: Extract path from existing Signed URL if storagePath is missing
  if (!path && docData.fileUrl) {
    try {
      const url = new URL(docData.fileUrl);
      // Expected format: .../storage/v1/object/sign/<bucket>/<path>?token=...
      const matches = url.pathname.match(/\/sign\/([^\/]+)\/(.+)$/);
      if (matches && matches.length >= 3) {
        bucket = matches[1] as any;
        path = matches[2]; // This is the encoded path, might need decoding?
        // Usually path in URL is URL-encoded.
        path = decodeURIComponent(path);
      }
    } catch (e) {
      console.warn("Failed to parse existing fileUrl", e);
    }
  }

  if (path) {
    try {
      // Determine bucket if we have path but it wasn't extracted from URL
      if (!docData.fileUrl?.includes(bucket)) {
        bucket = path.includes('processed') ? 'processed_docs' : 'raw_uploads';
      }

      const refreshUrl = await getSignedUrl(bucket, path);
      if (refreshUrl) {
        return { ...docData, fileUrl: refreshUrl };
      }
    } catch (e) {
      console.warn("Failed to refresh signed URL", e);
    }
  }
  return docData;
};

/**
 * Fetch Single Document
 */
export const getDocument = async (id: string): Promise<ClarityDocument | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() } as ClarityDocument;
      return await enrichDocument(data);
    }
    return null;
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
};

/**
 * Delete Document (Firestore + Storage)
 */
/**
 * Delete Document (Firestore + Storage)
 */
export const deleteDocument = async (document: ClarityDocument): Promise<void> => {
  try {
    // 1. Delete from Firestore
    await deleteDoc(doc(db, COLLECTION_NAME, document.id));

    // 2. Delete from Supabase Storage
    const path = document.storagePath || (document.fileUrl && !document.fileUrl.includes('firebasestorage') ? document.fileUrl : null);

    if (path) {
      try {
        const sb = await getAuthenticatedSupabase();
        await sb.storage.from('raw_uploads').remove([path]);
        await sb.storage.from('processed_docs').remove([path]);
      } catch (e) {
        console.warn("Supabase Storage Delete Warning:", e);
      }
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

/**
 * Update Document Metadata
 */
export const updateDocumentMetadata = async (id: string, data: Partial<ClarityDocument>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

/**
 * Register a document processed via UploadPage (Client-Side)
 * This ensures it appears in the Documents list and counts regarding storage.
 */
export const registerProcessedDocument = async (
  userId: string,
  file: File,
  text: string,
  confidence: number,
  fileUrl: string = '' // Added fileUrl parameter
): Promise<string> => {
  try {
    const docData: Partial<ClarityDocument> = {
      uploaderId: userId,
      workspaceId: userId,
      name: file.name,
      fileUrl: fileUrl, // Use the provided URL
      fileType: file.type,
      fileSize: file.size,
      docType: 'other',
      processingStatus: 'completed',
      ocrConfidence: confidence,
      extractedText: text,
      pageCount: 1, // Estimate
      language: 'eng',
      tags: ['ai-analyzed'],
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    return docRef.id;
  } catch (error) {
    console.error("Error registering document:", error);
    throw error;
  }
};