import type { AxiosError } from "axios";

export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "INACTIVE_ACCOUNT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "GEO_OUTSIDE_FENCE"
  | "GEOFENCE_OUTSIDE_RADIUS"
  | "GEOFENCE_LOW_ACCURACY"
  | "ATTENDANCE_STATE_INVALID"
  | "LEAVE_BALANCE_INSUFFICIENT"
  | "LEAVE_OVERLAP"
  | "LEAVE_REASON_REQUIRED"
  | "CORRECTION_NO_CHANGE"
  | "RATE_LIMITED"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_ATTEMPTS_EXCEEDED"
  | "USER_NOT_FOUND"
  | "MAIL_SEND_FAILED"
  | "DEVICE_SESSION_BLOCKED"
  | "NOT_IMPLEMENTED"
  | "NETWORK"
  | "UNKNOWN";

export interface ApiErrorPayload {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

interface NormalizedBackendError {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly isApiError = true;

  constructor(message: string, code: ApiErrorCode = "UNKNOWN", status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  is(code: ApiErrorCode): boolean {
    return this.code === code;
  }
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return "The request is invalid";
    case 401:
      return "Session expired. Please sign in again";
    case 403:
      return "You do not have permission to perform this action";
    case 404:
      return "The requested resource was not found";
    case 409:
      return "The request conflicts with the current state";
    case 422:
      return "The action is not allowed in the current state";
    case 429:
      return "Too many requests. Please try again shortly";
    default:
      return "Something went wrong. Please try again";
  }
}

export function extractBackendError(error: unknown): NormalizedBackendError {
  if (error instanceof ApiError) {
    return { code: error.code, message: error.message, details: error.details };
  }

  if (error instanceof Error) {
    if ((error as AxiosError).isAxiosError) {
      const axiosError = error as AxiosError<ApiErrorPayload>;
      const responseData = axiosError.response?.data;
      const status = axiosError.response?.status ?? 0;

      if (responseData?.error?.message) {
        return {
          code: responseData.error.code ?? errorCodeFromStatus(status),
          message: responseData.error.message,
          details: responseData.error.details,
        };
      }
      if (axiosError.request) {
        return { code: "NETWORK", message: "Unable to reach the server. Check your connection" };
      }
      return {
        code: errorCodeFromStatus(status),
        message: fallbackMessage(status),
      };
    }
    return { code: "UNKNOWN", message: error.message || fallbackMessage(500) };
  }

  return { code: "UNKNOWN", message: fallbackMessage(500) };
}

function errorCodeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_FAILED";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    default:
      return "UNKNOWN";
  }
}

export function toApiError(error: unknown): ApiError {
  const normalized = extractBackendError(error);
  if (error instanceof ApiError) return error;
  const status = error instanceof Error && (error as AxiosError).isAxiosError
    ? (error as AxiosError).response?.status ?? 500
    : 500;
  return new ApiError(normalized.message, normalized.code as ApiErrorCode, status, normalized.details);
}

export function getErrorMessage(error: unknown): string {
  return extractBackendError(error).message;
}