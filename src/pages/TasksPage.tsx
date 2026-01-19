import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Calendar as CalendarIcon, Flag, ListTodo } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory, addManualTask } from '@/services/historyService';
import { TaskItem } from '@/types/task';

// --- Components ---

const PriorityBadge = ({ priority }: { priority: string }) => {
    const colors: Record<string, string> = {
        critical: 'bg-red-500 hover:bg-red-600 border-red-600',
        high: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
        medium: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
        low: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
        none: 'bg-slate-500 hover:bg-slate-600 border-slate-600',
    };

    return (
        <Badge className={`${colors[priority] || colors.none} text-white border ml-2 shadow-sm uppercase text-[10px] tracking-wider px-1.5 py-0.5 h-5`}>
            {priority}
        </Badge>
    );
};

const TaskRow = ({ task, onToggle }: { task: TaskItem & { sourceDoc?: string }, onToggle: (id: string) => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            className="group flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-violet-200 dark:hover:border-violet-900 rounded-xl transition-all mb-2 shadow-sm hover:shadow-md"
        >
            <div className="mt-1">
                <Checkbox
                    checked={!!task.completed}
                    onCheckedChange={() => onToggle(task.id)}
                    className="w-5 h-5 rounded-full border-2 border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none transition-all"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-700 dark:text-slate-200'} transition-all line-clamp-2`}>
                        {task.content}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {task.deadline && (
                        <span className={`text-xs flex items-center gap-1 ${isPast(new Date(task.deadline)) && !task.completed && !isToday(new Date(task.deadline)) ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            <CalendarIcon className="w-3 h-3" />
                            {isToday(new Date(task.deadline)) ? 'Today' : isTomorrow(new Date(task.deadline)) ? 'Tomorrow' : format(new Date(task.deadline), 'MMM d')}
                        </span>
                    )}

                    <PriorityBadge priority={task.priority} />

                    {task.sourceDoc && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 max-w-[120px] truncate">
                            {task.sourceDoc}
                        </span>
                    )}
                </div>
            </div >
        </motion.div >
    );
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Array<TaskItem & { sourceDoc?: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskContent, setNewTaskContent] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('medium');
    const [isAdding, setIsAdding] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();

    const fetchTasks = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const history = await getHistory();
            const allTasks: Array<TaskItem & { sourceDoc?: string }> = [];

            history.forEach(doc => {
                if (doc.analysisResult?.groups) {
                    doc.analysisResult.groups.forEach(group => {
                        if (group.tasks) {
                            group.tasks.forEach(task => {
                                allTasks.push({
                                    ...task,
                                    sourceDoc: doc.fileName || doc.title
                                });
                            });
                        }
                    });
                }
            });

            // Sort: Pending first, then by deadline
            allTasks.sort((a, b) => {
                if (a.completed === b.completed) {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                }
                return a.completed ? 1 : -1;
            });

            setTasks(allTasks);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskContent.trim() || !user) return;

        try {
            setIsAdding(true);
            const newTask: TaskItem = {
                id: uuidv4(),
                content: newTaskContent,
                completed: false,
                priority: newTaskPriority, // Use state
                estimatedTime: 15,
                deadline: new Date().toISOString(), // Default to today
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                groupId: 'default-manual-group'
            };

            await addManualTask(user.uid, newTask);

            // Optimistic Update
            setTasks(prev => [{ ...newTask, sourceDoc: 'Manual Entry' }, ...prev]);
            setNewTaskContent('');
            toast({ title: "Task added", description: "Your task has been created." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    };

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] font-sans text-slate-900 dark:text-slate-100 p-4 pb-20 md:p-8">
            {/* Style Overrides */}
            <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
          :root { font - family: 'Outfit', sans - serif; }
`}</style>

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <ListTodo className="w-8 h-8 text-violet-600" /> My Tasks
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            {loading ? '...' : `${pendingTasks.length} tasks remaining`}
                        </p>
                    </div>
                    <div className="text-sm text-slate-400">
                        {format(new Date(), 'EEEE, MMM do')}
                    </div>
                </div>

                {/* Quick Add Bar */}
                <Card className="mb-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 overflow-visible relative z-20">
                    <form onSubmit={handleAddTask} className="p-2 flex items-center gap-2">
                        <div className="pl-3 text-violet-500">
                            <Plus className="w-5 h-5" />
                        </div>
                        <Input
                            value={newTaskContent}
                            onChange={(e) => setNewTaskContent(e.target.value)}
                            placeholder="Add a task..."
                            className="border-none shadow-none focus-visible:ring-0 text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent h-12"
                            autoFocus
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-violet-600">
                                    <Flag className="w-4 h-4" />
                                    <span className="hidden sm:inline capitalize">{newTaskPriority}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {['critical', 'high', 'medium', 'low'].map((p) => (
                                    <DropdownMenuItem key={p} onClick={() => setNewTaskPriority(p as any)} className="capitalize gap-2">
                                        <span className={`w-2 h-2 rounded-full ${p === 'critical' ? 'bg-red-500' : p === 'high' ? 'bg-orange-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                                        {p}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button type="submit" disabled={!newTaskContent.trim() || isAdding} className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-10 px-6">
                            {isAdding ? 'Adding...' : 'Add'}
                        </Button>
                    </form>
                </Card>

                {/* Task List */}
                <div className="space-y-6">
                    {/* Pending */}
                    <div className="space-y-1">
                        {pendingTasks.map(task => (
                            <TaskRow key={task.id} task={task} onToggle={(id) => {
                                setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
                                // Note: Actual toggle persistence would go here, updating historyService
                            }} />
                        ))}
                        {pendingTasks.length === 0 && !loading && (
                            <div className="text-center py-12 text-slate-400">
                                <div className="flex justify-center mb-3">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                        <Check className="w-8 h-8 text-emerald-500" />
                                    </div>
                                </div>
                                <p>All caught up! No pending tasks.</p>
                            </div>
                        )}
                    </div>

                    {/* Completed */}
                    {completedTasks.length > 0 && (
                        <div className="pt-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                Completed <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs">{completedTasks.length}</span>
                            </h3>
                            <div className="opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                {completedTasks.map(task => (
                                    <TaskRow key={task.id} task={task} onToggle={(id) => {
                                        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
                                    }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
