

import React from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Task, TeamMember, ProjectComment, Project } from '../types/index';
import { TaskDetailsContent } from './TaskDetailsContent';

interface TaskDetailsModalProps {
    task: Task | null;
    onClose: () => void;
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


export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose, team, currentUser, comments, projects, onUpdateTask, onDeleteTask, onAddComment, onUpdateComment, onDeleteComment }) => {
    
    if (!task) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-base-200 rounded-2xl shadow-xl transform transition-all duration-300 scale-95 animate-fade-in max-h-[85vh] overflow-y-auto flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <TaskDetailsContent
                    task={task}
                    onClose={onClose}
                    team={team}
                    currentUser={currentUser}
                    comments={comments}
                    projects={projects}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onAddComment={onAddComment}
                    onUpdateComment={onUpdateComment}
                    onDeleteComment={onDeleteComment}
                />
            </div>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; transform: scale(.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};