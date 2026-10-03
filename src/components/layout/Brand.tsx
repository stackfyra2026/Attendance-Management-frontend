import { config } from "@/config";
import Logo from "@/components/ui/Logo";
import { classNames } from "@/utils/helpers";

interface BrandProps {
  showName?: boolean;
  nameClassName?: string;
  markClassName?: string;
  className?: string;
}

export default function Brand({
  showName = true,
  nameClassName,
  markClassName,
  className,
}: BrandProps) {
  return (
    <span className={classNames("flex items-center gap-2", className)}>
      <Logo size="sm" className={markClassName} />
      {showName && (
        <span className={classNames("font-bold text-app", nameClassName)}>{config.name}</span>
      )}
    </span>
  );
}