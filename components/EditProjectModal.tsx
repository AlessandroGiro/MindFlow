
import React, { useState, useEffect } from 'react';
import { Project, TeamMember } from '../types/index';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdateProject: (projectId: string, projectData: Partial<Omit<Project, 'projectId'>>) => Promise<void>;
    team: TeamMember[];
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, project, onUpdateProject, team }) => {
    const [projectName, setProjectName] = useState(project.projectName);
    const [description, setDescription] = useState(project.description);
    const [projectLead, setProjectLead] = useState(project.projectLead);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setProjectName(project.projectName);
            setDescription(project.description);
            setProjectLead(project.projectLead);
        }
    }, [isOpen, project]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) return;
        
        setIsSaving(true);
        try {
            await onUpdateProject(project.projectId, {
                projectName: projectName.trim(),
                description: description.trim(),
                projectLead
            });
            onClose();
        } catch (error) {
            console.error("Failed to update project:", error);
            alert("Failed to update project.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                className="bg-base-200 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold mb-6">Edit Project</h2>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2 text-base-content-secondary">Project Name</label>
                        <input 
                            type="text" 
                            value={projectName} 
                            onChange={(e) => setProjectName(e.target.value)} 
                            className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-4 focus:outline-none focus:border-brand-primary transition-colors" 
                            required 
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2 text-base-content-secondary">Description</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-4 focus:outline-none focus:border-brand-primary transition-colors" 
                            rows={3} 
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold mb-2 text-base-content-secondary">Project Lead</label>
                        <select 
                            value={projectLead} 
                            onChange={(e) => setProjectLead(e.target.value)} 
                            className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-4 focus:outline-none focus:border-brand-primary transition-colors"
                        >
                            {team.map(member => (
                                <option key={member.email} value={member.name}>{member.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-base-300/70 hover:bg-base-300 font-bold py-2 px-6 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
