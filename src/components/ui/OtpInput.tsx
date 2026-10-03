import { useEffect, useRef } from "react";
import { classNames } from "@/utils/helpers";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  disabled,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      refs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const chars = (value ?? "").slice(0, length).split("");
  while (chars.length < length) chars.push("");
  const digits = chars;

  const setDigit = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length - index);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((digit, i) => {
      next[index + i] = digit;
    });
    onChange(next.join(""));
    refs.current[Math.min(index + pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/\D/g, "");
              if (sanitized.length > 1) {
                onChange(sanitized.slice(0, length));
                refs.current[sanitized.length - 1]?.focus();
              } else if (sanitized.length === 1) {
                setDigit(index, sanitized);
              }
            }}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={(e) => onPaste(index, e)}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            aria-label={`OTP digit ${index + 1} of ${length}`}
            className={classNames(
              "h-12 w-11 rounded-xl border bg-surface text-center text-lg font-semibold text-app",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-all duration-200 select-none",
              error ? "border-danger focus:ring-danger" : "border-app",
              disabled && "opacity-60",
            )}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger text-center">{error}</p>}
    </div>
  );
}