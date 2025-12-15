"use client";
import { useState, useRef, useEffect } from 'react';

const CustomYearPicker = ({ value, onChange, label, className = '', size = 'medium' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [selectedYear, setSelectedYear] = useState(value ? parseInt(value) : new Date().getFullYear());

    // Update selected year when value changes
    useEffect(() => {
        if (value) {
            setSelectedYear(parseInt(value));
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const handleYearChange = (year) => {
        setSelectedYear(year);
        onChange(year.toString());
        setIsOpen(false);
    };

    const handleYearDecrease = () => {
        const newYear = selectedYear - 1;
        setSelectedYear(newYear);
        onChange(newYear.toString());
    };

    const handleYearIncrease = () => {
        const newYear = selectedYear + 1;
        setSelectedYear(newYear);
        onChange(newYear.toString());
    };

    const heightClass = size === 'small' ? 'h-8 min-h-8' : 'h-12 min-h-12';
    const textSizeClass = size === 'small' ? 'text-sm' : 'text-base';

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="label">
                    <span className="label-text">{label}</span>
                </label>
            )}
            <button
                type="button"
                className={`input input-bordered w-full flex items-center justify-between cursor-pointer ${heightClass} ${textSizeClass}`}
                style={{
                    height: size === 'small' ? '2rem' : '3rem',
                    minHeight: size === 'small' ? '2rem' : '3rem',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem',
                    paddingTop: '0.25rem',
                    paddingBottom: '0.25rem'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedYear ? '' : 'text-gray-400'}>
                    {selectedYear || 'Pick a year'}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 opacity-50"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
            </button>

            {isOpen && (
                <div className="dropdown absolute top-full left-0 mt-1 z-50 bg-base-100 border border-base-300 rounded-2xl shadow-xl p-4 min-w-[200px]">
                    <div className="flex flex-col gap-3">
                        {/* Year Navigation */}
                        <div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline btn-square"
                                    onClick={handleYearDecrease}
                                    title="Previous year"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                    </svg>
                                </button>
                                <div className="flex-1 text-center font-semibold px-2">
                                    {selectedYear}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline btn-square"
                                    onClick={handleYearIncrease}
                                    title="Next year"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomYearPicker;

