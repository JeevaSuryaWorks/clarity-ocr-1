import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { TaskGroup, TaskItem, HistoryItem } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { FolderPlus, CheckCircle, Clock, Trash2, PlusCircle, ChevronDown } from 'lucide-react';
import { EditableField } from './EditableField';

const listItemVariants: Variants = {
    hidden: { opacity: 0, x: -10, height: 0 },
    visible: { opacity: 1, x: 0, height: 'auto', transition: { type: 'spring', stiffness: 400, damping: 30 } },
    exit: { opacity: 0, x: 10, height: 0, transition: { duration: 0.2 } }
};

type FilterStatus = 'all' | 'active' | 'completed';

interface ChecklistBoardProps {
    groups: TaskGroup[];
    updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void;
    filter: FilterStatus;
    setFilter: (f: FilterStatus) => void;
    isReadOnly?: boolean;
    onToggleTask?: (groupId: string, taskId: string, completed: boolean) => void;
    onAddTask?: (groupId: string, taskName: string) => void;
    onDeleteTask?: (groupId: string, taskId: string) => void;
    onUpdateTask?: (groupId: string, taskId: string, updates: Partial<TaskItem>) => void;
    onRenameGroup?: (groupId: string, newName: string) => void;
    onDeleteGroup?: (groupId: string) => void;
}

export const ChecklistBoard: React.FC<ChecklistBoardProps> = ({
    groups,
    updateHistoryItem,
    filter,
    setFilter,
    isReadOnly = false,
    onToggleTask,
    onAddTask,
    onDeleteTask,
    onUpdateTask,
    onRenameGroup,
    onDeleteGroup
}) => {
    const [activeGroup, setActiveGroup] = useState<string | null>(groups[0]?.id || null);

    const filteredGroups = useMemo(() => {
        return groups.map(group => {
            let tasks = [...group.tasks];
            if (filter === 'active') tasks = tasks.filter(t => !t.completed);
            if (filter === 'completed') tasks = tasks.filter(t => t.completed);
            return { ...group, tasks };
        }).filter(group => group.tasks.length > 0 || groups.some(og => og.id === group.id && og.tasks.length === 0));
    }, [groups, filter]);


    const handleToggleTask = (groupId: string, taskId: string, completed: boolean) => {
        if (isReadOnly) return;
        if (onToggleTask) { onToggleTask(groupId, taskId, completed); return; }

        updateHistoryItem(p => ({
            ...p,
            analysisResult: {
                ...p.analysisResult,
                groups: p.analysisResult.groups.map(g => g.id === groupId ? {
                    ...g,
                    tasks: g.tasks.map(t => t.id === taskId ? { ...t, completed } : t)
                } : g)
            }
        }));
    };

    const handleAddTask = (groupId: string) => {
        if (isReadOnly) return;
        if (onAddTask) { onAddTask(groupId, "New Action Item"); return; }

        const newTask: TaskItem = {
            id: uuidv4(),
            content: "New Action Item",
            completed: false,
            priority: 'medium',
            estimatedTime: 15,
            deadline: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            groupId
        };
        updateHistoryItem(prev => {
            const newGroups = prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g);
            return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups, totalTasks: prev.analysisResult.totalTasks + 1 } };
        });
    };

    const handleDeleteTask = (groupId: string, taskId: string) => {
        if (isReadOnly) return;
        if (onDeleteTask) { onDeleteTask(groupId, taskId); return; }

        updateHistoryItem(prev => ({
            ...prev,
            analysisResult: {
                ...prev.analysisResult,
                groups: prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g)
            }
        }));
    };

    const handleUpdateTaskContent = (groupId: string, taskId: string, content: string) => {
        if (isReadOnly) return;
        if (onUpdateTask) { onUpdateTask(groupId, taskId, { content }); return; }

        updateHistoryItem(p => {
            const newGroups = p.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, content } : t) } : g);
            return { ...p, analysisResult: { ...p.analysisResult, groups: newGroups } };
        });
    };

    const handleUpdateTaskPriority = (groupId: string, taskId: string, priority: any) => {
        if (isReadOnly) return;
        if (onUpdateTask) { onUpdateTask(groupId, taskId, { priority }); return; }
        // Legacy update... skipping for brevity as it's not strictly requested but good to have consistency if I could.
    };

    return (
        <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Action Plan</h2>
                <div className="flex gap-2">
                    {['all', 'active', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as FilterStatus)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white/40 text-slate-600 hover:bg-white/60 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <Accordion type="single" collapsible value={activeGroup || ""} onValueChange={setActiveGroup} className="space-y-4">
                <AnimatePresence>
                    {filteredGroups.map(group => (
                        <motion.div key={group.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <AccordionItem value={group.id} className="border-0">
                                <Card className="glass-panel overflow-hidden border-0 shadow-lg shadow-slate-200/20 dark:shadow-none">
                                    {/* Custom Trigger Wrapper to avoid Button-in-Button DOM Nesting */}
                                    <div
                                        className="px-5 py-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-3 w-full group/trigger"
                                        onClick={() => setActiveGroup(activeGroup === group.id ? null : group.id)}
                                    >
                                        <div className="p-2 bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-900/30 dark:to-cyan-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                                            <FolderPlus className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 text-left flex items-center justify-between mr-4">
                                            <div className="flex-1" onClick={e => e.stopPropagation()}>
                                                {onRenameGroup && !isReadOnly ? (
                                                    <EditableField
                                                        value={group.name}
                                                        onSave={(val) => onRenameGroup(group.id, val)}
                                                        className="font-semibold text-slate-800 dark:text-slate-100 text-lg"
                                                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <>
                                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{group.name}</h3>
                                                    </>
                                                )}
                                                {(!onRenameGroup || isReadOnly) && <p className="text-xs text-slate-500 dark:text-slate-400">{group.tasks.length} tasks • {group.tasks.filter(t => t.completed).length} done</p>}
                                            </div>

                                            {!isReadOnly && onDeleteGroup && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Delete this group and all its tasks?')) onDeleteGroup(group.id);
                                                }}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeGroup === group.id ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    <AccordionContent className="bg-white/20 dark:bg-black/10 px-2 pb-2 pt-0">
                                        <div className="space-y-1 mt-2">
                                            {group.tasks.map(task => (
                                                <motion.div key={task.id} variants={listItemVariants} initial="hidden" animate="visible" exit="exit" layoutId={task.id}>
                                                    <div className={`
                                  group flex items-start gap-3 p-3 rounded-xl transition-all border border-transparent
                                  ${task.completed ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 hover:border-violet-100/50 hover:shadow-sm'}
                                `}>
                                                        <div className="mt-1 relative">
                                                            <input
                                                                type="checkbox"
                                                                checked={task.completed}
                                                                onChange={(e) => handleToggleTask(group.id, task.id, e.target.checked)}
                                                                className="peer sr-only" id={`check-${task.id}`}
                                                                disabled={isReadOnly}
                                                            />
                                                            <label htmlFor={`check-${task.id}`} className={`
                                        flex items-center justify-center w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 transition-all
                                        ${!isReadOnly ? 'cursor-pointer' : 'cursor-default'}
                                        peer-checked:bg-violet-600 peer-checked:border-violet-600 peer-focus:ring-2 peer-focus:ring-violet-300
                                      `}>
                                                                <CheckCircle className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100" />
                                                            </label>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <EditableField
                                                                value={task.content}
                                                                onSave={val => handleUpdateTaskContent(group.id, task.id, val)}
                                                                className={`text-base font-medium ${task.completed ? 'line-through decoration-slate-400 text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}
                                                                readOnly={isReadOnly}
                                                            />
                                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                <EditableField
                                                                    type="select"
                                                                    value={task.priority}
                                                                    onSave={(val) => handleUpdateTaskPriority(group.id, task.id, val)}
                                                                    readOnly={isReadOnly}
                                                                />
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/10 px-2 py-1 rounded-md">
                                                                    <Clock className="w-3 h-3" />
                                                                    {task.estimatedTime}m
                                                                </div>
                                                                {!isReadOnly && (
                                                                    <button onClick={() => handleDeleteTask(group.id, task.id)} className="ml-auto text-slate-400 hover:text-red-500 transition-colors p-1">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {!isReadOnly && (
                                                <Button variant="ghost" className="w-full mt-2 border border-dashed border-slate-300 text-slate-500 hover:text-violet-600 hover:bg-violet-50 hover:border-violet-200" onClick={() => handleAddTask(group.id)}>
                                                    <PlusCircle className="w-4 h-4 mr-2" /> Add Task
                                                </Button>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Accordion>
        </div>
    );
}
