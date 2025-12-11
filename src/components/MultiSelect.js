"use client";
import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, selectedIds, onChange, label, placeholder = "Select..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const toggleOption = (id) => {
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter(sid => sid !== id)
            : [...selectedIds, id];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.id));
        }
    };

    const displayText = selectedIds.length === 0
        ? "All"
        : selectedIds.length === options.length
            ? "All Selected"
            : `${selectedIds.length} Selected`;

    return (
        <div className="dropdown" ref={dropdownRef}>
            <div
                tabIndex={0}
                role="button"
                className="btn btn-sm btn-bordered w-full justify-between font-normal bg-base-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{displayText}</span>
                <span className="text-xs opacity-50">▼</span>
            </div>
            {isOpen && (
                <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow bg-base-100 rounded-box w-64 max-h-80 overflow-y-auto block">
                    <li className="mb-2">
                        <label className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded-lg p-2">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-xs checkbox-primary"
                                checked={selectedIds.length === options.length && options.length > 0}
                                onChange={handleSelectAll}
                            />
                            <span className="font-bold">Select All</span>
                        </label>
                    </li>
                    <div className="divider my-0"></div>
                    {options.map((opt) => (
                        <li key={opt.id}>
                            <label className="label cursor-pointer justify-start gap-3 hover:bg-base-200 rounded-lg p-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-xs"
                                    checked={selectedIds.includes(opt.id)}
                                    onChange={() => toggleOption(opt.id)}
                                />
                                <div className="flex items-center gap-2 truncate">
                                    {opt.color && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }}></div>}
                                    <span className="truncate">{opt.name}</span>
                                </div>
                            </label>
                        </li>
                    ))}
                    {options.length === 0 && <li className="text-center opacity-50 p-2">No options</li>}
                </ul>
            )}
        </div>
    );
}
