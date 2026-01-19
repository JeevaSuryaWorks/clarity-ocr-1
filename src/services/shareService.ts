import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/firebase';
import { HistoryItem } from '@/types/task';
import { Checklist, AccessRole, SharedPermissions } from '@/types/checklist';
import { v4 as uuidv4 } from 'uuid';

// ===================================================================================
// --- TYPES ---
// ===================================================================================

/**
 * Defines the structure for advanced sharing options.
 */
export interface ShareOptions {
  password?: string | null;
  expiresAt?: Date | null;
}

// ===================================================================================
// --- CORE SHARING LOGIC ---
// ===================================================================================

const DEFAULT_PERMISSIONS: SharedPermissions = {
  public: { enabled: false, role: 'viewer' },
  users: {}
};

/**
 * Creates or updates a secure, public share link for a checklist.
 */
export const createOrUpdatePublicShareLink = async (
  historyItem: HistoryItem,
  options: ShareOptions = {}
): Promise<string> => {
  if (!historyItem.uid) {
    throw new Error("History item must include a user UID to be shared.");
  }

  const shareId = historyItem.shareId || uuidv4();
  const publicDocRef = doc(db, 'publicChecklists', shareId);
  const originalDocRef = doc(db, `users/${historyItem.uid}/history`, historyItem.id);

  // Fetch existing permissions to preserve them
  let existingPermissions = DEFAULT_PERMISSIONS;
  try {
    const snap = await getDoc(publicDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.permissions) existingPermissions = data.permissions;
    }
  } catch (e) { console.warn("Could not fetch existing permissions, using defaults."); }

  const publicData = {
    ownerUid: historyItem.uid,
    title: historyItem.title,
    analysisResult: historyItem.analysisResult, // Store in legacy field for now
    sharedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    password: options.password || null,
    expiresAt: options.expiresAt || null,
    permissions: existingPermissions,
    searchKeywords: [historyItem.title.toLowerCase()] // Helper for potential future search
  };

  try {
    await setDoc(publicDocRef, publicData, { merge: true });
    await updateDoc(originalDocRef, { shareId: shareId });
    return shareId;
  } catch (error) {
    console.error("Error creating public share link:", error);
    throw new Error("Could not create share link. Please try again.");
  }
};

/**
 * Updates the permissions for a shared checklist.
 */
export const updateChecklistPermissions = async (shareId: string, permissions: SharedPermissions) => {
  const publicDocRef = doc(db, 'publicChecklists', shareId);
  try {
    await updateDoc(publicDocRef, {
      permissions,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    throw new Error("Failed to update access settings.");
  }
};

/**
 * Invite a user by email.
 * Note: Since we only have email, we store it in the permissions map.
 * Ideally, a backend function would resolve this Email to a UID to populate a `sharedWithUids` array.
 */
export const inviteUser = async (shareId: string, email: string, role: AccessRole = 'viewer') => {
  const publicDocRef = doc(db, 'publicChecklists', shareId);
  try {
    const snap = await getDoc(publicDocRef);
    if (!snap.exists()) throw new Error("Checklist not found");

    const data = snap.data();
    const permissions: SharedPermissions = data.permissions || DEFAULT_PERMISSIONS;

    const newPermissions = {
      ...permissions,
      users: {
        ...permissions.users,
        [email.toLowerCase()]: {
          role,
          addedAt: new Date().toISOString()
        }
      }
    };

    // We also update a top-level array for easier querying if strict rules allow
    await updateDoc(publicDocRef, {
      permissions: newPermissions,
      updatedAt: serverTimestamp(),
      // 'sharedWithEmails': arrayUnion(email.toLowerCase()) // Optional: helper for queries
    });

  } catch (error) {
    console.error("Error inviting user:", error);
    throw error;
  }
};

/**
 * Remove a user by email.
 */
export const removeUser = async (shareId: string, email: string) => {
  const publicDocRef = doc(db, 'publicChecklists', shareId);
  try {
    const snap = await getDoc(publicDocRef);
    if (!snap.exists()) throw new Error("Checklist not found");

    const data = snap.data();
    const permissions: SharedPermissions = data.permissions || DEFAULT_PERMISSIONS;

    const newUsers = { ...permissions.users };
    delete newUsers[email.toLowerCase()];

    const newPermissions = { ...permissions, users: newUsers };

    await updateDoc(publicDocRef, {
      permissions: newPermissions,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error removing user:", error);
    throw error;
  }
};

export const getPublicChecklist = async (shareId: string): Promise<Checklist> => {
  const docRef = doc(db, 'publicChecklists', shareId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('This shared checklist does not exist or has been deleted.');
  }

  const data = docSnap.data();

  // Check for expiration
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    throw new Error('This share link has expired.');
  }

  // Fire and forget view count
  updateDoc(docRef, { viewCount: increment(1) }).catch(err => console.error("Failed to increment view count", err));

  // Adapt to Checklist Type
  return {
    id: docSnap.id,
    title: data.title,
    ownerUid: data.ownerUid,
    groups: data.analysisResult?.groups || [],
    createdAt: data.createdAt || data.sharedAt,
    updatedAt: data.updatedAt,
    permissions: data.permissions || { public: { enabled: false, role: 'viewer' }, users: {} },
    sharedAt: data.sharedAt
  } as Checklist;
};

// ... Ensure other helpers are compatible or removed if unused ...
// Keeping social helpers as they are generic
export const nativeWebShare = async (shareLink: string, title: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Check out this checklist: ${title}`,
        url: shareLink,
      });
      return true;
    } catch (error) {
      console.error('Error using Web Share API:', error);
      return true;
    }
  }
  return false;
};