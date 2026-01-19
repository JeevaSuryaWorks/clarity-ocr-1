import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface StorageStats {
    used: number; // in bytes
    limit: number; // in bytes
    percent: number;
}

const STORAGE_LIMITS = {
    free: 1024 * 1024 * 1024, // 1GB
    pro: 1024 * 1024 * 1024, // 1GB
    enterprise: 10 * 1024 * 1024 * 1024 // 10GB
};

export const getStorageStats = async (userId: string): Promise<StorageStats> => {
    try {
        // Query 'documents' collection for files uploaded by this user
        const q = query(collection(db, "documents"), where("uploaderId", "==", userId));
        const snapshot = await getDocs(q);

        let totalBytes = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fileSize) {
                totalBytes += Number(data.fileSize);
            }
        });

        // Determine Plan Limit (Mocking plan check for now, defaulting to Free)
        // In a real app, you'd fetch the user's plan from 'users/{userId}' document
        const userPlan = 'free';
        const limit = STORAGE_LIMITS[userPlan];

        return {
            used: totalBytes,
            limit: limit,
            percent: Math.min((totalBytes / limit) * 100, 100)
        };

    } catch (error) {
        console.error("Error calculating storage stats:", error);
        return {
            used: 0,
            limit: STORAGE_LIMITS.free,
            percent: 0
        };
    }
};

export const getPlanLimit = (plan: 'free' | 'pro' | 'enterprise') => {
    return STORAGE_LIMITS[plan];
};
