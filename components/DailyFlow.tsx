
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, TeamMember, Project } from '../types/index';
import { TaskCard } from './TaskCard';

// --- Types for this specific module ---
interface ScheduledTask extends Task {
    duration: number; // in minutes
    startTime: number; // in minutes from midnight (0-1440)
}

interface DailyFlowProps {
    tasks: Task[];
    projects: Project[];
    currentUser: TeamMember;
    onToggleSidebar: () => void;
    onSelectTask: (task: Task) => void;
}

const MOCK_GCAL_TASKS = [
    { id: 'gcal-1', title: 'Client Call: Updates', tag: 'MEETING', duration: 45, startTime: 600, type: 'gcal' }, // 10:00 AM
    { id: 'gcal-2', title: 'Team Sync', tag: 'MEETING', duration: 30, startTime: 840, type: 'gcal' }, // 2:00 PM
];

// --- Helper Functions ---
const minutesToTimeStr = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
};

const generateMonthDays = (centerDate: Date) => {
    const year = centerDate.getFullYear();
    const month = centerDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
};

export const DailyFlow: React.FC<DailyFlowProps> = ({ tasks, projects, currentUser, onToggleSidebar, onSelectTask }) => {
    const [isSyncEnabled, setIsSyncEnabled] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduleMap, setScheduleMap] = useState<Record<string, { startTime: number, duration: number }>>({});
    const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });
    
    // Resizing state
    const [resizingState, setResizingState] = useState<{ taskId: string, initialY: number, initialDuration: number } | null>(null);

    const gridRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const activeDayRef = useRef<HTMLButtonElement>(null);

    // Filter tasks for the current user
    const myTasks = useMemo(() => {
        return tasks.filter(task => task.assignee === currentUser.name);
    }, [tasks, currentUser.name]);

    // Separate backlog vs scheduled
    const { backlogTasksByProject, scheduledTasks } = useMemo(() => {
        const backlog: Record<string, Task[]> = {};
        const scheduled: ScheduledTask[] = [];

        myTasks.forEach(task => {
            const schedule = scheduleMap[task.taskId];
            if (schedule) {
                scheduled.push({ ...task, ...schedule });
            } else {
                const projectName = task.project || 'Unassigned';
                if (!backlog[projectName]) backlog[projectName] = [];
                backlog[projectName].push(task);
            }
        });

        return { backlogTasksByProject: backlog, scheduledTasks: scheduled };
    }, [myTasks, scheduleMap]);

    // Sort project names for the backlog list
    const sortedProjectNames = Object.keys(backlogTasksByProject).sort();

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to current time on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
                const pxPerMinute = 100 / 60; 
                const currentY = currentTimeMinutes * pxPerMinute;
                const containerHeight = scrollContainerRef.current.clientHeight;
                const targetScroll = currentY - (containerHeight / 2);
                
                scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
            if (activeDayRef.current) {
                activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // --- Resize Logic ---
    useEffect(() => {
        if (!resizingState) return;

        const handleMouseMove = (e: MouseEvent) => {
             const deltaY = e.clientY - resizingState.initialY;
             // 100px = 60 mins, so 1px = 0.6 mins
             // We want to snap to 15 mins. 15 mins = 25px.
             const deltaMinutes = Math.round((deltaY / 100) * 60 / 15) * 15;
             
             const newDuration = Math.max(15, resizingState.initialDuration + deltaMinutes);
             
             setScheduleMap(prev => ({
                 ...prev, 
                 [resizingState.taskId]: { 
                     ...prev[resizingState.taskId], 
                     duration: newDuration 
                 }
             }));
        };

        const handleMouseUp = () => {
            setResizingState(null);
            document.body.style.cursor = ''; // Reset cursor
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingState]);

    const handleResizeStart = (e: React.MouseEvent, task: ScheduledTask) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent drag start of the card
        setResizingState({
            taskId: task.taskId,
            initialY: e.clientY,
            initialDuration: task.duration
        });
        document.body.style.cursor = 'ns-resize';
    };


    // --- Drag & Drop Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnGrid = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId || !gridRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        // Calculate Y relative to the top of the grid container. 
        const offsetY = e.clientY - rect.top;
        
        let minutes = (offsetY / 100) * 60;
        minutes = Math.round(minutes / 15) * 15; // Snap to 15 mins
        
        // Default duration is 30 mins if moving from backlog, or keep existing if moving on grid
        const currentDuration = scheduleMap[taskId]?.duration || 30;
        
        // Clamp to 24 hours
        minutes = Math.max(0, Math.min(1440 - currentDuration, minutes));

        setScheduleMap(prev => ({
            ...prev,
            [taskId]: { startTime: minutes, duration: currentDuration }
        }));
    };

    const handleDropOnBacklog = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        setScheduleMap(prev => {
            const newMap = { ...prev };
            delete newMap[taskId];
            return newMap;
        });
    };

    // --- Layout Calculation (Lane Packing) ---
    const layoutTasks = useMemo(() => {
        const allItems = [...scheduledTasks];
        
        // Add GCal mocks if enabled
        if (isSyncEnabled) {
            // @ts-ignore - mixing types for display only
            allItems.push(...MOCK_GCAL_TASKS);
        }

        const sorted = allItems.sort((a, b) => a.startTime - b.startTime);
        
        // Add layout info
        const processed = [];
        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            // @ts-ignore
            const currentEnd = current.startTime + current.duration;
            
            // Find overlapping items
            const overlaps = sorted.filter(t => {
                 // @ts-ignore
                if (t.id === current.id || t.taskId === current.taskId) return true;
                 // @ts-ignore
                const tStart = t.startTime;
                 // @ts-ignore
                const tEnd = tStart + t.duration;
                 // @ts-ignore
                return tStart < currentEnd && tEnd > current.startTime;
            });

            const totalOverlaps = overlaps.length;
            const indexInOverlap = overlaps.indexOf(current);
            
            processed.push({
                ...current,
                left: (indexInOverlap / totalOverlaps) * 100,
                width: 100 / totalOverlaps
            });
        }
        return processed;
    }, [scheduledTasks, isSyncEnabled]);

    // --- Render Helpers ---
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dateStrip = useMemo(() => generateMonthDays(currentDate), [currentDate]);

    return (
        <div className="flex h-full bg-[#F4F5F7] dark:bg-base-200 font-sans overflow-hidden text-base-content">
            {/* Left Sidebar: Backlog */}
            <div 
                className="w-80 flex-shrink-0 bg-base-100 border-r border-base-300 flex flex-col z-20 shadow-sm"
                onDragOver={handleDragOver}
                onDrop={handleDropOnBacklog}
            >
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                         <button onClick={onToggleSidebar} className="p-1 -ml-1 rounded hover:bg-base-200 md:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight">MindPlan</h1>
                    </div>
                    <p className="text-sm text-base-content-secondary mb-6">Today's Plan</p>
                    
                    <button 
                        onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                        className={`w-full py-2 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-6 border ${isSyncEnabled ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-100' : 'bg-base-100 border-base-300 text-base-content-secondary hover:bg-base-200'}`}
                    >
                        {isSyncEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        )}
                        {isSyncEnabled ? 'Synced with Google' : 'Sync Google Calendar'}
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto px-4 pb-6 space-y-4">
                    {myTasks.length === 0 ? (
                         <div className="text-center py-8 text-base-content-secondary text-sm italic border-2 border-dashed border-base-300 rounded-xl">
                            No tasks assigned to you.
                        </div>
                    ) : sortedProjectNames.length === 0 ? (
                        <div className="text-center py-8 text-base-content-secondary text-sm italic border-2 border-dashed border-base-300 rounded-xl">
                            All tasks scheduled!
                        </div>
                    ) : (
                        sortedProjectNames.map(projectName => (
                            <div key={projectName}>
                                <h3 className="text-xs font-bold text-base-content-secondary uppercase tracking-wider mb-2 px-2 sticky top-0 bg-base-100 z-10 py-1">{projectName}</h3>
                                <div className="space-y-2">
                                    {backlogTasksByProject[projectName].map(task => (
                                        <TaskCard key={task.taskId} task={task} onSelectTask={onSelectTask} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Timeline Area */}
            <div className="flex-grow flex flex-col h-full min-w-0 relative">
                {/* Header */}
                <div className="flex-shrink-0 px-8 pt-6 pb-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1 flex justify-center items-center gap-4">
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full bg-base-100 shadow-sm hover:bg-base-200 text-base-content-secondary hover:text-base-content transition-colors border border-base-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                            </button>
                            <h2 className="text-xl font-bold w-40 text-center select-none">
                                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full bg-base-100 shadow-sm hover:bg-base-200 text-base-content-secondary hover:text-base-content transition-colors border border-base-200">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="absolute right-8 top-6 hidden sm:flex gap-2">
                           <div className="text-xs font-medium text-base-content-secondary bg-base-100 px-3 py-1.5 rounded-full shadow-sm border border-base-200">
                               GMT+1
                           </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-8 px-8 no-scrollbar mask-fade-sides">
                        {dateStrip.map((date, i) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = date.toDateString() === currentDate.toDateString();
                            
                            return (
                                <button 
                                    key={i}
                                    ref={isSelected ? activeDayRef : null}
                                    onClick={() => setCurrentDate(date)}
                                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[52px] h-[64px] rounded-xl transition-all duration-200 border snap-center ${isSelected ? 'bg-base-content text-base-100 border-base-content shadow-lg scale-105' : isToday ? 'bg-base-100 text-brand-primary border-brand-primary/30 shadow-sm' : 'bg-base-100 text-base-content-secondary border-transparent hover:bg-base-200'}`}
                                >
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-60' : 'opacity-40'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className="text-lg font-bold mt-0.5">{date.getDate()}</span>
                                    {isToday && !isSelected && <div className="w-1 h-1 bg-brand-primary rounded-full mt-0.5"></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div 
                    ref={scrollContainerRef} 
                    className="flex-grow overflow-y-auto px-4 sm:px-8 pb-8 relative"
                >
                    <div 
                        className="bg-base-100 rounded-[32px] shadow-sm relative min-h-[2400px] overflow-hidden"
                        ref={gridRef}
                        onDragOver={handleDragOver}
                        onDrop={handleDropOnGrid}
                    >
                        {/* Current Time Line */}
                        <div 
                            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center transition-[top] duration-1000 ease-linear"
                            style={{ top: `${(currentTimeMinutes / 60) * 100}px` }}
                        >
                            <div className="flex-grow h-[2px] bg-red-500 relative shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                                <div className="absolute -left-1 -top-[3px] w-2 h-2 bg-red-500 rounded-full shadow-sm"></div>
                            </div>
                        </div>

                        {/* Grid Lines */}
                        {hours.map(hour => {
                            const isWorkingHour = hour >= 9 && hour < 17;
                            return (
                                <div 
                                    key={hour} 
                                    className={`h-[100px] border-b border-gray-300/70 dark:border-gray-700/70 flex relative group ${!isWorkingHour ? 'bg-base-200/30' : ''}`}
                                >
                                    <div className="w-16 flex-shrink-0 border-r border-gray-300/70 dark:border-gray-700/70 text-right pr-4 pt-3 text-xs font-bold text-base-content-secondary group-hover:text-base-content transition-colors select-none">
                                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                    </div>
                                    <div className="flex-grow relative">
                                        {/* Quarter lines */}
                                        <div className="absolute top-1/4 left-0 right-0 border-t border-gray-300/30 dark:border-gray-700/30 w-full border-dashed"></div>
                                        {/* Half hour line */}
                                        <div className="absolute top-2/4 left-0 right-0 border-t border-gray-300/50 dark:border-gray-700/50 w-full"></div>
                                        {/* Three-quarter line */}
                                        <div className="absolute top-3/4 left-0 right-0 border-t border-gray-300/30 dark:border-gray-700/30 w-full border-dashed"></div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Scheduled Tasks */}
                        {layoutTasks.map((task: any) => {
                            const isSmall = task.duration <= 30;
                            const isTiny = task.duration <= 15;

                            return (
                                <div
                                    key={task.taskId || task.id}
                                    draggable={!resizingState} // Disable drag while resizing
                                    onDragStart={(e) => {
                                        // For re-dragging scheduled tasks
                                        if (task.type !== 'gcal' && !resizingState) {
                                            e.dataTransfer.setData('taskId', task.taskId);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (task.type !== 'gcal') onSelectTask(task);
                                    }}
                                    className={`absolute rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden ${
                                        task.type === 'gcal' 
                                        ? 'bg-blue-50 border-l-4 border-l-blue-500 border-blue-100 text-blue-900' 
                                        : 'bg-white dark:bg-base-200 border-base-300 hover:border-brand-primary/50 cursor-grab active:cursor-grabbing'
                                    } ${resizingState?.taskId === task.taskId ? '!cursor-ns-resize z-30 shadow-xl ring-2 ring-brand-primary' : ''}`}
                                    style={{
                                        top: `${(task.startTime / 60) * 100}px`,
                                        height: `${(task.duration / 60) * 100}px`,
                                        left: `calc(4rem + ${task.left}% + 4px)`, 
                                        width: `calc(${task.width}% - 4rem - 8px)`,
                                        zIndex: resizingState?.taskId === task.taskId ? 50 : 10,
                                        padding: isTiny ? '2px 8px' : isSmall ? '4px 10px' : '10px 12px'
                                    }}
                                >
                                    {!isTiny && (
                                        <div className="flex justify-between items-start pointer-events-none mb-0.5">
                                            {task.type === 'gcal' ? (
                                                <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider truncate text-blue-600">{task.tag}</span>
                                            ) : (
                                                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-base-100 text-base-content-secondary border border-base-200`}>{task.priority}</span>
                                            )}
                                            
                                            {task.type === 'gcal' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-blue-500"><path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H4.75Z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex items-center ${isTiny ? 'h-full' : ''}`}>
                                        <p className={`font-bold leading-tight pointer-events-none truncate w-full ${isTiny ? 'text-xs' : 'text-sm'}`}>
                                            {task.title || task.taskName}
                                        </p>
                                    </div>

                                    {!isSmall && (
                                        <div className="text-xs opacity-70 mt-1 pointer-events-none">
                                            {minutesToTimeStr(task.startTime)} - {minutesToTimeStr(task.startTime + task.duration)}
                                        </div>
                                    )}
                                    
                                    {task.type !== 'gcal' && (
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex justify-center items-end pb-1 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-black/5 to-transparent"
                                            onMouseDown={(e) => handleResizeStart(e, task)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-8 h-1 bg-base-content/20 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};