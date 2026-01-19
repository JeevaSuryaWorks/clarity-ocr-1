import {
  QuickStats,
  ActivityLog,
  UpcomingDeadline,
  RecentDocument
} from '@/types/dashboard';
import { db } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
  where,
  onSnapshot
} from 'firebase/firestore';
import { getPlanLimit } from './storageService'; // We'll use this utility

// Helper to unsubscribe multiple listeners
type Unsubscribe = () => void;

export const subscribeToQuickStats = (userId: string, callback: (stats: QuickStats) => void): Unsubscribe => {
  let documentsUploaded = 0;
  let storageUsed = 0;
  let tasksPending = 0;
  let tasksCompleted = 0;

  // We need to maintain state from two different listeners
  // and call the callback whenever either updates.

  // 1. Listen to 'documents' for count and storage
  const docsRef = collection(db, 'documents');
  const docsQuery = query(docsRef, where("uploaderId", "==", userId));

  const unsubDocs = onSnapshot(docsQuery, (snapshot) => {
    documentsUploaded = snapshot.size;
    let totalBytes = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fileSize) {
        totalBytes += Number(data.fileSize);
      }
    });
    storageUsed = parseFloat((totalBytes / (1024 * 1024)).toFixed(2)); // to MB

    // Trigger update
    emitStats();
  }, (error) => {
    console.error("Error listening to quick stats (docs):", error);
  });

  // 2. Listen to 'history' for tasks
  const historyRef = collection(db, `users/${userId}/history`);
  const historyQuery = query(historyRef);

  const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
    let pending = 0;
    let completed = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.analysisResult && data.analysisResult.groups) {
        data.analysisResult.groups.forEach((group: any) => {
          if (Array.isArray(group.tasks)) {
            group.tasks.forEach((task: any) => {
              if (task.completed) {
                completed++;
              } else {
                pending++;
              }
            });
          }
        });
      }
    });

    tasksPending = pending;
    tasksCompleted = completed;

    // Trigger update
    emitStats();
  }, (error) => {
    console.error("Error listening to quick stats (history):", error);
  });

  const emitStats = () => {
    // Determine plan limit (Defaulting to free for now as in original service)
    const storageLimit = parseFloat((getPlanLimit('free') / (1024 * 1024)).toFixed(2)); // to MB

    callback({
      documentsUploaded,
      documentsTrend: 0, // Not implemented yet
      tasksPending,
      tasksCompleted,
      storageUsed,
      storageLimit
    });
  };

  return () => {
    unsubDocs();
    unsubHistory();
  };
};

export const subscribeToRecentActivity = (userId: string, callback: (logs: ActivityLog[]) => void): Unsubscribe => {
  const historyRef = collection(db, `users/${userId}/history`);
  // Limit to 10 to ensure we have enough to show, though UI might show less
  const q = query(historyRef, orderBy('createdAt', 'desc'), limit(10));

  return onSnapshot(q, (snapshot) => {
    const activities: ActivityLog[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const date = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
      return {
        id: doc.id,
        type: 'upload', // Currently only tracking uploads/analysis as activity
        user: 'You',
        description: `analyzed "${data.title || data.fileName || 'Document'}"`,
        timestamp: date,
      };
    });
    // Take top 5
    callback(activities.slice(0, 5));
  }, (error) => {
    console.error("Error listening to recent activity:", error);
    callback([]);
  });
};

export const subscribeToUpcomingDeadlines = (userId: string, callback: (deadlines: UpcomingDeadline[]) => void): Unsubscribe => {
  const historyRef = collection(db, `users/${userId}/history`);
  // We need to fetch enough history to find tasks with deadlines. 
  // Retrieving recent 20 documents should be enough for "Upcoming"
  const q = query(historyRef, orderBy('createdAt', 'desc'), limit(20));

  return onSnapshot(q, (snapshot) => {
    const allDeadlines: UpcomingDeadline[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.analysisResult && data.analysisResult.groups) {
        data.analysisResult.groups.forEach((group: any) => {
          if (Array.isArray(group.tasks)) {
            group.tasks.forEach((task: any) => {
              // Check if task has deadline and is NOT completed
              if (task.deadline && !task.completed) {
                // Ensure deadline is in the future (optional, but "upcoming" usually implies future)
                // For now, listing all pending deadlines
                allDeadlines.push({
                  id: task.id,
                  title: task.content.substring(0, 50) + (task.content.length > 50 ? '...' : ''),
                  dueDate: new Date(task.deadline),
                  priority: task.priority || 'medium',
                  documentName: data.title || data.fileName || 'Untitled Document'
                });
              }
            });
          }
        });
      }
    });

    // Sort by deadline ascending (nearest first)
    allDeadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    callback(allDeadlines.slice(0, 5));
  }, (error) => {
    console.error("Error listening to deadlines:", error);
    callback([]);
  });
};

export const subscribeToRecentDocuments = (userId: string, callback: (docs: RecentDocument[]) => void): Unsubscribe => {
  const historyRef = collection(db, `users/${userId}/history`);
  const q = query(historyRef, orderBy('createdAt', 'desc'), limit(10));

  return onSnapshot(q, (snapshot) => {
    const recentDocs: RecentDocument[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const date = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();

      // Calculate completion based on tasks
      let total = 0;
      let completed = 0;
      if (data.analysisResult?.groups) {
        data.analysisResult.groups.forEach((g: any) => {
          if (g.tasks) {
            total += g.tasks.length;
            completed += g.tasks.filter((t: any) => t.completed).length;
          }
        });
      }
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: doc.id,
        name: data.title || data.fileName || 'Untitled Document',
        uploadDate: date,
        status: progress === 100 ? 'completed' : 'processing', // Simplified status logic
        confidence: progress, // Reusing confidence field for progress in this context as per original code
      };
    });

    callback(recentDocs);
  }, (error) => {
    console.error("Error listening to recent documents:", error);
    callback([]);
  });
};