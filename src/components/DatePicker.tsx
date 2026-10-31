import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { sv } from 'date-fns/locale';
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  isToday
} from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  error?: boolean;
  id?: string;
  placeholder?: string;
  headerTitle?: string;
}

const WEEKDAYS = ['Må', 'Ti', 'On', 'To', 'Fr', 'Lö', 'Sö'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  error,
  id = 'datePicker',
  placeholder = 'Välj datum',
  headerTitle = 'Välj önskat startdatum'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  // On phones the calendar is a bottom sheet rendered at page level so it covers the header too
  const [asSheet, setAsSheet] = useState(false);

  const today = startOfDay(new Date());
  const parsed = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : null;
  const selectedDate = parsed && isValid(parsed) ? parsed : null;

  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate || today));

  // Jump to the selected month whenever the popover opens
  useEffect(() => {
    if (isOpen) {
      setViewMonth(startOfMonth(selectedDate || today));
      setAsSheet(window.matchMedia('(max-width: 560px)').matches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 })
      }),
    [viewMonth]
  );

  const canGoPrev = !isBefore(addMonths(viewMonth, -1), startOfMonth(today));
  const displayText = selectedDate ? format(selectedDate, 'd MMM yyyy', { locale: sv }) : '';
  const monthLabel = format(viewMonth, 'LLLL yyyy', { locale: sv });

  const renderPopover = (node: React.ReactNode, portal: boolean) =>
    portal ? createPortal(node, document.body) : node;

  const pick = (d: Date) => {
    onChange(format(d, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <div className="dp" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-invalid={error || undefined}
        onClick={() => setIsOpen((o) => !o)}
        className={`date-trigger ${error ? 'err' : ''}`}
      >
        <CalendarIcon className="date-icon" aria-hidden="true" />
        <span className={`date-text ${!displayText ? 'placeholder' : ''}`}>
          {displayText || placeholder}
        </span>
        {displayText && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="date-clear"
            aria-label="Rensa datum"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {isOpen && renderPopover(
        <>
          {asSheet && <div className="dp-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />}
          <div ref={popRef} className={`dp-pop${asSheet ? ' dp-sheet' : ''}`} role="dialog" aria-label={headerTitle}>
            <div className="dp-head">
              <button
                type="button"
                className="dp-nav"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                disabled={!canGoPrev}
                aria-label="Föregående månad"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="dp-month">{monthLabel}</span>
              <button
                type="button"
                className="dp-nav"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                aria-label="Nästa månad"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="dp-grid" role="grid">
              {WEEKDAYS.map((w) => (
                <span key={w} className="dp-wd">
                  {w}
                </span>
              ))}
              {days.map((d) => {
                const outside = !isSameMonth(d, viewMonth);
                const past = isBefore(d, today);
                const selected = selectedDate ? isSameDay(d, selectedDate) : false;
                if (outside) return <span key={d.toISOString()} className="dp-day dp-empty" />;
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    disabled={past}
                    onClick={() => pick(d)}
                    className={`dp-day${selected ? ' sel' : ''}${isToday(d) ? ' today' : ''}`}
                    aria-pressed={selected}
                    aria-label={format(d, 'd MMMM yyyy', { locale: sv })}
                  >
                    {format(d, 'd')}
                  </button>
                );
              })}
            </div>

            <p className="dp-hint">Vi bekräftar alltid exakt tid i offerten.</p>
          </div>
        </>,
        asSheet
      )}
    </div>
  );
};
