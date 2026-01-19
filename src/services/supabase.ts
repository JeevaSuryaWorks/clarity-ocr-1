import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@/firebase';

// CONFIGURATION (Load from ENV in production)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rypusevqlfrfkpxuxiqh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5cHVzZXZxbGZyZmtweHV4aXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjY4MTAsImV4cCI6MjA4MzYwMjgxMH0.AvXyxPXrwI5ulDIahZ1rZdiA_GnETSzlt_0dIIx_ifA';

/**
 * 🌉 Get Authenticated Supabase Client (Singleton-like usage)
 * 
 * Returns a Supabase client instance with the current Firebase user's ID token
 * injected into the Authorization header.
 * 
 * SECURITY: Uses the Anon Key. Security is enforced by RLS on the server.
 */
// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const getAuthenticatedSupabase = async (): Promise<SupabaseClient> => {
    // Return existing instance
    if (supabaseInstance) return supabaseInstance;

    // Use Anon Client for public reads (RLS handles the rest via Proxy writes)
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    });

    return supabaseInstance;
};

/**
 * 🔄 Sync Firebase Identity to Supabase
 */
export const syncUserToSupabase = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        // Call Proxy to Sync
        const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-proxy/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("Supabase Sync Error:", err);
        }
    } catch (err) {
        console.error("Critical Sync Failure:", err);
    }
}

/**
 * 📤 Upload File to Supabase Storage
 */
export const uploadFileToSupabase = async (
    bucket: 'profile_photos' | 'raw_uploads' | 'processed_docs',
    file: File,
    resourceId: string = 'default'
): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in to upload");

    // 1. Get Firebase Token
    const token = await user.getIdToken();

    // 2. Prepare Path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${user.uid}/${resourceId}/${timestamp}_${sanitizedName}`;

    // 3. Request Upload URL from Proxy
    const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-proxy/upload-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            bucket,
            path: filePath
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Upload Token Failed: ${err.error || response.statusText}`);
    }

    const { signedUrl, path } = await response.json();

    // 4. Upload to the Signed URL
    const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
            'cache-control': 'max-age=3600'
        }
    });

    if (!uploadRes.ok) {
        throw new Error(`Upload Failed: ${uploadRes.statusText}`);
    }

    return path;
};

/**
 * 🔗 Get Signed URL for Private File
 */
/**
 * 🔗 Get Signed URL for Private File
 */
export const getSignedUrl = async (
    bucket: 'profile_photos' | 'raw_uploads' | 'processed_docs',
    path: string
): Promise<string> => {
    const sb = await getAuthenticatedSupabase();

    // 1. For Public Buckets, return public URL
    if (bucket === 'profile_photos') {
        const { data } = sb.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }

    // 2. For Private Buckets, ask Proxy for Signed URL
    try {
        const user = auth.currentUser;
        if (!user) return ""; // Cannot sign without auth
        const token = await user.getIdToken();

        const response = await fetch(`${SUPABASE_URL}/functions/v1/secure-proxy/create-signed-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bucket,
                path,
                expiresIn: 3600 // Request 1 hour expiration
            })
        });

        if (!response.ok) {
            console.error("Sign URL Failed Status:", response.statusText);
            return "";
        }

        const { signedUrl } = await response.json();
        return signedUrl;
    } catch (err) {
        console.error("Sign URL Failed:", err);
        return "";
    }
}
