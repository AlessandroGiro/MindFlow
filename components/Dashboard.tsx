
import React, { useState, useMemo, useEffect, useRef } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, Task, TaskStatus, TASK_STATUSES, Priority, TeamMember } from '../types/index';
import { ToggleSwitch } from './ToggleSwitch';
import { EditProjectModal } from './EditProjectModal';
import { ConfirmationModal } from './ConfirmationModal';

interface DashboardProps {
    projects: Project[];
    tasks: Task[];
    team: TeamMember[];
    onSelectProject: (project: Project) => void;
    onNewProjectClick: () => void;
    onToggleSidebar: () => void;
    onUpdateProject: (projectId: string, projectData: Partial<Omit<Project, 'projectId'>>) => Promise<void>;
    onDeleteProject: (projectId: string) => Promise<void>;
    showInstallButton?: boolean;
    onInstallClick?: () => void;
}

const ProjectCard: React.FC<{
    project: Project;
    tasks: Task[];
    completedCount: number;
    onSelect: () => void;
    isExpanded: boolean;
    onToggleExpand: (e: React.MouseEvent) => void;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
}> = ({ project, tasks, completedCount, onSelect, isExpanded, onToggleExpand, onEdit, onDelete }) => {
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);

    const priorityClasses: Record<Priority, { badge: string }> = {
        'Urgent': { badge: 'bg-red-500 text-white dark:bg-red-600 dark:text-red-50' },
        'High': { badge: 'bg-orange-400 text-orange-900 dark:bg-orange-500 dark:text-orange-950' },
        'Medium': { badge: 'bg-yellow-300 text-yellow-800 dark:bg-yellow-400/80 dark:text-yellow-950' },
        'Low': { badge: 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-zinc-300' }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    React.useLayoutEffect(() => {
        const element = descriptionRef.current;
        if (element) {
            const style = window.getComputedStyle(element);
            const lineHeight = parseFloat(style.lineHeight);
            const twoLinesHeight = lineHeight * 2;
            
            if (element.scrollHeight > twoLinesHeight + 2) {
                setIsClamped(true);
            } else {
                setIsClamped(false);
            }
        }
    }, [project.description]);
    
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
    
    // Group tasks by status for the expanded view
    const tasksByStatus = useMemo(() => {
        if (!isExpanded) return {};
        return tasks.reduce((acc, task) => {
            if (!acc[task.status]) {
                acc[task.status] = [];
            }
            acc[task.status].push(task);
            return acc;
        }, {} as Record<TaskStatus, Task[]>);
    }, [tasks, isExpanded]);

    const toggleDescriptionExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDescriptionExpanded(prev => !prev);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onEdit(project);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onDelete(project);
    };
    
    return (
        <div onClick={onSelect} className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-3xl shadow-lg hover:shadow-2xl hover:bg-white/70 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-visible relative">
             {/* 3 Dots Menu */}
             <div className="absolute top-4 right-4 z-20" ref={menuRef}>
                <button 
                    onClick={handleMenuClick}
                    className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-base-content-secondary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Project actions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" /></svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-base-100 rounded-xl shadow-xl border border-base-200 overflow-hidden animate-fade-in z-30">
                         <button onClick={handleEditClick} className="w-full text-left px-4 py-2 text-sm hover:bg-base-200 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" /></svg>
                            Edit
                        </button>
                        <button onClick={handleDeleteClick} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 pb-0 pr-10">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow min-w-0">
                         <h3 className="text-xl font-extrabold truncate text-brand-primary dark:text-white" title={project.projectName}>{project.projectName}</h3>
                        <p className="text-sm font-medium text-base-content-secondary mt-1">Lead: {project.projectLead}</p>
                    </div>
                </div>
                <div className="mt-3 text-sm text-base-content-secondary font-medium">
                    <p 
                        ref={descriptionRef}
                        className={`relative transition-all duration-300 ease-in-out ${!isDescriptionExpanded && isClamped ? 'max-h-[2.5rem] overflow-hidden' : 'max-h-48'}`}
                    >
                        {project.description}
                        {!isDescriptionExpanded && isClamped && (
                            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none" />
                        )}
                    </p>
                    {isClamped && (
                        <button onClick={toggleDescriptionExpand} className="font-bold text-brand-primary hover:underline mt-1 text-xs uppercase tracking-wide">
                            {isDescriptionExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-2 text-sm font-bold">
                    <span className="text-base-content-secondary">Progress</span>
                    <span className="text-brand-primary">{progress}%</span>
                </div>
                <div className="w-full bg-white/50 dark:bg-white/10 rounded-full h-3 border border-white/20">
                    <div className="bg-brand-primary h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${progress}%` }}></div>
                </div>
                 <div className="text-right text-xs text-base-content-secondary mt-2 font-mono opacity-70">
                    {completedCount}/{tasks.length} tasks
                </div>
            </div>
            
             {/* Expand/Collapse Logic Button */}
             <button
                onClick={onToggleExpand}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 transition-colors text-base-content-secondary"
                aria-label={isExpanded ? 'Collapse project details' : 'Expand project details'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
            </button>

             <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'}`}>
                <div className="border-t border-white/20 bg-white/30 dark:bg-black/20 backdrop-blur-sm mt-8">
                    <div className="px-6 py-4 space-y-3">
                        {TASK_STATUSES.map(status => {
                            const statusTasks = tasksByStatus[status];
                            if (!statusTasks || statusTasks.length === 0) return null;

                            return (
                                <div key={status}>
                                    <h4 className="text-xs font-black text-base-content-secondary uppercase tracking-wider mb-1">{status} ({statusTasks.length})</h4>
                                    <ul className="space-y-1">
                                        {statusTasks.map(task => (
                                            <li key={task.taskId} className="text-sm font-medium text-base-content flex justify-between items-center group py-1 pl-2 border-l-2 border-transparent hover:border-brand-primary hover:bg-white/40 rounded-r-lg transition-all">
                                                <span className="truncate pr-2" title={task.taskName}>{task.taskName}</span>
                                                <div className="flex items-center gap-3 flex-shrink-0 pr-2">
                                                    <span className="text-[10px] uppercase tracking-wide text-base-content-secondary opacity-0 group-hover:opacity-100 transition-opacity">{task.assignee.split(' ')[0]}</span>
                                                    <span className={`w-16 text-center px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${priorityClasses[task.priority]?.badge}`}>{task.priority}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                        {tasks.length === 0 && <p className="text-sm text-base-content-secondary text-center italic py-2">No tasks in this project yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, tasks, team, onSelectProject, onNewProjectClick, onToggleSidebar, onUpdateProject, onDeleteProject, showInstallButton, onInstallClick }) => {
    const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
    const [expandAll, setExpandAll] = useState(false);
    
    // Editing State
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Deleting State
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggleExpandAll = (isChecked: boolean) => {
        setExpandAll(isChecked);
        if (isChecked) {
            setExpandedProjects(projects.map(p => p.projectId));
        } else {
            setExpandedProjects([]);
        }
    };

    const handleToggleProjectExpand = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setExpandedProjects(prev => {
            if (prev.includes(projectId)) {
                return prev.filter(id => id !== projectId);
            } else {
                return [...prev, projectId];
            }
        });
    };
    
    // Sync the master toggle if all cards are manually collapsed/expanded
    useEffect(() => {
        if (projects.length > 0) {
            if (expandedProjects.length === 0) {
                setExpandAll(false);
            } else if (expandedProjects.length === projects.length) {
                setExpandAll(true);
            }
        }
    }, [expandedProjects, projects.length]);

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        setIsEditModalOpen(true);
    };

    const handleDelete = (project: Project) => {
        setDeletingProject(project);
        setDeleteConfirmationInput('');
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingProject) return;
        if (deleteConfirmationInput !== deletingProject.projectName) {
            alert("The project name entered does not match.");
            return;
        }
        
        setIsDeleting(true);
        try {
            await onDeleteProject(deletingProject.projectId);
            setIsDeleteModalOpen(false);
            setDeletingProject(null);
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="h-full">
             <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                 <div className="flex items-center gap-2">
                    <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-white/30 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-brand-primary dark:text-white">Home</h1>
                        <p className="text-base-content-secondary font-medium mt-1">Your projects at a glance.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 self-start sm:self-center">
                    {showInstallButton && onInstallClick && (
                        <button
                            onClick={onInstallClick}
                            className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold px-4 py-2 rounded-full flex items-center gap-2 border border-brand-primary/20 shadow-sm backdrop-blur-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Install App
                        </button>
                    )}
                    <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <label htmlFor="expand-all-toggle" className="text-sm font-bold text-base-content cursor-pointer select-none">Expand All</label>
                        <ToggleSwitch id="expand-all-toggle" checked={expandAll} onChange={handleToggleExpandAll} />
                    </div>
                </div>
            </header>

            {projects.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 items-start pb-8">
                    {projects.map(p => {
                        const projectTasks = tasks.filter(t => t.project === p.projectName);
                        const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
                        return (
                             <ProjectCard 
                                key={p.projectId} 
                                project={p} 
                                tasks={projectTasks} 
                                completedCount={completedTasks} 
                                onSelect={() => onSelectProject(p)}
                                isExpanded={expandedProjects.includes(p.projectId)}
                                onToggleExpand={(e) => handleToggleProjectExpand(e, p.projectId)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        )
                    })}
                </div>
            ) : (
                 <div className="flex flex-col justify-center items-center h-full text-center p-4 bg-white/40 backdrop-blur-lg border border-white/30 rounded-3xl shadow-xl mt-[-80px] max-w-lg mx-auto">
                    <div className="p-6 bg-brand-primary/10 rounded-full mb-6">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-brand-primary" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M12 2.5C5.8 2.5 3.5 6.2 4.6 12c1.1 5.8 6.4 9.5 7.4 9.5s6.3-3.7 7.4-9.5c1.1-5.8-1.2-9.5-7.4-9.5zM12 7c-3.2 0-4.3 1.6-3.7 5.1.6 3.5 3.7 5.9 3.7 5.9s3.1-2.4 3.7-5.9c.6-3.5-.5-5.1-3.7-5.1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-brand-primary">No Projects Yet</h2>
                    <p className="text-lg text-base-content-secondary mb-8 font-medium">
                        Start your journey by creating a new project. Let's get productive!
                    </p>
                    <button
                        onClick={onNewProjectClick}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        <span>Create Project</span>
                    </button>
                </div>
            )}

            {editingProject && (
                <EditProjectModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    project={editingProject} 
                    onUpdateProject={onUpdateProject} 
                    team={team} 
                />
            )}

            {deletingProject && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Project?"
                    message={`This action is irreversible and will delete all tasks and comments associated with "${deletingProject.projectName}".`}
                    confirmLabel="Delete Project"
                    isDestructive={true}
                    isLoading={isDeleting}
                >
                    <div className="mt-4">
                        <label htmlFor="confirm-delete" className="block text-sm font-bold text-base-content-secondary mb-2">
                            Type <span className="select-all font-mono text-base-content bg-base-300 px-1 rounded">{deletingProject.projectName}</span> to confirm:
                        </label>
                        <input 
                            type="text" 
                            id="confirm-delete"
                            value={deleteConfirmationInput}
                            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                            className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-red-500 transition-colors duration-200"
                            placeholder="Project Name"
                            autoComplete="off"
                        />
                    </div>
                </ConfirmationModal>
            )}
        </div>
    );
};
