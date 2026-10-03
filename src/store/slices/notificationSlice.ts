import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Notification } from "@/types";
import { notificationService } from "@/services/notification.service";

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async () => notificationService.getAll()
);

export const markAsRead = createAsyncThunk<Notification, string, { rejectValue: string }>(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      return await notificationService.markAsRead(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const markAllAsRead = createAsyncThunk<Notification[], void, { rejectValue: string }>(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.markAllAsRead();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
    isLoading: false,
  } as NotificationState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.isRead).length;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n.id === action.payload.id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;