import { classNames, getInitials } from "@/utils/helpers";

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "away";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-secondary-400",
  away: "bg-warning",
};

export default function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
  showStatus,
  status = "online",
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  return (
    <div className={classNames("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={classNames(
            "rounded-full object-cover",
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={classNames(
            "rounded-full bg-primary text-primary-text flex items-center justify-center font-semibold",
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={classNames(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-surface",
            statusColors[status],
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-3 w-3"
          )}
        />
      )}
    </div>
  );
}
