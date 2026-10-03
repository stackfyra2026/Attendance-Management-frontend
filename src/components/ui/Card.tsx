import { classNames } from "@/utils/helpers";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export default function Card({
  children,
  className,
  padding = "md",
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={classNames(
        "bg-surface rounded-2xl border border-app/80 shadow-xs transition-all duration-200",
        paddingClasses[padding],
        hover && "cursor-pointer hover:shadow-sm hover:border-app transition-all duration-200",
        onClick && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
