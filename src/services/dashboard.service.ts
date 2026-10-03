import { dashboardApi } from "@/services/api/report.api";

export interface DashboardOverview {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  trendDelta: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  rate: number;
}

export interface OfficeStat {
  office: string;
  total: number;
  present: number;
  absent: number;
  late: number;
}

export interface RecentCheckIn {
  id: string;
  name: string;
  designation: string;
  time: string;
  status: string;
}

export const dashboardService = dashboardApi;