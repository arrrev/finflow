"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function ColorSelect({ options, value, onChange, placeholder = "Select...", label, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    const selectedOption = options.find(o => o.value == value);

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm('');
        }
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
                onClick={handleToggle}
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
                <div className="absolute top-full left-0 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-60 overflow-hidden z-50">
                    <div className="p-2 border-b border-base-300">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="input input-sm input-bordered w-full"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filteredOptions.map((opt) => (
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
                        {filteredOptions.length === 0 && <div className="p-3 text-gray-400 text-center">No matches</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
