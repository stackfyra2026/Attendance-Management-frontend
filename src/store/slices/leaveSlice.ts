import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Leave, LeaveBalance } from "@/types";
import { leaveService, type ApplyLeaveData } from "@/services/leave.service";

interface LeaveState {
  balance: LeaveBalance[];
  history: Leave[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  balance: [],
  history: [],
  isLoading: false,
  error: null,
};

export const fetchLeaveBalance = createAsyncThunk(
  "leave/fetchBalance",
  (employeeId: string) => leaveService.getBalance(employeeId)
);

export const fetchLeaveHistory = createAsyncThunk(
  "leave/fetchHistory",
  (employeeId: string) => leaveService.getHistory(employeeId)
);

interface ApplyLeaveArgs {
  employeeId: string;
  data: ApplyLeaveData;
}

export const applyLeave = createAsyncThunk<
  Leave,
  ApplyLeaveArgs,
  { rejectValue: string }
>("leave/apply", async (payload, { rejectWithValue }) => {
  try {
    return await leaveService.apply(payload.employeeId, payload.data);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

interface CancelLeaveArgs {
  id: string;
  employeeId: string;
}

export const cancelLeave = createAsyncThunk<
  Leave,
  CancelLeaveArgs,
  { rejectValue: string }
>("leave/cancel", async (payload, { rejectWithValue }) => {
  try {
    return await leaveService.cancel(payload.id, payload.employeeId);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchLeaveBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Failed to load leave balance";
      })
      .addCase(fetchLeaveHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaveHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchLeaveHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? "Failed to load leave history";
      })
      .addCase(applyLeave.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = [action.payload, ...state.history];
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to apply for leave";
      })
      .addCase(cancelLeave.fulfilled, (state, action) => {
        const updated = action.payload;
        state.history = state.history.map((r) =>
          r.id === updated.id ? updated : r
        );
      })
      .addCase(cancelLeave.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to cancel leave";
      });
  },
});

export const { clearError } = leaveSlice.actions;
export default leaveSlice.reducer;