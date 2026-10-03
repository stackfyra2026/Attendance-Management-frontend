import { API } from "@/services/http/endpoints";
import { get, post } from "@/services/http/request";
import { toRole } from "@/services/http/mappers";
import type { Role } from "@/types/enums";

export interface AuthUserBlock {
  id: string;
  email: string;
  name: string;
  role: Role;
  employeeId: string | null;
  avatarUrl: string | null;
}

interface RawAuthUserBlock {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId: string | null;
  avatarUrl: string | null;
}

interface RawLoginResult {
  token: string;
  refreshToken: string;
  user: RawAuthUserBlock;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  user: AuthUserBlock;
}

function mapBlock(raw: RawAuthUserBlock): AuthUserBlock {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role: toRole(raw.role),
    employeeId: raw.employeeId,
    avatarUrl: raw.avatarUrl,
  };
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    const raw = await post<RawLoginResult>(API.auth.login, { email, password });
    return {
      token: raw.token,
      refreshToken: raw.refreshToken,
      user: mapBlock(raw.user),
    };
  },

  async me(): Promise<AuthUserBlock> {
    const raw = await get<RawAuthUserBlock>(API.auth.me);
    return mapBlock(raw);
  },

  async logout(refreshToken: string): Promise<void> {
    await post<{ success: boolean }>(API.auth.logout, { refreshToken });
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return post<{ success: boolean; message: string }>(API.auth.forgotPassword, { email });
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return post<{ success: boolean; message: string }>(API.auth.verifyOtp, { email, otp });
  },

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return post<{ success: boolean; message: string }>(API.auth.resetPassword, {
      email,
      otp,
      newPassword,
    });
  },
};