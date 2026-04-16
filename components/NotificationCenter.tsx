import React from 'react';
import { AppNotification } from '../types/index';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    onNotificationClick: (notification: AppNotification) => void;
    onMarkAllAsRead: () => void;
}

const UserAvatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-base-300 flex items-center justify-center font-bold text-sm text-base-content-secondary">
        {name.charAt(0)}
    </div>
);

const TimeAgo: React.FC<{ date: string }> = ({ date }) => {
    const formatTimeAgo = (d: string): string => {
        const seconds = Math.floor((new Date().getTime() - new Date(d).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };
    return <span className="text-xs text-base-content-secondary whitespace-nowrap">{formatTimeAgo(date)}</span>;
};

const NotificationIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
    const iconStyles = "h-3 w-3 text-white";
    switch (type) {
        case 'mention':
            return <div className="bg-blue-500 rounded-full p-px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={iconStyles}><path d="M6.25 6.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" /><path fillRule="evenodd" d="M3.5 4.75A.75.75 0 0 1 4.25 4h11.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-2.635a.75.75 0 0 0-.53.22L10 18.293l-2.335-2.336a.75.75 0 0 0-.53-.22H4.25a.75.75 0 0 1-.75-.75V4.75Zm.75 0v10.5h2.635c.22 0 .43.084.594.236L10 16.94l2.52-2.524a.75.75 0 0 0 .595-.236h2.635V4.75H4.25Z" clipRule="evenodd" /></svg></div>;
        case 'reply':
            return <div className="bg-green-500 rounded-full p-px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={iconStyles}><path fillRule="evenodd" d="M10 2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8Zm.5 5.5a.5.5 0 0 0-1 0v2.768l-2.12-.32a.5.5 0 0 0-.566.652l2.39 4.301a.5.5 0 0 0 .886-.062l2.38-5.712a.5.5 0 0 0-.62-.64l-2.31.35V7.5Z" clipRule="evenodd" /></svg></div>;
        case 'digest':
            return <div className="bg-purple-500 rounded-full p-px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={iconStyles}><path d="M10 3a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 10 3ZM10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" /><path fillRule="evenodd" d="M.5 10a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0ZM10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" clipRule="evenodd" /></svg></div>;
    }
};

const NotificationItem: React.FC<{ notification: AppNotification; onNotificationClick: (notification: AppNotification) => void; }> = ({ notification, onNotificationClick }) => {
    return (
        <div 
            onClick={() => onNotificationClick(notification)}
            className={`relative p-3 rounded-xl transition-colors duration-200 cursor-pointer ${notification.isRead ? 'hover:bg-base-300/50' : 'bg-brand-primary/10 hover:bg-brand-primary/20'}`}
        >
            {!notification.isRead && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-primary" aria-label="Unread"></div>
            )}
            <div className="flex gap-3 items-start">
                <div className="relative mt-1">
                    <UserAvatar name={notification.author} />
                    <div className="absolute -bottom-0.5 -right-0.5">
                        <NotificationIcon type={notification.type} />
                    </div>
                </div>
                <div className="flex-grow">
                    <p className="text-sm">
                        <span className="font-bold">{notification.author}</span> {notification.message}
                    </p>
                    <TimeAgo date={notification.createdAt} />
                </div>
            </div>
        </div>
    );
};


export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, notifications, onNotificationClick, onMarkAllAsRead }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
       <>
            <div 
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside 
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-base-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-panel-title"
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-base-300">
                    <h2 id="notification-panel-title" className="text-xl font-bold">Notifications</h2>
                    <div className="flex items-center gap-2">
                         {unreadCount > 0 && (
                            <button onClick={onMarkAllAsRead} className="text-sm font-semibold text-brand-primary hover:underline">
                                Mark all as read
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-base-300" aria-label="Close notifications">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </header>
                <main className="flex-grow p-2 overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="space-y-2">
                             {notifications.map(n => <NotificationItem key={n.id} notification={n} onNotificationClick={onNotificationClick} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-base-content-secondary p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-base-content-secondary/50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            <h3 className="text-lg font-bold">All caught up!</h3>
                            <p className="max-w-xs">You have no new notifications. We'll let you know when something new comes up.</p>
                        </div>
                    )}
                </main>
            </aside>
       </>
    );
};