import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchActivityLogs } from '@/services/activityService';
import { ActivityLogItem } from '@/types/activity';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export const useActivityLog = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityLogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const loadActivities = useCallback(async (isInitial = false) => {
        if (!user) return;

        if (isInitial) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        const cursor = isInitial ? undefined : (lastDoc || undefined);
        const { logs, lastDoc: newLastDoc } = await fetchActivityLogs(user.uid, cursor, 20);

        if (isInitial) {
            setActivities(logs);
        } else {
            setActivities(prev => [...prev, ...logs]);
        }

        setLastDoc(newLastDoc);
        setHasMore(logs.length === 20); // If we fetched full limit, there might be more.

        if (isInitial) setLoading(false);
        else setLoadingMore(false);
    }, [user, lastDoc]);

    // Initial Load
    useEffect(() => {
        loadActivities(true);
    }, [user]); // Careful: loadActivities depends on lastDoc, but we want to reset on user change.

    // Manual refresh or load more wrapper
    const loadMore = () => {
        if (!loadingMore && hasMore) loadActivities(false);
    };

    return { activities, loading, loadingMore, hasMore, loadMore };
};
