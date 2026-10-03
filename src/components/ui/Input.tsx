import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { classNames } from "@/utils/helpers";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, isPassword, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-app mb-1.5">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            className={classNames(
              "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-app placeholder:text-app-muted/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              "transition-all duration-200 min-h-[42px] shadow-2xs",
              !!leftIcon && "pl-10",
              !!isPassword && "pr-10",
              error
                ? "border-danger focus:ring-danger/20 focus:border-danger"
                : "border-app/80 hover:border-app",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app transition-colors p-1 rounded-lg"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-app-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
