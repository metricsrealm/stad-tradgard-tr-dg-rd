import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { sv } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X, Zap, CalendarDays } from 'lucide-react';
import 'react-day-picker/style.css';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or preset label
  onChange: (dateStr: string) => void;
  error?: string;
  id?: string;
  placeholder?: string;
  headerTitle?: string;
  showPresets?: boolean;
}

const PRESETS = [
  { label: 'Snarast möjligt', icon: Zap },
  { label: 'Inom 1-2 veckor', icon: CalendarDays },
  { label: 'Flexibelt datum', icon: CalendarIcon }
];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  error,
  id = 'datePicker',
  placeholder = 'Välj önskat datum...',
  headerTitle = 'Välj önskat startdatum',
  showPresets = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check if value is a valid ISO date
  const isIsoDate = value && isValid(parseISO(value)) && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const selectedDate = isIsoDate ? parseISO(value) : undefined;

  // Display text: either formatted Swedish date or the selected preset text
  const displayText = selectedDate
    ? format(selectedDate, 'd MMMM yyyy', { locale: sv })
    : value || '';

  // Close popover on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onChange(formatted);
      setIsOpen(false);
    } else {
      onChange('');
    }
  };

  const handleSelectPreset = (presetLabel: string) => {
    onChange(presetLabel);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        type="button"
        id={id}
        aria-label={headerTitle}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`date-trigger ${error ? 'err' : ''}`}
      >
        <span className="date-icon" aria-hidden="true">
          <CalendarIcon className="w-4 h-4" />
        </span>
        <span className={`date-text ${!displayText ? 'placeholder' : ''}`}>
          {displayText || placeholder}
        </span>
        {displayText ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="date-clear"
            title="Rensa datum"
            aria-label="Rensa datum"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="date-badge">
            Kalender
          </span>
        )}
      </button>

      {isOpen && (
        <div className="date-popover" role="dialog" aria-modal="true" aria-label={headerTitle}>
          <div className="date-popover-head">
            <span className="date-popover-title">{headerTitle}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="date-popover-close"
              aria-label="Stäng kalender"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showPresets && (
            <div className="date-presets">
              <span className="date-presets-label">Snabbval:</span>
              <div className="date-presets-grid">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = value === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className={`date-preset-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(p.label)}
                    >
                      <Icon className="w-3 h-3 text-red-500" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="date-calendar-divider">
            <span>eller välj datum</span>
          </div>

          <div className="date-calendar-wrapper">
            <DayPicker
              mode="single"
              locale={sv}
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={{ before: new Date() }}
              className="custom-calendar"
            />
          </div>

          <div className="date-popover-footer">
            <span className="date-popover-hint">Vi bekräftar alltid tidpunkt i offerten.</span>
            {value && (
              <button
                type="button"
                className="date-popover-clear"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                Rensa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

