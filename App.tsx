
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { NewProjectModal } from './components/NewProjectModal';
import { NewTaskModal } from './components/NewTaskModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/Loader';
import { ProjectHeader } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { MyTasks } from './components/MyTasks';
import { Settings } from './components/Settings';
import { NotificationCenter } from './components/NotificationCenter';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, Task, TeamMember, TaskStatus, ProjectComment, AppNotification, AISummarySettings } from './types/index';
import * as server from './services/server';
import { generateTasks as generateTasksWithAI } from './services/geminiService';
import { ProjectCommentSection } from './components/ProjectLogSection';
import { DailyFlow } from './components/DailyFlow';
import { FeedFlow } from './components/FeedFlow';
import { useMediaQuery } from './hooks/useMediaQuery';
import { TaskDetailsContent } from './components/TaskDetailsContent';
import { SystemDocumentation } from './components/SystemDocumentation';
import { AIStudio } from './components/AIStudio';
import { DocuFlow } from './components/DocuFlow';
import { MindMap } from './components/MindMap';
import { MindSnap } from './components/MindSnap';


type ActiveView = 'dashboard' | 'project' | 'my-tasks' | 'settings' | 'system-docs' | 'daily-flow' | 'feed-flow' | 'ai-studio';

interface AppProps {
    currentUser: TeamMember;
    onLogout: () => void;
}

function usePrevious<T>(value: T): T | undefined {
    // FIX: Initialize useRef with a value to satisfy stricter TypeScript/linter rules that expect an argument.
    // FIX: useRef was called without arguments, causing an error. Initializing with `undefined`.
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

/**
 * Converts a VAPID public key string to a Uint8Array.
 * @param {string} base64String The VAPID public key.
 * @returns {Uint8Array} The VAPID public key as a Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// --- Favicon Update Utility ---
const ORIGINAL_FAVICON_HREF = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' fill='%232e2e5c' d='M12 2.5C5.8 2.5 3.5 6.2 4.6 12c1.1 5.8 6.4 9.5 7.4 9.5s6.3-3.7 7.4-9.5c1.1-5.8-1.2-9.5-7.4-9.5zM12 7c-3.2 0-4.3 1.6-3.7 5.1.6 3.5 3.7 5.9 3.7 5.9s3.1-2.4 3.7-5.9c.6-3.5-.5-5.1-3.7-5.1z' /%3E%3C/svg%3E";

const updateFaviconWithCount = (count: number) => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
    if (!link.parentNode) {
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
    }
    
    if (count === 0) {
        if (link.href !== ORIGINAL_FAVICON_HREF) {
            link.href = ORIGINAL_FAVICON_HREF;
        }
        return;
    }

    const canvas = document.createElement('canvas');
    const size = 64; // Use a higher resolution for better quality
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw base icon from SVG
        ctx.drawImage(img, 0, 0, size, size);

        // Draw notification badge
        const badgeRadius = size * 0.28;
        const badgeX = size - badgeRadius - (size * 0.05);
        const badgeY = badgeRadius + (size * 0.05);

        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444'; // Red-500
        ctx.fill();

        // Draw count text
        const text = count > 9 ? '9+' : count.toString();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.4}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, badgeX, badgeY + 1);

        link.href = canvas.toDataURL('image/png');
    };
    
    img.onerror = () => {
        // Fallback or error logging if the SVG fails to load
        console.error("Failed to load favicon image for badge drawing.");
    };

    // Set the source to the SVG data URL to trigger loading
    img.src = ORIGINAL_FAVICON_HREF;
};


const App: React.FC<AppProps> = ({ currentUser, onLogout }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [comments, setComments] = useState<ProjectComment[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>('dashboard');
    const [projectViewMode, setProjectViewMode] = useState<'board' | 'documents' | 'mindmap' | 'mindsnap'>('board');
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('To Do');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
    const prevComments = usePrevious(comments);
    
    // --- Push Notification State ---
    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
    const [isPushLoading, setIsPushLoading] = useState(true);

    // --- PWA Install State ---
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // VAPID public key - loaded from environment variables for security.
    const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
    
    // --- Expandable Comment Section State ---
    const [isCommentSectionExpanded, setIsCommentSectionExpanded] = useState(false);

    // --- AI Summary Settings State ---
    const [aiSummarySettings, setAiSummarySettings] = useState<AISummarySettings>({
        tone: 'Professional',
        format: 'Narrative',
        includeKeyDevelopments: true,
        includeNextSteps: true,
    });

    // --- Local-First Update Queue ---
    const [pendingChangesQueue, setPendingChangesQueue] = useState<(() => Promise<any>)[]>([]);
    const isSyncing = useRef(false);

    // --- Responsive State ---
    const isMobile = useMediaQuery('(max-width: 1023px)');

    // --- PWA Install Prompt Listener ---
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log("ProjectFlow: 'beforeinstallprompt' event was fired and captured.");
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

     // Check for push notification support and existing subscription
    useEffect(() => {
        const checkSubscription = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        setIsPushEnabled(true);
                        setPushSubscription(subscription);
                    }
                } catch (error) {
                    console.error("Error checking push subscription:", error);
                }
            }
            setIsPushLoading(false);
        };
        checkSubscription();
    }, []);

    const handleTogglePushNotifications = async () => {
        setIsPushLoading(true);
        if (isPushEnabled) {
            // Unsubscribe logic
            if (pushSubscription) {
                await pushSubscription.unsubscribe();
                // In a real app, also send a request to your server to remove the subscription.
                // e.g., await server.removePushSubscription(pushSubscription.endpoint);
                console.log("Unsubscribed from push notifications.", pushSubscription.endpoint);
                setIsPushEnabled(false);
                setPushSubscription(null);
            }
        } else {
            // Subscribe logic
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                alert("Push Notifications are not supported by your browser.");
                setIsPushLoading(false);
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert("Notification permission was not granted.");
                    setIsPushLoading(false);
                    return;
                }

                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                // In a real app, send the subscription object to your server to store it.
                // e.g., await server.savePushSubscription(subscription);
                console.log("Subscribed to push notifications:", JSON.stringify(subscription));

                setIsPushEnabled(true);
                setPushSubscription(subscription);
            } catch (error) {
                console.error("Failed to subscribe to push notifications:", error);
                alert("Failed to subscribe to push notifications. See console for details.");
                setIsPushEnabled(false); // Ensure state is correct on failure
            }
        }
        setIsPushLoading(false);
    };


    // Theme management
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);

        // Update PWA Theme Color to match the gradient top color
        // Light mode start color: #fde68a, Dark mode start color: #1e1b4b
        const themeColor = theme === 'dark' ? '#1e1b4b' : '#fde68a';
        
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute("content", themeColor);

    }, [theme]);

    const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    
    const handleToggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

    // Data fetching
    const fetchData = useCallback(async () => {
        // Don't fetch if a sync is in progress to avoid race conditions
        if (isSyncing.current) return;
        setIsLoading(true);
        try {
            const data = await server.getInitialData();
            setProjects(data.projects);
            setTasks(data.tasks);
            setTeam(data.team);
            setComments(data.comments);

            // Preserve current project selection
            if (activeView === 'project') {
                const selectedProjectId = selectedProject?.projectId;
                if (selectedProjectId && data.projects.some(p => p.projectId === selectedProjectId)) {
                    setSelectedProject(data.projects.find(p => p.projectId === selectedProjectId) || null);
                } else {
                    // If selected project is gone, go back to dashboard
                    setActiveView('dashboard');
                    setSelectedProject(null);
                }
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject?.projectId, activeView]);

    useEffect(() => {
        fetchData();
    }, []);


    // --- Change Syncing Logic ---
    const syncChanges = useCallback(async () => {
        if (pendingChangesQueue.length === 0 || isSyncing.current) {
            return;
        }

        isSyncing.current = true;
        console.log(`Syncing ${pendingChangesQueue.length} changes...`);
        
        const changesToSync = [...pendingChangesQueue];
        setPendingChangesQueue([]);

        try {
            await Promise.all(changesToSync.map(changeFn => changeFn()));
            console.log("Sync successful. Fetching latest data.");
            // After syncing, fetch fresh data to get canonical state,
            // which replaces temp IDs with real ones from the server.
            await fetchData();
        } catch (error) {
            console.error("Failed to sync changes:", error);
            // Naive retry: put failed changes back in the queue.
            setPendingChangesQueue(prev => [...changesToSync, ...prev]);
            alert("Some changes could not be saved to the server. They will be retried.");
        } finally {
            isSyncing.current = false;
        }
    }, [pendingChangesQueue, fetchData]);


    // --- Notification Generation ---
    useEffect(() => {
        if (!prevComments || isLoading || tasks.length === 0) return; // Don't run on initial load or while loading/tasks not ready

        const generateNotificationsForNewComments = (newComments: ProjectComment[], allComments: ProjectComment[]) => {
            const newNotifications: AppNotification[] = [];
            newComments.forEach(comment => {
                if (comment.author === currentUser.name || comment.commentId.startsWith('TEMP-')) return; // No notifications for your own actions or temporary comments

                // Mention notifications
                if (comment.taggedUsers.includes(currentUser.name)) {
                    let message = '';
                    let taskId: string | null = null;
                    if (comment.taskId) {
                        const task = tasks.find(t => t.taskId === comment.taskId);
                        message = `tagged you in a comment on task "${task?.taskName || 'a task'}".`;
                        taskId = comment.taskId;
                    } else {
                        message = `tagged you in a project comment.`;
                    }
                    newNotifications.push({
                        id: `notif-${Date.now()}-${comment.commentId}-mention`,
                        type: 'mention',
                        message: message,
                        commentId: comment.commentId,
                        taskId: taskId,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        author: comment.author,
                    });
                }

                // Reply notifications (checks for parentId which is set for comments)
                if (comment.parentId) {
                    const parentComment = allComments.find(l => l.commentId === comment.parentId);
                    if (parentComment && parentComment.author === currentUser.name) {
                        let message = '';
                        let taskId: string | null = null;
                        if (parentComment.taskId) {
                            const task = tasks.find(t => t.taskId === parentComment.taskId);
                            message = `replied to your comment on task "${task?.taskName || 'a task'}".`;
                            taskId = parentComment.taskId;
                        } else {
                            message = `replied to your project comment.`;
                        }
                        newNotifications.push({
                            id: `notif-${Date.now()}-${comment.commentId}-reply`,
                            type: 'reply',
                            message: message,
                            commentId: comment.commentId,
                            taskId: taskId,
                            isRead: false,
                            createdAt: new Date().toISOString(),
                            author: comment.author,
                        });
                    }
                }
            });
            if (newNotifications.length > 0) {
                setNotifications(prev => [...newNotifications, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        };

        const generateNotificationsForUpdatedComments = (updatedComments: ProjectComment[], previousComments: ProjectComment[]) => {
           const newNotifications: AppNotification[] = [];
           updatedComments.forEach(comment => {
               if (comment.author === currentUser.name) return;
               const oldComment = previousComments.find(p => p.commentId === comment.commentId);
               if (!oldComment) return;
               
               const oldTags = new Set(oldComment.taggedUsers);
               if (comment.taggedUsers.includes(currentUser.name) && !oldTags.has(currentUser.name)) {
                    let message = '';
                    let taskId: string | null = null;
                    if (comment.taskId) {
                        const task = tasks.find(t => t.taskId === comment.taskId);
                        message = `tagged you in a comment on task "${task?.taskName || 'a task'}".`;
                        taskId = comment.taskId;
                    } else {
                        message = `tagged you in an updated project comment.`;
                    }
                    newNotifications.push({
                        id: `notif-${Date.now()}-${comment.commentId}-update`,
                        type: 'mention',
                        message: message,
                        commentId: comment.commentId,
                        taskId: taskId,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        author: comment.author,
                    });
               }
           });
           if (newNotifications.length > 0) {
                setNotifications(prev => [...newNotifications, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        }

        // Check for new comments (that are not temporary)
        if (comments.length > prevComments.length) {
            const newComments = comments.filter(comment => !comment.commentId.startsWith('TEMP-') && !prevComments.some(pComment => pComment.commentId === comment.commentId));
            generateNotificationsForNewComments(newComments, comments);
        }
        
        // Check for updated comments
        const updatedComments = comments.filter(comment => {
            const pComment = prevComments.find(p => p.commentId === comment.commentId);
            return pComment && pComment.updatedAt !== comment.updatedAt;
        });
        if (updatedComments.length > 0) {
            generateNotificationsForUpdatedComments(updatedComments, prevComments);
        }

    }, [comments, prevComments, currentUser.name, isLoading, tasks]);

    // Hourly Digest Notification
     useEffect(() => {
        const interval = setInterval(() => {
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            
            // Check for comments created in the last hour not by the current user
            const otherUserCommentsLastHour = comments.filter(comment => 
                new Date(comment.createdAt).getTime() > oneHourAgo &&
                comment.author !== currentUser.name
            );

            if (otherUserCommentsLastHour.length > 0) {
                // Check if a digest was already created in the last hour
                const hasRecentDigest = notifications.some(n => 
                    n.type === 'digest' && new Date(n.createdAt).getTime() > oneHourAgo
                );
                
                if (!hasRecentDigest) {
                    const digestNotification: AppNotification = {
                        id: `notif-digest-${Date.now()}`,
                        type: 'digest',
                        message: `There ${otherUserCommentsLastHour.length === 1 ? 'has been 1 new comment' : `have been ${otherUserCommentsLastHour.length} new comments`} in the last hour.`,
                        commentId: undefined,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                        author: 'System',
                    };
                    setNotifications(prev => [digestNotification, ...prev]);
                }
            }
        }, 60 * 60 * 1000); // 1 hour

        return () => clearInterval(interval);
    }, [comments, notifications, currentUser.name]);

    const toggleCommentSectionExpanded = () => {
        setIsCommentSectionExpanded(prev => !prev);
    };
    
    // Navigation Handlers
    const handleSelectProject = (project: Project | null) => {
        syncChanges(); // Sync before changing project
        setSelectedProject(project);
        setActiveView(project ? 'project' : 'dashboard');
        setProjectViewMode('board'); // Reset view mode to board when selecting a new project
        setIsCommentSectionExpanded(false); // Reset comment expansion on project change
        setSelectedTask(null); // Deselect task when changing project
    };

    const handleSelectView = (view: ActiveView) => {
        syncChanges(); // Sync before changing view
        setActiveView(view);
        setSelectedTask(null); // Deselect task when changing view
        if (view !== 'project') {
          setSelectedProject(null); // Deselect project when switching to a non-project view
        }
    };


    // Data Mutation Handlers
    const handleAddProject = async (projectData: { projectName: string; projectLead: string; description: string; generateWithAI: boolean; members: string[] }) => {
        // This is a major action, so we sync pending changes first.
        await syncChanges();
        
        const newProject = await server.addNewProject(projectData);

        if (projectData.generateWithAI) {
            const generatedTasks = await generateTasksWithAI(projectData.projectName, projectData.description, team);
            const tasksWithProject = generatedTasks.map(task => ({ ...task, project: newProject.projectName }));
            await server.addTasks(tasksWithProject);
        }
        
        await fetchData(); // Refresh all data
        handleSelectProject(newProject);
        setIsNewProjectModalOpen(false);
    };

    const handleAddTask = async (taskData: Omit<Task, 'taskId' | 'project' | 'createdAt' | 'completionDate' | 'parentId'>) => {
        if (!selectedProject) return;
        
        // Adding a task is also a significant action.
        await syncChanges();

        await server.addNewTask({
            ...taskData,
            project: selectedProject.projectName,
        });

        await fetchData();
        setIsNewTaskModalOpen(false);
    }

    const handleUpdateTask = async (taskId: string, taskData: Partial<Omit<Task, 'taskId'>>): Promise<void> => {
        // Optimistic UI update
        setTasks(prevTasks => prevTasks.map(t => (t.taskId === taskId ? { ...t, ...taskData } : t)));
        
        // Queue the server call
        const syncOperation = () => server.updateTask(taskId, taskData);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleAddComment = async (commentData: Omit<ProjectComment, 'commentId' | 'createdAt' | 'author'>): Promise<ProjectComment> => {
        if (!commentData.projectId) {
            console.error("Cannot add a comment without a projectId.");
            throw new Error("Cannot add a comment without a projectId.");
        }
        
        const tempComment: ProjectComment = {
            ...commentData,
            author: currentUser.name,
            commentId: `TEMP-${Date.now()}-${Math.random()}`,
            createdAt: new Date().toISOString(),
            updatedAt: null,
        };
    
        // Optimistic UI update
        setComments(prevComments => [...prevComments, tempComment]);

        // Add the server call to the sync queue. Note: we pass the original data.
        const syncOperation = () => server.addNewComment({ ...commentData, author: currentUser.name });
        setPendingChangesQueue(prev => [...prev, syncOperation]);
        
        return tempComment;
    };

    const handleUpdateComment = async (commentId: string, newContent: string, newTaggedUsers: string[]): Promise<void> => {
        const updatedCommentForUI = {
            content: newContent,
            taggedUsers: newTaggedUsers,
            updatedAt: new Date().toISOString(),
        };

        // Optimistic UI update
        setComments(prevComments => prevComments.map(comment => comment.commentId === commentId ? { ...comment, ...updatedCommentForUI } : comment));

        // Queue the server call
        const syncOperation = () => server.updateComment(commentId, newContent, newTaggedUsers);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleMoveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
        const newCompletionDate = newStatus === 'Done' ? new Date().toISOString() : null;

        // Optimistic UI update
        setTasks(prevTasks => prevTasks.map(t => {
            if (t.taskId === taskId) {
                return { ...t, status: newStatus, completionDate: newCompletionDate };
            }
            return t;
        }));

        // Queue the server call
        const syncOperation = () => server.updateTaskStatus(taskId, newStatus, newCompletionDate);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    }, []);
    
    const handleUpdateProject = async (projectId: string, projectData: Partial<Omit<Project, 'projectId'>>): Promise<void> => {
        // Optimistic UI update
        setProjects(prevProjects => prevProjects.map(p => {
            if (p.projectId === projectId) {
                const updatedProject = { ...p, ...projectData };
                // If project name changes, we need to update tasks as well
                if (projectData.projectName && projectData.projectName !== p.projectName) {
                    setTasks(prevTasks => prevTasks.map(t => t.project === p.projectName ? { ...t, project: updatedProject.projectName } : t));
                }
                return updatedProject;
            }
            return p;
        }));
        
        // Queue the server call
        const syncOperation = () => server.updateProject(projectId, projectData);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleDeleteProject = async (projectId: string): Promise<void> => {
        // This is a major destructive action, sync first
        await syncChanges();

        const projectToDelete = projects.find(p => p.projectId === projectId);
        if (!projectToDelete) return;
        
        // Optimistic UI update
        setProjects(prev => prev.filter(p => p.projectId !== projectId));
        setTasks(prev => prev.filter(t => t.project !== projectToDelete.projectName));
        setComments(prev => prev.filter(c => c.projectId !== projectId));
        handleSelectProject(null); // Go back to dashboard

        // Queue the server call
        const syncOperation = () => server.deleteProject(projectId);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleDeleteTask = async (taskId: string): Promise<void> => {
        // Optimistic UI update
        setTasks(prev => prev.filter(t => t.taskId !== taskId));
        setComments(prev => prev.filter(c => c.taskId !== taskId)); // also remove task-specific comments
        setSelectedTask(null); // Close details view

        // Queue the server call
        const syncOperation = () => server.deleteTask(taskId);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleDeleteComment = async (commentId: string): Promise<void> => {
        // Optimistic UI update to remove comment and its replies
        const commentsToDelete = new Set<string>([commentId]);
        let changed = true;
        while(changed) {
            changed = false;
            const currentSize = commentsToDelete.size;
            comments.forEach(c => {
                if (c.parentId && commentsToDelete.has(c.parentId)) {
                    commentsToDelete.add(c.commentId);
                }
            });
            if (commentsToDelete.size > currentSize) {
                changed = true;
            }
        }
        setComments(prev => prev.filter(c => !commentsToDelete.has(c.commentId)));
        
        // Queue server call
        const syncOperation = () => server.deleteComment(commentId);
        setPendingChangesQueue(prev => [...prev, syncOperation]);
    };

    const handleOpenNewTaskModal = (status: TaskStatus) => {
        setNewTaskStatus(status);
        setIsNewTaskModalOpen(true);
    };

    const handleSelectTask = (task: Task) => setSelectedTask(task);
    const handleCloseDetails = () => setSelectedTask(null);
    
    // Notification Handlers
    const handleToggleNotificationCenter = () => {
        setIsNotificationCenterOpen(prev => !prev);
    };

    const handleMarkNotificationAsRead = (notificationId: string) => {
        setNotifications(prevNotifications =>
            prevNotifications.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        );
    };

    const handleMarkAllNotificationsAsRead = () => {
        setNotifications(prevNotifications =>
            prevNotifications.map(n => ({ ...n, isRead: true }))
        );
    };
    
    const handleNotificationClick = (notification: AppNotification) => {
        handleMarkNotificationAsRead(notification.id);
        setIsNotificationCenterOpen(false);

        const targetCommentId = notification.commentId;
        const highlightElement = (elementId: string) => {
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
            }, 300); // Timeout to allow UI to update (e.g., modal to open)
        };

        // --- Handle Task Comment Notifications ---
        if (notification.taskId) {
            const targetTask = tasks.find(task => task.taskId === notification.taskId);
            if (!targetTask) return;

            const targetProject = projects.find(p => p.projectName === targetTask.project);
            if (!targetProject) return;

            // Switch to the project view if necessary
            if (activeView !== 'project' || selectedProject?.projectId !== targetProject.projectId) {
                handleSelectProject(targetProject);
            }
            
            // Open the task details modal/panel
            setSelectedTask(targetTask);

            if (targetCommentId) {
                highlightElement(`comment-${targetCommentId}`);
            }
            return;
        }

        // --- Handle Project Comment Notifications ---
        if (targetCommentId) {
            const targetComment = comments.find(comment => comment.commentId === targetCommentId);
            if (!targetComment) return;
        
            const targetProject = projects.find(p => p.projectId === targetComment.projectId);
            if (!targetProject) return;
            
             if (activeView !== 'project' || selectedProject?.projectId !== targetProject.projectId) {
                handleSelectProject(targetProject);
            }
        
            highlightElement(`comment-${targetCommentId}`);
        }
    };

    // Memoized calculations
    const userProjects = useMemo(() => {
        return projects.filter(p => p.members && p.members.includes(currentUser.name));
    }, [projects, currentUser.name]);

    const projectTasks = useMemo(() => {
        if (!selectedProject) return [];
        return tasks.filter(task => task.project === selectedProject.projectName);
    }, [selectedProject, tasks]);

    const projectComments = useMemo(() => {
        if (!selectedProject) return [];
        return comments.filter(comment => comment.projectId === selectedProject.projectId)
                   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [selectedProject, comments]);
    
    const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    // --- Dynamic Favicon & Title ---
    useEffect(() => {
        updateFaviconWithCount(unreadNotificationsCount);
    }, [unreadNotificationsCount]);
    
    useEffect(() => {
        if (unreadNotificationsCount > 0) {
            document.title = `(${unreadNotificationsCount}) MindFlow`;
        } else {
            document.title = 'MindFlow';
        }
    }, [unreadNotificationsCount]);

    // Cleanup on logout/unmount
    useEffect(() => {
        return () => {
            updateFaviconWithCount(0);
            document.title = 'MindFlow';
        };
    }, []);

    // --- AI Summary Generation ---
    const handleGenerateSummary = async (projectId: string): Promise<string> => {
        const projectToSummarize = projects.find(p => p.projectId === projectId);
        if (!projectToSummarize) throw new Error("Project not found");

        const relevantTasks = tasks.filter(t => t.project === projectToSummarize.projectName);
        const relevantComments = comments.filter(c => c.projectId === projectId && c.visibility === 'Public');

        // Dynamically import the generator to avoid circular deps if necessary, though here it's imported at top level
        // We use the settings from state
        const summary = await import('./services/geminiService').then(module => 
            module.generateExecutiveSummary(projectToSummarize, relevantTasks, relevantComments, aiSummarySettings)
        );
        return summary;
    };


    // This is a desktop-only state derived from the main selectedTask state
    const showProjectDetailsPanel = !isMobile && selectedTask && activeView === 'project';

    const MainContent = () => {
        if (isLoading && pendingChangesQueue.length === 0) {
            return <div className="flex justify-center items-center h-full"><Loader /></div>;
        }

        const defaultViewWrapper = (children: React.ReactNode) => <div className="h-full overflow-y-auto p-4 md:p-6">{children}</div>;

        switch(activeView) {
            case 'dashboard':
                 return (
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        <Dashboard 
                            projects={userProjects} 
                            tasks={tasks} 
                            team={team}
                            onSelectProject={handleSelectProject} 
                            onNewProjectClick={() => setIsNewProjectModalOpen(true)} 
                            onToggleSidebar={handleToggleSidebar}
                            onUpdateProject={handleUpdateProject}
                            onDeleteProject={handleDeleteProject}
                            showInstallButton={!!deferredPrompt}
                            onInstallClick={handleInstallClick}
                        />
                    </div>
                );
            case 'project':
                if (selectedProject) {
                    return (
                        <div className="flex flex-col h-full">
                            {/* Only show header in board mode to avoid clutter in DocuFlow/MindMap/MindSnap */}
                            {projectViewMode === 'board' && (
                                <div className="flex-shrink-0 p-4 md:p-6 pb-0">
                                    <ProjectHeader 
                                      project={selectedProject}
                                      projects={userProjects}
                                      onSelectProject={handleSelectProject}
                                      onNewTaskClick={() => handleOpenNewTaskModal('To Do')}
                                      onToggleSidebar={handleToggleSidebar}
                                      viewMode={projectViewMode}
                                      onViewModeChange={setProjectViewMode}
                                    />
                                </div>
                            )}
                            
                            {projectViewMode === 'board' ? (
                                isMobile ? (
                                    <>
                                        {/* Main content, FAB will float over it */}
                                        <div className="flex-grow min-h-0 overflow-y-auto p-4 pt-0 pb-4">
                                            <KanbanBoard tasks={projectTasks} onMoveTask={handleMoveTask} onSelectTask={handleSelectTask} onNewTaskClick={handleOpenNewTaskModal} />
                                        </div>
                                        {/* Comment section now renders as a FAB and a full-screen modal */}
                                        <ProjectCommentSection
                                            comments={projectComments}
                                            project={selectedProject}
                                            currentUser={currentUser}
                                            team={team}
                                            onAddComment={handleAddComment}
                                            onUpdateComment={handleUpdateComment}
                                            onDeleteComment={handleDeleteComment}
                                            isExpanded={isCommentSectionExpanded}
                                            onToggleExpand={toggleCommentSectionExpanded}
                                        />
                                    </>
                                ) : (
                                    // --- Desktop View: Split view with comments on bottom ---
                                    <div className="flex-grow flex flex-col gap-4 min-h-0 p-4 md:p-6 pt-0">
                                        <div className="h-[45%] flex-shrink-0 min-h-0">
                                            <KanbanBoard tasks={projectTasks} onMoveTask={handleMoveTask} onSelectTask={handleSelectTask} onNewTaskClick={handleOpenNewTaskModal} />
                                        </div>
                                        <div className="flex-1 min-h-0">
                                            <ProjectCommentSection
                                                comments={projectComments}
                                                project={selectedProject}
                                                currentUser={currentUser}
                                                team={team}
                                                onAddComment={handleAddComment}
                                                onUpdateComment={handleUpdateComment}
                                                onDeleteComment={handleDeleteComment}
                                                isExpanded={true} // Always expanded on desktop
                                                onToggleExpand={() => {}} // No-op, button will be hidden
                                            />
                                        </div>
                                    </div>
                                )
                            ) : projectViewMode === 'documents' ? (
                                // --- Documents View ---
                                <div className="flex-grow min-h-0 flex flex-col">
                                     <DocuFlow 
                                        project={selectedProject}
                                        projects={userProjects}
                                        currentUser={currentUser}
                                        team={team}
                                        viewMode={projectViewMode}
                                        onViewModeChange={setProjectViewMode}
                                        onAddComment={handleAddComment}
                                        onSelectProject={handleSelectProject}
                                        onToggleSidebar={handleToggleSidebar}
                                     />
                                </div>
                            ) : projectViewMode === 'mindmap' ? (
                                // --- MindMap View ---
                                <div className="flex-grow min-h-0 flex flex-col">
                                    <MindMap 
                                        project={selectedProject}
                                        projects={userProjects}
                                        viewMode={projectViewMode}
                                        onViewModeChange={setProjectViewMode}
                                        onSelectProject={handleSelectProject}
                                        onToggleSidebar={handleToggleSidebar}
                                    />
                                </div>
                            ) : (
                                // --- MindSnap View ---
                                <div className="flex-grow min-h-0 flex flex-col">
                                    <MindSnap 
                                        project={selectedProject}
                                        projects={userProjects}
                                        viewMode={projectViewMode}
                                        onViewModeChange={setProjectViewMode}
                                        onSelectProject={handleSelectProject}
                                        onToggleSidebar={handleToggleSidebar}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }
                // Fallback to dashboard if view is 'project' but no project is selected
                return (
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        <Dashboard 
                            projects={userProjects} 
                            tasks={tasks} 
                            team={team}
                            onSelectProject={handleSelectProject} 
                            onNewProjectClick={() => setIsNewProjectModalOpen(true)} 
                            onToggleSidebar={handleToggleSidebar}
                            onUpdateProject={handleUpdateProject}
                            onDeleteProject={handleDeleteProject}
                            showInstallButton={!!deferredPrompt}
                            onInstallClick={handleInstallClick}
                        />
                    </div>
                );
            case 'my-tasks':
                return (
                    <div className="h-full p-4 md:p-6">
                        <MyTasks
                            tasks={tasks}
                            currentUser={currentUser}
                            projects={userProjects}
                            team={team}
                            comments={comments}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onAddComment={handleAddComment}
                            onUpdateComment={handleUpdateComment}
                            onDeleteComment={handleDeleteComment}
                            onToggleSidebar={handleToggleSidebar}
                            onSyncChanges={syncChanges}
                            onSelectTask={handleSelectTask}
                            selectedTask={selectedTask}
                        />
                    </div>
                );
            case 'daily-flow':
                return (
                    <div className="h-full">
                        <DailyFlow 
                            tasks={tasks} 
                            projects={userProjects}
                            currentUser={currentUser}
                            onToggleSidebar={handleToggleSidebar} 
                            onSelectTask={handleSelectTask}
                        />
                    </div>
                );
            case 'feed-flow':
                return (
                    <div className="h-full">
                         <FeedFlow onToggleSidebar={handleToggleSidebar} />
                    </div>
                );
             case 'ai-studio':
                return (
                    <div className="h-full p-4 md:p-6">
                        <AIStudio
                            projects={userProjects}
                            comments={comments}
                            aiSummarySettings={aiSummarySettings}
                            onAiSummarySettingsChange={setAiSummarySettings}
                            onGenerateSummary={handleGenerateSummary}
                            onToggleSidebar={handleToggleSidebar}
                        />
                    </div>
                );
            case 'system-docs':
                return defaultViewWrapper(<SystemDocumentation onToggleSidebar={handleToggleSidebar} />);
            case 'settings':
                return defaultViewWrapper(<Settings 
                    currentUser={currentUser} 
                    theme={theme} 
                    onToggleTheme={toggleTheme} 
                    onLogout={onLogout} 
                    onToggleSidebar={handleToggleSidebar} 
                    isPushEnabled={isPushEnabled}
                    isPushLoading={isPushLoading}
                    onTogglePush={handleTogglePushNotifications}
                />);
            default:
                return (
                    <div className="h-full overflow-y-auto p-4 md:p-6">
                        <Dashboard 
                            projects={userProjects} 
                            tasks={tasks} 
                            team={team}
                            onSelectProject={handleSelectProject} 
                            onNewProjectClick={() => setIsNewProjectModalOpen(true)} 
                            onToggleSidebar={handleToggleSidebar}
                            onUpdateProject={handleUpdateProject}
                            onDeleteProject={handleDeleteProject}
                            showInstallButton={!!deferredPrompt}
                            onInstallClick={handleInstallClick}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="h-full w-full flex font-sans text-base-content overflow-hidden">
            <Sidebar 
                isExpanded={isSidebarExpanded}
                onToggle={handleToggleSidebar}
                currentProject={selectedProject}
                onSelectProject={handleSelectProject}
                onNewProjectClick={() => setIsNewProjectModalOpen(true)}
                activeView={activeView}
                onSelectView={handleSelectView}
                unreadCount={unreadNotificationsCount}
                onToggleNotifications={handleToggleNotificationCenter}
                isNotificationCenterOpen={isNotificationCenterOpen}
                showInstallButton={!!deferredPrompt}
                onInstallClick={handleInstallClick}
            />
            
            <div
                role="button"
                aria-label="Close sidebar"
                tabIndex={-1}
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ease-in-out ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarExpanded(false)}
            />
            
            <div className="flex-1 flex flex-row min-w-0">
                <main className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-[margin] duration-300 ease-in-out md:ml-20`}>
                    <MainContent />
                </main>
                
                {/* Desktop Task Details Panel */}
                <aside className={`
                    flex-shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-l border-white/20 transition-all duration-300 ease-in-out
                    ${showProjectDetailsPanel ? 'w-[480px] p-2' : 'w-0 p-0'}
                `}>
                   {showProjectDetailsPanel && selectedTask && (
                        <TaskDetailsContent
                            task={selectedTask}
                            onClose={handleCloseDetails}
                            team={team}
                            currentUser={currentUser}
                            comments={comments}
                            projects={projects}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onAddComment={handleAddComment}
                            onUpdateComment={handleUpdateComment}
                            onDeleteComment={handleDeleteComment}
                        />
                   )}
                </aside>
            </div>
            
             <NotificationCenter
                isOpen={isNotificationCenterOpen}
                onClose={handleToggleNotificationCenter}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            />

            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onAddProject={handleAddProject}
                team={team}
                currentUser={currentUser}
            />
            <NewTaskModal
                isOpen={isNewTaskModalOpen}
                onClose={() => setIsNewTaskModalOpen(false)}
                onAddTask={handleAddTask}
                team={team}
                defaultStatus={newTaskStatus}
                currentUser={currentUser}
            />
            {/* Mobile/DailyFlow Task Details Modal */}
            <TaskDetailsModal
                task={(isMobile || activeView === 'daily-flow') ? selectedTask : null}
                onClose={handleCloseDetails}
                team={team}
                currentUser={currentUser}
                comments={comments}
                projects={projects}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddComment={handleAddComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
            />
        </div>
    );
};

export default App;
