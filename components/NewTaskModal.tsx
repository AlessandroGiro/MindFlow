import React, { useState, useCallback, useEffect } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { TeamMember, TaskStatus, PRIORITIES, Priority, Task } from '../types/index';
import { DatePickerInput } from './DatePickerInput';

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTask: (task: Omit<Task, 'taskId' | 'project' | 'createdAt' | 'completionDate' | 'parentId'>) => void;
    team: TeamMember[];
    defaultStatus: TaskStatus;
    currentUser: TeamMember;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onAddTask, team, defaultStatus, currentUser }) => {
    const [taskName, setTaskName] = useState('');
    const [description, setDescription] = useState('');
    const [assignee, setAssignee] = useState('');
    const [priority, setPriority] = useState<Priority>('Medium');
    const [status, setStatus] = useState<TaskStatus>(defaultStatus);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStatus(defaultStatus);
            if (team.length > 0) {
                 if (team.some(member => member.email === currentUser.email)) {
                    setAssignee(currentUser.name);
                } else if (!assignee) {
                    setAssignee(team[0].name);
                }
            }
        }
    }, [isOpen, defaultStatus, team, currentUser, assignee]);

    const resetAndClose = useCallback(() => {
        setTaskName('');
        setDescription('');
        setPriority('Medium');
        setStartDate(null);
        setDueDate(null);
        onClose();
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskName.trim()) {
            alert('Please provide a task name.');
            return;
        }
        onAddTask({
            taskName: taskName.trim(),
            description: description.trim(),
            assignee,
            priority,
            status,
            subStatus: 'Pending',
            dueDate,
            startDate,
        });
        resetAndClose();
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={resetAndClose}>
            <div 
              data-modal-content="true"
              className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-fade-in flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 p-6 sm:p-8 pb-4 border-b border-base-300">
                    <h2 className="text-3xl font-bold">Add New Task</h2>
                </header>
                
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                    <main className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-4">
                        <div>
                            <label htmlFor="taskName" className="block text-sm font-bold mb-2 text-base-content-secondary">Task Name</label>
                            <input type="text" id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="e.g., Design new logo" required />
                        </div>
                        
                        <div>
                            <label htmlFor="taskDescription" className="block text-sm font-bold mb-2 text-base-content-secondary">Description</label>
                            <textarea id="taskDescription" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="Add more details about the task..." rows={3} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DatePickerInput
                                id="startDate"
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                            />
                            <DatePickerInput
                                id="dueDate"
                                label="Due Date"
                                value={dueDate}
                                onChange={setDueDate}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="assignee" className="block text-sm font-bold mb-2 text-base-content-secondary">Assignee</label>
                                <select id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" required>
                                    {team.map(member => (<option key={member.email} value={member.name}>{member.name}</option>))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="priority" className="block text-sm font-bold mb-2 text-base-content-secondary">Priority</label>
                                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" required>
                                    {PRIORITIES.map(p => (<option key={p} value={p}>{p}</option>))}
                                </select>
                            </div>
                        </div>
                    </main>

                    <footer className="flex-shrink-0 p-6 sm:p-8 pt-4 border-t border-base-300 flex justify-end gap-4">
                        <button type="button" onClick={resetAndClose} className="bg-base-300/70 hover:bg-base-300 font-bold py-2 px-6 rounded-xl transition-colors duration-300">
                            Cancel
                        </button>
                        <button type="submit" className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors duration-300">
                            Add Task
                        </button>
                    </footer>
                </form>
            </div>
            <style>{`
              @keyframes fade-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
              .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};