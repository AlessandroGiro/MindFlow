
import React from 'react';

interface FeedFlowProps {
    onToggleSidebar: () => void;
}

export const FeedFlow: React.FC<FeedFlowProps> = ({ onToggleSidebar }) => {
    return (
        <div className="h-full flex flex-col bg-base-100 p-4 md:p-6 overflow-y-auto">
            <header className="flex items-center gap-2 mb-8">
                <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold">MindFeed</h1>
                    <p className="text-base-content-secondary mt-1">Stay updated with the latest team activity.</p>
                </div>
            </header>

            <div className="max-w-3xl mx-auto w-full space-y-8">
                {/* Placeholder Input Area */}
                <div className="bg-base-200 rounded-2xl p-4 shadow-sm border border-base-300">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                            You
                        </div>
                        <div className="flex-grow">
                            <div className="h-12 w-full bg-base-100 rounded-xl border border-base-300 flex items-center px-4 text-base-content-secondary cursor-not-allowed opacity-60">
                                Share an update with the team...
                            </div>
                            <div className="flex justify-end mt-2">
                                <button disabled className="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold opacity-50 cursor-not-allowed">
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder Feed Items */}
                <div className="space-y-6 relative">
                    <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-base-300"></div>

                    {/* Item 1 */}
                    <div className="relative pl-14">
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center border-4 border-base-100 z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="bg-base-200 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold">Sarah Miller</span>
                                    <span className="text-base-content-secondary"> completed a task</span>
                                </div>
                                <span className="text-xs text-base-content-secondary">2h ago</span>
                            </div>
                            <div className="mt-2 p-3 bg-base-100 rounded-xl border border-base-300/50 text-sm font-medium">
                                Finalize Q3 Marketing Budget
                            </div>
                        </div>
                    </div>

                     {/* Item 2 */}
                     <div className="relative pl-14">
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border-4 border-base-100 z-10">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                        </div>
                        <div className="bg-base-200 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold">David Chen</span>
                                    <span className="text-base-content-secondary"> created a new project</span>
                                </div>
                                <span className="text-xs text-base-content-secondary">5h ago</span>
                            </div>
                            <h3 className="mt-2 font-bold text-lg">Mobile App Redesign 2025</h3>
                            <p className="text-base-content-secondary text-sm mt-1">
                                Kickoff for the complete overhaul of our iOS and Android applications. Focusing on improved UX and performance.
                            </p>
                        </div>
                    </div>

                    {/* Item 3 */}
                    <div className="relative pl-14">
                        <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center border-4 border-base-100 z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a.78.78 0 0 1 .527-.224 41.202 41.202 0 0 0 5.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2M8 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                        </div>
                        <div className="bg-base-200 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold">Alex Johnson</span>
                                    <span className="text-base-content-secondary"> commented on a task</span>
                                </div>
                                <span className="text-xs text-base-content-secondary">Yesterday</span>
                            </div>
                             <div className="mt-2 p-3 bg-base-100 rounded-xl border border-base-300/50 italic text-base-content-secondary text-sm">
                                "Great work on the initial mockups! I've left a few notes in Figma regarding the color palette."
                            </div>
                        </div>
                    </div>

                </div>
                
                <div className="text-center py-8 text-base-content-secondary/50 text-sm font-medium italic">
                    More updates coming soon...
                </div>
            </div>
        </div>
    );
};