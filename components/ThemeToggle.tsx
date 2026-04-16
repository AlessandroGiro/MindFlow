import React from 'react';

interface ThemeToggleProps {
    theme: string;
    onToggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggleTheme }) => {
    const isDark = theme === 'dark';

    return (
        <label 
            htmlFor="theme-toggle" 
            className="relative inline-flex items-center cursor-pointer" 
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <input
                type="checkbox"
                checked={isDark}
                onChange={onToggleTheme}
                id="theme-toggle"
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-base-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-base-content/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
        </label>
    );
};