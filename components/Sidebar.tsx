
import React from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project } from '../types/index';

type ActiveView = 'dashboard' | 'project' | 'my-tasks' | 'settings' | 'ai-studio' | 'system-docs' | 'daily-flow' | 'feed-flow';

interface SidebarProps {
    isExpanded: boolean; // Currently used for Mobile drawer toggle
    onToggle: () => void;
    currentProject: Project | null;
    onSelectProject: (project: Project | null) => void;
    onNewProjectClick: () => void;
    activeView: ActiveView;
    onSelectView: (view: ActiveView) => void;
    unreadCount: number;
    onToggleNotifications: () => void;
    isNotificationCenterOpen: boolean;
    showInstallButton?: boolean;
    onInstallClick?: () => void;
}

const NavLink: React.FC<{
    isCurrent: boolean;
    onClick: (e: React.MouseEvent) => void;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
}> = ({ isCurrent, onClick, children, title, disabled }) => (
    <a
        href="#"
        onClick={(e) => {
            e.preventDefault();
            if (!disabled) onClick(e);
        }}
        className={`group relative block text-left rounded-2xl transition-all duration-200 text-sm font-bold flex justify-center items-center h-12 w-12 mx-auto
            ${isCurrent 
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                : 'text-base-content hover:bg-white/60 dark:hover:bg-white/10'}
            ${disabled ? 'text-base-content-secondary/50 cursor-not-allowed' : ''}
        `}
        aria-current={isCurrent ? 'page' : undefined}
        title={title} // Basic title attribute as fallback
    >
        {children}
        
        {/* Stylized Tooltip */}
        <div className="absolute left-14 z-50 px-3 py-2 text-xs font-bold text-white bg-gray-900 rounded-lg shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none whitespace-nowrap flex items-center min-w-max">
            <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-[6px] border-transparent border-r-gray-900"></div>
            {title}
        </div>
    </a>
);

export const Sidebar: React.FC<SidebarProps> = ({
    isExpanded,
    onToggle,
    currentProject,
    onSelectProject,
    onNewProjectClick,
    activeView,
    onSelectView,
    unreadCount,
    onToggleNotifications,
    isNotificationCenterOpen,
    showInstallButton,
    onInstallClick,
}) => {
    
    const mainNavItems = [
        { 
            name: 'Home', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>,
            view: 'dashboard',
            isCurrent: activeView === 'dashboard',
            onClick: () => onSelectView('dashboard'),
        },
        { 
            name: 'My Tasks', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
            view: 'my-tasks',
            isCurrent: activeView === 'my-tasks',
            onClick: () => onSelectView('my-tasks'),
        },
        { 
            name: 'MindPlan', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>,
            view: 'daily-flow',
            isCurrent: activeView === 'daily-flow',
            onClick: () => onSelectView('daily-flow'),
        },
        { 
            name: 'MindFeed', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>,
            view: 'feed-flow',
            isCurrent: activeView === 'feed-flow',
            onClick: () => onSelectView('feed-flow'),
        }
    ];

    return (
        <aside 
            className={`fixed top-0 left-0 h-full z-40 flex flex-col p-4 transition-transform md:transition-none duration-300 ease-in-out ${isExpanded ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 md:w-20 md:items-center`}
            aria-label="Sidebar"
        >
            {/* Glass Panel Background */}
            <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-r border-white/20 dark:border-white/5 md:bg-transparent md:dark:bg-transparent md:backdrop-blur-none md:border-none md:static md:inset-auto md:h-full md:flex md:flex-col">
            
                {/* Header Section */}
                <div className={`flex-shrink-0 w-full mb-8 mt-2 px-2 flex justify-center`}>
                    <div className="group relative flex items-center justify-center gap-3 w-full cursor-pointer" onClick={() => onSelectView('dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg flex-shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2.5C5.8 2.5 3.5 6.2 4.6 12c1.1 5.8 6.4 9.5 7.4 9.5s6.3-3.7 7.4-9.5c1.1-5.8-1.2-9.5-7.4-9.5zM12 7c-3.2 0-4.3 1.6-3.7 5.1.6 3.5 3.7 5.9 3.7 5.9s3.1-2.4 3.7-5.9c.6-3.5-.5-5.1-3.7-5.1z" />
                            </svg>
                        </div>
                        {/* Tooltip for Logo */}
                        <div className="absolute left-14 z-50 px-3 py-2 text-xs font-bold text-white bg-gray-900 rounded-lg shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none whitespace-nowrap flex items-center min-w-max">
                            <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-[6px] border-transparent border-r-gray-900"></div>
                            Home
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col w-full overflow-y-auto md:overflow-visible space-y-6 px-2 no-scrollbar">
                    <nav className="space-y-2 flex-grow">
                        {mainNavItems.map(item => (
                            <NavLink 
                                key={item.name}
                                isCurrent={item.isCurrent}
                                onClick={item.onClick}
                                title={item.name}
                            >
                                {item.icon}
                            </NavLink>
                        ))}
                    </nav>

                    <button
                        onClick={onNewProjectClick}
                        className={`group relative w-12 h-12 bg-brand-secondary text-brand-primary font-extrabold rounded-2xl shadow-sm transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto hover:shadow-lg hover:shadow-brand-secondary/30`}
                        title="New Project"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 flex-shrink-0">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        
                         {/* Tooltip for New Project */}
                        <div className="absolute left-14 z-50 px-3 py-2 text-xs font-bold text-white bg-gray-900 rounded-lg shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none whitespace-nowrap flex items-center min-w-max">
                            <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-[6px] border-transparent border-r-gray-900"></div>
                            New Project
                        </div>
                    </button>
                </div>
                
                {/* Footer */}
                <div className={`w-full mt-auto pt-4 pb-4 px-2`}>
                    <nav className="space-y-2">
                        <NavLink
                            isCurrent={isNotificationCenterOpen}
                            onClick={onToggleNotifications}
                            title="Notifications"
                        >
                            <span className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </span>
                        </NavLink>
                         <NavLink
                            isCurrent={activeView === 'system-docs'}
                            onClick={() => onSelectView('system-docs')}
                            title="System Docs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                        </NavLink>
                        {showInstallButton && onInstallClick && (
                            <button
                                onClick={onInstallClick}
                                className={`group relative block text-left rounded-2xl transition-all duration-200 text-sm font-bold flex justify-center items-center h-12 w-12 mx-auto text-brand-primary hover:bg-brand-primary/10`}
                                title="Install App"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                 {/* Tooltip */}
                                <div className="absolute left-14 z-50 px-3 py-2 text-xs font-bold text-white bg-gray-900 rounded-lg shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 pointer-events-none whitespace-nowrap flex items-center min-w-max">
                                    <div className="absolute top-1/2 -left-1.5 -mt-1.5 border-[6px] border-transparent border-r-gray-900"></div>
                                    Install App
                                </div>
                            </button>
                        )}
                        <NavLink
                            isCurrent={activeView === 'settings'}
                            onClick={() => onSelectView('settings')}
                            title="Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                            </svg>
                        </NavLink>
                    </nav>
                </div>
            </div>
        </aside>
    );
};