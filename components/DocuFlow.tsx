
import React, { useState, useEffect, useRef } from 'react';
import { Project, TeamMember, ProjectComment } from '../types/index';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ProjectHeader } from './Header';

interface DocuFlowProps {
    project: Project;
    projects?: Project[];
    currentUser: TeamMember;
    team: TeamMember[];
    viewMode: 'board' | 'documents' | 'mindmap' | 'mindsnap';
    onViewModeChange: (mode: 'board' | 'documents' | 'mindmap' | 'mindsnap') => void;
    onSelectProject?: (project: Project) => void;
    onAddComment?: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>) => Promise<ProjectComment>;
    onToggleSidebar?: () => void;
}

interface DocComment {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    quotedText: string;
    highlightId: string; // ID of the span in the HTML
    isDraft?: boolean;
}

interface PageData {
    id: string;
    content: string;
}

// --- Sub-component: Mention Popup ---
const MentionPopup: React.FC<{ 
    isOpen: boolean, 
    position: { top: number, left: number }, 
    users: TeamMember[], 
    onSelect: (user: TeamMember) => void,
    activeIndex: number
}> = ({ isOpen, position, users, onSelect, activeIndex }) => {
    if (!isOpen || users.length === 0) return null;

    return (
        <div 
            style={{ top: position.top, left: position.left }}
            className="fixed z-[60] w-64 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-base-300 rounded-xl shadow-xl flex flex-col animate-fade-in-sm"
        >
            {users.map((user, index) => (
                <button
                    key={user.email}
                    onClick={(e) => { e.preventDefault(); onSelect(user); }}
                    className={`flex items-center gap-3 p-2.5 text-left transition-colors ${index === activeIndex ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-base-200 dark:hover:bg-white/5'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold text-base-content-secondary">
                        {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium truncate">{user.name}</span>
                </button>
            ))}
            <style>{`
                @keyframes fade-in-sm { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-sm { animation: fade-in-sm 0.1s ease-out forwards; }
            `}</style>
        </div>
    );
};

// --- Sub-component: Sidebar Comment Input ---
const SidebarCommentInput: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    team: TeamMember[];
    placeholder?: string;
    autoFocus?: boolean;
}> = ({ value, onChange, onKeyDown, team, placeholder, autoFocus }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <div className="relative w-full group">
            <textarea
                ref={textareaRef}
                className="relative z-10 w-full text-sm p-2 bg-transparent rounded-lg focus:outline-none resize-none mb-2 font-sans text-base-content caret-brand-primary border border-base-300 focus:border-brand-primary transition-colors leading-normal"
                rows={3}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                spellCheck={false}
            />
        </div>
    );
};


export const DocuFlow: React.FC<DocuFlowProps> = ({ project, projects = [], currentUser, team, viewMode, onViewModeChange, onAddComment, onSelectProject = () => {}, onToggleSidebar = () => {} }) => {
    // --- Initial Data ---
    const initialHtml = `
        <h1 class="font-montserrat">${project.projectName}</h1>
        <p><strong>Overview</strong></p>
        <p>This document outlines the core objectives and deliverables for the ${project.projectName}. Our primary goal is to ensure a seamless execution of all tasks while maintaining high quality standards.</p>
        <h2>Scope of Work</h2>
        <p>The project is divided into three main phases:</p>
        <ul>
            <li><strong>Phase 1:</strong> Research and Discovery. Led by <span class="text-brand-primary bg-brand-primary/10 rounded px-1 font-medium mx-0.5 select-none" contenteditable="false">@${team[0]?.name || 'Team Lead'}</span>.</li>
            <li><strong>Phase 2:</strong> Development and Implementation.</li>
            <li><strong>Phase 3:</strong> Testing and Deployment.</li>
        </ul>
        <h2>Timeline & Milestones</h2>
        <p>We are targeting a Q4 launch. Critical milestones include the <span id="highlight-initial-1" class="bg-brand-secondary/50 text-brand-primary rounded-md cursor-pointer doc-highlight border-b-2 border-brand-primary">Alpha Release</span> scheduled for mid-October.</p>
        <p><br/></p>
        <p>We need to ensure all stakeholders are aligned.</p>
        <p><br/></p>
    `;

    const [pages, setPages] = useState<PageData[]>([{ id: 'page-1', content: initialHtml }]);
    const [comments, setComments] = useState<DocComment[]>([
        {
            id: 'comment-initial-1',
            author: team.length > 1 ? team[1].name : 'System',
            content: `Is this date firm? We might need more time for QA. @${currentUser.name}`,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            quotedText: "Alpha Release",
            highlightId: 'highlight-initial-1',
            isDraft: false
        }
    ]);

    const [outline, setOutline] = useState<{ id: string, text: string, level: number }[]>([]);
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false); 
    
    const [selectionRange, setSelectionRange] = useState<Range | null>(null);
    const [floatingBtnPos, setFloatingBtnPos] = useState<{ top: number, left: number } | null>(null);
    
    // --- Mention State ---
    const [mentionMenu, setMentionMenu] = useState<{
        isOpen: boolean;
        top: number;
        left: number;
        query: string;
        target: 'canvas' | 'comment';
        commentId?: string; 
    }>({ isOpen: false, top: 0, left: 0, query: '', target: 'canvas' });
    const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
    const canvasRangeRef = useRef<Range | null>(null); 

    const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
    const isMobile = useMediaQuery('(max-width: 1023px)');

    // --- Initialization ---
    useEffect(() => {
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;700&family=Inter:wght@300;400;600&family=Montserrat:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Raleway:wght@300;400;600&family=Roboto+Mono:wght@400;600&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, []);

    useEffect(() => {
        parseOutline();
    }, [pages]);

    // --- Outline Parser (Scans all pages) ---
    const parseOutline = () => {
        const newOutline: { id: string, text: string, level: number }[] = [];
        
        editorRefs.current.forEach((editor) => {
            if (!editor) return;
            const headers = editor.querySelectorAll('h1, h2');
            headers.forEach((header, index) => {
                if (!header.id) header.id = `doc-header-${Math.random().toString(36).substr(2, 9)}`;
                newOutline.push({
                    id: header.id,
                    text: header.textContent || 'Untitled Section',
                    level: parseInt(header.tagName.substring(1))
                });
            });
        });
        setOutline(newOutline);
    };

    // --- Input Handler & Auto-Paging Logic ---
    const handlePageInput = (pageIndex: number) => {
        const editor = editorRefs.current[pageIndex];
        if (!editor) return;

        // Update content in state
        const newContent = editor.innerHTML;
        setPages(prev => prev.map((p, idx) => idx === pageIndex ? { ...p, content: newContent } : p));
        
        // Check for overflow.
        if (editor.scrollHeight > editor.clientHeight) {
             if (pageIndex === pages.length - 1) {
                 addNewPage();
             }
        }
    };

    const addNewPage = () => {
        setPages(prev => [...prev, { id: `page-${Date.now()}`, content: '<p><br/></p>' }]);
    };

    // --- Mentions Logic ---
    const filteredUsers = team.filter(u => 
        u.name.toLowerCase().startsWith(mentionMenu.query.toLowerCase()) && u.email !== currentUser.email
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionMenu.isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionActiveIndex(prev => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionActiveIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (filteredUsers.length > 0) {
                    handleMentionSelect(filteredUsers[mentionActiveIndex]);
                } else {
                    closeMentionMenu();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeMentionMenu();
            }
        }
    };

    const closeMentionMenu = () => {
        setMentionMenu(prev => ({ ...prev, isOpen: false }));
        setMentionActiveIndex(0);
    };

    // Canvas Mention Trigger
    const handleCanvasKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
            closeMentionMenu();
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
            const textContent = textNode.textContent || '';
            const cursorPos = range.startOffset;
            const textBeforeCursor = textContent.slice(0, cursorPos);
            const atIndex = textBeforeCursor.lastIndexOf('@');
            
            if (atIndex !== -1) {
                const charBeforeAt = atIndex > 0 ? textContent[atIndex - 1] : ' ';
                if (charBeforeAt === ' ' || charBeforeAt === '\u00A0' || charBeforeAt === '\n') {
                    const query = textContent.slice(atIndex + 1, cursorPos);
                    const matchesAnyUser = team.some(u => u.name.toLowerCase().startsWith(query.toLowerCase()));

                    if (matchesAnyUser) {
                        const rect = range.getBoundingClientRect();
                        canvasRangeRef.current = range.cloneRange();
                        
                        setMentionMenu({
                            isOpen: true,
                            top: rect.bottom + 5, 
                            left: rect.left,
                            query: query,
                            target: 'canvas'
                        });
                        return;
                    }
                }
            }
        }
        
        if (mentionMenu.isOpen) {
            closeMentionMenu();
        }
    };

    const handleMentionSelect = (user: TeamMember) => {
        if (mentionMenu.target === 'canvas') {
            const range = canvasRangeRef.current;
            if (!range) return;
            
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            
            const textNode = range.startContainer;
            const textContent = textNode.textContent || '';
            const atIndex = textContent.lastIndexOf('@', range.startOffset - 1);
            
            if (atIndex !== -1) {
                range.setStart(textNode, atIndex);
                range.deleteContents();
                
                const span = document.createElement('span');
                span.className = 'text-brand-primary bg-brand-primary/10 rounded px-1 font-medium mx-0.5 select-none';
                span.contentEditable = 'false';
                span.textContent = `@${user.name}`;
                
                range.insertNode(span);
                range.setStartAfter(span);
                range.setEndAfter(span);
                
                const space = document.createTextNode('\u00A0');
                range.insertNode(space);
                range.setStartAfter(space);
                range.setEndAfter(space);
                
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
        }
        closeMentionMenu();
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
    };

    const handleHeading = (tag: string) => execCmd('formatBlock', tag);

    // --- Commenting System ---
    const handleSelectionChange = () => {
        const selection = window.getSelection();
        // Check if selection is inside ANY editor ref
        const isInsideEditor = editorRefs.current.some(ref => ref && selection?.anchorNode && ref.contains(selection.anchorNode));

        if (selection && !selection.isCollapsed && isInsideEditor) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setFloatingBtnPos({
                top: rect.top - 50, 
                left: rect.left + (rect.width / 2) - 20 
            });
            setSelectionRange(range.cloneRange());
        } else {
            setFloatingBtnPos(null);
        }
    };

    const initializeComment = () => {
        if (!selectionRange) return;

        const highlightId = `highlight-${Date.now()}`;
        const span = document.createElement('span');
        span.className = "bg-brand-secondary/50 text-brand-primary rounded-md cursor-pointer doc-highlight border-b-2 border-brand-primary";
        span.id = highlightId;
        
        try {
            selectionRange.surroundContents(span);
            window.getSelection()?.removeAllRanges();
            setFloatingBtnPos(null);
            setSelectionRange(null);
            setShowRightSidebar(true);

            const newDraft: DocComment = {
                id: `comment-${Date.now()}`,
                author: currentUser.name,
                content: '',
                timestamp: new Date().toISOString(),
                quotedText: span.textContent || '',
                highlightId: highlightId,
                isDraft: true
            };
            setComments(prev => [newDraft, ...prev]);
        } catch (e) {
            console.error("Could not wrap selection", e);
            alert("Complex selections across blocks are not supported yet.");
        }
    };

    const saveComment = async (commentId: string, content: string) => {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content, isDraft: false } : c));
        if (onAddComment) {
            const commentRef = comments.find(c => c.id === commentId);
            if (commentRef) {
                await onAddComment({
                    content: `[DOC_QUOTE: "${commentRef.quotedText}"] ${content}`,
                    visibility: 'Public',
                    taggedUsers: [],
                    parentId: null,
                    projectId: project.projectId
                });
            }
        }
    };

    const cancelDraft = (commentId: string, highlightId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    const scrollToHighlight = (highlightId: string) => {
        const el = document.getElementById(highlightId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.classList.add('ring-2', 'ring-brand-primary');
        setTimeout(() => el?.classList.remove('ring-2', 'ring-brand-primary'), 2000);
    };

    return (
        <div className="h-full w-full p-4 md:p-6 flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                #doc-container {
                    --heading-color: #111827;
                }
                .dark #doc-container {
                    --heading-color: #f3f4f6;
                }
                .doc-page h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; color: var(--heading-color); line-height: 1.2; }
                .doc-page h2 { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: var(--heading-color); }
                .doc-page p { font-size: 1.125rem; margin-bottom: 1rem; line-height: 1.6; }
                .doc-page ul { margin-bottom: 1rem; padding-left: 1.5rem; list-style-type: disc; }
                
                .doc-page {
                    background-color: white;
                    width: 210mm; /* A4 Width */
                    height: 297mm; /* A4 Height */
                    padding: 25.4mm; /* 1 inch margins */
                    margin-bottom: 2rem; /* Spacing between pages */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    overflow: hidden; /* Enforce boundary */
                    position: relative;
                    flex-shrink: 0; /* Don't shrink */
                }
                .dark .doc-page {
                     background-color: #18181b; /* zinc-900 */
                     box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
            `}</style>
            
            <MentionPopup 
                isOpen={mentionMenu.isOpen} 
                position={{ top: mentionMenu.top, left: mentionMenu.left }} 
                users={filteredUsers} 
                onSelect={handleMentionSelect}
                activeIndex={mentionActiveIndex}
            />

            {/* Replaced internal header with ProjectHeader for consistency */}
            <div className="w-full mb-8 flex-shrink-0">
                <ProjectHeader 
                    project={project}
                    projects={projects}
                    onSelectProject={onSelectProject}
                    onNewTaskClick={() => {}}
                    onToggleSidebar={onToggleSidebar}
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                />
            </div>

            {/* Main App Window - Glassmorphism */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl w-full flex-grow flex-shrink min-h-0 max-w-[1800px] rounded-[2.5rem] shadow-2xl flex overflow-hidden relative border border-white/20 dark:border-white/5" id="doc-container">
                
                {/* Main Layout */}
                <div className="flex h-full w-full relative">
                    
                    {/* Left Sidebar: Outline */}
                    <aside className={`${showLeftSidebar ? 'w-64 opacity-100 ml-0' : 'w-0 opacity-0 -ml-4'} transition-all duration-300 ease-in-out flex-shrink-0 bg-white/20 dark:bg-black/20 border-r border-white/10 overflow-hidden flex flex-col backdrop-blur-sm`}>
                        <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
                            <h3 className="text-xs font-bold text-base-content-secondary uppercase tracking-wider">Outline</h3>
                             <button onClick={() => setShowLeftSidebar(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-base-content-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 pt-2">
                            <ul className="space-y-2">
                                {outline.map((item, idx) => (
                                    <li key={idx} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                                        <a href={`#${item.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(item.id)?.scrollIntoView({behavior:'smooth'}); }} className="text-sm text-base-content/70 hover:text-brand-primary block py-1 truncate transition-colors">
                                            {item.text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Center: Editor Canvas Area - Lowered canvas by increasing padding-top */}
                    <main className="flex-grow overflow-y-auto relative bg-gray-100 dark:bg-base-300/30 scroll-smooth flex flex-col items-center pt-24">
                        
                        {/* Sticky Sidebar Triggers */}
                        <div className="sticky top-6 z-30 w-full px-6 flex justify-between pointer-events-none mb-[-3rem]">
                             <div className="pointer-events-auto">
                                {!showLeftSidebar && (
                                    <button onClick={() => setShowLeftSidebar(true)} className="p-2 bg-white/80 dark:bg-black/80 rounded-xl shadow-md border border-white/10 text-base-content-secondary hover:text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                             </div>
                             <div className="pointer-events-auto">
                                {!showRightSidebar && (
                                     <button onClick={() => setShowRightSidebar(true)} className="p-2 bg-white/80 dark:bg-black/80 rounded-xl shadow-md border border-white/10 text-base-content-secondary hover:text-brand-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M3.75 2A1.75 1.75 0 0 0 2 3.75v12.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 16.25V3.75A1.75 1.75 0 0 0 16.25 2H3.75Zm6.58 6.142a.75.75 0 0 1 .778-1.233 2.75 2.75 0 0 1 1.278 3.273.75.75 0 0 1-1.412-.51 1.25 1.25 0 0 0-.582-1.488.75.75 0 0 1-.062-.042Zm-2.728 1.22a.75.75 0 1 1 1.06 1.06l-.94 1.41h.94a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.623-1.17l1.437-2.156a.75.75 0 0 1 .626-.644ZM6.25 6.5a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Zm0 6.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                             </div>
                        </div>

                        {/* Toolbar */}
                        <div className="sticky top-6 z-20 mb-8 px-4">
                            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-xl rounded-full px-4 py-2 flex items-center gap-1 border border-white/20 overflow-x-auto max-w-[95vw] no-scrollbar">
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => execCmd('bold')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-bold text-base-content">B</button>
                                    <button onClick={() => execCmd('italic')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 italic text-base-content">I</button>
                                </div>
                                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                                <div className="flex items-center gap-2">
                                     <select onChange={(e) => handleHeading(e.target.value)} className="bg-transparent text-sm font-bold focus:outline-none w-24 text-base-content cursor-pointer">
                                        <option value="p">Normal</option>
                                        <option value="h1">Heading 1</option>
                                        <option value="h2">Heading 2</option>
                                    </select>
                                </div>
                                <div className="flex-grow"></div>
                                <button onClick={addNewPage} className="bg-brand-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-brand-primary/80">
                                    Add Page
                                </button>
                            </div>
                        </div>

                        {/* Pages Rendered as Stack of Sheets */}
                        <div className="flex flex-col gap-8 mb-24 items-center w-full">
                            {pages.map((page, index) => (
                                <div 
                                    key={page.id}
                                    ref={el => { editorRefs.current[index] = el; }}
                                    className="doc-page text-gray-900 font-['Montserrat'] text-lg leading-relaxed outline-none"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={() => handlePageInput(index)}
                                    onSelect={handleSelectionChange}
                                    onKeyUp={handleCanvasKeyUp}
                                    onKeyDown={handleKeyDown}
                                    spellCheck={false}
                                    dangerouslySetInnerHTML={{ __html: page.content }}
                                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                                ></div>
                            ))}
                        </div>

                        {/* Floating Comment Button */}
                        {floatingBtnPos && (
                            <button 
                                style={{ top: floatingBtnPos.top, left: floatingBtnPos.left }}
                                className="fixed z-50 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce-in hover:scale-105 transition-transform"
                                onClick={initializeComment}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.43 2.524A41.28 41.28 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902a41.102 41.102 0 0 1-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 0 1-1.322 0l-1.712-3.293a.75.75 0 0 0-.643-.413 41.108 41.108 0 0 1-3.55-.414C1.993 12.575 1 11.316 1 9.903V4.75c0-1.413.993-2.67 2.43-2.902Z" clipRule="evenodd" /></svg>
                                <span className="text-xs font-bold">Comment</span>
                            </button>
                        )}
                    </main>

                    {/* Right Sidebar: Comments */}
                    <aside className={`${showRightSidebar ? 'w-80 opacity-100 mr-0' : 'w-0 opacity-0 -mr-4'} transition-all duration-300 ease-in-out flex-shrink-0 bg-white/20 dark:bg-black/20 border-l border-white/10 overflow-hidden flex flex-col backdrop-blur-sm`}>
                        <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
                             <button onClick={() => setShowRightSidebar(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-base-content-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                            </button>
                            <h3 className="text-xs font-bold text-base-content-secondary uppercase tracking-wider">Comments</h3>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 pt-2">
                             <div className="space-y-4">
                                {comments.map(comment => (
                                    <div 
                                        key={comment.id} 
                                        id={`card-${comment.id}`}
                                        onClick={() => scrollToHighlight(comment.highlightId)}
                                        className={`bg-white dark:bg-base-100 p-4 rounded-xl shadow-sm border border-base-200 cursor-pointer transition-all hover:shadow-md ${comment.isDraft ? 'ring-2 ring-brand-primary' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-xs font-bold">
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold">{comment.author}</span>
                                            </div>
                                            <span className="text-[10px] text-base-content-secondary">{new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        
                                        <div className="pl-2 border-l-2 border-brand-primary/50 mb-2 text-xs text-base-content-secondary italic truncate">
                                            "{comment.quotedText}"
                                        </div>

                                        {comment.isDraft ? (
                                            <div className="mt-2">
                                                <SidebarCommentInput
                                                    value={comment.content}
                                                    onChange={(e) => setComments(prev => prev.map(c => c.id === comment.id ? { ...c, content: e.target.value } : c))}
                                                    team={team}
                                                    placeholder="Type your comment... (Type @ to mention)"
                                                    autoFocus={true}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={(e) => { e.stopPropagation(); cancelDraft(comment.id, comment.highlightId); }} className="text-xs font-bold text-base-content-secondary hover:text-base-content px-2 py-1">Cancel</button>
                                                    <button onClick={(e) => { e.stopPropagation(); saveComment(comment.id, comment.content); }} className="text-xs font-bold bg-brand-primary text-white px-3 py-1 rounded-lg shadow-sm">Post</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-base-content font-sans whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                                __html: comment.content.replace(/@(\w+(?: \w+)?)/g, '<span class="bg-blue-200 dark:bg-blue-800/50 text-brand-primary rounded-sm font-medium px-0.5">@$1</span>')
                                            }} />
                                        )}
                                    </div>
                                ))}
                             </div>
                        </div>
                    </aside>
                </div>
            </div>
            <style>{`
                @keyframes bounce-in {
                    0% { opacity: 0; transform: scale(0.9) translateY(5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-bounce-in { animation: bounce-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
        </div>
    );
};
