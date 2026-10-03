import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "@/types";
import { authApi } from "@/services/api/auth.api";
import { employeeApi } from "@/services/api/employee.api";
import { session } from "@/services/http/session";
import { getErrorMessage } from "@/services/http/errors";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const email = credentials.email.trim().toLowerCase();

    try {
      const result = await authApi.login(email, credentials.password);
      await session.setTokens({ accessToken: result.token, refreshToken: result.refreshToken });
      const employee = await employeeApi.getMe();
      const user: User = {
        id: employee.id,
        email: employee.email,
        role: result.user.role,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        avatar: employee.avatar,
      };
      return { user, token: result.token };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

type BootstrapResult =
  | { restored: false }
  | { restored: true; user: User; token: string | null };

export const bootstrapSession = createAsyncThunk<BootstrapResult, void>(
  "auth/bootstrap",
  async (_, { rejectWithValue }) => {
    const tokens = await session.getTokens();
    if (!tokens) {
      return { restored: false };
    }
    try {
      const block = await authApi.me();
      const employee = await employeeApi.getMe();
      const token = await session.getAccessToken();
      const user: User = {
        id: employee.id,
        email: employee.email,
        role: block.role,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        avatar: employee.avatar,
      };
      return { restored: true, user, token };
    } catch (error) {
      await session.clear();
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  const refreshToken = await session.getRefreshToken();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // best-effort server revoke
    }
  }
  await session.clear();
});

function resetAuthState(state: AuthState) {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;
  state.isLoading = false;
  state.isInitializing = false;
  state.error = null;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      resetAuthState(state);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Login failed";
      })
      .addCase(bootstrapSession.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.isInitializing = false;
        if (action.payload.restored) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.isInitializing = false;
        resetAuthState(state);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        resetAuthState(state);
      })
      .addCase(logoutUser.rejected, (state) => {
        resetAuthState(state);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;