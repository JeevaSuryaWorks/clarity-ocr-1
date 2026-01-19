/**
 * Advanced OCR & Document Parsing Service
 * Implements a Strategy Pattern for multi-engine support.
 */

import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
// ✅ FIX 3: VITE COMPATIBLE WORKER (BEST LONG-TERM)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// --- Configuration ---
// ✅ MOVED: Set worker source via import
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB for high-res images

// --- Interfaces ---

export interface OcrResult {
  text: string;
  confidence: number;
  pages?: number;
  processingTime?: number;
  fileType: string;
  strategyUsed: string;
  imageBase64?: string; // For Vision AI
}

export type ProgressCallback = (progress: number) => void;

interface OcrStrategy {
  canHandle(file: File): boolean;
  execute(file: File, progressCallback?: ProgressCallback, password?: string): Promise<OcrResult>;
}

// --- Helpers ---

/**
 * Validates file size and basic type safety.
 */
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 50MB.`);
  }
}

/**
 * Helper to convert Blob/File to Base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Optimizes images for OCR (Grayscale, Resize).
 */
async function optimizeImageForOCR(imageSource: File | HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error("Cannot create canvas context."));

    const img = new Image();
    img.onload = () => {
      // Resize if too large to prevent crash
      const maxDimension = 2500;
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      // Convert to grayscale & increase contrast simple algo
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg > 128 ? 255 : 0; // Binarization
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], "processed.png", { type: 'image/png' }));
        else reject(new Error('Image optimization failed.'));
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image for optimization.'));
    img.src = imageSource instanceof File ? URL.createObjectURL(imageSource) : imageSource.toDataURL();
  });
}

// --- Strategies ---

// ✅ FIX 2: ADD WORKER FALLBACK + ERROR HANDLING
async function createPdfDocument(arrayBuffer: ArrayBuffer, password?: string) {
  try {
    // Clone buffer for first attempt to prevent "detached ArrayBuffer" if worker transfers it
    const bufferClone = arrayBuffer.slice(0);

    return await pdfjsLib.getDocument({
      data: bufferClone,
      // ✅ FIX 1: SWITCH TO STABLE CDN (jsDelivr)
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
      password
    }).promise;
  } catch (workerError: any) {
    // Check if it's a Password Exception - if so, throw it up immediately so we don't just fallback to local
    if (workerError.name === 'PasswordException' || workerError.code === 1 || workerError.message?.includes('Password')) {
      throw workerError;
    }

    console.warn('PDF.js worker failed, trying local fallback', workerError);
    // Fallback: Disable worker (slower but works)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    return await pdfjsLib.getDocument({ data: arrayBuffer, password }).promise;
  }
}

/**
 * Strategy: PDF (PDF.js + Tesseract Fallback)
 * Optimized to reuse a single Tesseract Worker.
 */
class PdfStrategy implements OcrStrategy {
  canHandle(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  async execute(file: File, progressCallback?: ProgressCallback, password?: string): Promise<OcrResult> {
    const startTime = Date.now();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await createPdfDocument(arrayBuffer, password);

    console.log(`[PDF Strategy] Processing ${pdf.numPages} pages...`);

    let fullText = "";
    let totalConfidence = 100;
    let isScanned = false;
    let firstPageBase64: string | undefined = undefined;

    // 1. Parallel Text Extraction (Fast Path)
    // Process in batches to avoid overwhelming the browser memory
    const BATCH_SIZE = 8;
    const pageIndices = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

    // First, capture the first page for Vision AI (synchronous as it's just one page)
    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await firstPage.render({ canvasContext: context, viewport }).promise;
        firstPageBase64 = canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {
      console.warn("Failed to render first page for Vision AI", e);
    }

    // Process all pages for text content
    let detectedDigitalText = false;
    const pageTexts: string[] = new Array(pdf.numPages);

    for (let i = 0; i < pageIndices.length; i += BATCH_SIZE) {
      const batch = pageIndices.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(async (num) => {
        try {
          const page = await pdf.getPage(num);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join(' ');
          return { num, text };
        } catch (e) {
          console.warn(`Failed to extract text from page ${num}`, e);
          return { num, text: "" };
        }
      }));

      results.forEach(res => {
        pageTexts[res.num - 1] = res.text;
        if (res.text.trim().length > 20) detectedDigitalText = true;
      });

      progressCallback?.(Math.round(((i + batch.length) / pdf.numPages) * 100 * 0.8)); // 80% progress for text extraction
    }

    fullText = pageTexts.join('\n\n').trim();

    // 2. Conditional OCR (Only if document appears scanned)
    // If we have some digital text, we assume it's a digital PDF and skip OCR for speed
    if (!detectedDigitalText && pdf.numPages <= 50) {
      console.log("[PDF Strategy] No digital text detected. Attempting OCR on small document...");
      isScanned = true;
      let worker: Tesseract.Worker | null = null;

      try {
        worker = await Tesseract.createWorker('eng');
        let ocrResults = "";

        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport }).promise;
            const optimized = await optimizeImageForOCR(canvas);
            const { data } = await worker.recognize(optimized);
            ocrResults += data.text + '\n\n';
            totalConfidence = (totalConfidence + data.confidence) / 2;
          }
          progressCallback?.(80 + Math.round((i / Math.min(pdf.numPages, 10)) * 20));
        }
        fullText = ocrResults.trim() || fullText;
      } catch (err) {
        console.warn("OCR Fallback failed", err);
      } finally {
        if (worker) await worker.terminate();
      }
    } else if (!detectedDigitalText && pdf.numPages > 50) {
      console.warn("[PDF Strategy] Large scanned document detected. Skipping browser OCR.");
      fullText = "DOCUMENT IS SCANNED. Sequential OCR for large files is currently limited in-browser.";
    }

    progressCallback?.(100);

    if (!fullText.trim()) throw new Error("Could not extract any text from PDF.");

    return {
      text: fullText,
      confidence: Math.round(totalConfidence),
      pages: pdf.numPages,
      processingTime: Date.now() - startTime,
      fileType: isScanned ? 'PDF (Scanned)' : 'PDF (Digital)',
      strategyUsed: `PDF.js Parallel (BatchSize: ${BATCH_SIZE})`,
      imageBase64: firstPageBase64
    };
  }
}

/**
 * Strategy: DOCX (Mammoth)
 */
class DocxStrategy implements OcrStrategy {
  canHandle(file: File): boolean {
    return file.name.toLowerCase().endsWith('.docx');
  }

  async execute(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
    const startTime = Date.now();
    progressCallback?.(30);
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    progressCallback?.(100);

    return {
      text: result.value.trim(),
      confidence: 99,
      processingTime: Date.now() - startTime,
      fileType: 'DOCX',
      strategyUsed: 'Mammoth'
    };
  }
}

/**
 * Strategy: Image (Tesseract.js)
 */
class ImageStrategy implements OcrStrategy {
  canHandle(file: File): boolean {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type) ||
      /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);
  }

  async execute(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
    const startTime = Date.now();
    if (file.size > MAX_IMAGE_SIZE) throw new Error("Image too large for browser OCR.");

    progressCallback?.(10);
    const optimized = await optimizeImageForOCR(file);
    const imageBase64 = await blobToBase64(file);
    progressCallback?.(30);

    const { data } = await Tesseract.recognize(optimized, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progressCallback?.(30 + (m.progress * 70));
        }
      }
    });

    return {
      text: data.text.trim(),
      confidence: Math.round(data.confidence),
      processingTime: Date.now() - startTime,
      fileType: 'Image',
      strategyUsed: 'Tesseract.js',
      imageBase64
    };
  }
}

/**
 * Strategy: Plain Text & CSV
 */
class TextStrategy implements OcrStrategy {
  canHandle(file: File): boolean {
    return file.type === 'text/plain' ||
      file.type === 'text/csv' ||
      /\.(txt|md|markdown|csv)$/i.test(file.name);
  }

  async execute(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
    const startTime = Date.now();
    const text = await file.text();
    progressCallback?.(100);
    return {
      text,
      confidence: 100,
      processingTime: Date.now() - startTime,
      fileType: file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'Text',
      strategyUsed: 'Native File API'
    };
  }
}

/**
 * Strategy: Excel (XLSX)
 */
class ExcelStrategy implements OcrStrategy {
  canHandle(file: File): boolean {
    return /\.(xlsx|xls)$/i.test(file.name) ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';
  }

  async execute(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
    const startTime = Date.now();
    progressCallback?.(20);

    // Dynamic import to keep bundle small if not used
    const { read, utils } = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' });

    let fullText = "";
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = utils.sheet_to_csv(worksheet);
      fullText += `--- SHEET: ${sheetName} ---\n${csv}\n\n`;
      progressCallback?.(20 + ((index + 1) / workbook.SheetNames.length) * 80);
    });

    return {
      text: fullText.trim(),
      confidence: 100,
      processingTime: Date.now() - startTime,
      fileType: 'Excel',
      strategyUsed: 'XLSX Parser'
    };
  }
}

// --- Configuration (Loaded for Strategies) ---





// --- Context / Main Service ---

const strategies: OcrStrategy[] = [
  new PdfStrategy(), // Specific types first
  new DocxStrategy(),
  new ExcelStrategy(),
  new TextStrategy(),
  // new OcrSpaceStrategy(), // Disabled per user request
  new ImageStrategy(),    // Local OCR, fallback for images
];

export async function extractTextFromFile(file: File, progressCallback?: ProgressCallback, password?: string): Promise<OcrResult> {
  validateFile(file);

  // Find ALL applicable strategies
  const candidates = strategies.filter(s => s.canHandle(file));

  if (candidates.length === 0) {
    throw new Error(`No OCR strategy found for file type: ${file.type || 'Unknown'}`);
  }

  // Iterate through strategies (Fallback Chain)
  let lastError: any = null;

  for (const strategy of candidates) {
    try {
      console.log(`Attempting OCR with ${strategy.constructor.name}...`);
      return await strategy.execute(file, progressCallback, password);
    } catch (error: any) {
      if (error.name === 'PasswordException' || error.code === 1 || error.message?.includes('Password')) {
        if (password) {
          throw new Error('INCORRECT_PASSWORD');
        }
        throw new Error('PASSWORD_REQUIRED');
      }

      // ✅ FIX 4: STRATEGY FAILSAFE
      if (file.type === 'application/pdf' && error.message?.includes('worker')) {
        throw new Error('PDF processing unavailable due to browser restrictions. Please use images or text files.');
      }

      console.warn(`Strategy ${strategy.constructor.name} failed:`, error.message);
      lastError = error;
      // Continue to next strategy
    }
  }

  // If all failed
  console.error("All OCR strategies failed.", lastError);
  throw new Error(`OCR Processing Failed: ${lastError?.message || "Unknown error"}`);
}

// --- Utils ---

export function getFileTypeInfo(fileName: string): { type: string; icon: string; color: string } {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'pdf': return { type: 'PDF Document', icon: 'FileText', color: 'red' };
    case 'docx': return { type: 'Word Document', icon: 'FileText', color: 'blue' };
    case 'txt': case 'md': case 'markdown': return { type: 'Text File', icon: 'FileCode', color: 'green' };
    case 'csv': return { type: 'CSV Data', icon: 'Database', color: 'teal' };
    case 'xlsx': case 'xls': return { type: 'Excel Spreadsheet', icon: 'Table', color: 'emerald' };
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return { type: 'Image File', icon: 'FileImage', color: 'purple' };
    default: return { type: 'Unknown', icon: 'File', color: 'gray' };
  }
}

export function estimateProcessingTime(file: File): number {
  const sizeMB = file.size / (1024 * 1024);
  if (file.name.endsWith('.pdf')) return Math.max(5, sizeMB * 5); // ~5s per MB for PDF
  if (['jpg', 'png'].some(ext => file.name.endsWith(ext))) return Math.max(4, sizeMB * 4);
  return 2; // Fast for others
}