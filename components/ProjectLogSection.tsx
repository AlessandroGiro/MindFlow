
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, ProjectComment, TeamMember } from '../types/index';
import { CommentEntry } from './LogEntry';
import { ToggleSwitch } from './ToggleSwitch';
import { NewCommentForm } from './NewLogForm';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ProjectCommentSectionProps {
    comments: ProjectComment[];
    project: Project;
    currentUser: TeamMember;
    team: TeamMember[];
    onAddComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>) => Promise<ProjectComment>;
    onUpdateComment: (commentId: string, newContent: string, newTaggedUsers: string[]) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export const ProjectCommentSection: React.FC<ProjectCommentSectionProps> = ({ comments, project, currentUser, team, onAddComment, onUpdateComment, onDeleteComment, isExpanded, onToggleExpand }) => {
    const [hidePrivateComments, setHidePrivateComments] = useState(false);
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentAction, setCommentAction] = useState<{ type: 'new' | 'comment' | 'reply', target: ProjectComment | null }>({ type: 'new', target: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isMobile = useMediaQuery('(max-width: 1023px)');

    // --- Draggable FAB State ---
    const fabRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: window.innerWidth - 150, y: window.innerHeight - 80 });
    const dragInfo = useRef({
        isDragging: false,
        hasDragged: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
    });
    
    // --- Scroll-to-form state ---
    const formContainerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // --- Scroll-to-form on action ---
    useEffect(() => {
        if (isAddingComment && scrollContainerRef.current) {
            // A brief timeout ensures the element is visible after transitions before scrolling.
            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({ 
                    top: scrollContainerRef.current.scrollHeight,
                    behavior: 'smooth' 
                });
            }, 150);
        }
    }, [isAddingComment]);

    useEffect(() => {
        if (isSearchVisible) {
            searchInputRef.current?.focus();
        }
    }, [isSearchVisible]);


    const handleAddCommentClick = () => {
        setCommentAction({ type: 'new', target: null });
        setIsAddingComment(true);
    };

    const handleCommentClick = (comment: ProjectComment) => {
        setCommentAction({ type: 'comment', target: comment });
        setIsAddingComment(true);
    };
    
    const handleReplyClick = (comment: ProjectComment) => {
        setCommentAction({ type: 'reply', target: comment });
        setIsAddingComment(true);
    };

    const handleCancelComment = useCallback(() => {
        setIsAddingComment(false);
        // Use a timeout to allow closing animation to finish before clearing the target comment data
        setTimeout(() => setCommentAction({ type: 'new', target: null }), 300);
    }, []);
    
    const handleClearReplyTarget = useCallback(() => {
        setCommentAction({ type: 'new', target: null });
        formContainerRef.current?.querySelector('textarea')?.focus();
    }, []);

    const highlightElement = useCallback((elementId: string) => {
        setTimeout(() => {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('animate-pulse-once');
                setTimeout(() => {
                    if(element.classList.contains('animate-pulse-once')) {
                       element.classList.remove('animate-pulse-once');
                    }
                }, 2000);
            }
        }, 100);
    }, []);

    const handleCommentAdded = useCallback(async (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author' | 'projectId'>) => {
        let parentId = null;
        if (commentAction.target) {
            if (commentAction.type === 'reply') {
                // If replying to a reply, keep the same parent. Otherwise, parent is the comment itself.
                parentId = commentAction.target.parentId || commentAction.target.commentId;
            } else if (commentAction.type === 'comment') {
                // 'Comment' starts a new thread under a top-level comment.
                parentId = commentAction.target.commentId;
            }
        }

        const finalCommentData = {
            ...commentData,
            parentId: parentId,
            projectId: project.projectId
        };

        const newComment = await onAddComment(finalCommentData);
        handleCancelComment(); // Close form on success
        highlightElement(`comment-${newComment.commentId}`);
    }, [project.projectId, commentAction, onAddComment, handleCancelComment, highlightElement]);

    const { topLevelComments, repliesMap } = useMemo(() => {
        const projectComments = comments.filter(comment => !comment.taskId);

        const commentsToProcess = (() => {
            if (!searchTerm.trim()) {
                return projectComments;
            }

            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            
            const directMatches = new Set(
                projectComments.filter(comment => 
                    comment.author.toLowerCase().includes(lowerCaseSearchTerm) || 
                    comment.content.toLowerCase().includes(lowerCaseSearchTerm)
                ).map(comment => comment.commentId)
            );

            if (directMatches.size === 0) return [];

            const visibleTopLevelCommentIds = new Set<string>();
            const commentRepliesMap = projectComments.reduce((acc, comment) => {
                if (comment.parentId) {
                    if (!acc.has(comment.parentId)) acc.set(comment.parentId, []);
                    acc.get(comment.parentId)!.push(comment.commentId);
                }
                return acc;
            }, new Map<string, string[]>());

            for (const comment of projectComments) {
                if (!comment.parentId) { // It's a top-level comment
                    if (directMatches.has(comment.commentId)) {
                        visibleTopLevelCommentIds.add(comment.commentId);
                        continue;
                    }

                    const replies = commentRepliesMap.get(comment.commentId) || [];
                    if (replies.some(replyId => directMatches.has(replyId))) {
                        visibleTopLevelCommentIds.add(comment.commentId);
                    }
                }
            }
            
            return projectComments.filter(comment => 
                visibleTopLevelCommentIds.has(comment.commentId) || 
                (comment.parentId && visibleTopLevelCommentIds.has(comment.parentId))
            );
        })();

        const repliesMap = new Map<string, ProjectComment[]>();
        const topLevelComments: ProjectComment[] = [];

        commentsToProcess.forEach(comment => {
            if (comment.parentId) {
                if (!repliesMap.has(comment.parentId)) {
                    repliesMap.set(comment.parentId, []);
                }
                repliesMap.get(comment.parentId)!.unshift(comment);
            } else {
                topLevelComments.push(comment);
            }
        });

        return { topLevelComments, repliesMap };
    }, [comments, searchTerm]);
    
    // --- Draggable FAB Handlers ---
    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!dragInfo.current.isDragging) return;

        const deltaX = e.clientX - dragInfo.current.startX;
        const deltaY = e.clientY - dragInfo.current.startY;

        if (!dragInfo.current.hasDragged && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            dragInfo.current.hasDragged = true;
        }

        let newX = dragInfo.current.initialX + deltaX;
        let newY = dragInfo.current.initialY + deltaY;

        const fabWidth = fabRef.current?.offsetWidth || 80;
        const fabHeight = fabRef.current?.offsetHeight || 56;
        const margin = 16;
        newX = Math.max(margin, Math.min(newX, window.innerWidth - fabWidth - margin));
        newY = Math.max(margin, Math.min(newY, window.innerHeight - fabHeight - margin));

        setPosition({ x: newX, y: newY });
    }, []);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        if (!dragInfo.current.hasDragged) {
            onToggleExpand(); // This is a click
        }
        dragInfo.current.isDragging = false;
        dragInfo.current.hasDragged = false;
        
        fabRef.current?.releasePointerCapture(e.pointerId);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    }, [onToggleExpand, handlePointerMove]);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        fabRef.current?.setPointerCapture(e.pointerId);
        dragInfo.current = {
            isDragging: true,
            hasDragged: false,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [position.x, position.y, handlePointerMove, handlePointerUp]);

    
    if (isMobile) {
        return (
            <>
                {/* Draggable Floating Action Button */}
                <button
                    ref={fabRef}
                    onPointerDown={handlePointerDown}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        touchAction: 'none',
                    }}
                    className={`fixed top-0 left-0 z-40 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ease-in-out h-14 px-5 ${isExpanded ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
                    aria-label="Open comments"
                >
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M2 5.25A3.25 3.25 0 0 1 5.25 2h9.5A3.25 3.25 0 0 1 18 5.25v5.5A3.25 3.25 0 0 1 14.75 14h-2.52l-2.09 2.09a.75.75 0 0 1-1.06 0L7.02 14H5.25A3.25 3.25 0 0 1 2 10.75v-5.5ZM5.25 3.5a1.75 1.75 0 0 0-1.75 1.75v5.5c0 .966.784 1.75 1.75 1.75h2.25a.75.75 0 0 1 .53.22l1.3 1.29a.75.75 0 0 0 1.06 0l1.3-1.29a.75.75 0 0 1 .53-.22h2.25a1.75 1.75 0 0 0 1.75-1.75v-5.5a1.75 1.75 0 0 0-1.75-1.75h-9.5Z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 font-bold whitespace-nowrap">Comments</span>
                    </>
                </button>

                {/* Full-Screen Comments Modal */}
                <div
                    className={`fixed inset-0 bg-base-100 z-50 transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                    {isExpanded && (
                        <div className="h-full w-full flex flex-col">
                            {/* Main scrollable content area */}
                            <div 
                                ref={scrollContainerRef}
                                className="flex-grow overflow-y-auto overflow-x-hidden p-4"
                            >
                                {/* Sticky header with controls - adapted for modal */}
                                <div 
                                    className={`sticky top-0 z-10 bg-base-100/80 dark:bg-zinc-900/80 backdrop-blur-lg -mx-4 -mt-4 mb-4`}
                                >
                                     <div className="flex justify-between items-center gap-1 p-4 border-b border-base-300">
                                        <button onClick={onToggleExpand} className="p-2 -ml-2 rounded-full hover:bg-base-300 flex-shrink-0" aria-label="Close comments">
                                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                           </svg>
                                        </button>

                                        <h3 className="text-base font-bold whitespace-nowrap">Comments</h3>
                                        
                                        <div className="flex items-center gap-1.5 ml-auto min-w-0">
                                           <div className={`flex items-center gap-1 transition-all duration-300 ${isSearchVisible ? 'w-24' : 'w-auto'}`}>
                                                {isSearchVisible ? (
                                                    <div className="relative w-full">
                                                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-content-secondary"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
                                                        </div>
                                                        <input
                                                            ref={searchInputRef}
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            onBlur={() => { if (!searchTerm) setIsSearchVisible(false); }}
                                                            placeholder="Search..."
                                                            className="w-full bg-base-200 dark:bg-zinc-800 border-2 border-base-300 rounded-xl py-2 pl-8 pr-2 focus:outline-none focus:border-brand-primary transition-colors duration-200 text-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setIsSearchVisible(true)} className="p-2 rounded-full hover:bg-base-300" aria-label="Search comments">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-content-secondary"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <ToggleSwitch
                                                    id="private-log-toggle"
                                                    checked={hidePrivateComments}
                                                    onChange={(isChecked) => setHidePrivateComments(isChecked)}
                                                />
                                            </div>
                                            {!isAddingComment && (
                                                <button onClick={handleAddCommentClick} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold p-2 rounded-xl shadow-sm transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-1.5 flex-shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Comment List */}
                                <div className="space-y-4">
                                    {topLevelComments.map(comment => <CommentEntry key={comment.commentId} comment={comment} currentUser={currentUser} isPrivateCollapsed={hidePrivateComments} replies={repliesMap.get(comment.commentId) || []} onComment={handleCommentClick} onReply={handleReplyClick} allComments={comments} team={team} onUpdateComment={onUpdateComment} onDeleteComment={onDeleteComment}/>)}
                                </div>
                                {comments.length > 0 && topLevelComments.length === 0 && searchTerm && (
                                    <div className="text-center py-12 text-base-content-secondary">
                                        <h4 className="text-lg font-bold">No Matching Comments Found</h4>
                                        <p>Try a different search term.</p>
                                    </div>
                                )}
                                {comments.length === 0 && (
                                    <div className="text-center py-12 text-base-content-secondary">
                                        <h4 className="text-lg font-bold">No Comments Yet</h4>
                                        <p>Be the first to add a comment for this project.</p>
                                    </div>
                                )}
                            </div>
                            {/* New comment form, docks to bottom */}
                            <div
                                ref={formContainerRef}
                                className={`flex-shrink-0 bg-base-100 border-t border-base-300 transition-all duration-300 ease-in-out ${isAddingComment ? 'max-h-[500px] opacity-100 p-2 pt-0' : 'max-h-0 opacity-0 !p-0 !border-0 overflow-hidden'}`}
                            >
                                {isAddingComment && (
                                    <NewCommentForm 
                                        currentUser={currentUser} 
                                        team={team} 
                                        onAddComment={handleCommentAdded} 
                                        onCancel={handleCancelComment} 
                                        onCancelReply={handleClearReplyTarget}
                                        actionTargetComment={commentAction.target} 
                                        actionType={commentAction.type} 
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }

    // --- DESKTOP VIEW ---
    // Updated container styling to match Kanban Column glassmorphism EXACTLY
    return (
        <div className="relative bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/5 rounded-3xl shadow-lg flex flex-col h-full overflow-hidden">
            {/* Header - Outside scroll container to sit flush top without gap */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0 border-b border-white/20 bg-white/10 backdrop-blur-sm z-10">
                <h3 className="text-lg font-extrabold tracking-tight whitespace-nowrap">Activity</h3>
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search and Filter controls */}
                    <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchVisible ? 'w-48' : 'w-auto'}`}>
                        {isSearchVisible ? (
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-base-content-secondary"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onBlur={() => { if (!searchTerm) setIsSearchVisible(false); }}
                                    placeholder="Search..."
                                    className="w-full bg-white/50 dark:bg-black/30 border border-white/20 rounded-xl py-1.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-colors duration-200 text-sm"
                                />
                            </div>
                        ) : (
                            <button onClick={() => setIsSearchVisible(true)} className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10" aria-label="Search comments">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-base-content-secondary"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0 -11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="private-log-toggle" className="text-xs font-bold text-base-content-secondary cursor-pointer select-none uppercase tracking-wide">Private</label>
                        <ToggleSwitch
                            id="private-log-toggle"
                            checked={hidePrivateComments}
                            onChange={(isChecked) => setHidePrivateComments(isChecked)}
                        />
                    </div>
                    {!isAddingComment && (
                        <button onClick={handleAddCommentClick} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                            <span className="hidden sm:inline">Add</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                {/* Main scrollable content area */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-grow overflow-y-auto overflow-x-hidden p-4 custom-scrollbar"
                >
                    {/* Comment List */}
                    <div className="space-y-3">
                        {topLevelComments.map(comment => <CommentEntry key={comment.commentId} comment={comment} currentUser={currentUser} isPrivateCollapsed={hidePrivateComments} replies={repliesMap.get(comment.commentId) || []} onComment={handleCommentClick} onReply={handleReplyClick} allComments={comments} team={team} onUpdateComment={onUpdateComment} onDeleteComment={onDeleteComment} />)}
                    </div>
                    {comments.length > 0 && topLevelComments.length === 0 && searchTerm && (
                        <div className="text-center py-12 text-base-content-secondary">
                            <h4 className="text-lg font-bold">No Matching Comments Found</h4>
                            <p>Try a different search term.</p>
                        </div>
                    )}
                    {comments.length === 0 && (
                        <div className="text-center py-12 text-base-content-secondary">
                            <h4 className="text-lg font-bold">No Comments Yet</h4>
                            <p>Be the first to add a comment for this project.</p>
                        </div>
                    )}
                </div>

                {/* New comment form, absolutely positioned within this container */}
                <div ref={formContainerRef} className={`flex-shrink-0 border-t border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-md transition-all duration-300 ease-in-out ${isAddingComment ? 'max-h-[500px] opacity-100 p-4' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                    <NewCommentForm 
                        currentUser={currentUser} 
                        team={team} 
                        onAddComment={handleCommentAdded} 
                        onCancel={handleCancelComment} 
                        onCancelReply={handleClearReplyTarget}
                        actionTargetComment={commentAction.target} 
                        actionType={commentAction.type} />
                </div>
            </div>
        </div>
    );
};
