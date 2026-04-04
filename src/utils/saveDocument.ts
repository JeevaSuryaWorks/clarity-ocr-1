import { createClient } from '@/utils/supabase/client';

export async function saveDocument({
  fileName,
  fileType,
  fileBuffer,
  extractedText,
  summary,
  checklist,
  structuredData,
  ocrEngine,
  confidence,
  isHandwriting = false,
  language = 'en',
}: {
  fileName: string;
  fileType: string;
  fileBuffer?: Buffer;
  extractedText: string;
  summary?: string;
  checklist?: string[];
  structuredData?: object;
  ocrEngine: string;
  confidence: number;
  isHandwriting?: boolean;
  language?: string;
}) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[SaveDocument] User not logged in. Skipping save.');
    return null;
  }

  // Upload original file to Storage
  let fileUrl: string | null = null;
  if (fileBuffer) {
    const filePath = `${user.id}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, { contentType: fileType });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    } else {
      console.error('[SaveDocument] Upload error:', uploadError.message);
    }
  }

  // Save to database
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      extracted_text: extractedText,
      summary: summary ?? null,
      checklist: checklist ?? [],
      structured_data: structuredData ?? null,
      ocr_engine: ocrEngine,
      confidence,
      word_count: extractedText?.split(/\s+/).filter(Boolean).length ?? 0,
      is_handwriting: isHandwriting,
      language,
    })
    .select()
    .single();

  if (error) console.error('[SaveDocument] DB error:', error.message);
  return data;
}

export async function getDocumentHistory() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) console.error('[GetHistory]', error.message);
  return data ?? [];
}

export async function updateChatHistory(documentId: string, chatHistory: object[]) {
  const supabase = createClient();
  const { error } = await supabase
    .from('documents')
    .update({ chat_history: chatHistory })
    .eq('id', documentId);

  if (error) console.error('[UpdateChat]', error.message);
}

export async function deleteDocument(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) console.error('[DeleteDocument]', error.message);
}

export async function toggleStar(id: string, isStarred: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('documents')
    .update({ is_starred: isStarred })
    .eq('id', id);

  if (error) console.error('[ToggleStar]', error.message);
}
