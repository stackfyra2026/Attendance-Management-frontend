import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Theme } from "@/types/enums";

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("attendflow-theme");
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

const initialTheme = getInitialTheme();
setTimeout(() => applyTheme(initialTheme), 0);

const appSlice = createSlice({
  name: "app",
  initialState: {
    theme: initialTheme,
    sidebarOpen: false,
    sidebarCollapsed: false,
  } as AppState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      localStorage.setItem("attendflow-theme", action.payload);
      applyTheme(action.payload);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setTheme, toggleSidebar, closeSidebar, toggleSidebarCollapsed } =
  appSlice.actions;
export default appSlice.reducer;
