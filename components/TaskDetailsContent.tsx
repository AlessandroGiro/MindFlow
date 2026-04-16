import React, { useState, useEffect } from 'react';
import { Task, Priority, TeamMember, ProjectComment, Project, PRIORITIES } from '../types/index';
import { DatePickerInput } from './DatePickerInput';
import { TaskActivity } from './TaskActivity';
import { ConfirmationModal } from './ConfirmationModal';

interface TaskDetailsContentProps {
    task: Task;
    onClose?: () => void;
    team: TeamMember[];
    currentUser: TeamMember;
    comments: ProjectComment[];
    projects: Project[];
    onUpdateTask: (taskId: string, taskData: Partial<Omit<Task, 'taskId'>>) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
    onAddComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>) => Promise<ProjectComment>;
    onUpdateComment: (commentId: string, newContent: string, newTaggedUsers: string[]) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

const priorityStyles: Record<Priority, { text: string, className: string }> = {
    'Urgent': { text: 'Urgent', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    'High': { text: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    'Medium': { text: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    'Low': { text: 'Low', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300' }
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-base-content-secondary">{label}</dt>
        <dd className="mt-1 text-base font-semibold">{value || 'N/A'}</dd>
    </div>
);

export const TaskDetailsContent: React.FC<TaskDetailsContentProps> = ({ task, onClose, team, currentUser, comments, projects, onUpdateTask, onDeleteTask, onAddComment, onUpdateComment, onDeleteComment }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Partial<Task>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // If the selected task changes, exit edit mode
        setIsEditing(false);
        setEditedTask({});
    }, [task]);

    const handleEditClick = () => {
        setEditedTask({
            taskName: task.taskName,
            description: task.description,
            assignee: task.assignee,
            priority: task.priority,
            startDate: task.startDate,
            dueDate: task.dueDate,
        });
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setEditedTask({});
    };

    const handleSaveClick = async () => {
        setIsSaving(true);
        try {
            await onUpdateTask(task.taskId, editedTask);
            setIsEditing(false);
            setEditedTask({});
        } catch (error) {
            console.error("Failed to update task:", error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await onDeleteTask(task.taskId);
            setIsDeleteModalOpen(false);
            if (onClose) onClose();
        } catch (error) {
            console.error("Failed to delete task:", error);
            alert("Failed to delete task.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleFieldChange = (field: keyof typeof editedTask, value: any) => {
        setEditedTask(prev => ({ ...prev, [field]: value }));
    };

    const priorityInfo = priorityStyles[task.priority] || { text: 'N/A', className: 'bg-base-300' };
    const formatDate = (dateString: string | null) => dateString ? new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, { timeZone: 'UTC' }) : null;

    return (
        <>
            <div className="bg-base-200 p-6 sm:p-8 rounded-2xl shadow-xl h-full flex flex-col">
                <header className="flex-shrink-0 pb-4 border-b border-base-300">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        {isEditing ? (
                            <input 
                                type="text"
                                value={editedTask.taskName || ''}
                                onChange={e => handleFieldChange('taskName', e.target.value)}
                                className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary transition-colors duration-200 text-2xl sm:text-3xl font-bold"
                            />
                        ) : (
                            <h2 className="text-2xl sm:text-3xl font-bold pr-4 break-words">{task.taskName}</h2>
                        )}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!isEditing && (
                                <>
                                    <button onClick={handleEditClick} className="p-1 rounded-full hover:bg-base-300 transition-colors" title="Edit task">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" /></svg>
                                    </button>
                                    <button onClick={handleDeleteClick} className="p-1 rounded-full text-base-content-secondary hover:bg-red-500/10 hover:text-red-600 transition-colors" title="Delete task">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM4.854 13.73a6.5 6.5 0 0 1 8.877-8.876l-8.877 8.876Zm1.416 1.416 8.876-8.877a6.5 6.5 0 0 1-8.876 8.877Z" clipRule="evenodd" /></svg>
                                    </button>
                                </>
                            )}
                            {onClose && (
                              <button onClick={onClose} className="p-1 rounded-full hover:bg-base-300 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                        </div>
                    </div>
                    {!isEditing && (
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${priorityInfo.className}`}>{priorityInfo.text}</span>
                            <span className="text-base-content-secondary text-sm">Status: <span className="font-semibold text-base-content">{task.status}</span></span>
                        </div>
                    )}
                </header>

                <div className="flex-grow overflow-y-auto overflow-x-hidden min-h-0">
                    {isEditing ? (
                        <div className="space-y-4 py-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-base-content-secondary">Description</label>
                                <textarea 
                                    value={editedTask.description || ''}
                                    onChange={e => handleFieldChange('description', e.target.value)}
                                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200"
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <DatePickerInput id="edit-startDate" label="Start Date" value={editedTask.startDate || null} onChange={date => handleFieldChange('startDate', date)} />
                                <DatePickerInput id="edit-dueDate" label="Due Date" value={editedTask.dueDate || null} onChange={date => handleFieldChange('dueDate', date)} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-base-content-secondary">Assignee</label>
                                    <select value={editedTask.assignee} onChange={e => handleFieldChange('assignee', e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200">
                                        {team.map(m => <option key={m.email} value={m.name}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-base-content-secondary">Priority</label>
                                    <select value={editedTask.priority} onChange={e => handleFieldChange('priority', e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200">
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="py-6">
                                <p className="text-base-content/90 mb-6 whitespace-pre-wrap break-words">{task.description || 'No description provided.'}</p>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <DetailItem label="Assignee" value={task.assignee} />
                                    <DetailItem label="Project" value={task.project} />
                                    <DetailItem label="Start Date" value={formatDate(task.startDate)} />
                                    <DetailItem label="Due Date" value={formatDate(task.dueDate)} />
                                </dl>
                            </div>
                            
                            <div className="pt-6 mt-6 border-t border-base-300">
                                <TaskActivity
                                    task={task}
                                    projects={projects}
                                    comments={comments}
                                    currentUser={currentUser}
                                    team={team}
                                    onAddComment={onAddComment}
                                    onUpdateComment={onUpdateComment}
                                    onDeleteComment={onDeleteComment}
                                />
                            </div>
                        </>
                    )}
                </div>

                {isEditing && (
                    <footer className="flex-shrink-0 pt-4 border-t border-base-300 flex justify-end gap-3">
                        <button onClick={handleCancelClick} className="bg-base-300/70 hover:bg-base-300 font-bold py-2 px-6 rounded-xl transition-colors duration-300">
                            Cancel
                        </button>
                        <button onClick={handleSaveClick} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors duration-300 w-28 disabled:opacity-50 disabled:cursor-not-allowed">
                             {isSaving ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Save'}
                        </button>
                    </footer>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Task?"
                message="Are you sure you want to delete this task? This action cannot be undone and will delete all associated comments."
                confirmLabel="Delete Task"
                isDestructive={true}
                isLoading={isDeleting}
            />
        </>
    );
};