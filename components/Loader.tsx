import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full animate-spin border-4 border-solid border-brand-primary border-t-transparent"></div>
            <p className="text-lg font-semibold text-base-content-secondary">Loading...</p>
        </div>
    );
};
