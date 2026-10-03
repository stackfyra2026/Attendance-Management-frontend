import { classNames } from "@/utils/helpers";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-surface-muted text-app-muted border border-app/50",
  primary: "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60",
  success: "bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 border border-success-200/60 dark:border-success-800/60",
  warning: "bg-warning-50 dark:bg-warning-950/40 text-warning-700 dark:text-warning-300 border border-warning-200/60 dark:border-warning-800/60",
  danger: "bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-300 border border-danger-200/60 dark:border-danger-800/60",
  outline: "border border-app text-app-muted bg-surface",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[11px] font-medium gap-1",
  md: "px-2.5 py-1 text-xs font-medium gap-1.5",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
