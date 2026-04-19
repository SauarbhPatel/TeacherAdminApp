import {
  LoginResponse,
  DailyAttendanceResponse,
  AttendanceTypesResponse,
  SaveAttendancePayload,
  SaveAttendanceResponse,
} from '@/types';

// ─── Base Config ────────────────────────────────────────
const BASE_URL = 'https://edumug.in/api';

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  "Client-Service": "smartschool",
  "Auth-Key": "schoolAdmin@",
  token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiZXJwQG11Zy5jb20iLCJ1c2VybmFtZSI6InJpd2Vic29mdCJ9.89EaZzArzGv44nHv6mZCkcVjL9ruMhAxarhvgjY-umU",
  "Schoolid": "86"
};

export function buildHeaders(token?: string,school_id?:string): Record<string, string> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) {
    // Use the short token from login response as Bearer
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }
  if (school_id) {
    headers['Schoolid'] = school_id;
  }
  return headers;
}

// ─── Helper ──────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers as Record<string, string> || {}) },
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.response_message || `Server error: ${response.status}`);
  }

  return data as T;
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════

export interface LoginPayload {
  username: string;
  password: string;
  deviceToken?: string;
}

export async function staffLogin(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/home/stafflogin', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username.trim(),
      password: payload.password,
      deviceToken: payload.deviceToken ?? 'EXPO_APP_TOKEN',
    }),
  });
}

// ═══════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════

/**
 * GET daily attendance overview for all classes on a given date.
 * Requires staff token from login.
 */
export async function getDailyAttendance(
  date: string,   // "YYYY-MM-DD"
  token: string,
  school_id: string
): Promise<DailyAttendanceResponse> {
  return apiFetch<DailyAttendanceResponse>('/attendance/get_daily_attendance', {
    method: 'POST',
    headers: buildHeaders(token,school_id),
    body: JSON.stringify({ date }),
  });
}

/**
 * GET all attendance types (Present, Leave, Absent, Holiday).
 * Requires staff token.
 */
export async function getAttendanceTypes(
  token: string,
  school_id: string

): Promise<AttendanceTypesResponse> {
  return apiFetch<AttendanceTypesResponse>('/attendance/get_attendance_type', {
    method: 'GET',
    headers: buildHeaders(token,school_id),
  });
}

/**
 * Save / update a single student's attendance.
 */
export async function saveAttendance(
  payload: SaveAttendancePayload,
  token: string,
  school_id: string

): Promise<SaveAttendanceResponse> {
  return apiFetch<SaveAttendanceResponse>('/attendance/save_attendance', {
    method: 'POST',
    headers: buildHeaders(token,school_id),
    body: JSON.stringify(payload),
  });
}

/**
 * GET classwise attendance — real student list with existing attendance data.
 * POST /attendance/get_classwise_attendance
 */
export async function getClasswiseAttendance(
  payload: { date: string; class_id: number; section_id: number },
  token: string,
  school_id: string
): Promise<import('@/types').ClasswiseAttendanceResponse> {
  return apiFetch<import('@/types').ClasswiseAttendanceResponse>('/attendance/get_classwise_attendance', {
    method: 'POST',
    headers: buildHeaders(token,school_id),
    body: JSON.stringify(payload,),
  });
}
