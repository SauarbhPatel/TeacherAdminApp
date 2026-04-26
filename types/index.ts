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
  session_id?: string;   // present in some API responses
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

// ─── Marks Entry ─────────────────────────────────────────

// GET /webservice/getClassSectionList
export interface ClassSection {
  section_id: string;
  section_name: string;
}
export interface ClassWithSections {
  class_id: string;
  class_name: string;
  sections: ClassSection[];
}
export interface ClassSectionListResponse {
  total_classes: number;
  data: ClassWithSections[];
  response_code: number;
  response_message: string;
}

// POST /Webservice/getClassExamList
export interface ExamItem {
  exam_id: string;
  exam_name: string;
}
export interface ClassExamListResponse {
  exams: ExamItem[];
  response_code: number;
  response_message: string;
  message:string;

}

// POST /Webservice/getClassSectionMarksheet
export interface MarksSubject {
  subject_id: string;
  subject_name: string;
  max_marks: number;
  marks_obtained: number;
  percentage: string;
  grade_name: string;
  grade_point: string;
}
export interface MarksExam {
  exam_id: string;
  exam_name: string;
  max_marks: number;
  marks_obtained: number;
  percentage: string;
  grade_name: string;
  subjects: MarksSubject[];
}
export interface MarksStudent {
  student_id: string;
  student_session_id: string;
  class_id: string;
  section_id: string;
  class: string;
  section: string;
  admission_no: string;
  student_name: string;
  father_name: string;
  exams: MarksExam[];
}
export interface ClassSectionMarksheetResponse {
  students: MarksStudent[];
  response_code: number;
  response_message: string;
}

// POST /Webservice/saveStudentMarksEntry
export interface SaveMarksPayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_master_id: string | number;
  student_id: string;
  subject_master_id: string | number;
  marks_obtained: number;
}
export interface SaveMarksResponse {
  student_id: string;
  subject_master_id: number;
  exam_master_id: number;
  marks_obtained: number;
  response_code: number;
  response_message: string;
}


// GET /Webservice/getCoscholasticExamByClass
export interface CoscholasticExamItem {
  exam_id: string;
  exam_name: string;
}
export interface CoscholasticExamListResponse {
  exams: CoscholasticExamItem[];
  response_code: number;
  response_message: string;
}
 
// GET /Webservice/getCoscholasticMarksEntry
export interface CoscholasticSubject {
  school_id: string;
  class_id: string;
  exam_master_id: string;
  cosubject_master_id: string;
  exam_name: string;
  cosubject_code: string;
  cosubject_name: string;
  grade: string;
}
export interface CoscholasticStudent {
  student_id: string;
  school_id: string;
  session_id: string;
  section_id: string;
  admission_no: string;
  roll_no: string | null;
  firstname: string;
  middlename: string | null;
  lastname: string | null;
  subjects: CoscholasticSubject[];
}
export interface CoscholasticMarksEntryResponse {
  students: CoscholasticStudent[];
  response_code: number;
  response_message: string;
}
 
// POST /Webservice/saveCoscholasticMarksEntry
export interface SaveCoscholasticPayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_id: string | number;
  student_ids: number;       // single student id (int)
  subject_ids: number[];     // array of cosubject_master_id
  grades: string[];          // parallel array of grade strings
}
export interface SaveCoscholasticResponse {
  status: string;
  students_count: number;
  subjects_count: number;
  response_code: number;
  response_message: string;
}

// GET /Webservice/getExamAttendance
export interface ExamAttendanceRecord {
  school_id: string;
  class_id: string;
  exam_master_id: string;
  exam_name: string;
  classes_held: number | string;
  classes_attended: number | string;
  percentage: number | string;
  weightage: number | string;
  remarks: number | string;
}
export interface ExamAttendanceStudent {
  student_id: string;
  school_id: string;
  session_id: string;
  section_id: string;
  admission_no: string;
  roll_no: string | null;
  firstname: string;
  middlename: string | null;
  lastname: string | null;
  attendance: ExamAttendanceRecord;
}
export interface ExamAttendanceResponse {
  students: ExamAttendanceStudent[];
  response_code: number;
  response_message: string;
}
 
// POST /Webservice/saveExamAttendance
export interface SaveExamAttendancePayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_id: string | number;
  student_id: number;
  classes_held: number;
  classes_attended: number;
  remarks: string;
}
export interface SaveExamAttendanceResponse {
  response_code: number;
  response_message: string;
}
 
// GET /Webservice/getStudentExamRemarks
export interface ExamRemarkRecord {
  school_id: string;
  class_id: string;
  exam_master_id: string;
  exam_name: string;
  remarks: string;
}
export interface ExamRemarksStudent {
  student_id: string;
  school_id: string;
  session_id: string;
  section_id: string;
  admission_no: string;
  roll_no: string | null;
  firstname: string;
  middlename: string | null;
  lastname: string | null;
  remarks: ExamRemarkRecord;
}
export interface ExamRemarksResponse {
  students: ExamRemarksStudent[];
  response_code: number;
  response_message: string;
}
 
// POST /Webservice/saveExamRemarks
export interface SaveExamRemarksPayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  exam_id: string | number;
  student_id: number;
  remark: string;
}
export interface SaveExamRemarksResponse {
  response_code: number;
  response_message: string;
}

// ─── ADD TO types/index.ts ───────────────────────────────

export interface HomeworkItem {
  id: string;
  subject_id: string;
  subject_name: string;
  homework_date: string | null;
  from_date: string | null;
  to_date: string | null;
  submit_date: string | null;
  description: string | null;
  document: string | null;
  image: string | null;
  class_id: string;
  section_id: string;
}

export interface HomeworkDashboardItem {
  date: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  homework: HomeworkItem[];
}

export interface HomeworkDashboardResponse {
  total_classes: number;
  data: HomeworkDashboardItem[];
  response_code: number;
  response_message: string;
}

export interface SaveHomeworkSubject {
  subject_id: number;
  description: string;
  document: string;
  image: string;
}

export interface SaveHomeworkPayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  homework_date: string;
  from_date: string;
  to_date: string;
  submit_date: string;
  subjects: SaveHomeworkSubject[];
}

export interface SaveHomeworkResponse {
  response_code: number;
  response_message: string;
}


export interface SubjectItem {
  subject_master_id: string;
  subject_name: string;
}
export interface SubjectListResponse {
  subjects: SubjectItem[];
  response_code: number;
  response_message: string;
}

export interface TestMarkStudent {
  student_id: string;
  admission_no: string;
  roll_no: string | null;
  firstname: string;
  lastname: string | null;
  father_name: string | null;
  subject_master_id: string;
  subject_name: string;
  entry_id: string | null;
  marks_obtained: string | null;
  max_marks: string | null;
  passing_marks: string | null;
  weightage: string | null;
  exam_date: string | null;
}
export interface ClassSectionTestResponse {
  students: TestMarkStudent[];
  response_code: number;
  response_message: string;
}

export interface SaveTestMarksPayload {
  school_id: string | number;
  session_id: string | number;
  class_id: string | number;
  section_id: string | number;
  subject_master_id: string | number;
  student_id: string;
  marks_obtained: number;
  max_marks: number;
  exam_date: string;
}
export interface SaveTestMarksResponse {
  response_code: number;
  response_message: string;
}