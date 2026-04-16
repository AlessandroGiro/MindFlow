
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types/index';

interface ProjectHeaderProps {
    project: Project;
    projects: Project[];
    onSelectProject: (project: Project) => void;
    onNewTaskClick: () => void;
    onToggleSidebar: () => void;
    viewMode: 'board' | 'documents' | 'mindmap' | 'mindsnap';
    onViewModeChange: (mode: 'board' | 'documents' | 'mindmap' | 'mindsnap') => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ 
    project, 
    projects,
    onSelectProject, 
    onNewTaskClick, 
    onToggleSidebar, 
    viewMode, 
    onViewModeChange 
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="mb-4 flex-shrink-0 relative z-50">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Left Column: Project Switcher */}
                <div className="min-w-0 flex items-center gap-3 justify-self-start relative" ref={dropdownRef}>
                    <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="group flex items-center gap-2 rounded-xl hover:bg-white/20 px-2 py-1 -ml-2 transition-colors"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold min-w-0 truncate text-left max-w-[200px] sm:max-w-md" title={project.projectName}>
                                {project.projectName}
                            </h2>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor" 
                                className={`w-6 h-6 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} opacity-50 group-hover:opacity-100`}
                            >
                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-base-100/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in p-2">
                                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
                                    {projects.map(p => (
                                        <button
                                            key={p.projectId}
                                            onClick={() => {
                                                onSelectProject(p);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex flex-col ${p.projectId === project.projectId ? 'bg-brand-primary/10 border-brand-primary/20' : 'hover:bg-white/40 dark:hover:bg-white/10'}`}
                                        >
                                            <span className={`font-bold ${p.projectId === project.projectId ? 'text-brand-primary' : ''}`}>{p.projectName}</span>
                                            <span className="text-xs text-base-content-secondary truncate">{p.projectLead}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Center Column: View Switcher */}
                <div className="flex justify-center">
                    <div className="flex-shrink-0 bg-base-200/50 p-1 rounded-xl flex gap-1 border border-base-300/50 backdrop-blur-sm shadow-sm">
                        <button 
                            onClick={() => onViewModeChange('board')}
                            className={`group relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'board' ? 'bg-white dark:bg-black/40 shadow-sm text-brand-primary' : 'text-base-content-secondary hover:text-base-content hover:bg-white/40'}`}
                            aria-label="Activity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                Activity
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </button>
                        <button 
                            onClick={() => onViewModeChange('documents')}
                            className={`group relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'documents' ? 'bg-white dark:bg-black/40 shadow-sm text-brand-primary' : 'text-base-content-secondary hover:text-base-content hover:bg-white/40'}`}
                            aria-label="DocuMind"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                DocuMind
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </button>
                        <button 
                            onClick={() => onViewModeChange('mindmap')}
                            className={`group relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'mindmap' ? 'bg-white dark:bg-black/40 shadow-sm text-brand-primary' : 'text-base-content-secondary hover:text-base-content hover:bg-white/40'}`}
                            aria-label="MindMap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.875 1.875 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0Z" /></svg>
                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                MindMap
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </button>
                        <button 
                            onClick={() => onViewModeChange('mindsnap')}
                            className={`group relative flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${viewMode === 'mindsnap' ? 'bg-white dark:bg-black/40 shadow-sm text-brand-primary' : 'text-base-content-secondary hover:text-base-content hover:bg-white/40'}`}
                            aria-label="MindSnap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                            {/* Tooltip */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                MindSnap
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Column: Empty spacer to balance grid */}
                <div className="justify-self-end"></div>
            </div>
        </header>
    );
};
