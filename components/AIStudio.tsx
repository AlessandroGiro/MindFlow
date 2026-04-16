import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: The import path for types was incorrect. It should point to 'types/index'.
import { Project, ProjectComment, AISummarySettings, AI_SUMMARY_TONES, AI_SUMMARY_FORMATS } from '../types/index';
import { ToggleSwitch } from './ToggleSwitch';
import { Loader } from './Loader';

interface AIStudioProps {
    projects: Project[];
    comments: ProjectComment[];
    aiSummarySettings: AISummarySettings;
    onAiSummarySettingsChange: (settings: AISummarySettings) => void;
    onGenerateSummary: (projectId: string) => Promise<string>;
    onToggleSidebar: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-base-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 pb-2 border-b border-base-300">{title}</h3>
        {children}
    </div>
);

const formatSummaryToHtml = (markdownText: string): string => {
    if (!markdownText) return '';

    let html = markdownText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    // Convert '**Title**' into <h2> for better structure and styling
    const sectionTitles = ["Executive Summary", "Key Developments", "Current Focus & Next Steps"];
    sectionTitles.forEach(title => {
        const regex = new RegExp(`^\\s*\\*\\*(${title})\\*\\*`, "gm");
        html = html.replace(regex, `<h2>$1</h2>`);
    });

    // Temporarily replace list blocks to protect them from paragraph processing
    const listPlaceholders = new Map<string, string>();
    const placeholder = (type: string) => `__PLACEHOLDER_${type}_${listPlaceholders.size}__`;

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
        if (trimmedBlock.match(/^__PLACEHOLDER_/) || trimmedBlock.startsWith('<h2>')) return trimmedBlock;
        if (trimmedBlock.startsWith('### ')) return `<h3>${trimmedBlock.substring(4)}</h3>`;
        if (trimmedBlock.startsWith('## ')) return `<h2>${trimmedBlock.substring(3)}</h2>`;
        if (trimmedBlock.startsWith('# ')) return `<h1>${trimmedBlock.substring(2)}</h1>`;
        
        return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    // Restore lists
    listPlaceholders.forEach((listHtml, key) => {
        html = html.replace(key, listHtml);
    });
    
    // Add visual dividers before specific sections
    html = html.replace(/<h2>Key Developments<\/h2>/g, '<hr class="!my-4 !border-base-300/60" /><h2>Key Developments</h2>');
    html = html.replace(/<h2>Current Focus &amp; Next Steps<\/h2>/g, '<hr class="!my-4 !border-base-300/60" /><h2>Current Focus &amp; Next Steps</h2>');


    // Now, process all inline elements
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    return html;
};


export const AIStudio: React.FC<AIStudioProps> = ({
    projects,
    aiSummarySettings,
    onAiSummarySettingsChange,
    onGenerateSummary,
    onToggleSidebar
}) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects.length > 0 ? projects[0].projectId : '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [editedSummary, setEditedSummary] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

     // Auto-resize textarea
    useEffect(() => {
        if (isEditingSummary && textareaRef.current) {
            textareaRef.current.style.height = '0px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = scrollHeight + 'px';
        }
    }, [isEditingSummary, editedSummary]);

    const handleSettingChange = (key: keyof AISummarySettings, value: any) => {
        onAiSummarySettingsChange({
            ...aiSummarySettings,
            [key]: value
        });
    };

    const handleGenerateClick = async () => {
        if (!selectedProjectId) {
            alert('Please select a project.');
            return;
        }
        setIsGenerating(true);
        setIsEditingSummary(false); // Exit edit mode on new generation
        setSummary('');
        try {
            const result = await onGenerateSummary(selectedProjectId);
            setSummary(result);
        } catch (error) {
            console.error("Failed to generate summary:", error);
            setSummary("Error: Could not generate the summary. Please check the console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(summary).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Failed to copy!');
            console.error('Could not copy text: ', err);
        });
    };

    const handleEditClick = () => {
        setEditedSummary(summary);
        setIsEditingSummary(true);
    };

    const handleCancelEdit = () => {
        setIsEditingSummary(false);
    };

    const handleSaveEdit = () => {
        setSummary(editedSummary);
        setIsEditingSummary(false);
    };

    const highlightedSummary = useMemo(() => {
        return { __html: formatSummaryToHtml(summary) };
    }, [summary]);

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6 flex-shrink-0">
                 <div className="flex items-center gap-2">
                     <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-full hover:bg-base-300 md:hidden" aria-label="Toggle menu">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold">AI Studio</h1>
                        <p className="text-base-content-secondary mt-1">Generate insights and content for your projects.</p>
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                <div className="lg:col-span-1 space-y-6 overflow-y-auto">
                    <SettingsSection title="Executive Summary Generator">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="project-select" className="block text-sm font-medium text-base-content-secondary mb-1">Select Project</label>
                                <select 
                                    id="project-select" 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary transition-colors duration-200"
                                    disabled={projects.length === 0}
                                >
                                    {projects.length > 0 ? (
                                        projects.map(p => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)
                                    ) : (
                                        <option>No projects available</option>
                                    )}
                                </select>
                            </div>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating || !selectedProjectId}
                                className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> :
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0V4.5h.004a.75.75 0 0 0 .746.75.75.75 0 0 0 .75-.75h.004V2.75ZM9.25 4.5v-.004a.75.75 0 0 1-.746-.75.75.75 0 0 1 .75-.75v-.004h1.5v.004a.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75v.004h-1.5ZM5.5 5.5A.75.75 0 0 1 6.25 4.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 5.5 5.5Zm6.25-.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" /><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 10Zm0 4.25a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                }
                                <span>{isGenerating ? 'Generating...' : 'Generate Summary'}</span>
                            </button>
                        </div>
                    </SettingsSection>

                    <SettingsSection title="AI Summary Customization">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="ai-tone" className="block text-sm font-medium text-base-content-secondary mb-1">Tone</label>
                                <select 
                                    id="ai-tone" 
                                    value={aiSummarySettings.tone}
                                    onChange={(e) => handleSettingChange('tone', e.target.value)}
                                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary transition-colors duration-200"
                                >
                                    {AI_SUMMARY_TONES.map(tone => <option key={tone} value={tone}>{tone}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="ai-format" className="block text-sm font-medium text-base-content-secondary mb-1">Format</label>
                                <select 
                                    id="ai-format" 
                                    value={aiSummarySettings.format}
                                    onChange={(e) => handleSettingChange('format', e.target.value)}
                                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-primary transition-colors duration-200"
                                >
                                    {AI_SUMMARY_FORMATS.map(format => <option key={format} value={format}>{format}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">Include "Key Developments"</p>
                                    <p className="text-sm text-base-content-secondary/70">Highlight major accomplishments.</p>
                                </div>
                                <ToggleSwitch 
                                    id="include-key-developments"
                                    checked={aiSummarySettings.includeKeyDevelopments}
                                    onChange={(checked) => handleSettingChange('includeKeyDevelopments', checked)}
                                />
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">Include "Next Steps"</p>
                                    <p className="text-sm text-base-content-secondary/70">Outline immediate priorities.</p>
                                </div>
                                <ToggleSwitch 
                                    id="include-next-steps"
                                    checked={aiSummarySettings.includeNextSteps}
                                    onChange={(checked) => handleSettingChange('includeNextSteps', checked)}
                                />
                            </div>
                        </div>
                    </SettingsSection>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-base-200 p-6 rounded-2xl shadow-sm h-full flex flex-col">
                        <h3 className="text-xl font-bold mb-4 pb-2 border-b border-base-300 flex justify-between items-center flex-shrink-0">
                            <span>{isEditingSummary ? 'Editing Summary' : 'Generated Output'}</span>
                             <div className="flex items-center gap-4">
                                {isEditingSummary ? (
                                    <>
                                        <button onClick={handleCancelEdit} className="text-sm font-semibold text-base-content-secondary hover:text-base-content transition-colors">Cancel</button>
                                        <button onClick={handleSaveEdit} className="text-sm font-semibold text-brand-primary hover:underline">Save Changes</button>
                                    </>
                                ) : summary && !isGenerating && (
                                    <>
                                        <button onClick={handleCopyToClipboard} className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1" disabled={!!copySuccess}>
                                             {copySuccess ? (
                                                <>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" /></svg>
                                                <span>{copySuccess}</span>
                                                </>
                                            ) : (
                                                <>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1.378A1.5 1.5 0 0 1 13 12.5v-1.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H7V3.5ZM9.121 7.121a.75.75 0 0 0 .53.22h1.879a.75.75 0 0 0 .53-.22L15 4.343V3.5a.75.75 0 0 0-.75-.75H8.5a.75.75 0 0 0-.75.75v3.121l1.371 1.371Z" /><path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h1.879a.75.75 0 0 1 .53.22l2.622 2.622a.75.75 0 0 1 0 1.06l-2.622 2.622a.75.75 0 0 1-.53.22H4.5A1.5 1.5 0 0 1 3 9.5v-4Z" /></svg>
                                                <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                        <button onClick={handleEditClick} className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" /></svg>
                                            <span>Edit</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </h3>
                        <div className="flex-grow overflow-y-auto min-h-0">
                            {isGenerating ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader />
                                </div>
                            ) : summary ? (
                                isEditingSummary ? (
                                    <textarea
                                        ref={textareaRef}
                                        value={editedSummary}
                                        onChange={(e) => setEditedSummary(e.target.value)}
                                        className="w-full h-full bg-base-100 border-2 border-base-300 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-primary transition-colors duration-200 resize-none"
                                    />
                                ) : (
                                    <div 
                                        className="prose prose-sm dark:prose-invert max-w-none prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-p:my-2 prose-h2:text-lg prose-h2:font-bold prose-h2:mt-4 prose-h2:mb-1 prose-h2:pb-1 prose-h2:border-b prose-h2:border-base-300"
                                        dangerouslySetInnerHTML={highlightedSummary} 
                                    />
                                )
                            ) : (
                                <div className="flex flex-col justify-center items-center h-full text-center text-base-content-secondary p-4">
                                     <div className="p-4 sm:p-6 bg-brand-primary/10 rounded-full mb-6">
                                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 sm:w-16 sm:h-16 text-brand-primary">
                                            <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 9 4.5Zm3.75 1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5h-1.5Zm-5.25 3a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M3 8.25A2.25 2.25 0 0 1 5.25 6H12a.75.75 0 0 1 0 1.5H5.25A.75.75 0 0 0 4.5 8.25v7.5A.75.75 0 0 0 5.25 16.5H9v1.5a.75.75 0 0 1-1.5 0v-1.5H5.25a2.25 2.25 0 0 1-2.25-2.25v-7.5ZM12.75 12a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
                                            <path d="M12.991 8.016a.75.75 0 0 0-1.062-1.062l-1.5 1.5a.75.75 0 1 0 1.062 1.062l1.5-1.5Zm3.75 1.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm-.75 5.25a.75.75 0 0 0 1.062 1.062l1.5-1.5a.75.75 0 1 0-1.062-1.062l-1.5 1.5Z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold">Generate a Project Summary</h3>
                                    <p className="max-w-xs">Select a project and click "Generate Summary" to get an AI-powered executive summary of its current status.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};