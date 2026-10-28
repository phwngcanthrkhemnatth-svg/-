import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { THAI_PROVINCES } from '../../mock/initialData';

export interface ProvinceSelectProps {
  value: string;
  onChange: (province: string) => void;
  label?: string;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const ProvinceSelect: React.FC<ProvinceSelectProps> = ({
  value,
  onChange,
  label,
  placeholder = 'เลือกจังหวัด',
  allowAll = false,
  allLabel = 'ทุกจังหวัด (ทั่วประเทศ)',
  error,
  required = false,
  disabled = false,
  id = 'province-select',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filtered provinces list
  const filteredProvinces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return THAI_PROVINCES;
    return THAI_PROVINCES.filter((p) => p.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelect = (prov: string) => {
    onChange(prov);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(allowAll ? 'All' : '');
  };

  const isAllSelected = allowAll && (value === 'All' || value === '' || value === 'ทุกจังหวัด');
  const displayLabel = isAllSelected
    ? allLabel
    : value || placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {value && value !== 'All' && !disabled && (
            <span className="text-[11px] font-normal text-slate-400">
              {THAI_PROVINCES.includes(value) ? '✓ 77 จังหวัด' : ''}
            </span>
          )}
        </label>
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
          error
            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
      >
        <span
          className={`flex items-center gap-2 truncate ${
            !value && !isAllSelected ? 'text-slate-400 dark:text-slate-500' : 'font-medium'
          }`}
        >
          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && value !== 'All' && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="ล้างการเลือก"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar inside Dropdown */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ค้นหาจังหวัด... (เช่น ระยอง, เชียงใหม่)"
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
              <span>เลือกได้ครบ 77 จังหวัด</span>
              <span>พบ {filteredProvinces.length} จังหวัด</span>
            </div>
          </div>

          {/* List of Provinces */}
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-slate-50 dark:divide-slate-800/40">
            {allowAll && !searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect('All')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isAllSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🇹🇭</span>
                  <span>{allLabel}</span>
                </span>
                {isAllSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            )}

            {filteredProvinces.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-slate-500 font-medium">ไม่พบจังหวัด "{searchQuery}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  โปรดตรวจสอบตัวสะกดภาษาไทยให้ถูกต้อง
                </p>
              </div>
            ) : (
              filteredProvinces.map((prov, index) => {
                const isSelected = value === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleSelect(prov)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-400 font-mono w-5">
                        {index + 1}.
                      </span>
                      <span className="truncate">{prov}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
