import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";
import { classNames } from "@/utils/helpers";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnOverlay = true,
}: BottomSheetProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className={classNames(
          "relative w-full bg-surface rounded-t-3xl sm:rounded-2xl shadow-xl",
          "animate-in slide-in-from-bottom duration-300",
          "max-h-[90vh] overflow-hidden flex flex-col"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-300" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-app">
            <h2 className="text-lg font-semibold text-app">{title}</h2>
            <IconButton onClick={onClose} size="sm">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-app safe-area-bottom">{footer}</div>
        )}
      </div>
    </div>
  );
}
