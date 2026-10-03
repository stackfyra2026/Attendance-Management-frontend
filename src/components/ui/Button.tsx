import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "@/utils/helpers";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary text-primary-text hover:bg-primary-hover focus:ring-primary/40 shadow-xs font-semibold",
      secondary:
        "bg-surface-muted text-app border border-app hover:bg-surface-200 dark:hover:bg-surface-muted focus:ring-primary/20 font-medium",
      outline:
        "border border-app text-app bg-surface hover:bg-surface-muted focus:ring-primary/20 font-medium",
      ghost: "text-app-muted hover:bg-surface-muted hover:text-app focus:ring-primary/20 font-medium",
      danger: "bg-danger text-white hover:opacity-92 focus:ring-danger/40 shadow-xs font-semibold",
      success: "bg-success text-white hover:opacity-92 focus:ring-success/40 shadow-xs font-semibold",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[36px]",
      md: "text-sm px-4 py-2 gap-2 min-h-[42px]",
      lg: "text-base px-5 py-2.5 gap-2.5 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        className={classNames(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
