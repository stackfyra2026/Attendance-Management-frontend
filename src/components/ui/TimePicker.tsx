import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from "react";
import { Clock, X } from "lucide-react";
import { classNames } from "@/utils/helpers";

export interface TimePickerProps {
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
  className?: string;
  required?: boolean;
  stepMinutes?: number;
}

const PRESET_TIMES = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "06:00 PM", value: "18:00" },
  { label: "07:00 PM", value: "19:00" },
];

function parse24To12(time24: string) {
  if (!time24 || !time24.includes(":")) return { hour12: "09", minute: "00", period: "AM" as "AM" | "PM" };
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr || "9", 10);
  const m = mStr || "00";
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const hour12 = h.toString().padStart(2, "0");
  return { hour12, minute: m.padStart(2, "0"), period };
}

function format12To24(hour12: string, minute: string, period: "AM" | "PM") {
  let h = parseInt(hour12, 10);
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function formatDisplayTime(time24: string) {
  if (!time24 || !time24.includes(":")) return "";
  const { hour12, minute, period } = parse24To12(time24);
  return `${hour12}:${minute} ${period}`;
}

const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = "Select time",
      value: propValue,
      defaultValue,
      onChange,
      onBlur,
      name,
      disabled = false,
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
    const { hour12, minute, period } = parse24To12(selectedValue);

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

    const updateTime = (h12: string, m: string, p: "AM" | "PM") => {
      const formatted24 = format12To24(h12, m, p);
      setInternalValue(formatted24);
      onChange?.({ target: { name, value: formatted24 } });
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValue("");
      onChange?.({ target: { name, value: "" } });
    };

    const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
    const minutesList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

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
            <span className={classNames("truncate", !selectedValue && "text-app-muted/70")}>
              {selectedValue ? formatDisplayTime(selectedValue) : placeholder}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {selectedValue && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={handleClear}
                  className="p-1 hover:bg-surface-muted rounded-md text-app-muted hover:text-app transition-colors"
                  title="Clear time"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <Clock className="h-4 w-4 text-app-muted" />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-64 bg-surface border border-app/80 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1">Hour</label>
                  <div className="h-32 overflow-y-auto border border-app/60 rounded-xl p-1 space-y-0.5 scrollbar-thin">
                    {hoursList.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => updateTime(h, minute, period)}
                        className={classNames(
                          "w-full text-xs font-semibold py-1 rounded-lg transition-colors text-center",
                          hour12 === h
                            ? "bg-primary text-primary-text"
                            : "text-app hover:bg-surface-muted"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1">Min</label>
                  <div className="h-32 overflow-y-auto border border-app/60 rounded-xl p-1 space-y-0.5 scrollbar-thin">
                    {minutesList.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateTime(hour12, m, period)}
                        className={classNames(
                          "w-full text-xs font-semibold py-1 rounded-lg transition-colors text-center",
                          minute === m
                            ? "bg-primary text-primary-text"
                            : "text-app hover:bg-surface-muted"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-14 flex flex-col">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1">AM/PM</label>
                  <div className="flex-1 flex flex-col gap-1">
                    {(["AM", "PM"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateTime(hour12, minute, p)}
                        className={classNames(
                          "flex-1 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center border",
                          period === p
                            ? "bg-primary text-primary-text border-primary shadow-xs"
                            : "border-app/60 text-app hover:bg-surface-muted"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-app/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted mb-1.5">Presets</p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_TIMES.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => {
                        setInternalValue(pt.value);
                        onChange?.({ target: { name, value: pt.value } });
                        setIsOpen(false);
                      }}
                      className={classNames(
                        "text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all duration-150",
                        selectedValue === pt.value
                          ? "bg-primary-50 dark:bg-primary-950/40 text-primary border-primary-200"
                          : "border-app/60 text-app-muted hover:text-app hover:bg-surface-muted"
                      )}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
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

TimePicker.displayName = "TimePicker";

export default TimePicker;
