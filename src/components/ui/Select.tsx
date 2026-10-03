import { forwardRef, useState, useRef, useEffect, useImperativeHandle } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { classNames } from "@/utils/helpers";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  onBlur?: (e: { target: { name?: string; value: string } }) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  searchable?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options = [],
      placeholder = "Select an option",
      wrapperClassName = "w-full",
      value: propValue,
      defaultValue,
      onChange,
      onBlur,
      name,
      disabled = false,
      required,
      searchable = options.length > 6,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>(propValue ?? defaultValue ?? "");
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => selectRef.current as HTMLSelectElement);

    const selectedValue = propValue !== undefined ? propValue : internalValue;
    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const filteredOptions = searchQuery
      ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options;

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery("");
            onBlur?.({ target: { name, value: selectedValue } });
          }
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onBlur, name, selectedValue]);

    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return;
      setInternalValue(opt.value);
      onChange?.({ target: { name, value: opt.value } });
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          const opt = filteredOptions[focusedIndex];
          if (opt && !opt.disabled) {
            handleSelectOption(opt);
          }
        }
      }
    };

    return (
      <div ref={containerRef} className={classNames("relative", wrapperClassName)}>
        {/* Hidden select element for HTML form/ref compatibility */}
        <select
          ref={selectRef}
          name={name}
          value={selectedValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            onChange?.({ target: { name, value: e.target.value } });
          }}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

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
            onKeyDown={handleKeyDown}
            className={classNames(
              "w-full flex items-center justify-between rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-app",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200 min-h-[42px] shadow-2xs text-left cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed bg-surface-muted",
              error ? "border-danger focus:ring-danger/20 focus:border-danger" : "border-app/80 hover:border-app",
              className
            )}
          >
            <span className={classNames("truncate", !selectedOption && "text-app-muted/70")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={classNames(
                "h-4 w-4 text-app-muted shrink-0 ml-2 transition-transform duration-200",
                isOpen && "rotate-180 text-primary"
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1.5 w-full min-w-[200px] bg-surface border border-app/80 rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
              {searchable && (
                <div className="relative p-1 mb-1 border-b border-app/60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder="Search options..."
                    className="w-full bg-surface-muted/60 rounded-lg pl-8 pr-7 py-1.5 text-xs text-app placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin">
                {filteredOptions.length === 0 ? (
                  <p className="text-xs text-app-muted text-center py-3">No options found</p>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = opt.value === selectedValue;
                    const isFocused = idx === focusedIndex;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => handleSelectOption(opt)}
                        className={classNames(
                          "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 text-left",
                          opt.disabled && "opacity-40 cursor-not-allowed",
                          isSelected
                            ? "bg-primary-50 dark:bg-primary-950/40 text-primary font-bold"
                            : isFocused
                            ? "bg-surface-muted text-app"
                            : "text-app hover:bg-surface-muted/80"
                        )}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
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

Select.displayName = "Select";

export default Select;
