import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { classNames } from "@/utils/helpers";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary: "bg-primary text-primary-text hover:bg-primary-hover focus:ring-primary",
      secondary:
        "bg-surface-muted text-app border border-app hover:bg-surface-200 focus:ring-primary",
      outline: "border border-app text-app bg-transparent hover:bg-surface-muted focus:ring-primary",
      ghost: "text-app-muted hover:bg-surface-muted hover:text-app focus:ring-primary",
      danger: "bg-danger text-white hover:bg-danger-700 focus:ring-danger",
    };

    const sizes = {
      xs: "h-9 w-9",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        className={classNames(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
