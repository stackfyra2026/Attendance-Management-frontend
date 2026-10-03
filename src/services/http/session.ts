import { storageGet, storageRemove, storageSet } from "@/services/storage";

const ACCESS_TOKEN_KEY = "attendflow.access-token";
const REFRESH_TOKEN_KEY = "attendflow.refresh-token";

export const SESSION_EXPIRED_EVENT = "attendflow:session-expired";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export const session = {
  async getAccessToken(): Promise<string | null> {
    return storageGet(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return storageGet(REFRESH_TOKEN_KEY);
  },
  async getTokens(): Promise<SessionTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      storageGet(ACCESS_TOKEN_KEY),
      storageGet(REFRESH_TOKEN_KEY),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },
  async setTokens(tokens: SessionTokens): Promise<void> {
    await Promise.all([
      storageSet(ACCESS_TOKEN_KEY, tokens.accessToken),
      storageSet(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  },
  async setAccessToken(accessToken: string): Promise<void> {
    await storageSet(ACCESS_TOKEN_KEY, accessToken);
  },
  async clear(): Promise<void> {
    await Promise.all([
      storageRemove(ACCESS_TOKEN_KEY),
      storageRemove(REFRESH_TOKEN_KEY),
    ]);
  },
};

export function notifySessionExpired(): void {
  try {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  } catch {
    // ignore
  }
}