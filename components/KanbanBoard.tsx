import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Task, TaskStatus, TASK_STATUSES } from '../types/index';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface KanbanBoardProps {
    tasks: Task[];
    onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
    onSelectTask: (task: Task) => void;
    onNewTaskClick: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onMoveTask, onSelectTask, onNewTaskClick }) => {
    const isMobile = useMediaQuery('(max-width: 1023px)');
    const [expandedStatuses, setExpandedStatuses] = useState<TaskStatus[]>([]);

    useEffect(() => {
        if (isMobile) {
            // On mobile, find the first status column that has tasks and expand it by default.
            const firstStatusWithTasks = TASK_STATUSES.find(status => tasks.some(t => t.status === status));
            if (firstStatusWithTasks) {
                setExpandedStatuses([firstStatusWithTasks]);
            } else {
                // if no tasks, expand "To Do"
                setExpandedStatuses(['To Do']);
            }
        }
    }, [isMobile, tasks]); // Rerun when switching between mobile/desktop or when tasks change

    const toggleStatusExpansion = (status: TaskStatus) => {
        setExpandedStatuses(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    if (isMobile) {
        return (
            // On mobile, use a vertical flex layout with spacing.
            <div className="flex flex-col gap-4">
                {TASK_STATUSES.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={tasks.filter(t => t.status === status)}
                        onMoveTask={onMoveTask}
                        onSelectTask={onSelectTask}
                        onNewTaskClick={onNewTaskClick}
                        isMobile={true}
                        isExpanded={expandedStatuses.includes(status)}
                        onToggleExpand={() => toggleStatusExpansion(status)}
                    />
                ))}
            </div>
        );
    }
    
    // Desktop view: Removed solid background color to let gradient show
    return (
        <div className="flex h-full gap-6 pb-4">
            {TASK_STATUSES.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasks.filter(t => t.status === status)}
                    onMoveTask={onMoveTask}
                    onSelectTask={onSelectTask}
                    onNewTaskClick={onNewTaskClick}
                    isMobile={false}
                    isExpanded={true} // Always expanded on desktop
                    onToggleExpand={() => {}} // No-op on desktop
                />
            ))}
        </div>
    );
};