import type {
  AttendanceReportRow,
  LeaveReportRow,
  MonthlySummary,
  OvertimeReportRow,
  ReportFilter,
} from "@/services/report.service";
import type {
  OfficeStat,
  DashboardOverview,
  RecentCheckIn,
  TrendPoint,
} from "@/services/dashboard.service";
import { API } from "@/services/http/endpoints";
import { get } from "@/services/http/request";
import { downloadCSV } from "@/utils/helpers";

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    return get<DashboardOverview>(API.dashboard.overview);
  },

  async getAttendanceTrend(days = 14): Promise<TrendPoint[]> {
    return get<TrendPoint[]>(API.dashboard.trend, {
      params: { days: String(days) },
    });
  },

  async getOfficeStats(): Promise<OfficeStat[]> {
    return get<OfficeStat[]>(API.dashboard.officeStats);
  },

  async getRecentCheckIns(limit = 8): Promise<RecentCheckIn[]> {
    return get<RecentCheckIn[]>(API.dashboard.recentCheckIns, {
      params: { limit: String(limit) },
    });
  },
};

function filterParams(filter: ReportFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.from) params.from = filter.from;
  if (filter.to) params.to = filter.to;
  if (filter.departmentId) params.departmentId = filter.departmentId;
  if (filter.officeId) params.officeId = filter.officeId;
  if (filter.employeeId) params.employeeId = filter.employeeId;
  if (filter.status) params.status = filter.status;
  return params;
}

export const reportApi = {
  async getAttendanceReport(filter: ReportFilter = {}): Promise<AttendanceReportRow[]> {
    return get<AttendanceReportRow[]>(API.reports.attendance, {
      params: filterParams(filter),
    });
  },

  async getLateReport(filter: ReportFilter = {}): Promise<AttendanceReportRow[]> {
    return get<AttendanceReportRow[]>(API.reports.late, {
      params: filterParams(filter),
    });
  },

  async getAbsentReport(filter: ReportFilter = {}): Promise<AttendanceReportRow[]> {
    return get<AttendanceReportRow[]>(API.reports.absent, {
      params: filterParams(filter),
    });
  },

  async getMonthlySummary(month: string, filter: ReportFilter = {}): Promise<MonthlySummary[]> {
    const params = filterParams(filter);
    params.month = month;
    return get<MonthlySummary[]>(API.reports.monthly, { params });
  },

  async getLeaveReport(filter: ReportFilter = {}): Promise<LeaveReportRow[]> {
    return get<LeaveReportRow[]>(API.reports.leave, {
      params: filterParams(filter),
    });
  },

  async getOvertimeReport(filter: ReportFilter = {}): Promise<OvertimeReportRow[]> {
    return get<OvertimeReportRow[]>(API.reports.overtime, {
      params: filterParams(filter),
    });
  },

  exportCsv(filename: string, rows: Record<string, string | number>[]): void {
    downloadCSV(rows, filename);
  },
};