'use client';

import { useState, useRef, useEffect } from 'react';

export default function ColorPalette({ selectedColor = '#fbbf24', onSelect }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef(null);

    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#fbbf24',
        '#84cc16', '#06b6d4', '#6366f1', '#a855f7',
        '#f43f5e', '#eab308', '#22c55e', '#0ea5e9'
    ];

    const handleColorSelect = (color) => {
        onSelect(color);
        setIsExpanded(false);
    };

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isExpanded) return;
            
            const target = event.target;
            // Don't close if clicking within the container
            if (containerRef.current && containerRef.current.contains(target)) {
                return;
            }
            
            setIsExpanded(false);
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside, true);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside, true);
            };
        }
    }, [isExpanded]);

    return (
        <div ref={containerRef} className="w-full color-palette-container">
            {/* Selected Color Display - Clickable */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary transition-colors bg-base-100"
            >
                <div
                    className="w-8 h-8 rounded-full border-2 border-base-300 shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-base-content/70 flex-1 text-left">
                    {isExpanded ? 'Select a color' : 'Click to change color'}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform text-base-content/60 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expandable Color Palette */}
            {isExpanded && (
                <div className="mt-3 p-3 bg-base-200 rounded-lg">
                    <div className="grid grid-cols-8 gap-2">
                        {colors.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handleColorSelect(color)}
                                className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
