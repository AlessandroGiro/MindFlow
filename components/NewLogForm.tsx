import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ProjectComment, TeamMember, LogVisibility } from '../types/index';

interface NewCommentFormProps {
    onAddComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'projectId' | 'author'>) => Promise<void>;
    onCancel: () => void;
    onCancelReply: () => void;
    team: TeamMember[];
    currentUser: TeamMember;
    actionTargetComment?: ProjectComment | null;
    actionType: 'new' | 'comment' | 'reply';
}

const UserAvatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-base-300 flex items-center justify-center font-bold text-base-content-secondary">
        {name.charAt(0)}
    </div>
);

const MentionUserAvatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-base-300 flex items-center justify-center font-bold text-xs text-base-content-secondary">
        {name.charAt(0)}
    </div>
);

const ReplyQuote: React.FC<{ comment: ProjectComment, onCancelReply: () => void, actionType: 'comment' | 'reply' }> = ({ comment, onCancelReply, actionType }) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(`comment-${comment.commentId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a temporary highlight effect
            element.classList.add('animate-pulse-once');
            setTimeout(() => element.classList.remove('animate-pulse-once'), 2000);
        }
    };

    const titleText = actionType === 'comment' ? `Commenting on ${comment.author}` : `Replying to ${comment.author}`;

    return (
        <div className="mb-2">
            <div className="text-xs font-bold text-base-content-secondary mb-1 flex justify-between items-center">
                <span>{titleText}</span>
                 <button
                    type="button"
                    onClick={onCancelReply}
                    className="p-1 -mr-1 rounded-full hover:bg-base-300 text-base-content-secondary flex-shrink-0"
                    aria-label="Cancel reply"
                    title="Cancel reply"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                </button>
            </div>
            <a 
                href={`#comment-${comment.commentId}`} 
                onClick={handleClick} 
                className="block p-2 bg-base-200 dark:bg-zinc-800 rounded-lg text-sm border border-base-300/50 hover:border-brand-primary transition-colors group"
            >
                <p className="text-base-content-secondary truncate">
                    {comment.content.replace(/^\[REPLY_TO:COMMENT-[\w-]+\]\s*/, '').trim()}
                </p>
            </a>
            <style>{`
                @keyframes pulse-once { 0%, 100% { background-color: var(--original-bg); } 50% { background-color: rgb(var(--color-brand-primary) / 0.1); } }
                .animate-pulse-once { --original-bg: rgb(var(--color-base-100)); animation: pulse-once 1.5s ease-in-out; }
            `}</style>
        </div>
    );
};


export const NewCommentForm: React.FC<NewCommentFormProps> = ({ onAddComment, onCancel, onCancelReply, team, currentUser, actionTargetComment, actionType }) => {
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<LogVisibility>('Public');
    const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Mention System State ---
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<TeamMember[]>([]);
    const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const suggestionPositionerRef = useRef<HTMLDivElement>(null);

    // --- State for smart deletion ---
    const prevContentRef = useRef(content);
    useEffect(() => {
        prevContentRef.current = content;
    }, [content]);
    
    // Memoize the list of all valid mentionable names (full and first names).
    // This is used for both highlighting and smart backspace logic.
    const validMentionNames = useMemo(() => {
        const allNameParts = new Set<string>();
        team.forEach(member => {
            allNameParts.add(member.name); // Add full name, e.g., "Alessandro Giro"
            const parts = member.name.split(' ');
            if (parts.length > 1) {
                allNameParts.add(parts[0]); // Add first name, e.g., "Alessandro"
            }
        });
        // Sort by length descending to match longer names first ("Alessandro Giro" before "Alessandro")
        return [...allNameParts].sort((a, b) => b.length - a.length);
    }, [team]);
    
    // --- Highlighted content for the mirror div ---
    const highlightedMarkup = useMemo(() => {
        // Basic XSS protection
        const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (!content || visibility === 'Private' || validMentionNames.length === 0) {
            return { __html: escapeHtml(content) };
        }
        
        const namesRegexStr = validMentionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const regex = new RegExp(`@(${namesRegexStr})\\b`, 'g');

        const highlighted = escapeHtml(content).replace(regex, (match) => {
            return `<span class="bg-blue-200 dark:bg-blue-800/50 rounded-sm">${match}</span>`;
        });

        return { __html: highlighted };
    }, [content, visibility, validMentionNames]);

    useEffect(() => {
        if (actionType === 'reply' || actionType === 'comment') {
            setContent(''); // Start with a clean slate for replies/comments
            textareaRef.current?.focus();
        } else {
            setContent('');
        }
        
        setTaggedUsers([]);
        // Comments on public posts should also be public
        setVisibility('Public');
    }, [actionType, actionTargetComment]);

    // Effect to handle visibility changes
    useEffect(() => {
        if (visibility === 'Private') {
            setShowSuggestions(false);
            if (taggedUsers.length > 0) {
                // When switching to private, remove the @ symbol from valid mentions.
                let newContent = content;
                const sortedTaggedUsers = [...taggedUsers].sort((a,b) => b.length - a.length);
                sortedTaggedUsers.forEach(user => {
                    const userRegex = new RegExp(`@${user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                    newContent = newContent.replace(userRegex, user);
                });
                setContent(newContent);
                setTaggedUsers([]);
            }
        }
    }, [visibility, content, taggedUsers]);

    const submitForm = useCallback(async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            let finalContent = content.trim();
            if (actionType === 'reply' && actionTargetComment) {
                finalContent = `[REPLY_TO:${actionTargetComment.commentId}] ${finalContent}`;
            }

            await onAddComment({
                content: finalContent,
                visibility,
                taggedUsers: visibility === 'Public' ? [...new Set(taggedUsers)] : [],
                parentId: null,
            });
            setContent('');
            setTaggedUsers([]);
            setVisibility('Public');
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert("There was an error posting the comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }, [content, isSubmitting, actionType, actionTargetComment, onAddComment, visibility, taggedUsers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitForm();
    };

    const handleSuggestionSelect = useCallback((user: TeamMember) => {
        if (mentionStartIndex === null || !textareaRef.current) return;

        const textBefore = content.substring(0, mentionStartIndex);
        const textAfterCursor = content.substring(textareaRef.current.selectionStart);
        
        const queryBoundaryMatch = textAfterCursor.match(/[\s\n,.;!?]|\b/);
        const queryEndIndex = queryBoundaryMatch ? queryBoundaryMatch.index : textAfterCursor.length;
        const textAfter = textAfterCursor.substring(queryEndIndex || 0);

        const newContent = `${textBefore}@${user.name}${textAfter.startsWith(' ') ? '' : ' '}${textAfter}`;
        setContent(newContent);
        
        setShowSuggestions(false);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = textBefore.length + user.name.length + 2;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [content, mentionStartIndex]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        const newCursorPos = e.target.selectionStart;
        const oldContent = prevContentRef.current;

        // --- Smart Deletion Logic ---
        if (newContent.length < oldContent.length && visibility === 'Public' && validMentionNames.length > 0) {
            const namesRegexStr = validMentionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            const tagRegex = new RegExp(`@(${namesRegexStr})`, 'g');
            let match;
            
            while ((match = tagRegex.exec(oldContent)) !== null) {
                const tagName = match[1];
                const tagStartIndex = match.index;
                const tagEndIndex = tagStartIndex + tagName.length + 1;

                if (newCursorPos > tagStartIndex && newCursorPos <= tagEndIndex) {
                    const spaceIndexInTagName = tagName.lastIndexOf(' ');
                    const deletionPosInTag = newCursorPos - (tagStartIndex + 1);
                    
                    let finalContent = '';
                    let finalCursorPos = 0;

                    // Deletion happened in the last name part
                    if (spaceIndexInTagName !== -1 && deletionPosInTag > spaceIndexInTagName) {
                        const firstNamePart = `@${tagName.substring(0, spaceIndexInTagName)}`;
                        // Reconstruct with first name tag and a trailing space
                        finalContent = oldContent.substring(0, tagStartIndex) + firstNamePart + ' ' + oldContent.substring(tagEndIndex);
                        finalCursorPos = tagStartIndex + firstNamePart.length + 1;
                    } else { // Deletion happened in the first name part
                        // Remove the '@' and convert the tag to plain text
                        finalContent = oldContent.substring(0, tagStartIndex) + tagName + oldContent.substring(tagEndIndex);
                        finalCursorPos = tagStartIndex + tagName.length;
                    }

                    setContent(finalContent);
                    setTimeout(() => { 
                        if(textareaRef.current) {
                            textareaRef.current.focus();
                            textareaRef.current.setSelectionRange(finalCursorPos, finalCursorPos); 
                        }
                    }, 0);
                    return; // We've handled this change, so we can exit.
                }
            }
        }

        // --- Regular content change and suggestion logic ---
        setContent(newContent);
        
        // Recalculate tagged users on every change
        const updatedTags: string[] = [];
        if (visibility === 'Public' && validMentionNames.length > 0) {
            const namesRegexStr = validMentionNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            const regex = new RegExp(`@(${namesRegexStr})\\b`, 'g');
            const matches = newContent.matchAll(regex);
            for (const match of matches) {
                updatedTags.push(match[1]);
            }
        }
        setTaggedUsers([...new Set(updatedTags)]);
        
        // Suggestion logic
        if (visibility === 'Private') {
            setShowSuggestions(false);
            return;
        }

        const textUpToCursor = newContent.substring(0, newCursorPos);
        const atIndex = textUpToCursor.lastIndexOf('@');
        const spaceIndex = textUpToCursor.lastIndexOf(' ');

        if (atIndex > -1 && atIndex > spaceIndex) {
            const query = textUpToCursor.substring(atIndex + 1);
            const currentTags = new Set(updatedTags); 
            const filteredTeam = team.filter(
                member => 
                    member.name.toLowerCase().startsWith(query.toLowerCase()) && 
                    member.email !== currentUser.email &&
                    !currentTags.has(member.name)
            );

            if (filteredTeam.length > 0) {
                if (suggestionPositionerRef.current && textareaRef.current) {
                    const textarea = textareaRef.current;
                    const mirror = suggestionPositionerRef.current;
                    const textUpToAt = newContent.substring(0, atIndex);

                    mirror.textContent = textUpToAt;
                    const span = document.createElement('span');
                    span.textContent = ' '; // using a space to get position after the typed content
                    mirror.appendChild(span);
                    
                    const top = span.offsetTop - textarea.scrollTop;
                    const left = span.offsetLeft - textarea.scrollLeft;

                    setSuggestionPos({ top, left });
                }
                
                setSuggestions(filteredTeam);
                setShowSuggestions(true);
                setMentionStartIndex(atIndex);
                setActiveIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % suggestions.length);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleSuggestionSelect(suggestions[activeIndex]);
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSuggestions(false);
                return;
            }
        }

        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submitForm();
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isMac = useMemo(() => typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0, []);
    const shortcutHint = isMac ? '⌘ + Enter' : 'Ctrl + Enter';
    const submitButtonText = { 'new': 'Post', 'comment': 'Comment', 'reply': 'Reply' }[actionType];

    return (
        <form onSubmit={handleSubmit} className="bg-base-100 rounded-2xl shadow-lg p-4 flex gap-4">
            <UserAvatar name={currentUser.name} />
            <div className="flex-grow min-w-0">
                 {actionTargetComment && actionType !== 'new' && <ReplyQuote comment={actionTargetComment} onCancelReply={onCancelReply} actionType={actionType} />}
                <div className="relative">
                    <div
                        ref={suggestionPositionerRef}
                        style={{ minHeight: '80px' }}
                        className="invisible absolute top-0 left-0 -z-10 whitespace-pre-wrap break-words w-full bg-base-100 border-2 border-transparent rounded-xl py-3 px-4"
                    ></div>
                    <div
                        aria-hidden="true"
                        style={{ minHeight: '80px' }}
                        className="absolute inset-0 z-0 pointer-events-none whitespace-pre-wrap break-words w-full bg-transparent border-2 border-transparent rounded-xl py-3 px-4 text-base-content"
                        dangerouslySetInnerHTML={highlightedMarkup}
                    />
                    <textarea
                        id="logContent"
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        className="relative z-10 w-full bg-transparent border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200 resize-y caret-current"
                        placeholder={visibility === 'Private' ? "Mentions are disabled for private comments." : "What's new? Type '@' to mention a teammate..."}
                        rows={3}
                        style={{ minHeight: '80px' }}
                        required
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            ref={suggestionsRef}
                            style={{ top: suggestionPos.top + 24, left: suggestionPos.left }}
                            className="absolute z-20 w-64 max-h-48 overflow-y-auto bg-base-200 dark:bg-base-100 border border-base-300 rounded-xl shadow-lg"
                        >
                            {suggestions.map((user, index) => (
                                <div
                                    key={user.email}
                                    onClick={() => handleSuggestionSelect(user)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex items-center gap-2 p-2 cursor-pointer ${index === activeIndex ? 'bg-brand-primary/10' : 'hover:bg-base-300/50'}`}
                                >
                                    <MentionUserAvatar name={user.name} />
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center mt-2">
                     <div className="flex items-center gap-1 bg-base-200 border-2 border-base-300 rounded-xl p-1 max-w-min">
                        <button type="button" onClick={() => setVisibility('Public')} disabled={actionType === 'comment'} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${visibility === 'Public' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>Public</button>
                        <button type="button" onClick={() => setVisibility('Private')} disabled={actionType === 'comment'} title="Private comments are only visible to you. Mentions will be disabled." className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${visibility === 'Private' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'} disabled:opacity-50 disabled:cursor-not-allowed`}>Private</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content-secondary hidden sm:block" aria-hidden="true">
                            {shortcutHint}
                        </span>
                        <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-base-300/70 hover:bg-base-300 font-bold py-2 px-4 rounded-xl transition-colors duration-300 disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !content.trim()} className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors duration-300 w-24 disabled:opacity-50 disabled:cursor-not-allowed">
                           {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div> : submitButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};