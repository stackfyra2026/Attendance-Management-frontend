import axios, {
  AxiosError,
  type AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { config } from "@/config";
import { API } from "./endpoints";
import { toApiError } from "./errors";
import { notifySessionExpired, session } from "./session";
import { DEVICE_ID_HEADER, getDeviceId } from "@/services/device.service";

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
  signal?: AbortSignal;
}

interface ApiEnvelope {
  success: boolean;
  message: string;
  data: unknown;
  meta?: Record<string, number>;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
  user: unknown;
}

const DEFAULT_TIMEOUT_MS = 30000;

const instance: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  async (reqConfig: InternalAxiosRequestConfig) => {
    const [token, deviceId] = await Promise.all([
      session.getAccessToken(),
      getDeviceId(),
    ]);
    if (reqConfig.headers) {
      if (token) {
        (reqConfig.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
      }
      (reqConfig.headers as AxiosHeaders).set(DEVICE_ID_HEADER, deviceId);
    }
    return reqConfig;
  },
);

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const tokens = await session.getTokens();
  if (!tokens) return false;

  try {
    const response = await axios.post<ApiEnvelope>(
      API.auth.refresh,
      { refreshToken: tokens.refreshToken },
      { baseURL: config.apiBaseUrl, timeout: DEFAULT_TIMEOUT_MS },
    );
    const body = unwrapEnvelope<RefreshResponse>(response.data);
    await session.setTokens({ accessToken: body.token, refreshToken: body.refreshToken });
    return true;
  } catch {
    await session.clear();
    notifySessionExpired();
    return false;
  }
}

function refreshTokens(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function isAuthPath(url?: string): boolean {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/refresh");
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retried && !isAuthPath(original.url)) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        original._retried = true;
        const token = await session.getAccessToken();
        if (token && original.headers) {
          (original.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
        }
        return instance(original);
      }
    }

    throw toApiError(error);
  },
);

function unwrapEnvelope<T>(body: unknown): T {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const envelope = body as ApiEnvelope;
    if (envelope.meta !== undefined) {
      return { data: envelope.data, meta: envelope.meta } as unknown as T;
    }
    return envelope.data as T;
  }
  return body as T;
}

function buildConfig(options?: RequestOptions): AxiosRequestConfig {
  const headers: Record<string, string> = {};
  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers[key] = value;
    }
  }
  const contentType = headers["Content-Type"] ?? headers["content-type"];
  if (contentType && contentType.includes("multipart")) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }
  return {
    headers,
    params: options?.params,
    timeout: options?.timeout,
    signal: options?.signal,
  };
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await instance.request<T>({
    method,
    url,
    data,
    ...buildConfig(options),
  });
  return unwrapEnvelope<T>(response.data);
}

export async function get<T>(url: string, options?: RequestOptions): Promise<T> {
  return request<T>("GET", url, undefined, options);
}

export async function post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("POST", url, data, options);
}

export async function put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("PUT", url, data, options);
}

export async function patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("PATCH", url, data, options);
}

export async function del<T>(url: string, options?: RequestOptions): Promise<T> {
  return request<T>("DELETE", url, undefined, options);
}

export async function delWithBody<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("DELETE", url, data, options);
}