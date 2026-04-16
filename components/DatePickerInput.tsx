import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface DatePickerInputProps {
    id: string;
    label: string;
    value: string | null;
    onChange: (date: string | null) => void;
    placeholder?: string;
}

// Icon components for clarity
const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-base-content-secondary">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H4.75Z" clipRule="evenodd" />
    </svg>
);

const ClearIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-base-content-secondary"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
);

const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
);

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
);

export const DatePickerInput: React.FC<DatePickerInputProps> = ({ id, label, value, onChange, placeholder = "Select a date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Use UTC dates to avoid timezone issues
    const [viewDate, setViewDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const [isAbove, setIsAbove] = useState(false);
    const [alignRight, setAlignRight] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && !containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);
    
    // Reset view date when value changes externally
    useEffect(() => {
        if (value && !isOpen) {
            setViewDate(new Date(value + 'T00:00:00'));
        } else if (!value && !isOpen) {
            setViewDate(new Date());
        }
    }, [value, isOpen]);

    // This effect calculates the calendar's position when it opens.
    useLayoutEffect(() => {
        if (isOpen && containerRef.current && calendarRef.current) {
            const inputRect = containerRef.current.getBoundingClientRect();
            const calendarHeight = calendarRef.current.offsetHeight;
            const calendarWidth = calendarRef.current.offsetWidth;
            
            // Determine vertical placement
            const spaceBelow = window.innerHeight - inputRect.bottom;
            if (spaceBelow < calendarHeight && inputRect.top > calendarHeight) {
                setIsAbove(true);
            } else {
                setIsAbove(false);
            }
            
            // Determine horizontal placement
            const spaceRight = window.innerWidth - inputRect.left;
            if (spaceRight < calendarWidth) {
                setAlignRight(true);
            } else {
                setAlignRight(false);
            }
        }
    }, [isOpen]);
    
    const handleDateSelect = (day: number) => {
        const newDate = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), day));
        // Format to YYYY-MM-DD
        const formattedDate = newDate.toISOString().split('T')[0];
        onChange(formattedDate);
        setIsOpen(false);
    };

    const changeMonth = (amount: number) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(prev.getUTCMonth() + amount);
            return newDate;
        });
    };

    const getMonthDays = () => {
        const year = viewDate.getUTCFullYear();
        const month = viewDate.getUTCMonth();
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(Date.UTC(year, month, day));
            const currentDateStr = currentDate.toISOString().split('T')[0];
            const today = new Date();
            today.setUTCHours(0,0,0,0);
            
            const isSelected = value === currentDateStr;
            const isToday = today.getTime() === currentDate.getTime();

            let classes = "w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors text-sm ";
            if (isSelected) {
                classes += "bg-brand-primary text-white font-bold";
            } else if (isToday) {
                classes += "bg-base-300 dark:bg-zinc-700 font-bold";
            } else {
                classes += "hover:bg-base-300 dark:hover:bg-zinc-700";
            }

            days.push(
                <button type="button" key={day} onClick={() => handleDateSelect(day)} className={classes}>
                    {day}
                </button>
            );
        }
        return days;
    };

    const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    }) : placeholder;

    return (
        <div className="relative" ref={containerRef}>
            <label htmlFor={id} className="block text-sm font-bold mb-2 text-base-content-secondary">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    id={id}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-base-100 border-2 border-base-300 rounded-xl py-3 pl-4 pr-12 text-left focus:outline-none focus:border-brand-primary transition-colors duration-200 flex items-center h-[50px]"
                >
                    <span className={value ? 'text-base-content' : 'text-base-content-secondary/70'}>
                        {displayValue}
                    </span>
                </button>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {value && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            className="p-1 rounded-full hover:bg-base-300/80"
                            aria-label="Clear date"
                        >
                            <ClearIcon />
                        </button>
                    )}
                     <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-1" aria-label="Open calendar">
                        <CalendarIcon />
                    </button>
                </div>
            </div>

            {isOpen && (
                <div
                    ref={calendarRef}
                    className={`absolute z-50 w-80 bg-base-200 dark:bg-zinc-800 border border-base-300 rounded-2xl shadow-lg p-4 animate-fade-in-sm
                        ${isAbove ? 'bottom-full mb-2' : 'top-full mt-2'}
                        ${alignRight ? 'right-0' : 'left-0'}`
                    }
                >
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Previous month"><ChevronLeftIcon /></button>
                        <div className="font-bold text-base">
                            {months[viewDate.getUTCMonth()]} {viewDate.getUTCFullYear()}
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-base-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Next month"><ChevronRightIcon /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-base-content-secondary mb-2 font-bold">
                        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {getMonthDays()}
                    </div>
                    <style>{`
                      @keyframes fade-in-sm { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                      .animate-fade-in-sm { animation: fade-in-sm 0.15s ease-out forwards; }
                    `}</style>
                </div>
            )}
        </div>
    );
};
