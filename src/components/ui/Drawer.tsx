import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import { classNames } from "@/utils/helpers";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
  footer?: ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = "right",
  footer,
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={classNames(
          "absolute top-0 bottom-0 w-full max-w-md bg-surface shadow-xl flex flex-col",
          "animate-in slide-in-from-right duration-300",
          side === "left" ? "left-0 slide-in-from-left" : "right-0"
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-app">
            <h2 className="text-lg font-semibold text-app">{title}</h2>
            <IconButton onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-app">{footer}</div>
        )}
      </div>
    </div>
  );
}
