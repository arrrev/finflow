"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    label,
    disabled,
    searchable = true
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Normalize options to { label, value, color? }
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) return opt;
        return { label: opt, value: opt };
    });

    const selectedOption = normalizedOptions.find(o => o.value == value);

    // Filter options based on search term
    const filteredOptions = normalizedOptions.filter(opt =>
        opt.label.toString().toLowerCase().includes(searchTerm.toLowerCase())
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
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm('');
        }
    };

    if (disabled) {
        return (
            <div className="w-full opacity-50 cursor-not-allowed border border-base-300 rounded-lg p-3 bg-base-200">
                <span className="text-gray-500">{selectedOption?.label || placeholder}</span>
            </div>
        );
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className="input input-bordered w-full flex items-center justify-between cursor-pointer"
                onClick={handleToggle}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption ? (
                        <>
                            {selectedOption.color && (
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: selectedOption.color }}
                                ></div>
                            )}
                            <span className="truncate">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <span className="opacity-50 text-xs">▼</span>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-60 overflow-hidden z-50 flex flex-col">
                    {searchable && (
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
                    )}
                    <div className="overflow-y-auto flex-1">
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
                                <span className="truncate">{opt.label}</span>
                            </div>
                        ))}
                        {filteredOptions.length === 0 && <div className="p-3 text-gray-400 text-center">No matches</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
