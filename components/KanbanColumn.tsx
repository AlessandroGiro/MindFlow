import React, { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Task, TaskStatus } from '../types/index';

interface KanbanColumnProps {
    status: TaskStatus;
    tasks: Task[];
    onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
    onSelectTask: (task: Task) => void;
    onNewTaskClick: (status: TaskStatus) => void;
    isMobile: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

const statusConfig: Record<TaskStatus, { name: string }> = {
    'Backlog': { name: 'Backlog' },
    'To Do': { name: 'To Do' },
    'In Progress': { name: 'In Progress' },
    'In Review': { name: 'In Review' },
    'Done': { name: 'Done' },
};

const canAddTask: TaskStatus[] = ['Backlog', 'To Do'];

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onMoveTask, onSelectTask, onNewTaskClick, isMobile, isExpanded, onToggleExpand }) => {
    const [isOver, setIsOver] = useState(false);

    const sortedTasks = useMemo(() => {
        const tasksCopy = [...tasks];
        if (status === 'Done') {
            // For 'Done', sort by completion date, newest first.
            tasksCopy.sort((a, b) => {
                if (!a.completionDate) return 1;
                if (!b.completionDate) return -1;
                return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime();
            });
        } else {
            // For all other columns, sort by creation date, newest first.
            tasksCopy.sort((a, b) => {
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }
        return tasksCopy;
    }, [tasks, status]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isMobile) {
            e.preventDefault();
            setIsOver(true);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isMobile) {
            setIsOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (!isMobile) {
            e.preventDefault();
            setIsOver(false);
            const taskId = e.dataTransfer.getData('taskId');
            if (taskId) {
                onMoveTask(taskId, status);
            }
        }
    };
    
    const config = statusConfig[status];

    const headerContent = (
         <>
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">{config.name}</h2>
                <span className="font-mono font-bold bg-white/50 dark:bg-black/20 text-base-content-secondary rounded-full px-2.5 py-0.5 text-sm shadow-sm">{tasks.length}</span>
            </div>
            <div className="flex items-center gap-1">
                {canAddTask.includes(status) && (
                    <button 
                        onClick={(e) => {
                            if (isMobile) e.stopPropagation(); // Prevent toggling expand when adding task
                            onNewTaskClick(status);
                        }}
                        className="bg-brand-secondary text-brand-primary rounded-full p-1.5 shadow-sm hover:bg-white transition-all transform hover:scale-105"
                        aria-label={`Add new task to ${status}`}
                        title={`Add new task to ${status}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                    </button>
                )}
                 {isMobile && (
                    <div className="p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </div>
                 )}
            </div>
        </>
    );

    // Updated to use glassmorphism styles
    const mainContainerClasses = isMobile
        ? `flex flex-col rounded-3xl bg-white/30 backdrop-blur-md min-w-0 border border-white/40 shadow-lg`
        : `flex flex-col h-full rounded-3xl transition-all duration-300 bg-white/30 dark:bg-black/20 backdrop-blur-md min-w-0 flex-1 border border-white/30 dark:border-white/5 ${isOver ? 'bg-white/50 ring-2 ring-brand-primary/50' : ''}`;

    const renderTasks = () => (
         <>
            {sortedTasks.length > 0 ? (
                sortedTasks.map(task => <TaskCard key={task.taskId} task={task} onSelectTask={onSelectTask} />)
            ) : (
                <div className="flex items-center justify-center h-full text-base-content-secondary/60 italic text-center p-4 border-2 border-dashed border-white/20 rounded-2xl min-h-[100px] font-medium text-sm">
                    {isMobile ? 'No tasks.' : 'Drag tasks here.'}
                </div>
            )}
        </>
    );

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={mainContainerClasses}
        >
            {isMobile ? (
                <button
                    onClick={onToggleExpand}
                    className="w-full px-5 py-4 flex items-center justify-between sticky top-0 rounded-t-3xl z-10 bg-white/40 backdrop-blur-md border-b border-white/20"
                    aria-expanded={isExpanded}
                >
                    {headerContent}
                </button>
            ) : (
                <div className="px-5 py-4 flex items-center justify-between sticky top-0 rounded-t-3xl z-10 border-b border-white/20 bg-white/10 backdrop-blur-sm">
                    {headerContent}
                </div>
            )}
            
            {isMobile ? (
                <div className={`transition-[grid-template-rows] duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="min-h-0 overflow-hidden">
                        <div className="p-3 space-y-3">
                            {renderTasks()}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow p-3 space-y-3 overflow-y-auto custom-scrollbar">
                    {renderTasks()}
                </div>
            )}
        </div>
    );
};