import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    getDocs,
    startAfter,
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase';
import { ActivityLogItem, ActivityAction } from '@/types/activity';

const COLLECTION_NAME = 'activity_logs';

export const logActivity = async (
    userId: string,
    userName: string,
    action: ActivityAction,
    details: { checklistId?: string, checklistTitle?: string, metadata?: any }
) => {
    try {
        await addDoc(collection(db, COLLECTION_NAME), {
            userId,
            userName,
            action,
            ...details,
            createdAt: serverTimestamp() // Firestore server time
        });
    } catch (e) {
        console.error("Failed to log activity", e);
    }
};

export const fetchActivityLogs = async (
    userId: string | undefined,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    limitCount: number = 20
) => {
    if (!userId) return { logs: [], lastDoc: null };

    let q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    if (lastDoc) {
        q = query(q, startAfter(lastDoc));
    }

    try {
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as ActivityLogItem;
        });

        return {
            logs,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return { logs: [], lastDoc: null };
    }
};
