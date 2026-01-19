import { Timestamp } from 'firebase/firestore';

/**
 * Represents a single item in the checklist.
 * Corresponds to `TaskItem` in the legacy types but with stricter requirements.
 */
export interface ChecklistItem {
    id: string;
    content: string;
    completed: boolean;
    priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
    estimatedTime?: number | null;
    deadline?: string | null;
    createdAt: string;
    updatedAt: string;

    // New field for audit and multi-user context
    lastUpdatedBy?: string; // UID of the user who last touched this
    assignee?: string;      // UID or email
}

/**
 * Represents a group/category of tasks.
 */
export interface ChecklistGroup {
    id: string;
    name: string;
    expanded?: boolean;
    tasks: ChecklistItem[];
}

/**
 * Permissions structure for sharing.
 */
export type AccessRole = 'viewer' | 'editor' | 'owner';

export interface SharedPermissions {
    public: {
        enabled: boolean;
        role: AccessRole;
    };
    users: {
        [email: string]: {
            role: AccessRole;
            addedAt: string;
            uid?: string; // Optional linkage to actual user ID
        };
    };
}

/**
 * The top-level Checklist document stored in `publicChecklists` or `users/{uid}/history`.
 */
export interface Checklist {
    id: string;           // Document ID (shareId for public)
    title: string;
    ownerUid: string;

    // The core data
    groups: ChecklistGroup[];

    // Metadata & Sharing
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
    sharedAt?: Timestamp | string;

    permissions: SharedPermissions;

    // Optional legacy fields for backward compatibility
    analysisResult?: { // Keeping this to map from HistoryItem if needed
        summary: any;
        groups: ChecklistGroup[];
    };
}
