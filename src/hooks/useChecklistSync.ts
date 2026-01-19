import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Checklist, ChecklistGroup, ChecklistItem } from '@/types/checklist';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { logActivity } from '@/services/activityService';

interface UseChecklistSyncReturn {
    checklist: Checklist | null;
    loading: boolean;
    error: string | null;
    syncing: boolean;
    updateChecklist: (newData: Partial<Checklist>) => Promise<void>;

    // CRUD Operations
    toggleTask: (groupId: string, taskId: string, completed: boolean) => Promise<void>;
    addTask: (groupId: string, taskName: string) => Promise<void>;
    deleteTask: (groupId: string, taskId: string) => Promise<void>;
    addGroup: (name: string) => Promise<void>;
    renameGroup: (groupId: string, newName: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
}

export const useChecklistSync = (shareId: string | undefined): UseChecklistSyncReturn => {
    const [checklist, setChecklist] = useState<Checklist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const checklistRef = useRef<Checklist | null>(null);
    useEffect(() => { checklistRef.current = checklist; }, [checklist]);

    useEffect(() => {
        if (!shareId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, 'publicChecklists', shareId);

        const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, (snapshot) => {
            if (!snapshot.exists()) {
                setError('Checklist not found or access denied.');
                setChecklist(null);
                setLoading(false);
                return;
            }

            setSyncing(snapshot.metadata.hasPendingWrites);

            const data = snapshot.data();

            // Safe Access for Groups
            const rawGroups = data.analysisResult?.groups || data.groups || [];
            const safeGroups = Array.isArray(rawGroups) ? rawGroups : [];

            // Adapt
            const adaptedChecklist: Checklist = {
                id: snapshot.id,
                title: data.title || 'Untitled Checklist',
                ownerUid: data.ownerUid,
                groups: safeGroups,
                createdAt: data.createdAt || data.sharedAt,
                updatedAt: data.updatedAt || Timestamp.now(),
                permissions: data.permissions || { public: { enabled: false, role: 'viewer' }, users: {} },
                sharedAt: data.sharedAt
            };

            setChecklist(adaptedChecklist);
            setLoading(false);
            setError(null);

        }, (err) => {
            console.error("Snapshot error:", err);
            if (err.code === 'permission-denied') {
                setError('permission-denied');
            } else {
                setError('Failed to sync checklist.');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [shareId]);


    // Generic Update Helper (Atomic where possible, but usually falls back to full object for intricate arrays)
    const updateFirestoreGroups = async (newGroups: ChecklistGroup[]) => {
        if (!shareId) return;
        const docRef = doc(db, 'publicChecklists', shareId);
        // We write to both locations to maintain compatibility if needed, 
        // or just `analysisResult.groups` as that seems to be the primary storage in legacy.
        // The read logic prioritized `analysisResult.groups`.

        try {
            await updateDoc(docRef, {
                'analysisResult.groups': newGroups,
                // 'groups': newGroups, // optional: migrate to top level?
                updatedAt: Timestamp.now()
            });
        } catch (err) {
            console.error("Firestore update failed:", err);
            toast({ title: "Save Failed", description: "Changes could not be saved.", variant: "destructive" });
            // Revert would happen on next snapshot
        }
    };


    const updateChecklist = useCallback(async (newData: Partial<Checklist>) => {
        if (!shareId || !checklistRef.current) return;
        setChecklist((prev) => prev ? { ...prev, ...newData } : null);
        try {
            const docRef = doc(db, 'publicChecklists', shareId);
            await updateDoc(docRef, { ...newData, updatedAt: Timestamp.now() });
        } catch (err) {
            toast({ title: "Error", description: "Update failed.", variant: "destructive" });
        }
    }, [shareId, toast]);

    // --- CRUD Impl ---

    const addGroup = useCallback(async (name: string) => {
        if (!checklistRef.current || !shareId || !name.trim()) return;

        const newGroup: ChecklistGroup = {
            id: uuidv4(),
            name: name.trim(),
            tasks: []
        };

        const newGroups = [...checklistRef.current.groups, newGroup];

        // Optimistic
        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);

        // Write
        await updateFirestoreGroups(newGroups);
        logActivity(user?.uid || 'anon', user?.displayName || 'Unknown', 'update_checklist', { checklistId: shareId, checklistTitle: checklistRef.current.title, metadata: { action: 'add_group', group: name } });
    }, [shareId, user]);

    const renameGroup = useCallback(async (groupId: string, newName: string) => {
        if (!checklistRef.current || !shareId || !newName.trim()) return;

        const newGroups = checklistRef.current.groups.map(g =>
            g.id === groupId ? { ...g, name: newName.trim() } : g
        );

        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);
        await updateFirestoreGroups(newGroups);
    }, [shareId]);

    const deleteGroup = useCallback(async (groupId: string) => {
        if (!checklistRef.current || !shareId) return;

        const newGroups = checklistRef.current.groups.filter(g => g.id !== groupId);

        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);
        await updateFirestoreGroups(newGroups);
        logActivity(user?.uid || 'anon', user?.displayName || 'Unknown', 'update_checklist', { checklistId: shareId, checklistTitle: checklistRef.current.title, metadata: { action: 'delete_group' } });
    }, [shareId, user]);


    const addTask = useCallback(async (groupId: string, taskName: string) => {
        if (!checklistRef.current || !shareId || !taskName.trim()) return;

        const newTask: ChecklistItem = {
            id: uuidv4(),
            content: taskName.trim(),
            completed: false,
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: user?.uid
        };

        const newGroups = checklistRef.current.groups.map(g =>
            g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g
        );

        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);
        await updateFirestoreGroups(newGroups);
        logActivity(user?.uid || 'anon', user?.displayName || 'Unknown', 'add_task', { checklistId: shareId, checklistTitle: checklistRef.current.title, metadata: { taskContent: taskName } });
    }, [shareId, user]);

    const toggleTask = useCallback(async (groupId: string, taskId: string, completed: boolean) => {
        if (!checklistRef.current || !shareId) return;

        // Note: For atomic toggle, we can use dot notation which is cheaper than rewriting whole array.
        // Reuse the logic from previous implementation if robust, or just use updateFirestoreGroups for consistency.
        // Consistency is safer for "moving parts". Let's use `updateFirestoreGroups` to ensure complete state sync
        // unless performance is critical. Array rewrite is fine for <1000 items.

        const newGroups = checklistRef.current.groups.map(g =>
            g.id === groupId ? {
                ...g,
                tasks: g.tasks.map(t => t.id === taskId ? { ...t, completed, lastUpdatedBy: user?.uid } : t)
            } : g
        );

        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);

        // Try optimized dot notation if possible, but fallback to full update for simplicity & safety of structural integrity
        // Given we aren't re-ordering, dot notation is safe if we find index.
        const groupIndex = checklistRef.current.groups.findIndex(g => g.id === groupId);
        const taskIndex = checklistRef.current.groups[groupIndex]?.tasks.findIndex(t => t.id === taskId);

        if (groupIndex !== -1 && taskIndex !== -1 && taskIndex !== undefined) {
            const docRef = doc(db, 'publicChecklists', shareId);
            const fieldPath = `analysisResult.groups.${groupIndex}.tasks.${taskIndex}`;
            try {
                await updateDoc(docRef, {
                    [`${fieldPath}.completed`]: completed,
                    [`${fieldPath}.lastUpdatedBy`]: user?.uid,
                    updatedAt: Timestamp.now()
                });
            } catch (e) {
                await updateFirestoreGroups(newGroups);
            }
        } else {
            await updateFirestoreGroups(newGroups);
        }

        if (completed) {
            logActivity(user?.uid || 'anon', user?.displayName || 'Unknown', 'complete_task', { checklistId: shareId, checklistTitle: checklistRef.current.title });
        }

    }, [shareId, user]);

    const deleteTask = useCallback(async (groupId: string, taskId: string) => {
        if (!checklistRef.current || !shareId) return;

        const newGroups = checklistRef.current.groups.map(g =>
            g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g
        );

        setChecklist(prev => prev ? { ...prev, groups: newGroups } : null);
        await updateFirestoreGroups(newGroups);
        logActivity(user?.uid || 'anon', user?.displayName || 'Unknown', 'delete_task', { checklistId: shareId, checklistTitle: checklistRef.current.title });
    }, [shareId, user]);


    return {
        checklist, loading, error, syncing, updateChecklist,
        toggleTask, addTask, deleteTask, addGroup, renameGroup, deleteGroup
    };
};
