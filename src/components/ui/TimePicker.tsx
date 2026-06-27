import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];
const ITEM_H = 40;

function parse24(v: string) {
  if (!v) return { h12: '07', min: '00', period: 'AM' };
  const [hRaw = '0', mRaw = '0'] = v.split(':');
  const h = parseInt(hRaw, 10);
  const m = parseInt(mRaw, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { h12: String(h12).padStart(2, '0'), min: String(m).padStart(2, '0'), period };
}

function to24(h12: string, min: string, period: string): string {
  let h = parseInt(h12, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

const ScrollColumn: React.FC<{
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  width?: string;
}> = ({ items, selected, onSelect, width = 'w-16' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(selected);
    if (idx >= 0) {
      ref.current.scrollTop = Math.max(0, idx * ITEM_H - ITEM_H);
    }
  }, [selected, items]);

  return (
    <div
      ref={ref}
      className={`${width} h-56 overflow-y-auto border-r border-gray-100 dark:border-gray-700 last:border-0`}
      style={{ scrollbarWidth: 'none' }}
    >
      <div style={{ height: 8 }} />
      {items.map((item) => (
        <div
          key={item}
          onClick={() => onSelect(item)}
          style={{ height: ITEM_H }}
          className={`flex items-center justify-center text-sm font-medium cursor-pointer transition-colors mx-1 rounded-lg select-none ${
            item === selected
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {item}
        </div>
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, placeholder = 'Select time', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { h12, min, period } = parse24(value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const display = value ? `${h12}:${min} ${period}` : '';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors"
      >
        <span className={`text-sm ${display ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {display || placeholder}
        </span>
        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden flex">
          <ScrollColumn items={HOURS} selected={h12} onSelect={(v) => onChange(to24(v, min, period))} />
          <ScrollColumn items={MINUTES} selected={min} onSelect={(v) => onChange(to24(h12, v, period))} />
          <ScrollColumn items={PERIODS} selected={period} onSelect={(v) => onChange(to24(h12, min, v))} width="w-14" />
        </div>
      )}
    </div>
  );
};

export default TimePicker;
