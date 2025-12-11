"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function ColorSelect({ options, value, onChange, placeholder = "Select...", label, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(o => o.value == value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    if (disabled) {
        return (
            <div className="w-full opacity-50 cursor-not-allowed border border-base-300 rounded-lg p-3 bg-base-200">
                <span className="text-gray-500">{options.find(o => o.value == value)?.label || placeholder}</span>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className="input input-bordered w-full flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {selectedOption ? (
                        <>
                            {selectedOption.color && (
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedOption.color }}
                                ></div>
                            )}
                            <span>{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <span>▼</span>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`p-3 hover:bg-base-200 cursor-pointer flex items-center gap-2 ${opt.value == value ? 'bg-primary/10' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.color && (
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: opt.color }}
                                ></div>
                            )}
                            <span>{opt.label}</span>
                        </div>
                    ))}
                    {options.length === 0 && <div className="p-3 text-gray-400 text-center">No options</div>}
                </div>
            )}
        </div>
    );
}
