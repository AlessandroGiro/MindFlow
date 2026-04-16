

// FIX: Corrected a typo in the React import statement. The extra 'a' was causing a syntax error and preventing hooks from being imported.
import React, { useMemo, useState, useRef, useEffect } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { ProjectComment, TeamMember } from '../types/index';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ConfirmationModal } from './ConfirmationModal';

interface CommentEntryProps {
    comment: ProjectComment;
    currentUser: TeamMember;
    isPrivateCollapsed: boolean;
    replies: ProjectComment[];
    onComment: (comment: ProjectComment) => void;
    onReply: (comment: ProjectComment) => void;
    onUpdateComment: (commentId: string, newContent: string, newTaggedUsers: string[]) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    allComments: ProjectComment[];
    team: TeamMember[];
}

const UserAvatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center font-bold text-base-content border border-white/10">
        {name.charAt(0)}
    </div>
);

const AIAvatar: React.FC = () => (
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold shadow-md">
        AI
    </div>
);

const VisibilityIcon: React.FC<{ visibility: 'Public' | 'Private', isMobile: boolean }> = ({ visibility, isMobile }) => {
    if (visibility === 'Private') {
        return (
            <div className="flex items-center gap-1 text-xs text-base-content-secondary" title="Visible only to you">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1Zm2 3.5V6H6V4.5a2 2 0 1 1 4 0Z" clipRule="evenodd" /></svg>
                {!isMobile && <span>Private</span>}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 text-xs text-base-content-secondary" title="Visible to everyone in the project">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z" /><path d="M8 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm-4.5-5.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" /></svg>
            {!isMobile && <span>Public</span>}
        </div>
    );
};

export const CommentEntry: React.FC<CommentEntryProps> = ({ comment, currentUser, isPrivateCollapsed, replies, onComment, onReply, onUpdateComment, onDeleteComment, allComments, team }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMobile = useMediaQuery('(max-width: 1023px)');

    const isAIComment = comment.author === 'AI Assistant';
    const isVisible = comment.visibility === 'Public' || comment.author === currentUser.name;

    if (!isVisible) {
        return null;
    }

    const isPrivate = comment.visibility === 'Private';
    
    const formattedDate = new Date(comment.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const replyRegex = /^\[REPLY_TO:((?:COMMENT|TEMP)-[\w.-]+)\](.*)/s;
    const match = comment.content.match(replyRegex);

    let originalComment: ProjectComment | undefined;
    let actualContent = comment.content;

    if (match && allComments) {
        const originalCommentId = match[1];
        actualContent = match[2].trim();
        originalComment = allComments.find(l => l.commentId === originalCommentId);
    }
    
    const handleOriginalCommentClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (originalComment) {
            const element = document.getElementById(`comment-${originalComment.commentId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('animate-pulse-once');
                setTimeout(() => {
                    if(element.classList.contains('animate-pulse-once')) {
                       element.classList.remove('animate-pulse-once');
                    }
                }, 2000);
            }
        }
    };

    const highlightedContent = useMemo(() => {
        const formatToHtml = (markdownText: string): string => {
            if (!markdownText) return '';

            let html = markdownText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            
            // Temporarily replace list blocks to protect them from paragraph processing
            const listPlaceholders = new Map<string, string>();
            const placeholder = (type: string) => `__COMMENT_PLACEHOLDER_${type}_${listPlaceholders.size}__`;

            // Unordered lists (* or -)
            html = html.replace(/^(?:[\s\t]*)([-*] .*(?:\n|$))+/gm, (match) => {
                const items = match.trim().split('\n').map(item => `<li>${item.replace(/^[-*]\s*/, '')}</li>`).join('');
                const listHtml = `<ul>${items}</ul>`;
                const key = placeholder('UL');
                listPlaceholders.set(key, listHtml);
                return key;
            });

            // Ordered lists
            html = html.replace(/^(?:[\s\t]*)(\d+\. .*(?:\n|$))+/gm, (match) => {
                const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\d+\.\s*/, '')}</li>`).join('');
                const listHtml = `<ol>${items}</ul>`;
                const key = placeholder('OL');
                listPlaceholders.set(key, listHtml);
                return key;
            });

            // Process paragraphs and remaining headings
            html = html.split(/\n\s*\n/).map(block => {
                const trimmedBlock = block.trim();
                if (trimmedBlock === '') return '';
                if (trimmedBlock.match(/^__COMMENT_PLACEHOLDER_/)) return trimmedBlock;
                if (trimmedBlock.startsWith('### ')) return `<h3>${trimmedBlock.substring(4)}</h3>`;
                if (trimmedBlock.startsWith('## ')) return `<h2>${trimmedBlock.substring(3)}</h2>`;
                if (trimmedBlock.startsWith('# ')) return `<h1>${trimmedBlock.substring(2)}</h1>`;
                
                return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
            }).join('');

            // Restore lists
            listPlaceholders.forEach((listHtml, key) => {
                html = html.replace(key, listHtml);
            });

            // Now, process all inline elements
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/_(.*?)_/g, '<em>$1</em>');

            return html;
        };
        
        let processedHtml = formatToHtml(actualContent);

        if (comment.visibility === 'Public' && team && team.length > 0 && !isAIComment) {
            const sortedTeamNames = [...team]
                .map(m => m.name)
                .sort((a, b) => b.length - a.length);

            const namesRegex = sortedTeamNames
                .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // escape special regex chars
                .join('|');
            
            const regex = new RegExp(`@(${namesRegex})\\b`, 'g');

            processedHtml = processedHtml.replace(regex, (match) => {
                return `<span class="bg-blue-200 dark:bg-blue-800/50 rounded-sm font-medium px-1">${match}</span>`;
            });
        }

        return { __html: processedHtml };
    }, [actualContent, team, comment.visibility, isAIComment]);

    const handleEditClick = () => {
        setEditedContent(actualContent);
        setIsEditing(true);
    };
    
    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        await onDeleteComment(comment.commentId);
        setIsDeleteModalOpen(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        const newContent = editedContent.trim();
        if (!newContent) return;

        const sortedTeamNames = [...team].map(m => m.name).sort((a, b) => b.length - a.length);
        const newTaggedUsers: string[] = [];
        if (sortedTeamNames.length > 0 && comment.visibility === 'Public') {
            const namesRegex = sortedTeamNames
                .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                .join('|');
            const regex = new RegExp(`@(${namesRegex})\\b`, 'g');
            const matches = editedContent.matchAll(regex);
            for (const match of matches) {
                newTaggedUsers.push(match[1]);
            }
        }
        
        const finalContent = match ? `[REPLY_TO:${match[1]}] ${newContent}` : newContent;
        
        await onUpdateComment(comment.commentId, finalContent, [...new Set(newTaggedUsers)]);
        setIsEditing(false);
    };
    
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.focus();
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [isEditing]);
    
    const actions = [];
    if (comment.author === currentUser.name) {
        actions.push(<button key="edit" onClick={handleEditClick} className="text-xs font-bold text-brand-primary hover:underline">Edit</button>);
        actions.push(<button key="delete" onClick={handleDeleteClick} className="text-xs font-bold text-red-500 hover:underline">Delete</button>);
    }
    if (!isAIComment && comment.visibility === 'Public') {
        if (!comment.parentId) {
            // Only top-level comments can be "commented on" to start a new sub-thread
            actions.push(<button key="comment" onClick={() => onComment(comment)} className="text-xs font-bold text-brand-primary hover:underline">Comment</button>);
        }
        // All public comments can be replied to
        actions.push(<button key="reply" onClick={() => onReply(comment)} className="text-xs font-bold text-brand-primary hover:underline">Reply</button>);
    }

    const commentBaseClasses = `rounded-2xl shadow-sm ${isMobile ? 'p-3' : 'p-4'} transition-all duration-500 ease-in-out origin-top`;
    const commentStateClasses = isPrivate && isPrivateCollapsed ? 'max-h-0 opacity-0 !p-0 !my-0 overflow-hidden' : 'max-h-none';

    const commentStyleClasses = () => {
        let classes = '';

        if (isPrivate) {
            classes += ' bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800';
        } else {
            // Updated to use theme color (brand-primary) background tint as requested
            classes += ' bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/10';
        }

        return classes.trim();
    };


    return (
        <>
            <div 
                id={`comment-${comment.commentId}`}
                className={`${commentBaseClasses} ${commentStateClasses} ${commentStyleClasses()}`}
            >
                <div className="flex items-start gap-4">
                    {isAIComment ? <AIAvatar /> : <UserAvatar name={comment.author} />}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                 <span className="font-bold">{comment.author}</span>
                                 <span className="text-xs text-base-content-secondary">{formattedDate}</span>
                                 {comment.updatedAt && <span className="text-xs text-base-content-secondary/70 italic">(edited)</span>}
                                 {actions.map((action, index) => (
                                     <React.Fragment key={index}>
                                        <span className="text-xs text-base-content-secondary/50 mx-1">•</span>
                                        {action}
                                     </React.Fragment>
                                 ))}
                            </div>
                            {!isAIComment && <VisibilityIcon visibility={comment.visibility} isMobile={isMobile} />}
                        </div>

                        {originalComment && (
                            <a
                                href={`#comment-${originalComment.commentId}`}
                                onClick={handleOriginalCommentClick}
                                className="block mt-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg text-sm border border-white/20 hover:border-brand-primary transition-colors group"
                            >
                                <div className="font-bold text-xs text-base-content-secondary mb-1 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 8a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5A.75.75 0 0 1 4 8Zm0-2.5a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 4 5.5Z" clipRule="evenodd" /><path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h.663c.143.43.377.838.68 1.192a.75.75 0 0 0 1.114 0c.303-.354.537-.762.68-1.192h5.126c.143.43.377.838.68 1.192a.75.75 0 0 0 1.114 0c.303-.354.537-.762.68-1.192H13.5A1.5 1.5 0 0 0 15 13.5v-11A1.5 1.5 0 0 0 13.5 1h-11ZM2.5 2.5h11v11h-11v-11Z" /></svg>
                                    <span>Replying to {originalComment.author}</span>
                                </div>
                                <p className="text-base-content-secondary truncate pl-5">
                                    {originalComment.content.replace(/^\[REPLY_TO:COMMENT-[\w-]+\]\s*/, '').trim()}
                                </p>
                            </a>
                        )}
                        
                        <div className="mt-2 text-base-content/90 prose prose-sm dark:prose-invert max-w-none prose-strong:text-base-content prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-p:my-1 break-words">
                            {isEditing ? (
                                <div>
                                    <textarea
                                        ref={textareaRef}
                                        value={editedContent}
                                        onChange={handleTextareaChange}
                                        className="w-full bg-white/50 dark:bg-black/20 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary transition-colors duration-200 resize-none overflow-hidden"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-2 mt-2 justify-end">
                                        <button onClick={handleCancelEdit} className="bg-base-300/70 hover:bg-base-300 font-bold py-1 px-3 rounded-lg transition-colors duration-300 text-sm">
                                            Cancel
                                        </button>
                                        <button onClick={handleSaveEdit} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-1 px-3 rounded-lg transition-colors duration-300 text-sm">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div dangerouslySetInnerHTML={highlightedContent} />
                            )}
                        </div>
                        {comment.taggedUsers.length > 0 && !isEditing && (
                            <div className="mt-2 text-xs text-base-content-secondary flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5ZM2.75 4.25c0-.828.672-1.5 1.5-1.5h2.5c.828 0 1.5.672 1.5 1.5v2.5c0 .828-.672 1.5-1.5 1.5h-2.5c-.828 0-1.5-.672-1.5-1.5v-2.5Z" /><path d="M11.75 5.25a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM10.5 8a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5ZM9.25 11.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z" /></svg>
                                <span>Tagged: {comment.taggedUsers.join(', ')}</span>
                            </div>
                        )}
                        {replies.length > 0 && (
                             <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                                {replies.map(reply => (
                                    <CommentEntry
                                        key={reply.commentId}
                                        comment={reply}
                                        currentUser={currentUser}
                                        isPrivateCollapsed={isPrivateCollapsed}
                                        replies={[]} // For simplicity, we don't support nested replies
                                        onComment={onComment}
                                        onReply={onReply}
                                        onUpdateComment={onUpdateComment}
                                        onDeleteComment={onDeleteComment}
                                        allComments={allComments}
                                        team={team}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Comment?"
                message={replies.length > 0 
                    ? "This comment has replies. Deleting it will also remove all replies. This action cannot be undone." 
                    : "Are you sure you want to delete this comment? This action cannot be undone."
                }
                confirmLabel="Delete"
                isDestructive={true}
            />
        </>
    );
};
