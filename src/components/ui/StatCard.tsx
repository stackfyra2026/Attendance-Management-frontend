import { classNames } from "@/utils/helpers";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles = {
  default: "bg-surface border-app/80",
  primary: "bg-primary-50/50 dark:bg-primary-950/20 border-primary-200/60 dark:border-primary-800/60",
  success: "bg-success-50/50 dark:bg-success-950/20 border-success-200/60 dark:border-success-800/60",
  warning: "bg-warning-50/50 dark:bg-warning-950/20 border-warning-200/60 dark:border-warning-800/60",
  danger: "bg-danger-50/50 dark:bg-danger-950/20 border-danger-200/60 dark:border-danger-800/60",
};

const iconStyles = {
  default: "bg-surface-muted text-app-muted border border-app/50",
  primary: "bg-primary-100 dark:bg-primary-900/50 text-primary border border-primary-200/50 dark:border-primary-800/50",
  success: "bg-success-100 dark:bg-success-900/50 text-success border border-success-200/50 dark:border-success-800/50",
  warning: "bg-warning-100 dark:bg-warning-900/50 text-warning border border-warning-200/50 dark:border-warning-800/50",
  danger: "bg-danger-100 dark:bg-danger-900/50 text-danger border border-danger-200/50 dark:border-danger-800/50",
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={classNames(
        "rounded-2xl border p-4 shadow-xs transition-all duration-200 hover:shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-app-muted truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-app mt-1.5">{value}</p>
          {change !== undefined && (
            <p
              className={classNames(
                "text-xs mt-1.5 font-medium flex items-center gap-1",
                change >= 0 ? "text-success" : "text-danger"
              )}
            >
              <span>{change >= 0 ? "+" : ""}{change}%</span>
              <span className="text-app-muted font-normal">{changeLabel || "vs last month"}</span>
            </p>
          )}
        </div>
        <div className={classNames("h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
