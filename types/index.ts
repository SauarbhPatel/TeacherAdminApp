// ─── Staff Record from API ──────────────────────────────
export interface StaffRecord {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  contact_no: string;
  dob: string;
  gender: string;
  department: string;
  designation: string;
  school_id: string;
  is_active: string;
  role: string;
}

// ─── Login API Response ─────────────────────────────────
export interface LoginResponse {
  status: number;
  message: string;
  id: string;
  token: string;
  role: string;
  record: StaffRecord;
  authtoken: string;
  response_code: number;
  response_message: string;
}

// ─── Auth Context Shape ─────────────────────────────────
export interface AuthUser {
  id: string;
  token: string;
  authtoken: string;
  role: string;
  record: StaffRecord;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// ─── Attendance Status (local state) ────────────────────
export type AttendanceStatus = 'P' | 'A' | 'L' | null;

export interface AttendanceState {
  [classId: string]: { [roll: number]: AttendanceStatus };
}

// ─── Daily Attendance Overview  ─────────────────────────
// GET /attendance/get_daily_attendance
export interface DailyAttendanceClass {
  whatapp_send: string | null;
  present: string | null;
  late: string | null;
  absent: string | null;
  half_day: string | null;
  total_present: string | null;
  total_late: string | null;
  total_absent: string | null;
  total_half_day: string | null;
  total_students: string | number;
  mark_by: string;
  class_name: string;
  section_name: string;
  class_id: string;
  section_id: string;
}

export interface DailyAttendanceTotal {
  total_students: number;
  total_present: number;
  total_leave: number;
  total_absent: number;
  total_half_day: number;
}

export interface DailyAttendanceResponse {
  date: string;
  data: DailyAttendanceClass[];
  total: DailyAttendanceTotal;
  response_code: number;
  response_message: string;
}

// ─── Attendance Types ────────────────────────────────────
// GET /attendance/get_attendance_type
export interface AttendanceType {
  id: string;       // "1"=Present, "3"=Leave, "4"=Absent, "5"=Holiday
  type: string;     // "Present", "Leave", "Absent", "Holiday"
  key_value: string;
}

export interface AttendanceTypesResponse {
  attendance_types: AttendanceType[];
  response_code: number;
  response_message: string;
}

// ─── Save Attendance ─────────────────────────────────────
// POST /attendance/save_attendance
export interface SaveAttendancePayload {
  date: string;
  student_session_id: number;
  attendence_type_id: number;
}

export interface SaveAttendanceResponse {
  student_session_id: string;
  date: string;
  attendence_type_id: string;
  response_code: number;
  response_message: string;
}

// ─── Homework ────────────────────────────────────────────
export interface HomeworkItem {
  cls: string;
  sub: string;
  title: string;
  desc: string;
  due: string;
  tag: string;
}

export interface HomeworkStore {
  active: HomeworkItem[];
  submitted: HomeworkItem[];
  graded: HomeworkItem[];
}

// ─── Classwise Attendance (Student List) ─────────────────
// POST /attendance/get_classwise_attendance
export interface ClasswiseStudent {
  attendence_id: string;
  attendence_dt: string;
  firstname: string;
  middlename: string;
  lastname: string;
  date: string;
  remark: string;
  biometric_attendence: string;
  roll_no: string;
  admission_no: string;
  std_id: string;
  attendence_type_id: string;   // "1"=Present, "3"=Leave, "4"=Absent, "5"=Holiday
  student_session_id: string;
  att_type: string;             // "Present" | "Leave" | "Absent" | "Holiday"
  key: string;                  // HTML badge string from API
  father_name: string;
}

export interface ClasswiseAttendanceResponse {
  date: string;
  selected_date: string;
  class_id: string;
  section_id: string;
  students: ClasswiseStudent[];
  response_code: number;
  response_message: string;
}

export interface ClasswiseAttendancePayload {
  date: string;
  class_id: number;
  section_id: number;
}
