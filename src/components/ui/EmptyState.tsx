import { Inbox, RefreshCw, AlertTriangle } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-surface-muted/80 border border-app/60 flex items-center justify-center mb-3.5 shadow-2xs">
        {icon || <Inbox className="h-7 w-7 text-app-muted" />}
      </div>
      <h3 className="text-base font-semibold text-app mb-1 tracking-tight">{title}</h3>
      {description && <p className="text-xs text-app-muted max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          <RefreshCw className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200/60 dark:border-danger-800/60 flex items-center justify-center mb-3.5 shadow-2xs">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>
      <h3 className="text-base font-semibold text-app mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-app-muted max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}
