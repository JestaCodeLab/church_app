import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['M','T','W','T','F','S','S'];

function parseYMD(s: string) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function toYMD(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildCalendar(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7; // Monday = 0
  const days: Date[] = [];
  for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) days.push(new Date(year, month + 1, d));
  return days;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, min, max, disabled = false, placeholder = 'dd/mm/yyyy', className = '' }) => {
  const parsed = parseYMD(value);
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? today.getMonth());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const minParsed = parseYMD(min || '');
  const maxParsed = parseYMD(max || '');

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (parsed) { setViewYear(parsed.y); setViewMonth(parsed.m); }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (d: Date) => {
    const cmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (minParsed) {
      const minDate = new Date(minParsed.y, minParsed.m, minParsed.d);
      if (cmp < minDate) return true;
    }
    if (maxParsed) {
      const maxDate = new Date(maxParsed.y, maxParsed.m, maxParsed.d);
      if (cmp > maxDate) return true;
    }
    return false;
  };

  const isSelected = (d: Date) =>
    !!parsed && d.getFullYear() === parsed.y && d.getMonth() === parsed.m && d.getDate() === parsed.d;

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  const days = buildCalendar(viewYear, viewMonth);
  const display = parsed ? `${String(parsed.d).padStart(2,'0')}/${String(parsed.m+1).padStart(2,'0')}/${parsed.y}` : '';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`text-sm ${display ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
          {display || placeholder}
        </span>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-72 p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500">
                {l}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth;
              const disabled = isDisabled(d);
              const selected = isSelected(d);
              const todayMark = isToday(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(toYMD(d.getFullYear(), d.getMonth(), d.getDate())); setOpen(false); }}
                  className={[
                    'h-8 w-full flex items-center justify-center text-sm rounded-lg transition-colors',
                    selected ? 'bg-primary-600 text-white font-semibold' : '',
                    !selected && todayMark ? 'border border-primary-400 text-primary-600 dark:text-primary-400 font-medium' : '',
                    !selected && !disabled && inMonth ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' : '',
                    !selected && !inMonth ? 'text-gray-300 dark:text-gray-600' : '',
                    disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                  ].filter(Boolean).join(' ')}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                onChange(toYMD(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
