import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import { classNames } from "@/utils/helpers";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: ReactNode;
  closeOnOverlay?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[calc(100vw-2rem)]",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  closeOnOverlay = true,
}: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className={classNames(
          "relative w-full bg-surface rounded-2xl border border-app shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden",
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-app/80 bg-surface-muted/30">
            <h2 className="text-base font-semibold text-app tracking-tight">{title}</h2>
            <IconButton onClick={onClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="px-6 py-5 max-h-[calc(100vh-8rem)] overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-3.5 border-t border-app/80 bg-surface-muted/30 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
