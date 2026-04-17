import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Selecione uma opção...',
    searchPlaceholder = 'Buscar...',
    className,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const [isMobile, setIsMobile] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, position: 'bottom' as 'top' | 'bottom' });
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Handle animation states
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsAnimatingOut(false);
            // Delay mounting state to trigger transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsMounted(true));
            });
        } else if (shouldRender) {
            setIsAnimatingOut(true);
            setIsMounted(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsAnimatingOut(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    const selectedOption = useMemo(() => 
        options.find(opt => opt.value === value), 
    [options, value]);

    const filteredOptions = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return options;
        return options.filter(opt => 
            opt.label.toLowerCase().includes(term) || 
            opt.value.toLowerCase().includes(term)
        );
    }, [options, searchTerm]);

    // Screen size detection for mobile behavior
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sync active index with filtering
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchTerm]);

    const updateCoords = () => {
        if (wrapperRef.current && !isMobile) {
            const rect = wrapperRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 350; // Estimated max height
            
            if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                // Open upward - overlap border by 2px
                setCoords({
                    top: rect.top + 2,
                    left: rect.left,
                    width: rect.width,
                    position: 'top'
                });
            } else {
                // Open downward - overlap border by 2px
                setCoords({
                    top: rect.bottom - 2,
                    left: rect.left,
                    width: rect.width,
                    position: 'bottom'
                });
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [isOpen, isMobile]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                const portalContent = document.getElementById('searchable-select-portal');
                if (portalContent && portalContent.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[activeIndex].value);
                } else if (filteredOptions.length === 1) {
                    handleSelect(filteredOptions[0].value);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    };

    // Auto-scroll the active item into view
    useEffect(() => {
        if (activeIndex >= 0 && listRef.current) {
            const activeEl = listRef.current.children[activeIndex] as HTMLElement;
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex]);

    const toggleOpen = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    };

    const desktopDropdown = (
        <div 
            id="searchable-select-portal"
            className={cn(
                "fixed z-[10000] transition-all duration-300 ease-out",
                coords.position === 'bottom' ? "origin-top" : "origin-bottom",
                isMounted && !isAnimatingOut
                    ? "opacity-100 scale-y-100 translate-y-0" 
                    : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
            )}
            style={{ 
                top: coords.position === 'bottom' ? `${coords.top}px` : 'auto',
                bottom: coords.position === 'top' ? `${window.innerHeight - coords.top}px` : 'auto', 
                left: `${coords.left}px`, 
                width: `${coords.width}px` 
            }}
        >
            <div className={cn(
                "bg-white border-2 border-blue-500 shadow-2xl shadow-blue-900/10 overflow-hidden",
                coords.position === 'bottom' ? "rounded-b-[24px]" : "rounded-t-[24px]"
            )}>
                <div className="pt-2 pb-1.5 px-1.5">
                    <div ref={listRef} className="max-h-[300px] overflow-y-auto custom-scrollbar focus:outline-none overscroll-contain">
                        {filteredOptions.length > 0 ? (
                            <div className="space-y-1">
                                {filteredOptions.map((option, index) => {
                                    const isSelected = option.value === value;
                                    const isActive = index === activeIndex;
                                    return (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={cn(
                                                "group flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all duration-200 rounded-xl relative mx-1",
                                                isSelected 
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                                    : isActive 
                                                        ? "bg-blue-50 text-blue-700 font-bold"
                                                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                            )}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14.5px] truncate font-medium">{option.label}</span>
                                            </div>
                                            {isSelected && <Check size={14} strokeWidth={3} className="shrink-0 ml-2" />}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-400">
                                <Search size={24} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Nenhum resultado</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const mobileSheet = (
        <div id="searchable-select-portal" className="fixed inset-0 z-[10001] flex flex-col justify-end sm:hidden">
            <div 
                className={cn(
                    "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                    isAnimatingOut ? "backdrop-fade-out" : "backdrop-fade-in"
                )} 
                onClick={() => setIsOpen(false)} 
            />
            <div className={cn(
                "relative bg-white rounded-t-[32px] h-[85vh] flex flex-col overflow-hidden shadow-2xl",
                isAnimatingOut ? "sheet-slide-down" : "sheet-slide-up"
            )}>
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />
                
                {/* Mobile Search Header */}
                <div className="px-6 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{placeholder}</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full h-12 pl-12 pr-12 bg-gray-50 border-2 border-transparent rounded-2xl text-base font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all outline-none caret-blue-600"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Options List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    {filteredOptions.length > 0 ? (
                        <div className="space-y-2">
                            {filteredOptions.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-2xl border-2 transition-all active:scale-[0.98]",
                                            isSelected 
                                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20" 
                                                : "bg-white border-gray-100 text-gray-800 active:bg-gray-50"
                                        )}
                                    >
                                        <span className="text-[16px] font-bold">{option.label}</span>
                                        {isSelected && <Check size={20} strokeWidth={3} />}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400">
                            <Search size={40} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold">Nenhum passageiro encontrado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            {/* Main Select Field */}
            <div
                tabIndex={0}
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                className={cn(
                    "flex items-center justify-between w-full h-[60px] px-5 bg-white border-2 transition-all duration-300 outline-none relative z-[10001] cursor-pointer",
                    isOpen 
                        ? cn(
                            "border-blue-500 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)]",
                            coords.position === 'bottom' ? "rounded-t-2xl rounded-b-none" : "rounded-b-2xl rounded-t-none"
                          )
                        : "border-gray-100 hover:border-blue-200 hover:bg-gray-50/50 rounded-2xl",
                    disabled && "opacity-50 cursor-not-allowed bg-gray-50"
                )}
            >
                {/* Search icon for Desktop searching */}
                {!isMobile && isOpen ? (
                    <div className="flex-1 flex items-center gap-3">
                        <Search size={18} className="text-blue-500 animate-in fade-in slide-in-from-left-2" />
                        <input
                            ref={inputRef}
                            type="text"
                            autoComplete="off"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={searchPlaceholder}
                            className="flex-1 h-9 bg-transparent border-none outline-none font-semibold text-[15px] leading-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 caret-blue-600"
                        />
                    </div>
                ) : (
                    <div className="flex-1 truncate font-semibold text-[15px] tracking-tight">
                        {selectedOption ? selectedOption.label : placeholder}
                    </div>
                )}

                <div className="flex items-center gap-2 ml-3 shrink-0">
                    {selectedOption && !disabled && !isOpen && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onChange(''); }}
                            className="p-1.5 hover:bg-red-50 rounded-full text-gray-300 hover:text-red-500 transition-all duration-200"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <ChevronDown 
                        size={18} 
                        className={cn("text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} 
                    />
                </div>
            </div>

            {/* Portal Rendering */}
            {shouldRender && createPortal(
                isMobile ? mobileSheet : desktopDropdown,
                document.body
            )}
        </div>
    );
};
