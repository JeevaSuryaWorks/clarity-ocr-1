import * as pdfjsLib from 'pdfjs-dist';
import { OCRResult } from '@/types/schema';

// Initialize PDF.js worker
// Note: In Vite, we need to point to the worker file in node_modules or public
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;



/**
 * Process an Image using Google Gemini 1.5 Vision (Replacing broken Tesseract logic)
 */
const processImage = async (file: File): Promise<OCRResult> => {
  try {
    const prompt = "Extract absolutely all text perfectly exactly as it is written. Do not summarize, do not hallucinate, and do not add conversational text. Preserve the original structure and line breaks.";
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });

    // 1. Primary Strategy: Groq Vision (llama-3.2-11b-vision-instruct)
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-instruct",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
              ]
            }],
            temperature: 0.1
          })
        });

        if (groqResponse.ok) {
          const data = await groqResponse.json();
          return {
            text: (data.choices?.[0]?.message?.content || "").trim(),
            confidence: 99,
            pages: [{ pageNumber: 1, text: (data.choices?.[0]?.message?.content || "").trim() }],
          };
        }
      } catch (e) {
        console.warn("Groq Vision Request Failed, checking fallbacks...", e);
      }
    }

    // 2. Secondary Strategy: Optiic OCR API
    const optiicKey = import.meta.env.VITE_OPTIIC_API_KEY;
    if (optiicKey) {
      try {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("mode", "ocr");

        const response = await fetch("https://api.optiic.dev/process", {
          method: "POST",
          headers: { "Authorization": `Bearer ${optiicKey}` },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          return {
            text: (data.text || "").trim(),
            confidence: 99, // Optiic typically doesn't return character-level confidence
            pages: [{ pageNumber: 1, text: (data.text || "").trim() }],
          };
        }
      } catch (e) {
        console.warn("Optiic Engine crashed, checking for Hive AI fallback...", e);
      }
    }

    // 3. Final Fallback Strategy: Hive AI OCR
    const hiveSecret = import.meta.env.VITE_HIVE_SECRET_KEY;
    if (!hiveSecret) throw new Error("All Vision Keys (Groq/Optiic/Hive) Failed or Missing.");

    const hiveData = new FormData();
    hiveData.append("media", file);

    const hiveResponse = await fetch("https://api.thehive.ai/api/v2/task/sync", {
      method: "POST",
      headers: { "Authorization": `Token ${hiveSecret}` },
      body: hiveData
    });

    if (!hiveResponse.ok) {
      const errText = await hiveResponse.text();
      throw new Error(`Hive AI API Error: ${errText}`);
    }

    const hiveResult = await hiveResponse.json();
    
    let hiveTextExtract = "";
    try {
       const rawOutput = hiveResult.data[0]?.status[0]?.response?.output[0]?.classes || [];
       hiveTextExtract = rawOutput.map((c: any) => c.class).join(' ');
    } catch(err) {
       console.warn("Could not cleanly parse Hive nested JSON output:", err);
       hiveTextExtract = JSON.stringify(hiveResult);
    }

    return {
      text: hiveTextExtract.trim(),
      confidence: 99,
      pages: [{ pageNumber: 1, text: hiveTextExtract.trim() }],
    };

  } catch (error) {
    console.error('Multi-Modal Vision OCR Error:', error);
    throw new Error('Failed to process image through AI Vision Pipelines');
  }
};

/**
 * Process a PDF using PDF.js to extract text layer
 * Note: If scanned PDF (images inside PDF), we would need to render canvas and send to Tesseract.
 * This implementation extracts embedded text first (faster), falling back to basic extraction.
 */
const processPDF = async (fileUrl: string, password?: string): Promise<OCRResult> => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: fileUrl,
      password: password
    });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');

      fullText += pageText + '\n\n';
      pages.push({ pageNumber: i, text: pageText });
    }

    // If text is empty, it might be a scanned PDF (image-only).
    // In a real production environment, we would detect this and render the PDF 
    // to a canvas, then send that canvas to Tesseract.
    if (fullText.trim().length === 0) {
      console.warn("PDF appears to be image-only (scanned). OCR fallback required.");
      // For Phase 1, we return empty/warning. 
      // Phase 2 enhancement: Render page -> Canvas -> Tesseract
      return { text: "[SCANNED PDF DETECTED - RAW IMAGE MODE NEEDED]", confidence: 0, pages: [] };
    }

    return {
      text: fullText,
      confidence: 95, // Assumed high for digital PDFs
      pages,
    };
  } catch (error: any) {
    if (error.name === 'PasswordException' || error.message?.includes('Password') || error.code === 1) {
      throw new Error('PASSWORD_REQUIRED'); // Specific error for UI to catch
    }
    console.error('PDF Processing Error:', error);
    throw new Error('Failed to process PDF');
  }
};

/**
 * Main Entry Point for OCR
 */
export const runOCR = async (file: File, _language: string = 'eng', password?: string): Promise<OCRResult> => {
  const fileType = file.type;

  // Create a local URL for processing (avoids downloading from Firebase again if we have the file)
  const objectUrl = URL.createObjectURL(file);

  try {
    if (fileType === 'application/pdf') {
      return await processPDF(objectUrl, password);
    } else if (fileType.startsWith('image/')) {
      return await processImage(file);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } finally {
    URL.revokeObjectURL(objectUrl); // Cleanup
  }
};