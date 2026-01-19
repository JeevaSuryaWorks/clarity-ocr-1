// src/services/historyService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase'; // Make sure auth is exported from firebase.ts
import { HistoryItem, TaskItem, AnalysisResult } from '../types/task';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches a single history item by ID
 */
export const getHistoryItem = async (
  userId: string,
  historyId: string
): Promise<HistoryItem | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'history', historyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...(docSnap.data() as Omit<HistoryItem, 'id'>)
      } as HistoryItem;
    }

    return null;
  } catch (error) {
    console.error('Error fetching history item:', error);
    throw new Error('Failed to fetch history item');
  }
};

/**
 * Creates a new history item
 */
export const createHistoryItem = async (
  userId: string,
  item: Omit<HistoryItem, 'id' | 'createdAt'>
): Promise<HistoryItem> => {
  try {
    const newItem = {
      ...item,
      createdAt: Timestamp.now()
    };

    const docRef = doc(collection(db, 'users', userId, 'history'));
    await setDoc(docRef, newItem);

    return {
      id: docRef.id,
      ...newItem
    } as HistoryItem;
  } catch (error) {
    console.error('Error creating history item:', error);
    throw new Error('Failed to create history item');
  }
};

/**
 * Updates an existing history item
 */
export const updateHistoryItem = async (
  userId: string,
  historyId: string,
  updates: Partial<Omit<HistoryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'history', historyId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating history item:', error);
    throw new Error('Failed to update history item');
  }
};

import { getAuthenticatedSupabase } from '@/services/supabase';

/**
 * Deletes a history item AND cleans up associated Storage files and Document records
 */
export const deleteHistoryItem = async (
  userId: string,
  historyId: string
): Promise<void> => {
  try {
    // 1. Fetch the history item first to get fileName/details
    const historyItem = await getHistoryItem(userId, historyId);

    if (historyItem) {
      // 2. Try to find and delete the associated record in 'documents' collection
      if (historyItem.fileName) {
        const docsRef = collection(db, 'documents');
        const q = query(docsRef, where('uploaderId', '==', userId), where('fileName', '==', historyItem.fileName));
        const snapshot = await getDocs(q);

        // Delete all matching document records (usually just 1)
        const deletePromises = snapshot.docs.map(async (d) => {
          // 3. Delete from Supabase Storage (Migration: Firebase files are orphaned, we can't delete them without SDK)
          const data = d.data();
          if (data.storagePath && !data.storagePath.startsWith('gs://')) {
            try {
              // Heuristic: If it looks like a Supabase path or we have explicit metadata
              // Ideally, we store "storageProvider" in the document record now.
              // For now, we attempt deletion if we have a path.
              const sb = await getAuthenticatedSupabase();
              // Assuming 'raw_uploads' for documents based on migration plan
              // We might need to check multiple buckets if not tracked.
              // Best effort cleanup:
              await sb.storage.from('raw_uploads').remove([data.storagePath]);
              await sb.storage.from('processed_docs').remove([data.storagePath]);
            } catch (e) {
              console.warn("Supabase file deletion failed/skipped", e);
            }
          }
          return deleteDoc(d.ref);
        });
        await Promise.all(deletePromises);
      }
    }

    // 4. Finally delete the history item
    const docRef = doc(db, 'users', userId, 'history', historyId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw new Error('Failed to delete history item');
  }
};

/**
 * Fetches all history items for the current user
 * @returns Promise resolving to array of HistoryItem objects
 */
export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;
    const historyRef = collection(db, 'users', userId, 'history');

    const q = query(historyRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const items: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<HistoryItem, 'id'>;
      items.push({
        id: doc.id,
        ...data
      } as HistoryItem);
    });

    return items;
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }
};

/**
 * Fetches paginated history items for a user
 */
export const getUserHistoryWithPagination = async (
  userId: string,
  lastDoc: DocumentSnapshot | null,
  pageSize: number = 10
): Promise<{ items: HistoryItem[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    const historyRef = collection(db, 'users', userId, 'history');

    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(historyRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const items: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...(doc.data() as Omit<HistoryItem, 'id'>)
      } as HistoryItem);
    });

    const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

    return { items, lastDoc: newLastDoc };
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Failed to fetch history');
  }
};

/**
 * Updates the status of a specific task in a history item
 */
export const updateTaskStatusInDb = async (
  userId: string,
  historyId: string,
  taskId: string,
  completed: boolean
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }

    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.map(task =>
        task.id === taskId
          ? { ...task, completed, updatedAt: new Date().toISOString() }
          : task
      )
    }));

    await updateHistoryItem(userId, historyId, {
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
};

/**
 * Updates the content of a specific task in a history item
 */
export const updateTaskContentInDb = async (
  userId: string,
  historyId: string,
  taskId: string,
  content: string
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }

    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.map(task =>
        task.id === taskId
          ? { ...task, content, updatedAt: new Date().toISOString() }
          : task
      )
    }));

    await updateHistoryItem(userId, historyId, {
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error updating task content:', error);
    throw new Error('Failed to update task content');
  }
};

/**
 * Adds a new task to a history item
 */
export const addTaskToDb = async (
  userId: string,
  historyId: string,
  groupId: string,
  task: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TaskItem> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupId,
    };

    const updatedGroups = historyItem.analysisResult.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          tasks: [...group.tasks, newTask]
        };
      }
      return group;
    });

    await updateHistoryItem(userId, historyId, {
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });

    return newTask;
  } catch (error) {
    console.error('Error adding task:', error);
    throw new Error('Failed to add task');
  }
};

/**
 * Deletes a task from a history item
 */
export const deleteTaskFromDb = async (
  userId: string,
  historyId: string,
  taskId: string
): Promise<void> => {
  try {
    const historyItem = await getHistoryItem(userId, historyId);
    if (!historyItem) {
      throw new Error('History item not found');
    }

    const updatedGroups = historyItem.analysisResult.groups.map(group => ({
      ...group,
      tasks: group.tasks.filter(task => task.id !== taskId)
    }));

    await updateHistoryItem(userId, historyId, {
      analysisResult: {
        ...historyItem.analysisResult,
        groups: updatedGroups
      }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

/**
 * Adds a new history item with analysis result to the user's history
 */
export const addToHistory = async (
  result: AnalysisResult,
  fileName: string = 'Untitled Document',
  originalText?: string
): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const userId = user.uid;

    const historyItemData: Omit<HistoryItem, 'id' | 'createdAt'> = {
      title: fileName,
      fileName,
      analysisResult: result,
      shareCount: 0,
      tags: [],
      metadata: {},
      userId,
      uid: userId, // Fix for redundant type definition
      originalText: originalText || ""
    };

    const newHistoryItem = await createHistoryItem(userId, historyItemData);
    return newHistoryItem.id;
  } catch (error) {
    console.error('Error adding to history:', error);
    throw new Error('Failed to save analysis result to history');
  }
};

/**
 * Ensures a "My Manual Tasks" container exists for the user.
 * Returns the historyId of that container.
 */
export const ensureManualTasksContainer = async (userId: string): Promise<string> => {
  const historyRef = collection(db, 'users', userId, 'history');
  const q = query(historyRef, where('metadata.isManualContainer', '==', true));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  // Create if not exists
  const newItem: Omit<HistoryItem, 'id'> = {
    uid: userId,
    userId: userId,
    title: "My Manual Tasks",
    fileName: "Manual Entry",
    createdAt: Timestamp.now(),
    shareCount: 0,
    tags: ['manual'],
    metadata: { isManualContainer: true }, // Marker
    analysisResult: {
      analysisId: uuidv4(),
      totalTasks: 0,
      summary: {
        projectDescription: "This container holds all your manually created tasks.",
        milestones: [],
        resources: []
      },
      groups: [{
        id: 'default-manual-group',
        name: 'My Tasks',
        expanded: true,
        tasks: []
      }]
    },
    originalText: ""
  };

  const docRef = await createHistoryItem(userId, newItem);
  return docRef.id;
};

/**
 * Adds a manual task to the global "My Manual Tasks" container
 */
export const addManualTask = async (userId: string, task: TaskItem): Promise<void> => {
  const historyId = await ensureManualTasksContainer(userId);
  const item = await getHistoryItem(userId, historyId);

  if (!item) throw new Error("Could not find manual tasks container");

  const groups = item.analysisResult?.groups || [];
  // Ensure default group exists
  let defaultGroup = groups.find(g => g.id === 'default-manual-group');
  if (!defaultGroup) {
    defaultGroup = {
      id: 'default-manual-group',
      name: 'My Tasks',
      expanded: true,
      tasks: []
    };
    groups.push(defaultGroup);
  }

  defaultGroup.tasks.push(task);

  // Recalculate total
  const totalTasks = groups.reduce((acc, g) => acc + g.tasks.length, 0);

  await updateHistoryItem(userId, historyId, {
    analysisResult: {
      ...item.analysisResult!,
      groups,
      totalTasks
    }
  });
};