import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { classNames } from "@/utils/helpers";

export interface DatePickerProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  onBlur?: (e: { target: { name?: string; value: string } }) => void;
  name?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  className?: string;
  required?: boolean;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = "Select date",
      value: propValue,
      defaultValue,
      onChange,
      onBlur,
      name,
      disabled = false,
      min,
      max,
      className,
      required,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(propValue ?? defaultValue ?? "");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const selectedValue = propValue !== undefined ? propValue : internalValue;

    const parsedSelected = selectedValue ? parseISO(selectedValue) : null;
    const validSelected = parsedSelected && isValid(parsedSelected) ? parsedSelected : null;

    const [viewDate, setViewDate] = useState<Date>(validSelected || new Date());

    useEffect(() => {
      if (validSelected) {
        setViewDate(validSelected);
      }
    }, [selectedValue]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          if (isOpen) {
            setIsOpen(false);
            onBlur?.({ target: { name, value: selectedValue } });
          }
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onBlur, name, selectedValue]);

    const handleDateSelect = (date: Date) => {
      const formatted = format(date, "yyyy-MM-dd");
      setInternalValue(formatted);
      onChange?.({ target: { name, value: formatted } });
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValue("");
      onChange?.({ target: { name, value: "" } });
    };

    const minStr = min !== undefined ? String(min) : undefined;
    const maxStr = max !== undefined ? String(max) : undefined;

    const minDate = minStr ? parseISO(minStr) : null;
    const maxDate = maxStr ? parseISO(maxStr) : null;

    const isDateDisabled = (day: Date) => {
      const dayStr = format(day, "yyyy-MM-dd");
      if (minStr && minDate && isValid(minDate) && dayStr < minStr) return true;
      if (maxStr && maxDate && isValid(maxDate) && dayStr > maxStr) return true;
      return false;
    };

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div ref={containerRef} className={classNames("w-full relative", className)}>
        <input
          ref={inputRef}
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
        />
        {label && (
          <label className="block text-sm font-medium text-app mb-1.5">
            {label}
            {required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
            className={classNames(
              "w-full flex items-center justify-between rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-app",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200 min-h-[42px] shadow-2xs text-left",
              disabled && "opacity-50 cursor-not-allowed bg-surface-muted",
              error ? "border-danger focus:ring-danger/20 focus:border-danger" : "border-app/80 hover:border-app"
            )}
          >
            <span className={classNames("truncate", !validSelected && "text-app-muted/70")}>
              {validSelected ? format(validSelected, "dd MMM yyyy") : placeholder}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {validSelected && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="p-1 hover:bg-surface-muted rounded-md text-app-muted hover:text-app transition-colors"
                  title="Clear date"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <CalendarIcon className="h-4 w-4 text-app-muted" />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-72 bg-surface border border-app/80 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-1.5 rounded-lg text-app-muted hover:text-app hover:bg-surface-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-app">
                  {format(viewDate, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-1.5 rounded-lg text-app-muted hover:text-app hover:bg-surface-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                  <span key={dayName} className="text-[11px] font-semibold text-app-muted py-1 uppercase">
                    {dayName}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const isSelected = validSelected && isSameDay(day, validSelected);
                  const isCurrentMonth = isSameMonth(day, viewDate);
                  const disabledDay = isDateDisabled(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleDateSelect(day)}
                      className={classNames(
                        "h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all duration-150 mx-auto",
                        !isCurrentMonth && "text-app-muted/30",
                        isCurrentMonth && !isSelected && "text-app hover:bg-surface-muted",
                        isToday && !isSelected && "border border-primary text-primary font-bold",
                        isSelected && "bg-primary text-primary-text font-bold shadow-xs",
                        disabledDay && "opacity-25 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-app-muted">{hint}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
