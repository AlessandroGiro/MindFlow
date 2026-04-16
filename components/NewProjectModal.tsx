import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { TeamMember } from '../types/index';
import { Loader } from './Loader';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProject: (project: { projectName: string, projectLead: string, description: string, generateWithAI: boolean, members: string[] }) => Promise<void>;
    team: TeamMember[];
    currentUser: TeamMember;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onAddProject, team, currentUser }) => {
    const [projectName, setProjectName] = useState('');
    const [projectLead, setProjectLead] = useState('');
    const [description, setDescription] = useState('');
    const [generateWithAI, setGenerateWithAI] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [members, setMembers] = useState<string[]>([]);
    
    // --- Member Search State ---
    const [memberSearch, setMemberSearch] = useState('');
    const [suggestions, setSuggestions] = useState<TeamMember[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // When the modal opens or the current user/team changes, set the defaults.
        if (isOpen && team.length > 0) {
            const defaultLead = team.some(member => member.email === currentUser.email) ? currentUser.name : team[0].name;
            setProjectLead(defaultLead);
            setMembers([defaultLead]);
        }
    }, [team, currentUser, isOpen]);
    
    // --- Close suggestions on outside click ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // When the project lead changes, ensure they are in the members list
    const handleLeadChange = (newLead: string) => {
        setProjectLead(newLead);
        setMembers(prevMembers => {
            const newMembers = new Set(prevMembers);
            newMembers.add(newLead);
            return Array.from(newMembers);
        });
    };
    
    // --- Member Search & Selection Logic ---
    const handleMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setMemberSearch(term);

        if (term.trim() === '') {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            return;
        }

        const filtered = team.filter(member => 
            member.name.toLowerCase().includes(term.toLowerCase()) &&
            !members.includes(member.name)
        );

        setSuggestions(filtered);
        setIsSuggestionsOpen(filtered.length > 0);
    };

    const handleAddMember = (memberName: string) => {
        if (!members.includes(memberName)) {
            setMembers(prev => [...prev, memberName]);
        }
        setMemberSearch('');
        setSuggestions([]);
        setIsSuggestionsOpen(false);
    };

    const handleRemoveMember = (memberName: string) => {
        if (memberName === projectLead) return; // Prevent removing the project lead
        setMembers(prev => prev.filter(m => m !== memberName));
    };
    
    const resetAndClose = useCallback(() => {
        setProjectName('');
        setDescription('');
        setGenerateWithAI(true);
        if (team.length > 0) {
            const defaultLead = team.some(m => m.email === currentUser.email) ? currentUser.name : team[0].name;
            setProjectLead(defaultLead);
            setMembers([defaultLead]);
        }
        setMemberSearch('');
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        setIsCreating(false);
        onClose();
    }, [team, onClose, currentUser]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim() || !projectLead || !description.trim() || members.length === 0) {
            alert('Please fill out all fields and select at least one member.');
            return;
        }
        setIsCreating(true);
        try {
            await onAddProject({ 
                projectName: projectName.trim(), 
                projectLead, 
                description: description.trim(),
                generateWithAI,
                members
            });
            // The modal will be closed by the parent component after the promise resolves.
        } catch (error) {
            console.error("Failed to create project:", error);
            alert("There was an error creating the project. Please try again.");
            setIsCreating(false); // Only stop loading on error
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={!isCreating ? resetAndClose : undefined}>
            <div 
              className="bg-base-200 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-95 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <h2 className="text-3xl font-bold mb-6">Create New Project</h2>
                    
                    <div className="mb-4">
                        <label htmlFor="projectName" className="block text-sm font-bold mb-2 text-base-content-secondary">Project Name</label>
                        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="e.g., Q3 Marketing Campaign" required />
                    </div>
                     <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-bold mb-2 text-base-content-secondary">Project Description</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" placeholder="Describe the main goal of this project." rows={3} required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="projectLead" className="block text-sm font-bold mb-2 text-base-content-secondary">Project Lead</label>
                        <select id="projectLead" value={projectLead} onChange={(e) => handleLeadChange(e.target.value)} className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200" required disabled={team.length === 0}>
                            {team.length > 0 ? (team.map(member => (<option key={member.email} value={member.name}>{member.name}</option>))) : (<option>Loading team...</option>)}
                        </select>
                    </div>
                     <div className="mb-6">
                        <label className="block text-sm font-bold mb-2 text-base-content-secondary">Project Members</label>
                        <div className="bg-base-100 border-2 border-base-300 rounded-xl p-2">
                            {/* Selected member tags */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {members.map(memberName => (
                                    <div key={memberName} className="bg-brand-primary/10 text-brand-primary font-semibold py-1 px-3 rounded-full flex items-center gap-2 animate-fade-in-sm">
                                        <span>{memberName} {memberName === projectLead && <span className="text-xs opacity-70">(Lead)</span>}</span>
                                        {memberName !== projectLead && (
                                            <button type="button" onClick={() => handleRemoveMember(memberName)} className="hover:bg-brand-primary/20 rounded-full p-0.5" aria-label={`Remove ${memberName}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Search input and suggestions */}
                            <div className="relative" ref={searchRef}>
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={handleMemberSearchChange}
                                    onFocus={handleMemberSearchChange}
                                    placeholder="Add members by name..."
                                    className="w-full bg-base-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200"
                                />
                                {isSuggestionsOpen && suggestions.length > 0 && (
                                    <div className="absolute z-10 top-full mt-1 w-full max-h-40 overflow-y-auto bg-base-200 border border-base-300 rounded-lg shadow-lg">
                                        {suggestions.map(member => (
                                            <button
                                                type="button"
                                                key={member.email}
                                                onClick={() => handleAddMember(member.name)}
                                                className="w-full text-left px-3 py-2 hover:bg-brand-primary/10"
                                            >
                                                {member.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mb-6 bg-base-100 p-4 rounded-xl border-2 border-base-300">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={generateWithAI} onChange={(e) => setGenerateWithAI(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            <span className="ml-3 text-sm font-bold">Generate initial tasks with AI ✨</span>
                        </label>
                         <p className="text-xs text-base-content-secondary mt-2 ml-8">Based on your project description, Gemini will create a set of relevant tasks to get you started.</p>
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={resetAndClose} disabled={isCreating} className="bg-base-300/70 hover:bg-base-300 font-bold py-2 px-6 rounded-xl transition-colors duration-300 disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isCreating} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-colors duration-300 w-40 disabled:opacity-50 disabled:cursor-not-allowed">
                           {isCreating ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
              @keyframes fade-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
              .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
              @keyframes fade-in-sm { from { opacity: 0; } to { opacity: 1; } }
              .animate-fade-in-sm { animation: fade-in-sm 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};