import React from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { TeamMember } from '../types/index';
import { ThemeToggle } from './ThemeToggle';

interface SettingsProps {
    currentUser: TeamMember;
    theme: string;
    onToggleTheme: () => void;
    onLogout: () => void;
    onToggleSidebar: () => void;
    isPushEnabled: boolean;
    isPushLoading: boolean;
    onTogglePush: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-base-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 pb-2 border-b border-base-300">{title}</h3>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
     <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 gap-2">
        <span className="text-base-content-secondary font-medium">{label}</span>
        <span className="font-semibold text-left sm:text-right">{value}</span>
    </div>
);


export const Settings: React.FC<SettingsProps> = ({ currentUser, theme, onToggleTheme, onLogout, onToggleSidebar, isPushEnabled, isPushLoading, onTogglePush }) => {
    
    const pushStatus = Notification.permission;

    return (
        <div>
            <header className="mb-6">
                 <div className="flex items-center gap-2">
                     <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">Settings</h1>
                        <p className="text-base-content-secondary mt-1">Manage your profile and application settings.</p>
                    </div>
                </div>
            </header>
            <div className="space-y-6 max-w-3xl">
                <SettingsSection title="Profile">
                    <InfoRow label="Full Name" value={currentUser.name} />
                    <InfoRow label="Email Address" value={currentUser.email} />
                </SettingsSection>

                <SettingsSection title="Appearance">
                    <div className="flex justify-between items-center py-2">
                        <div >
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-base-content-secondary/70">Switch between light and dark mode.</p>
                        </div>
                        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
                    </div>
                </SettingsSection>

                <SettingsSection title="Notifications">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 gap-4">
                        <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-base-content-secondary/70">
                                {pushStatus === 'denied' 
                                    ? 'You have blocked notifications. Please enable them in your browser settings.'
                                    : 'Receive updates even when the app is not open.'
                                }
                            </p>
                        </div>
                        {isPushLoading ? (
                            <div className="w-6 h-6 border-2 border-base-content border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <button 
                                onClick={onTogglePush}
                                disabled={pushStatus === 'denied'}
                                className={`font-bold py-2 px-4 rounded-xl transition-colors duration-300 self-start sm:self-center w-24 ${
                                    isPushEnabled 
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400'
                                    : 'bg-brand-primary hover:bg-brand-primary/80 text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isPushEnabled ? 'Disable' : 'Enable'}
                            </button>
                        )}
                    </div>
                </SettingsSection>

                <SettingsSection title="Account">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 gap-4">
                        <div>
                            <p className="font-medium">Log Out</p>
                             <p className="text-sm text-base-content-secondary/70">End your current session on this device.</p>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded-xl transition-colors duration-300 self-start sm:self-center"
                        >
                            Log Out
                        </button>
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
};