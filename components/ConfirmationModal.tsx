import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    children?: React.ReactNode; // Allow custom content like inputs
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmLabel = "Confirm", 
    cancelLabel = "Cancel", 
    isDestructive = false,
    children,
    isLoading = false
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 overflow-hidden border border-base-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-base-content">{title}</h3>
                    <p className="text-base-content-secondary mb-4">{message}</p>
                    
                    {children && (
                        <div className="mb-6">
                            {children}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 rounded-xl font-medium hover:bg-base-300 text-base-content transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                                isDestructive 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-brand-primary hover:bg-brand-primary/80'
                            }`}
                        >
                            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
              @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.15s ease-out forwards; }
            `}</style>
        </div>,
        document.body
    );
};