import { createClient } from '@/utils/supabase/client';

/**
 * 📤 Upload File to Supabase Storage
 */
export const uploadFileToSupabase = async (
    bucket: 'profile_photos' | 'raw_uploads' | 'processed_docs' | 'documents',
    file: File,
    resourceId: string = 'default'
): Promise<string> => {
    const supabase = createClient();
    
    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fallback ID structure if Firebase is still dominating login, though RLS will block if fully anonymous
    const uid = user?.id || 'anonymous'; 

    // 2. Prepare Path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${uid}/${resourceId}/${timestamp}_${sanitizedName}`;

    // Map legacy buckets to the newly created 'documents' bucket
    const targetBucket = bucket === 'documents' ? 'documents' : 'documents';

    // 3. Upload Directly
    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file);

    if (error) {
        throw new Error(`Upload Failed: ${error.message}`);
    }

    return data.path;
};

/**
 * 🔗 Get URL for File (Public Bucket)
 */
export const getSignedUrl = async (
    bucket: 'profile_photos' | 'raw_uploads' | 'processed_docs' | 'documents',
    path: string
): Promise<string> => {
    const supabase = createClient();
    const targetBucket = bucket === 'documents' ? 'documents' : 'documents';

    // Because the 'documents' bucket is configured as PUBLIC per the SQL setup, 
    // we do not need signed tokens for generic views.
    const { data } = supabase.storage.from(targetBucket).getPublicUrl(path);
    return data.publicUrl;
};
