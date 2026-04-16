import React from 'react';
import { Task, Priority } from '../types/index';

interface TaskCardProps {
    task: Task;
    onSelectTask: (task: Task) => void;
    isSelected?: boolean;
}

const priorityClasses: Record<Priority, { badge: string }> = {
    'Urgent': { badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' },
    'High': { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200' },
    'Medium': { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' },
    'Low': { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask, isSelected }) => {

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const priorityClass = priorityClasses[task.priority] || { badge: 'bg-gray-100 text-gray-600' };
    
    const selectedClasses = isSelected 
        ? 'ring-2 ring-brand-primary shadow-xl scale-[1.02]' 
        : 'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.01]';


    return (
        <div
            draggable
            onClick={() => onSelectTask(task)}
            onDragStart={handleDragStart}
            className={`bg-white/90 dark:bg-gray-800/90 p-4 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 cursor-pointer active:cursor-grabbing transition-all duration-200 backdrop-blur-sm ${selectedClasses}`}
            role="button"
            aria-label={`View details for task: ${task.taskName}`}
            aria-selected={isSelected}
        >
            <h3 className="font-bold text-base truncate text-base-content" title={task.taskName}>{task.taskName}</h3>
            
            <div className="flex justify-between items-center text-sm font-medium text-base-content-secondary mt-3">
                <span className="flex items-center gap-1">
                     <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold text-brand-primary">
                        {task.assignee.charAt(0)}
                    </div>
                    <span className="text-xs opacity-80">{task.assignee.split(' ')[0]}</span>
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold ${priorityClass.badge}`}>{task.priority}</span>
            </div>
        </div>
    );
};