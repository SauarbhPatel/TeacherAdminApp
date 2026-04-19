export const TEACHER = {
  name: 'Ms. Sharma',
  email: 'sharma@kendriyavidyalaya.edu.in',
  phone: '+91 98765 43210',
  subject: 'Mathematics & Science',
  employeeId: 'KV-2019-0342',
  school: 'Kendriya Vidyalaya No. 1, Bhopal',
};

export const CLASSES: Record<string, { name: string; subject: string; count: number; time: string; icon: string }> = {
  '5A': { name: 'Class 5-A', subject: 'Mathematics', count: 32, time: '9:00 AM', icon: '📐' },
  '6B': { name: 'Class 6-B', subject: 'Science', count: 28, time: '11:00 AM', icon: '🔬' },
  '4C': { name: 'Class 4-C', subject: 'English', count: 30, time: '1:00 PM', icon: '📖' },
};

export const NAMES: Record<string, string[]> = {
  '5A': [
    'Aarav Rathore', 'Priya Kumari', 'Rahul Sharma', 'Neha Patel', 'Vikram Singh',
    'Anjali Verma', 'Rohan Mehta', 'Sneha Gupta', 'Arjun Singh', 'Kavya Nair',
    'Ishaan Joshi', 'Pooja Yadav', 'Karan Malhotra', 'Simran Kaur', 'Dev Agarwal',
    'Riya Tiwari', 'Akash Pandey', 'Meera Pillai', 'Siddharth Roy', 'Diya Shah',
    'Manish Kumar', 'Aditi Bose', 'Yash Chopra', 'Tanvi Mishra', 'Nikhil Reddy',
    'Aisha Khan', 'Pranav Desai', 'Shreya Iyer', 'Rohit Saxena', 'Lavanya Murthy',
    'Deepak Nair', 'Kritika Jain',
  ],
  '6B': [
    'Alok Sharma', 'Bharti Patel', 'Chirag Mehta', 'Divya Singh', 'Esha Gupta',
    'Farhan Khan', 'Gauri Joshi', 'Harsh Verma', 'Ishita Roy', 'Jai Agarwal',
    'Kirti Tiwari', 'Lakshmi Iyer', 'Mohit Pandey', 'Nandini Bose', 'Om Desai',
    'Pallavi Shah', 'Qureshi Samir', 'Ritu Nair', 'Sandeep Malhotra', 'Tara Pillai',
    'Uday Reddy', 'Vaishnavi Kaur', 'Waseem Ahmad', 'Xerxes Patel', 'Yuvraj Chopra',
    'Zoya Mishra', 'Arun Kumar', 'Bhavna Jain',
  ],
  '4C': [
    'Abhi Rajan', 'Bindu Nair', 'Chetan Rao', 'Dimple Verma', 'Ekta Singh',
    'Faisal Khan', 'Garima Sharma', 'Hemant Gupta', 'Indira Patel', 'Jyoti Mehta',
    'Kailash Joshi', 'Leena Roy', 'Madhav Agarwal', 'Nalini Tiwari', 'Omkar Desai',
    'Prathima Shah', 'Qamar Raza', 'Reena Pillai', 'Suresh Reddy', 'Taruna Kaur',
    'Umesh Bose', 'Vasudha Iyer', 'Waqar Ahmad', 'Ximena Patel', 'Yogesh Chopra',
    'Zainab Mishra', 'Aditya Nair', 'Bhanu Jain', 'Chandra Kumar', 'Devi Saxena',
  ],
};

export const TIMETABLE: Record<string, Array<{
  time: string; cls: string; sub: string; room: string; icon: string; color: string; free?: boolean;
}>> = {
  Mon: [
    { time: '9:00 AM', cls: 'Class 5-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
    { time: '10:00 AM', cls: 'Break', sub: '', room: '', icon: '☕', color: '#a89ec0', free: true },
    { time: '11:00 AM', cls: 'Class 6-B', sub: 'Science', room: 'Lab 2', icon: '🔬', color: '#12b76a' },
    { time: '12:00 PM', cls: 'Class 8-D', sub: 'Mathematics', room: 'Room 08', icon: '📐', color: '#6722d5' },
    { time: '1:00 PM', cls: 'Class 4-C', sub: 'English', room: 'Room 15', icon: '📖', color: '#2e90fa' },
    { time: '2:00 PM', cls: 'Break', sub: '', room: '', icon: '☕', color: '#a89ec0', free: true },
    { time: '3:00 PM', cls: 'Class 7-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
  ],
  Tue: [
    { time: '8:00 AM', cls: 'Class 6-B', sub: 'Science', room: 'Lab 2', icon: '🔬', color: '#12b76a' },
    { time: '9:00 AM', cls: 'Class 4-C', sub: 'English', room: 'Room 15', icon: '📖', color: '#2e90fa' },
    { time: '10:00 AM', cls: 'Break', sub: '', room: '', icon: '☕', color: '#a89ec0', free: true },
    { time: '11:00 AM', cls: 'Class 5-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
    { time: '12:00 PM', cls: 'Class 9-B', sub: 'Mathematics', room: 'Room 20', icon: '📐', color: '#6722d5' },
    { time: '2:00 PM', cls: 'Class 7-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
  ],
  Wed: [
    { time: '9:00 AM', cls: 'Staff Meeting', sub: 'Conference Hall', room: '', icon: '👥', color: '#f79009' },
    { time: '10:00 AM', cls: 'Class 8-D', sub: 'Mathematics', room: 'Room 08', icon: '📐', color: '#6722d5' },
    { time: '11:00 AM', cls: 'Break', sub: '', room: '', icon: '☕', color: '#a89ec0', free: true },
    { time: '12:00 PM', cls: 'Class 6-B', sub: 'Science', room: 'Lab 2', icon: '🔬', color: '#12b76a' },
    { time: '2:00 PM', cls: 'Class 4-C', sub: 'English', room: 'Room 15', icon: '📖', color: '#2e90fa' },
  ],
  Thu: [
    { time: '9:00 AM', cls: 'Class 5-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
    { time: '11:00 AM', cls: 'Class 6-B', sub: 'Science', room: 'Lab 2', icon: '🔬', color: '#12b76a' },
    { time: '1:00 PM', cls: 'Class 4-C', sub: 'English', room: 'Room 15', icon: '📖', color: '#2e90fa' },
  ],
  Fri: [
    { time: '8:00 AM', cls: 'Class 9-B', sub: 'Mathematics', room: 'Room 20', icon: '📐', color: '#6722d5' },
    { time: '10:00 AM', cls: 'Class 5-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
    { time: '12:00 PM', cls: 'Class 7-A', sub: 'Mathematics', room: 'Room 12', icon: '📐', color: '#6722d5' },
    { time: '2:00 PM', cls: 'Break', sub: '', room: '', icon: '☕', color: '#a89ec0', free: true },
  ],
  Sat: [
    { time: '9:00 AM', cls: 'Class 6-B', sub: 'Science Lab', room: 'Lab 2', icon: '🔬', color: '#12b76a' },
    { time: '11:00 AM', cls: 'Class 4-C', sub: 'English Reading', room: 'Library', icon: '📖', color: '#2e90fa' },
  ],
};

export const HOMEWORK = {
  active: [
    { cls: 'Class 5-A', sub: 'Mathematics', title: 'Ch.5 – Fractions Worksheet', desc: 'Complete exercises 5.1 to 5.4 from the textbook.', due: 'Apr 5', tag: 'Written' },
    { cls: 'Class 6-B', sub: 'Science', title: 'Food Chain Diagram', desc: 'Draw a 3-level food chain for a forest ecosystem.', due: 'Apr 6', tag: 'Project' },
    { cls: 'Class 4-C', sub: 'English', title: 'Write a Paragraph on "My School"', desc: 'Minimum 10 sentences. Use at least 5 new vocabulary words.', due: 'Apr 4', tag: 'Written' },
    { cls: 'Class 5-A', sub: 'Mathematics', title: 'Tables Practice 6–12', desc: 'Revise and write multiplication tables from 6 to 12.', due: 'Apr 3', tag: 'Revision' },
  ],
  submitted: [
    { cls: 'Class 6-B', sub: 'Science', title: 'Parts of a Plant Drawing', desc: 'Labeled diagram of a plant.', due: 'Apr 1', tag: 'Practical' },
    { cls: 'Class 5-A', sub: 'Mathematics', title: 'Addition Word Problems', desc: '20 word problems from Ch.4.', due: 'Mar 28', tag: 'Written' },
  ],
  graded: [
    { cls: 'Class 4-C', sub: 'English', title: 'Story Completion', desc: 'Complete the given story in 100 words.', due: 'Mar 25', tag: 'Written' },
  ],
};

export const NOTICES = [
  { type: 'urgent', tag: 'Urgent', title: 'PTM Scheduled – April 10', body: 'Parent-Teacher Meeting is scheduled for Saturday, April 10. All teachers must be present by 9:00 AM. Attendance is compulsory.', date: 'Apr 2, 2026' },
  { type: 'event', tag: 'Event', title: 'Annual Sports Day – April 18', body: 'Sports Day practice starts from April 12. Please coordinate with the PE department regarding your assigned class activities.', date: 'Apr 1, 2026' },
  { type: 'general', tag: 'General', title: 'Revised Academic Calendar', body: 'The revised academic calendar for Term 2 has been uploaded on the staff portal. Please review the updated exam schedule.', date: 'Mar 30, 2026' },
  { type: 'general', tag: 'General', title: 'Staff Development Workshop', body: 'A professional development workshop will be held on April 22 in the school auditorium from 10 AM to 2 PM.', date: 'Mar 28, 2026' },
];

// ─── Marks Entry Mock Data ───────────────────────────────

export const MARKS_CLASSES = [
  { class_id: '2135', class_name: 'I' },
  { class_id: '2136', class_name: 'II' },
  { class_id: '2137', class_name: 'III' },
  { class_id: '2138', class_name: 'IV' },
  { class_id: '2139', class_name: 'V' },
];

export const MARKS_SECTIONS: Record<string, { section_id: string; section_name: string }[]> = {
  '2135': [{ section_id: '868', section_name: 'A' }, { section_id: '869', section_name: 'B' }, { section_id: '870', section_name: 'C' }],
  '2136': [{ section_id: '871', section_name: 'A' }, { section_id: '872', section_name: 'B' }],
  '2137': [{ section_id: '873', section_name: 'A' }, { section_id: '874', section_name: 'B' }, { section_id: '875', section_name: 'C' }],
  '2138': [{ section_id: '876', section_name: 'A' }, { section_id: '877', section_name: 'B' }],
  '2139': [{ section_id: '878', section_name: 'A' }, { section_id: '879', section_name: 'B' }, { section_id: '880', section_name: 'C' }],
};

export const MOCK_EXAMS = [
  { exam_id: '1', exam_name: 'PT- I' },
  { exam_id: '2', exam_name: 'NB- I' },
  { exam_id: '3', exam_name: 'PT- II' },
  { exam_id: '4', exam_name: 'Half Yearly' },
  { exam_id: '5', exam_name: 'PT- III' },
  { exam_id: '6', exam_name: 'Annual' },
];

export const MOCK_SUBJECTS = [
  { subject_id: '1', subject_name: 'ENGLISH',     max_marks: 20 },
  { subject_id: '2', subject_name: 'HINDI',        max_marks: 20 },
  { subject_id: '3', subject_name: 'MATHEMATICS',  max_marks: 20 },
  { subject_id: '8', subject_name: 'EVS',          max_marks: 20 },
];

const makeStudents = (classId: string, sectionId: string, className: string, sectionName: string, examId: string) => {
  const names = [
    { name: 'AVNI', father: 'MANOJ KUMAR', adm: '24/330' },
    { name: 'ARJUN SHARMA', father: 'RAJESH SHARMA', adm: '24/331' },
    { name: 'PRIYA GUPTA', father: 'SURESH GUPTA', adm: '24/332' },
    { name: 'RAHUL VERMA', father: 'DEEPAK VERMA', adm: '24/333' },
    { name: 'NEHA SINGH', father: 'VIKRAM SINGH', adm: '24/334' },
    { name: 'RIYA PATEL', father: 'AMIT PATEL', adm: '24/335' },
    { name: 'ISHAAN MEHTA', father: 'SANJAY MEHTA', adm: '24/336' },
    { name: 'KAVYA NAIR', father: 'KRISHNA NAIR', adm: '24/337' },
    { name: 'ROHAN JOSHI', father: 'PRAKASH JOSHI', adm: '24/338' },
    { name: 'SNEHA YADAV', father: 'RAMESH YADAV', adm: '24/339' },
    { name: 'DEV AGARWAL', father: 'MOHAN AGARWAL', adm: '24/340' },
    { name: 'SIMRAN KAUR', father: 'GURPREET SINGH', adm: '24/341' },
  ];

  return names.map((s, i) => {
    const subjects = MOCK_SUBJECTS.map(sub => {
      const obtained = Math.floor(Math.random() * (sub.max_marks - 8)) + 8;
      const pct = ((obtained / sub.max_marks) * 100).toFixed(0);
      const grade = parseInt(pct) >= 91 ? 'A1' : parseInt(pct) >= 81 ? 'A2' : parseInt(pct) >= 71 ? 'B1' : parseInt(pct) >= 61 ? 'B2' : 'C1';
      const gp = parseInt(pct) >= 91 ? '10.00' : parseInt(pct) >= 81 ? '9.00' : parseInt(pct) >= 71 ? '8.00' : parseInt(pct) >= 61 ? '7.00' : '6.00';
      return { ...sub, marks_obtained: obtained, percentage: pct, grade_name: grade, grade_point: gp };
    });

    const total = subjects.reduce((a, b) => a + b.marks_obtained, 0);
    const maxTotal = subjects.reduce((a, b) => a + b.max_marks, 0);
    const pct = ((total / maxTotal) * 100).toFixed(1);
    const grade = parseFloat(pct) >= 91 ? 'A1' : parseFloat(pct) >= 81 ? 'A2' : parseFloat(pct) >= 71 ? 'B1' : 'B2';

    return {
      student_id: String(67399 + i),
      student_session_id: String(91372 + i),
      class_id: classId,
      section_id: sectionId,
      class: className,
      section: sectionName,
      admission_no: s.adm,
      student_name: s.name,
      father_name: s.father,
      exams: [{
        exam_id: examId,
        exam_name: MOCK_EXAMS.find(e => e.exam_id === examId)?.exam_name ?? 'Exam',
        max_marks: maxTotal,
        marks_obtained: total,
        percentage: pct,
        grade_name: grade,
        subjects,
      }],
    };
  });
};

export function getMockMarksStudents(classId: string, sectionId: string, className: string, sectionName: string, examId: string) {
  return makeStudents(classId, sectionId, className, sectionName, examId);
}
