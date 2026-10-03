// src/dto/attendance.dto.ts

/**
 * Data Transfer Objects (DTO) for Attendance Management in the backend API.
 * These schemas are used for validating request/response payloads via Zod.
 * They correspond to the frontend service contracts defined in `src/services/attendance.service.ts`
 * and the Prisma `Attendance` model.
 */

import { z } from "zod";

/**
 * Shared Location DTO – used for both request (check‑in) and response payloads.
 */
export const AttendanceLocationDto = z.object({
  latitude: z.number().refine((v) => v >= -90 && v <= 90, {
    message: "Latitude must be between -90 and 90",
  }),
  longitude: z.number().refine((v) => v >= -180 && v <= 180, {
    message: "Longitude must be between -180 and 180",
  }),
  accuracy: z.number().nonnegative(),
});

/**
 * DTO for creating (check‑in) an attendance record.
 */
export const AttendanceCreateDto = z.object({
  employeeId: z.string().uuid(),
  officeId: z.string().uuid(),
  location: AttendanceLocationDto,
  timestamp: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid ISO timestamp",
  }),
});

/**
 * DTO for updating (check‑out) an attendance record.
 */
export const AttendanceUpdateDto = z.object({
  attendanceId: z.string().uuid(),
  location: AttendanceLocationDto.optional(), // checkout can omit location
  timestamp: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid ISO timestamp",
  }),
});

/**
 * DTO for reading a single attendance entry (response).
 * Mirrors the Prisma `Attendance` model but exposes only JSON‑serialisable fields.
 */
export const AttendanceReadDto = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  officeId: z.string().uuid().nullable(),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid ISO date",
  }),
  checkIn: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid check‑in timestamp",
  }),
  checkOut: z.string().nullable().refine((v) => v === null || !isNaN(Date.parse(v)), {
    message: "Invalid check‑out timestamp",
  }),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"]),
  workDurationMinutes: z.number().nonnegative(),
  breakDurationMinutes: z.number().nonnegative(),
  // Embedded Geo data for transparency – same shape as AttendanceLocationDto
  checkInLocation: AttendanceLocationDto,
  checkOutLocation: AttendanceLocationDto.optional(),
});

/**
 * TypeScript types inferred from the Zod schemas – useful for service layer typing.
 */
export type AttendanceLocationDto = z.infer<typeof AttendanceLocationDto>;
export type AttendanceCreateDto = z.infer<typeof AttendanceCreateDto>;
export type AttendanceUpdateDto = z.infer<typeof AttendanceUpdateDto>;
export type AttendanceReadDto = z.infer<typeof AttendanceReadDto>;

/**
 * DTO for reading a paginated list of attendances.
 */
export const AttendanceListResponseDto = z.object({
  items: AttendanceReadDto.array(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export type AttendanceListResponseDto = z.infer<typeof AttendanceListResponseDto>;
