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
  // "Schoolid": "86"
};

export function buildHeaders(token?: string,school_id?: string | number): Record<string, string> {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) {
    // Use the short token from login response as Bearer
    headers['Authorization'] = `Bearer ${token}`;
    headers['token'] = token;
  }
  if (school_id) {
    headers['Schoolid'] = String(school_id);
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
    body: JSON.stringify(payload),
  });
}

// ═══════════════════════════════════════════════════════
// MARKS ENTRY
// ═══════════════════════════════════════════════════════

import type {
  ClassSectionListResponse,
  ClassExamListResponse,
  ClassSectionMarksheetResponse,
  SaveMarksPayload,
  SaveMarksResponse,
  CoscholasticMarksEntryResponse,
  SaveCoscholasticPayload,
  SaveCoscholasticResponse,
  CoscholasticExamListResponse,
} from '@/types';

/**
 * GET list of all classes with their sections.
 * GET /webservice/getClassSectionList
 */
export async function getClassSectionList(
  token: string,
  school_id: string

): Promise<ClassSectionListResponse> {
  return apiFetch<ClassSectionListResponse>('/webservice/getClassSectionList', {
    method: 'GET',
    headers: buildHeaders(token,school_id),
  });
}

/**
 * GET exam list for a specific class/section.
 * POST /Webservice/getClassExamList
 */
export async function getClassExamList(payload: {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
}, token: string): Promise<ClassExamListResponse> {
  return apiFetch<ClassExamListResponse>('/Webservice/getClassExamList', {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
}

/**
 * GET student marksheet for class/section/exam combination.
 * POST /Webservice/getClassSectionMarksheet
 */
export async function getClassSectionMarksheet(payload: {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_id: string | number;
}, token: string): Promise<ClassSectionMarksheetResponse> {

  return apiFetch<ClassSectionMarksheetResponse>('/Webservice/getClassSectionMarksheet', {
    method: 'POST',
    headers: buildHeaders(token,payload?.school_id),
    body: JSON.stringify(payload),
  });
}

/**
 * Save a single student's marks for one subject.
 * POST /Webservice/saveStudentMarksEntry
 */
export async function saveStudentMarksEntry(
  payload: SaveMarksPayload,
  token: string
): Promise<SaveMarksResponse> {
  return apiFetch<SaveMarksResponse>('/Webservice/saveStudentMarksEntry', {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
}


// ═══════════════════════════════════════════════════════
// CO-SCHOLASTIC GRADE REPORT
// ═══════════════════════════════════════════════════════

/**
 * GET Co-Scholastic exam list for a class/section.
 * POST /Webservice/getCoscholasticExamByClass
 */
export async function getCoscholasticExamList(payload: {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
}, token: string): Promise<CoscholasticExamListResponse> {
  return apiFetch<CoscholasticExamListResponse>('/Webservice/getCoscholasticExamByClass', {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
}

/**
 * GET Co-Scholastic student grades entry for a class/section/exam.
 * POST /Webservice/getCoscholasticMarksEntry
 */
export async function getCoscholasticMarksEntry(payload: {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_id: string | number;
}, token: string): Promise<CoscholasticMarksEntryResponse> {
  return apiFetch<CoscholasticMarksEntryResponse>('/Webservice/getCoscholasticMarksEntry', {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
}

/**
 * Save Co-Scholastic grades for a single student (all subjects at once).
 * POST /Webservice/saveCoscholasticMarksEntry
 */
export async function saveCoscholasticMarksEntry(
  payload: SaveCoscholasticPayload,
  token: string,
): Promise<SaveCoscholasticResponse> {
  return apiFetch<SaveCoscholasticResponse>('/Webservice/saveCoscholasticMarksEntry', {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
}