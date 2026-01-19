import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  UploadCloud,
  FileText,
  CheckSquare,
  Clock,
  Plus,
  ArrowRight,
  Zap,
  Layout,
  FileSearch,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

// Services & Types
import {
  subscribeToQuickStats,
  subscribeToRecentActivity,
  subscribeToRecentDocuments
} from '@/services/dashboardService';
import type {
  QuickStats,
  ActivityLog,
  RecentDocument
} from '@/types/dashboard';

// --- Components ---

const WelcomeBanner = ({ userName }: { userName: string }) => {
  const navigate = useNavigate();
  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-8 md:p-10 text-white shadow-xl dark:shadow-violet-900/20">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit mb-2">
            {greeting}, {userName}.
          </h1>
          <p className="text-violet-100 max-w-md text-lg opacity-90">
            You have a productive day ahead. Your workspace is ready.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-3 mt-4 md:mt-0">
          <Button
            onClick={() => navigate('/upload')}
            className="flex-1 md:flex-none bg-white text-violet-600 hover:bg-violet-50 border-none font-semibold h-10 md:h-11 px-4 md:px-6 text-sm md:text-base shadow-lg shadow-black/5 whitespace-nowrap"
          >
            <UploadCloud className="w-4 h-4 mr-2" /> Upload New
          </Button>
          <Button
            onClick={() => navigate('/tasks/new')}
            variant="outline"
            className="flex-1 md:flex-none bg-white/10 border-white/20 text-white hover:bg-white/20 h-10 md:h-11 px-4 md:px-6 text-sm md:text-base backdrop-blur-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

const StatCard = ({ title, value, label, icon: Icon, trend }: { title: string, value: string | number, label: string, icon: any, trend?: number }) => (
  <div className="group bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 p-5 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300 shadow-sm hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <span className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 font-outfit tracking-tight">{value}</span>
      <div className="flex flex-col mt-1">
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      </div>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, desc, onClick }: { icon: any, label: string, desc: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 text-left group"
  >
    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 group-hover:bg-violet-500 group-hover:text-white transition-colors duration-300">
      <Icon className="w-5 h-5 text-sky-600 dark:text-sky-400 group-hover:text-white" />
    </div>
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{label}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 ml-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
  </button>
);

const DocumentRow = ({ doc }: { doc: RecentDocument }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/documents/${doc.id}`)}
      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
    >
      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-white group-hover:text-violet-600 group-hover:shadow-sm transition-all">
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">{doc.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {doc.status}
          </Badge>
          <span className="text-[10px] text-slate-400">• {formatDistanceToNow(new Date(doc.uploadDate))} ago</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );
};

// --- Main Dashboard ---

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubStats = subscribeToQuickStats(user.uid, (data) => {
      setStats(data);
      setIsLoading(false);
    });
    const unsubActivity = subscribeToRecentActivity(user.uid, setActivities);
    const unsubDocs = subscribeToRecentDocuments(user.uid, setRecentDocs);

    return () => {
      unsubStats();
      unsubActivity();
      unsubDocs();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F19] p-4 md:p-8 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Background Aurora */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-sky-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">

        <WelcomeBanner userName={user.displayName?.split(' ')[0] || 'User'} />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-white/40 dark:bg-slate-900/40 rounded-2xl animate-pulse backdrop-blur-sm border border-white/20" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Documents"
                value={stats?.documentsUploaded || 0}
                label="Files Processed"
                icon={FileSearch}
                trend={stats?.documentsTrend}
              />
              <StatCard
                title="Pending Tasks"
                value={stats?.tasksPending || 0}
                label="Items in queue"
                icon={Clock}
              />
              <StatCard
                title="Storage Used"
                value={`${stats?.storageUsed ? Math.round(stats.storageUsed) : 0}MB`}
                label={`of ${stats?.storageLimit || 1024}MB limit`}
                icon={Layout}
              />
              <StatCard
                title="Efficiency"
                value="98.5%"
                label="Analysis Accuracy"
                icon={Zap}
                trend={2.4}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Quick Actions & Recent Files */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick Actions */}
            <section>
              <h2 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-500" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction
                  icon={UploadCloud}
                  label="Upload Document"
                  desc="Analyze PDFs or Images"
                  onClick={() => navigate('/upload')}
                />
                <QuickAction
                  icon={CheckSquare}
                  label="Create Checklist"
                  desc="Start from scratch"
                  onClick={() => navigate('/checklist/new')}
                />
                {/* Add more as needed */}
              </div>
            </section>

            {/* Recent Documents */}
            <section className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100">Recent Documents</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your latest uploaded and analyzed files</p>
                </div>
                <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20" onClick={() => navigate('/documents')}>
                  View All
                </Button>
              </div>

              <div className="space-y-2">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                  ))
                ) : recentDocs.length > 0 ? (
                  recentDocs.map(doc => <DocumentRow key={doc.id} doc={doc} />)
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileSearch className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No documents yet</p>
                    <Button variant="link" onClick={() => navigate('/upload')} className="text-violet-600">
                      Upload your first file
                    </Button>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column: Activity Feed */}
          <div className="space-y-8">
            <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 h-full">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-500" /> Activity Log
                </h2>

                <div className="space-y-8 relative pl-2">
                  {/* Timeline Line */}
                  <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-gradient-to-b from-slate-200 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800/50" />

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="relative flex gap-4">
                        <Avatar className="h-10 w-10 border-4 border-white dark:border-[#0B0F19] shadow-sm z-10 shrink-0">
                          <AvatarImage src={activity.userAvatar} />
                          <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 font-bold text-xs ring-2 ring-white dark:ring-slate-900">
                            {activity.user.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="py-1">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{activity.user}</span> {activity.description}
                          </p>
                          <span className="text-xs text-slate-400 block mt-1">
                            {formatDistanceToNow(activity.timestamp)} ago
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {!isLoading && activities.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">No recent activity.</p>
                  )}
                </div>

                {activities.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full mt-6 text-slate-500" onClick={() => navigate('/history')}>
                    View Full History
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}