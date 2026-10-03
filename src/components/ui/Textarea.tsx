import { type TextareaHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/utils/helpers";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-app mb-1.5">{label}</label>
        )}
        <textarea
          ref={ref}
          className={classNames(
            "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-app placeholder:text-app-muted/60",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-all duration-200 min-h-[100px] resize-y shadow-2xs",
            error ? "border-danger focus:ring-danger/20 focus:border-danger" : "border-app/80 hover:border-app",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-app-muted">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
