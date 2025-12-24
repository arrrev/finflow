"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "error" }) {
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleEsc);
        
        // Prevent body scroll locking
        if (isOpen) {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
            if (!isOpen) {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !loading) {
            onCancel();
        }
    };

    const handleConfirm = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <dialog className="modal modal-open" open onClick={handleBackdropClick}>
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
                style={{ zIndex: 99999 }}
                onClick={handleBackdropClick}
            />
            <div 
                className="modal-box w-11/12 max-w-md relative" 
                style={{ zIndex: 100000 }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action items-center">
                    <button className="btn h-10" onClick={onCancel} disabled={loading}>{cancelText}</button>
                    <button
                        className={`btn h-10 ${type === 'error' ? 'btn-error' : 'btn-primary'}`}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="loading loading-spinner loading-sm"></span>
                                Processing...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </dialog>
    );

    // Render modal at document root level to avoid positioning issues
    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    
    return modalContent;
}
