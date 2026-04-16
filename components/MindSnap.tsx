
import React, { useState, useEffect } from 'react';
import { Project } from '../types/index';
import { ProjectHeader } from './Header';
import { ConfirmationModal } from './ConfirmationModal';
import { Plus, Edit2, Trash2, X, Palette } from 'lucide-react';

interface MindSnapProps {
    project: Project;
    projects?: Project[];
    viewMode: 'board' | 'documents' | 'mindmap' | 'mindsnap';
    onViewModeChange: (mode: 'board' | 'documents' | 'mindmap' | 'mindsnap') => void;
    onSelectProject?: (project: Project) => void;
    onToggleSidebar: () => void;
}

interface Note {
    id: string;
    title: string;
    content: string;
    color: string;
    createdAt: string;
}

const NOTE_COLORS = [
    { name: 'Yellow', class: 'bg-yellow-100/40 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-700/30' },
    { name: 'Purple', class: 'bg-purple-100/40 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-700/30' },
    { name: 'Green', class: 'bg-green-100/40 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/30' },
    { name: 'Blue', class: 'bg-blue-100/40 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/30' },
    { name: 'Pink', class: 'bg-pink-100/40 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-700/30' },
    { name: 'Gray', class: 'bg-gray-100/40 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/30' },
];

const DEFAULT_NOTES: Note[] = [
    { id: '1', title: 'Brainstorming', content: 'Key takeaways from the meeting:\n- Focus on mobile-first\n- Dark mode is a priority\n- Simplify the onboarding flow', color: NOTE_COLORS[0].class, createdAt: new Date().toISOString() },
    { id: '2', title: 'Design Inspiration', content: 'Check out Dribbble for new glassmorphism trends. Specifically look at the usage of noise textures and blurred gradients.', color: NOTE_COLORS[1].class, createdAt: new Date().toISOString() },
    { id: '3', title: 'Project Goals', content: '1. Launch MVP by Q4\n2. Acquire 1000 beta users\n3. Establish a feedback loop', color: NOTE_COLORS[2].class, createdAt: new Date().toISOString() },
];

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    initialData?: Note;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].class);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setContent(initialData.content);
                setSelectedColor(initialData.color);
            } else {
                setTitle('');
                setContent('');
                setSelectedColor(NOTE_COLORS[0].class);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, content, color: selectedColor });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div 
                className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-base-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-6 ${selectedColor} transition-colors duration-300`}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">{initialData ? 'Edit Note' : 'New Note'}</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/20 border-none rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-brand-primary/50 placeholder-base-content/50 font-bold text-lg"
                            autoFocus
                        />
                        <textarea
                            placeholder="Write your thoughts..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-white/50 dark:bg-black/20 border-none rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-brand-primary/50 placeholder-base-content/50 min-h-[120px] resize-none"
                        />
                        
                        <div className="mb-6">
                            <label className="block text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2 flex items-center gap-1">
                                <Palette size={12} /> Color
                            </label>
                            <div className="flex gap-2">
                                {NOTE_COLORS.map((color) => (
                                    <button
                                        key={color.name}
                                        type="button"
                                        onClick={() => setSelectedColor(color.class)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color.class.split(' ')[0]} ${selectedColor === color.class ? 'border-brand-primary ring-1 ring-brand-primary ring-offset-1 ring-offset-base-200' : 'border-transparent'}`}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-xl font-bold shadow-lg hover:bg-brand-primary/80 transition-colors">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const MindSnap: React.FC<MindSnapProps> = ({ project, projects = [], viewMode, onViewModeChange, onSelectProject = () => {}, onToggleSidebar }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    // Load notes from localStorage on mount or when project changes
    useEffect(() => {
        const savedNotes = localStorage.getItem(`mindsnap_notes_${project.projectId}`);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        } else {
            // Initialize with default notes for new projects if empty
            setNotes(DEFAULT_NOTES);
        }
    }, [project.projectId]);

    // Save notes to localStorage whenever they change
    useEffect(() => {
        if (notes.length > 0 || localStorage.getItem(`mindsnap_notes_${project.projectId}`)) {
             localStorage.setItem(`mindsnap_notes_${project.projectId}`, JSON.stringify(notes));
        }
    }, [notes, project.projectId]);

    const handleSaveNote = (noteData: Omit<Note, 'id' | 'createdAt'>) => {
        if (editingNote) {
            setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...noteData } : n));
        } else {
            const newNote: Note = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                ...noteData
            };
            setNotes(prev => [newNote, ...prev]);
        }
        setEditingNote(undefined);
    };

    const handleEditClick = (note: Note) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setNoteToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (noteToDelete) {
            setNotes(prev => prev.filter(n => n.id !== noteToDelete));
            setNoteToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const handleAddClick = () => {
        setEditingNote(undefined);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col h-full">
             <div className="flex-shrink-0 p-4 md:p-6 pb-0">
                <ProjectHeader 
                    project={project}
                    projects={projects}
                    onSelectProject={onSelectProject}
                    onNewTaskClick={() => {}}
                    onToggleSidebar={onToggleSidebar}
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                />
            </div>
            <div className="flex-grow overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                    {/* Add New Note Card */}
                    <button 
                        onClick={handleAddClick}
                        className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 transition-all group min-h-[200px] animate-fade-in"
                    >
                        <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-brand-primary shadow-sm">
                            <Plus size={28} strokeWidth={3} />
                        </div>
                        <span className="font-bold text-brand-primary/80 text-lg">New Note</span>
                    </button>

                    {notes.map(note => (
                        <div 
                            key={note.id} 
                            className={`group relative p-6 rounded-3xl shadow-lg border backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col ${note.color} animate-fade-in`}
                            onClick={() => handleEditClick(note)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-base-content line-clamp-2 pr-6">{note.title || 'Untitled'}</h3>
                            </div>
                            
                            <p className="text-base-content/80 whitespace-pre-line text-sm leading-relaxed flex-grow line-clamp-6 font-medium">
                                {note.content || <span className="italic opacity-50">No content</span>}
                            </p>
                            
                            <div className="flex justify-between items-end mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                                <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(note); }}
                                        className="p-1.5 rounded-full bg-white/40 hover:bg-white/70 text-base-content hover:text-brand-primary transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(note.id); }}
                                        className="p-1.5 rounded-full bg-white/40 hover:bg-white/70 text-base-content hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <NoteModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveNote} 
                initialData={editingNote}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Note?"
                message="Are you sure you want to delete this note? This action cannot be undone."
                confirmLabel="Delete"
                isDestructive={true}
            />
            
            <style>{`
              @keyframes fade-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
              .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    )
}
