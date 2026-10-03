import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import OtpInput from "@/components/ui/OtpInput";
import Logo from "@/components/ui/Logo";
import { authApi } from "@/services/api/auth.api";
import { ApiError, getErrorMessage } from "@/services/http/errors";

const RESEND_COOLDOWN_SECONDS = 60;

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Enter your email",
  2: "Enter the 6-digit code",
  3: "Set a new password",
};

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {([1, 2, 3] as Step[]).map((s) => (
        <span
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s === step
              ? "w-6 bg-primary"
              : s < step
                ? "w-3 bg-primary"
                : "w-3 bg-surface-200 dark:bg-surface-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [inboxMessage, setInboxMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [success, setSuccess] = useState(false);

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const requestOtp = useCallback(
    async (targetEmail: string) => {
      setIsSending(true);
      try {
        await authApi.forgotPassword(targetEmail);
        setInboxMessage("We've emailed a 6-digit code. Check your inbox (and spam folder).");
        setResendError("");
        setOtp("");
        setResendIn(RESEND_COOLDOWN_SECONDS);
        setStep(2);
      } catch (error) {
        emailForm.setError("email", { type: "manual", message: getErrorMessage(error) });
      } finally {
        setIsSending(false);
      }
    },
    [emailForm],
  );

  const handleEmailSubmit = async (data: EmailFormData) => {
    setEmail(data.email);
    await requestOtp(data.email);
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setResendError("");
    try {
      await authApi.forgotPassword(email);
      setInboxMessage("A new code has been sent to your email.");
      setOtp("");
      setOtpError("");
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setResendError(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setOtpError("Enter the 6-digit code sent to your email");
      return;
    }
    setOtpError("");
    setIsVerifying(true);
    try {
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (error) {
      setOtpError(getErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const returnToOtpStep = (message: string, allowResend: boolean) => {
    setOtpError(message);
    setStep(2);
    if (allowResend) {
      setResendIn(0);
      setOtp("");
    }
  };

  const handleReset = async (data: ResetFormData) => {
    setIsResetting(true);
    try {
      await authApi.resetPassword(email, otp, data.newPassword);
      setSuccess(true);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "UNKNOWN";
      const message = getErrorMessage(error);
      if (code === "OTP_EXPIRED" || code === "OTP_ATTEMPTS_EXCEEDED" || code === "OTP_INVALID") {
        returnToOtpStep(message, code !== "OTP_EXPIRED");
      } else {
        resetForm.setError("newPassword", { type: "manual", message });
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-app-muted hover:text-app mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <Logo size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-app">Forgot Password</h1>
          <p className="text-sm text-app-muted mt-1">{success ? "All done" : STEP_LABELS[step]}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-app p-6 shadow-sm">
          {success ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-app mb-2">Password updated</h2>
              <p className="text-sm text-app-muted">
                Your password has been reset. Sign in with your new password.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-6"
                fullWidth
                onClick={() => navigate("/login")}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <StepIndicator step={step} />

              {step === 1 && (
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                  <p className="text-sm text-app-muted -mt-1">
                    Enter your account email and we'll send you a one-time code to reset your
                    password.
                  </p>
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    autoComplete="email"
                    error={emailForm.formState.errors.email?.message}
                    {...emailForm.register("email")}
                  />
                  <Button type="submit" fullWidth size="lg" isLoading={isSending}>
                    Send code
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-app-muted">
                      Enter the 6-digit code sent to <strong className="text-app">{email}</strong>
                    </p>
                    {inboxMessage && <p className="mt-2 text-xs text-app-muted">{inboxMessage}</p>}
                  </div>

                  <OtpInput
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setOtpError("");
                    }}
                    error={otpError}
                    autoFocus
                    disabled={isVerifying}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="lg"
                    onClick={handleVerify}
                    isLoading={isVerifying}
                  >
                    Verify code
                    <KeyRound className="h-4 w-4" />
                  </Button>

                  <div className="text-center">
                    <span className="text-xs text-app-muted mr-1">Didn't get the code?</span>
                    {resendIn > 0 ? (
                      <span className="text-xs font-medium text-app-muted">
                        Resend in {resendIn}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                        Resend code
                      </button>
                    )}
                  </div>
                  {resendError && <p className="text-xs text-danger text-center">{resendError}</p>}
                </div>
              )}

              {step === 3 && (
                <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
                  <p className="text-sm text-app-muted -mt-1">
                    Choose a new password for <strong className="text-app">{email}</strong>.
                  </p>
                  <Input
                    label="New password"
                    type="password"
                    isPassword
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    error={resetForm.formState.errors.newPassword?.message}
                    {...resetForm.register("newPassword")}
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    isPassword
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    error={resetForm.formState.errors.confirmPassword?.message}
                    {...resetForm.register("confirmPassword")}
                  />
                  <Button type="submit" fullWidth size="lg" isLoading={isResetting}>
                    Reset password
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}