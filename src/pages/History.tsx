import React from 'react';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, FileText, UserPlus, ListStart, CheckCircle, Trash2, Edit, ChevronDown } from 'lucide-react';
import { ActivityAction, ActivityLogItem } from '@/types/activity';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

const ActivityIcon: React.FC<{ action: ActivityAction }> = ({ action }) => {
  switch (action) {
    case 'create_checklist': return <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'add_task': return <ListStart className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'complete_task': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'delete_task': return <Trash2 className="w-5 h-5 text-red-500" />;
    case 'invite_user': return <UserPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    case 'update_checklist': return <Edit className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    default: return <FileText className="w-5 h-5 text-slate-500" />;
  }
};

const History: React.FC = () => {
  const { activities, loading, loadingMore, hasMore, loadMore } = useActivityLog();

  if (loading && activities.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-slate-500 text-sm">Loading activity history...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-sora tracking-tight">Activity Log</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Track changes and updates across your checklists.</p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No activity recorded yet.</p>
          <p className="text-slate-400 text-sm mt-1">Actions you take will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6 relative">
          {/* Continuous Vertical Line */}
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {activities.map((log) => (
            <div key={log.id} className="group relative flex flex-col sm:flex-row gap-4">
              {/* Desktop Timeline Dot */}
              <div className="hidden sm:flex absolute left-6 -translate-x-1/2 mt-4 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-violet-500 rounded-full z-10" />

              {/* Mobile Icon / Desktop Spacer */}
              <div className="sm:hidden flex items-center gap-3 mb-1">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-full">
                  <ActivityIcon action={log.action} />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex-1">
                <ActivityCard log={log} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-full px-8 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium text-slate-600 dark:text-slate-300"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" /> Load More
              </>
            )}
          </Button>
        </div>
      )}
      {!hasMore && activities.length > 0 && (
        <p className="text-center text-slate-400 text-sm mt-8 pb-8">No more activity to load.</p>
      )}
    </div>
  );
};

// Extracted Card Component for cleaner main file
const ActivityCard: React.FC<{ log: ActivityLogItem }> = ({ log }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {/* Desktop Icon inline */}
            <div className="hidden sm:inline-block p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg mr-1 scale-90">
              <ActivityIcon action={log.action} />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug">
              {formatActionTitle(log)}
            </p>
          </div>
          {/* Action Description */}
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {formatActionDescription(log)}
          </p>

          {/* Metadata Box */}
          {renderMetadata(log) && (
            <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/60 font-medium">
              {renderMetadata(log)}
            </div>
          )}

          {/* Action Button */}
          {log.checklistId && (
            <div className="pt-3">
              <a
                href={`/checklist/${log.checklistId}`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
              >
                Open Checklist
              </a>
            </div>
          )}
        </div>

        {/* Desktop Timestamp */}
        <span className="hidden sm:block text-xs font-medium text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};

// Helpers
function formatActionTitle(log: ActivityLogItem) {
  if (log.userName === 'You' || !log.userName) return "You made a change";
  return log.userName;
}

function formatActionDescription(log: ActivityLogItem) {
  const title = <span className="font-semibold text-slate-800 dark:text-slate-200">"{log.checklistTitle || 'Untitled'}"</span>;
  switch (log.action) {
    case 'create_checklist': return <>Created a new checklist: {title}</>;
    case 'add_task': return <>Added a new task to {title}</>;
    case 'delete_task': return <>Removed a task from {title}</>;
    case 'complete_task': return <>Marked a task as complete in {title}</>;
    case 'invite_user': return <>Shared {title} with a user</>;
    case 'update_checklist': return <>Updated settings for {title}</>;
    default: return <>Updated {title}</>;
  }
}

function renderMetadata(log: ActivityLogItem) {
  if (log.action === 'add_task' && log.metadata?.taskContent) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span>Task: "{log.metadata.taskContent}"</span>
      </div>
    );
  }
  if (log.action === 'invite_user' && log.metadata?.email) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        <span>Invited: {log.metadata.email}</span>
      </div>
    );
  }
  if (log.metadata?.group) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Group: {log.metadata.group}</span>
      </div>
    );
  }
  return null;
}

export default History;