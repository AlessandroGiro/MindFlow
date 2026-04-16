import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project, ProjectComment, TeamMember, Task } from '../types/index';
import { CommentEntry } from './LogEntry';
import { NewCommentForm } from './NewLogForm';

interface TaskActivityProps {
    task: Task;
    projects: Project[];
    comments: ProjectComment[];
    currentUser: TeamMember;
    team: TeamMember[];
    onAddComment: (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>) => Promise<ProjectComment>;
    onUpdateComment: (commentId: string, newContent: string, newTaggedUsers: string[]) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

export const TaskActivity: React.FC<TaskActivityProps> = ({ task, projects, comments, currentUser, team, onAddComment, onUpdateComment, onDeleteComment }) => {
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentAction, setCommentAction] = useState<{ type: 'new' | 'comment' | 'reply', target: ProjectComment | null }>({ type: 'new', target: null });
    const formRef = useRef<HTMLDivElement>(null);
    const [newlyAddedCommentId, setNewlyAddedCommentId] = useState<string | null>(null);

    const taskComments = useMemo(() => {
        return comments
            .filter(comment => comment.taskId === task.taskId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [comments, task.taskId]);

    const { topLevelComments, repliesMap } = useMemo(() => {
        const repliesMap = new Map<string, ProjectComment[]>();
        const topLevelComments: ProjectComment[] = [];

        taskComments.forEach(comment => {
            if (comment.parentId) {
                if (!repliesMap.has(comment.parentId)) {
                    repliesMap.set(comment.parentId, []);
                }
                repliesMap.get(comment.parentId)!.unshift(comment); // Keep chronological order
            } else {
                topLevelComments.push(comment);
            }
        });
        return { topLevelComments, repliesMap };
    }, [taskComments]);

    useEffect(() => {
        if (isAddingComment) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                formRef.current?.querySelector('textarea')?.focus();
            }, 100);
        }
    }, [isAddingComment, commentAction.target]);

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
        setTimeout(() => setCommentAction({ type: 'new', target: null }), 300);
    }, []);
    
    const handleClearReplyTarget = useCallback(() => {
        setCommentAction({ type: 'new', target: null });
        formRef.current?.querySelector('textarea')?.focus();
    }, []);
    
    useEffect(() => {
        // This effect runs only when a new comment ID is set.
        if (newlyAddedCommentId) {
            // A timeout ensures this code runs after React has rendered the new comment to the DOM.
            const timer = setTimeout(() => {
                const element = document.getElementById(`comment-${newlyAddedCommentId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('animate-pulse-once');
                    // Remove the animation class after it has finished.
                    setTimeout(() => {
                        element.classList.remove('animate-pulse-once');
                    }, 2000);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [newlyAddedCommentId]); // Only re-run when a new comment is posted.


    const handleCommentAdded = useCallback(async (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author' | 'projectId'>) => {
        const project = projects.find(p => p.projectName === task.project);
        if (!project) {
            console.error("Could not find project for this task's comment.");
            return;
        }

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
            taskId: task.taskId,
            projectId: project.projectId,
        };
        const newComment = await onAddComment(finalCommentData);
        handleCancelComment();
        setNewlyAddedCommentId(newComment.commentId);
    }, [projects, task, commentAction, onAddComment, handleCancelComment]);

    return (
        <div className="flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold">Activity</h3>
                 {!isAddingComment && (
                    <button onClick={handleAddCommentClick} className="text-sm font-semibold text-brand-primary hover:underline">
                        Add comment
                    </button>
                 )}
            </div>
            <div className="space-y-4">
                {topLevelComments.map(comment => (
                    <CommentEntry 
                        key={comment.commentId} 
                        comment={comment} 
                        currentUser={currentUser}
                        isPrivateCollapsed={false} // Private comments are not task-specific
                        replies={repliesMap.get(comment.commentId) || []}
                        onComment={handleCommentClick}
                        onReply={handleReplyClick}
                        allComments={comments}
                        team={team}
                        onUpdateComment={onUpdateComment}
                        onDeleteComment={onDeleteComment}
                    />
                ))}
            </div>
            {taskComments.length === 0 && !isAddingComment && (
                <div className="text-center py-6 text-base-content-secondary text-sm">
                    <p>No comments yet. Start the conversation!</p>
                </div>
            )}

            <div 
                ref={formRef}
                className={`
                    flex-shrink-0 transition-all duration-300 ease-in-out
                    ${isAddingComment ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
                `}
            >
                {isAddingComment && (
                    <div className="mt-4 pt-4 border-t border-base-300">
                        <NewCommentForm
                            currentUser={currentUser}
                            team={team}
                            onAddComment={handleCommentAdded}
                            onCancel={handleCancelComment}
                            onCancelReply={handleClearReplyTarget}
                            actionTargetComment={commentAction.target}
                            actionType={commentAction.type}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};