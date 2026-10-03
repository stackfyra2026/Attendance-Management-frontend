import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Attendance, AttendanceLocation } from "@/types";
import type { RootState } from "../store";
import {
  attendanceService,
  type MonthlyAttendance,
} from "@/services/attendance.service";
import { parseISO } from "@/utils/date";

interface AttendanceState {
  today: Attendance | null;
  history: Attendance[];
  monthly: MonthlyAttendance | null;
  isLoading: boolean;
  isLoadingMonthly: boolean;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  error: string | null;
  breakStartedAt: string | null;
}

const initialState: AttendanceState = {
  today: null,
  history: [],
  monthly: null,
  isLoading: false,
  isLoadingMonthly: false,
  isCheckingIn: false,
  isCheckingOut: false,
  error: null,
  breakStartedAt: null,
};

export const fetchTodayAttendance = createAsyncThunk(
  "attendance/fetchToday",
  async (employeeId: string) => attendanceService.getToday(employeeId)
);

export const fetchAttendanceHistory = createAsyncThunk(
  "attendance/fetchHistory",
  async (employeeId: string) => attendanceService.getHistory(employeeId)
);

interface MonthlyArgs {
  employeeId: string;
  month: string;
}

export const fetchMonthlyAttendance = createAsyncThunk<MonthlyAttendance, MonthlyArgs>(
  "attendance/fetchMonthly",
  async (payload) => attendanceService.getMonthly(payload.employeeId, payload.month)
);

interface CheckInArgs {
  employeeId: string;
  officeId: string;
  location: AttendanceLocation;
}

export const checkIn = createAsyncThunk<
  Attendance,
  CheckInArgs,
  { rejectValue: string }
>("attendance/checkIn", async (payload, { rejectWithValue }) => {
  try {
    return await attendanceService.checkIn({
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

interface CheckOutArgs {
  employeeId: string;
  location?: AttendanceLocation;
  reason?: string;
}

export const checkOut = createAsyncThunk<
  Attendance,
  CheckOutArgs,
  { rejectValue: string }
>("attendance/checkOut", async (payload, { getState, rejectWithValue }) => {
  const state = getState() as RootState;
  const record = state.attendance.today;
  if (!record?.checkIn) {
    return rejectWithValue("You are not checked in today.");
  }

  const nowMs = Date.now();
  const checkInMs = parseISO(record.checkIn).getTime();
  const accumulatedBreakMs = record.breakMinutes * 60000;
  const activeBreakMs = state.attendance.breakStartedAt
    ? nowMs - parseISO(state.attendance.breakStartedAt).getTime()
    : 0;
  const workingHours = Math.max(0, (nowMs - checkInMs - accumulatedBreakMs - activeBreakMs) / 3600000);

  try {
    return await attendanceService.checkOut({
      employeeId: payload.employeeId,
      workingHours,
      location: payload.location,
      reason: payload.reason,
    });
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

interface EndBreakArgs {
  employeeId: string;
  breakMinutes: number;
}

export const endBreak = createAsyncThunk<
  Attendance,
  EndBreakArgs,
  { rejectValue: string }
>("attendance/endBreak", async (payload, { rejectWithValue }) => {
  try {
    return await attendanceService.endBreak(payload.employeeId, payload.breakMinutes);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    startBreak(state, action: PayloadAction<string>) {
      state.breakStartedAt = action.payload;
    },
    clearToday(state) {
      state.today = null;
      state.breakStartedAt = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.today = action.payload;
        state.breakStartedAt = null;
      })
      .addCase(fetchTodayAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.error.message ?? "") || "Failed to load attendance";
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(fetchMonthlyAttendance.pending, (state) => {
        state.isLoadingMonthly = true;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.isLoadingMonthly = false;
        state.monthly = action.payload;
      })
      .addCase(fetchMonthlyAttendance.rejected, (state) => {
        state.isLoadingMonthly = false;
      })
      .addCase(checkIn.pending, (state) => {
        state.isCheckingIn = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.isCheckingIn = false;
        state.today = action.payload;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.isCheckingIn = false;
        state.error = action.payload ?? "Check-in failed";
      })
      .addCase(checkOut.pending, (state) => {
        state.isCheckingOut = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.isCheckingOut = false;
        state.today = action.payload;
        state.breakStartedAt = null;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.isCheckingOut = false;
        state.error = action.payload ?? "Check-out failed";
      })
      .addCase(endBreak.fulfilled, (state, action) => {
        state.today = action.payload;
        state.breakStartedAt = null;
      })
      .addCase(endBreak.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to end break";
      });
  },
});

export const { startBreak, clearToday, clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;