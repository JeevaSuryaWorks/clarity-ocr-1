export type ActivityAction =
    | 'create_checklist'
    | 'update_checklist'
    | 'delete_checklist'
    | 'add_task'
    | 'complete_task'
    | 'uncomplete_task'
    | 'delete_task'
    | 'invite_user'
    | 'remove_user';

export interface ActivityLogItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    checklistId?: string; // Optional if global log, but usually tied to a checklist or user
    checklistTitle?: string;
    action: ActivityAction;
    metadata?: Record<string, any>; // e.g., task content, invited email
    createdAt: string; // ISO String
}
