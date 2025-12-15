"use client";
import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { formatDate } from '@/lib/utils';

const CustomDatePicker = ({ value, onChange, label, className = '', size = 'medium' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : undefined);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef(null);
    const buttonRef = useRef(null);

    // Update selected date when value prop changes
    useEffect(() => {
        if (value) {
            // Parse YYYY-MM-DD format in local timezone to avoid UTC conversion
            const [year, month, day] = value.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            setSelectedDate(date);
            setCurrentMonth(date);
        } else {
            setSelectedDate(undefined);
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

    const handleSelect = (date) => {
        if (date) {
            setSelectedDate(date);
            // Format date in local timezone to avoid UTC conversion issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD
            onChange(formattedDate);
        } else {
            setSelectedDate(undefined);
            onChange('');
        }
        setIsOpen(false);
    };

    const displayValue = selectedDate ? formatDate(selectedDate) : '';
    const heightClass = size === 'small' ? 'h-8 min-h-8' : 'h-12 min-h-12';
    const textSizeClass = size === 'small' ? 'text-sm' : 'text-base';

    return (
        <div className={`relative w-full ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
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
                <span className={displayValue ? '' : 'text-gray-400'}>
                    {displayValue || 'Pick a date'}
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
                <div className="dropdown absolute top-full left-0 mt-1 z-[9999] bg-base-100 border border-base-300 rounded-2xl shadow-xl p-4 min-w-[280px]" style={{ zIndex: 9999 }}>
                    {/* Year Navigation - Top Center */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <button
                            type="button"
                            className="text-base-content hover:opacity-70 transition-opacity cursor-pointer"
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setFullYear(newMonth.getFullYear() - 1);
                                setCurrentMonth(newMonth);
                            }}
                            title="Previous year"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="text-lg font-bold text-base-content px-2">{currentMonth.getFullYear()}</span>
                        <button
                            type="button"
                            className="text-base-content hover:opacity-70 transition-opacity cursor-pointer"
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setFullYear(newMonth.getFullYear() + 1);
                                setCurrentMonth(newMonth);
                            }}
                            title="Next year"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                    {/* Month Display with Navigation */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <button
                            type="button"
                            className="text-base-content hover:opacity-70 transition-opacity cursor-pointer"
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setMonth(newMonth.getMonth() - 1);
                                setCurrentMonth(newMonth);
                            }}
                            title="Previous month"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <span className="text-base text-base-content min-w-[120px] text-center">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                        </span>
                        <button
                            type="button"
                            className="text-base-content hover:opacity-70 transition-opacity cursor-pointer"
                            onClick={() => {
                                const newMonth = new Date(currentMonth);
                                newMonth.setMonth(newMonth.getMonth() + 1);
                                setCurrentMonth(newMonth);
                            }}
                            title="Next month"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>
                    </div>
                    <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleSelect}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="react-day-picker"
                        weekStartsOn={1}
                        showOutsideDays={false}
                        classNames={{
                            months: 'w-full',
                            month: 'w-full',
                            caption: 'hidden',
                            caption_label: 'hidden',
                            nav: 'hidden',
                            button_previous: 'hidden',
                            button_next: 'hidden',
                            month_caption: 'hidden',
                            weekdays: 'flex justify-between mb-3',
                            weekday: 'text-gray-500 text-xs font-normal w-[calc(100%/7)] text-center',
                            week: 'flex justify-between mb-1 gap-4',
                            day: 'w-[calc(100%/7)] text-center',
                            day_button: 'w-full h-9 flex items-center justify-center rounded-lg hover:bg-base-200 text-base-content',
                            selected: '!bg-purple-600 !text-white hover:!bg-purple-700',
                            today: 'font-semibold',
                        }}
                        modifiersClassNames={{
                            selected: '!bg-purple-600 !text-white',
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
