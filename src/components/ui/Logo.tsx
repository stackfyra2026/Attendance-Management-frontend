import { classNames } from "@/utils/helpers";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

export default function Logo({ size = "md", className, alt }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt={alt ?? "Logo"}
      className={classNames("shrink-0 select-none", sizeClasses[size], className)}
    />
  );
}