"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToasterContext = createContext(null);

export function useToaster() {
    return useContext(ToasterContext);
}

export function ToasterProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // Helper functions
    const success = (msg) => showToast(msg, 'success');
    const error = (msg) => showToast(msg, 'error');
    const info = (msg) => showToast(msg, 'info');

    return (
        <ToasterContext.Provider value={{ showToast, success, error, info }}>
            {children}
            <div className="toast toast-end toast-bottom" style={{ zIndex: 100001 }}>
                {toasts.map(toast => (
                    <div key={toast.id} className={`alert alert-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToasterContext.Provider>
    );
}
