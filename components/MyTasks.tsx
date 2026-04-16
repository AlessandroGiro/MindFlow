




import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Task, TeamMember, Project, ProjectComment } from '../types/index';
import { TaskCard } from './TaskCard';
import { TaskDetailsContent } from './TaskDetailsContent';
import { TaskDetailsModal } from './TaskDetailsModal';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface MyTasksProps {
    tasks: Task[];
    currentUser: TeamMember;
    projects: Project[];
    team: TeamMember[];
    comments: ProjectComment[];
    onUpdateTask: (taskId: string, taskData: Partial<Omit<Task, 'taskId'>>) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
    onAddComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>) => Promise<ProjectComment>;
    onUpdateComment: (commentId: string, newContent: string, newTaggedUsers: string[]) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    onToggleSidebar: () => void;
    onSyncChanges: () => void;
    onSelectTask: (task: Task) => void;
    selectedTask: Task | null;
}

export const MyTasks: React.FC<MyTasksProps> = ({ tasks, currentUser, projects, team, comments, onUpdateTask, onDeleteTask, onAddComment, onUpdateComment, onDeleteComment, onToggleSidebar, onSyncChanges, onSelectTask, selectedTask }) => {
    
    const selectedTaskId = selectedTask?.taskId || null;
    const isMobile = useMediaQuery('(max-width: 767px)');
    
    const myTasks = useMemo(() => {
        return tasks.filter(task => task.assignee === currentUser.name);
    }, [tasks, currentUser.name]);


    const tasksByProject = useMemo(() => {
        return myTasks.reduce((acc, task) => {
            const projectName = task.project || 'Unassigned';
            if (!acc[projectName]) {
                acc[projectName] = [];
            }
            acc[projectName].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [myTasks]);
    
    // --- Syncing logic for local-first updates ---
    // FIX: Initialize useRef with a value to satisfy stricter TypeScript/linter rules that expect an argument.
    // FIX: useRef was called without arguments. Initializing with `null`.
    const prevSelectedTaskIdRef = useRef<string | null>(null);
    useEffect(() => {
        prevSelectedTaskIdRef.current = selectedTaskId;
    });
    const prevSelectedTaskId = prevSelectedTaskIdRef.current;

    useEffect(() => {
        // Sync when unselecting a task or selecting a different one.
        // The check `prevSelectedTaskId` ensures it doesn't run on initial mount.
        if (prevSelectedTaskId && prevSelectedTaskId !== selectedTaskId) {
            onSyncChanges();
        }
    }, [selectedTaskId, prevSelectedTaskId, onSyncChanges]);

    // Sync when the user navigates away from the "My Tasks" view.
    useEffect(() => {
        return () => {
            onSyncChanges();
        };
    }, [onSyncChanges]);


    const sortedProjectNames = Object.keys(tasksByProject).sort();

    return (
        <div className="h-full flex flex-col">
            <header className="flex-shrink-0 mb-6">
                <div className="flex items-center gap-2">
                     <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">My Tasks</h1>
                        <p className="text-base-content-secondary mt-1">All tasks assigned to <span className="font-bold text-base-content">{currentUser.name}</span>.</p>
                    </div>
                </div>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                {/* Task List Column */}
                <div className="md:col-span-1 h-full flex flex-col min-h-0 bg-base-200/50 rounded-2xl">
                    {myTasks.length > 0 ? (
                        <div className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-4">
                            {sortedProjectNames.map((projectName) => (
                                <section key={projectName}>
                                    <h2 className="text-lg font-bold mb-3 px-2 sticky top-0 bg-base-200/80 backdrop-blur-sm py-2 -mx-2 -mt-2 z-10 sm:mx-0 sm:mt-0">{projectName}</h2>
                                    <div className="space-y-2">
                                        {tasksByProject[projectName].map(task => (
                                            <TaskCard 
                                                key={task.taskId} 
                                                task={task} 
                                                onSelectTask={onSelectTask} 
                                                isSelected={selectedTaskId === task.taskId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-center p-4">
                             <div className="p-6 bg-brand-primary/10 rounded-full mb-6">
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-brand-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">All Clear!</h2>
                            <p className="text-lg text-base-content-secondary max-w-xs">You have no tasks assigned to you. Great job!</p>
                        </div>
                    )}
                </div>

                {/* Task Details Column (Desktop Only) */}
                <div className="hidden md:block md:col-span-2 h-full min-h-0">
                    {selectedTask && !isMobile ? (
                        <TaskDetailsContent
                            task={selectedTask}
                            projects={projects}
                            team={team}
                            currentUser={currentUser}
                            comments={comments}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onAddComment={onAddComment}
                            onUpdateComment={onUpdateComment}
                            onDeleteComment={onDeleteComment}
                        />
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full text-center p-4 bg-base-200 rounded-2xl">
                           <h2 className="text-2xl font-bold mb-2">No Task Selected</h2>
                           <p className="text-lg text-base-content-secondary max-w-xs">Select a task from the list to see its details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};