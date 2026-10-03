import { useState, useRef, useEffect, type ReactNode } from "react";
import { classNames } from "@/utils/helpers";

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  align = "right",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={classNames("relative inline-block", className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={classNames(
            "absolute z-50 mt-1.5 min-w-[190px] bg-surface border border-app rounded-xl shadow-lg p-1 animate-in fade-in slide-in-from-top-1 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                if (!item.disabled) {
                  onSelect(item.value);
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={classNames(
                "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors",
                item.disabled && "opacity-50 cursor-not-allowed",
                item.danger
                  ? "text-danger hover:bg-danger-50 dark:hover:bg-danger-950/30"
                  : "text-app hover:bg-surface-muted"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
