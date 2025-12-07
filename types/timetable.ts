export interface Subject {
  id: string
  name: string
  code: string
  color: string
}

export interface GradeSubjectAllocation {
  id: string
  gradeId: string
  subjectId: string
  weeklyHours: number
  semesterWeeks: number
  totalHours: number
}

export interface Grade {
  id: string
  name: string
  level: number
}

export interface ClassSection {
  id: string
  name: string
  gradeId: string
  studentCount: number
}

export interface Teacher {
  id: string
  name: string
  email: string
  subjects: string[]
  weeklyHourLimit: number
  currentWeeklyHours: number
}

export interface Room {
  id: string
  name: string
  capacity: number
  type: string
}

export interface TimeSlot {
  id: string
  day: string
  period: number
  startTime: string
  endTime: string
}

export interface TimetableEntry {
  id: string
  classId: string
  teacherId: string
  subjectId: string
  roomId?: string
  timeSlotId: string
  day: string
  period: number
}

export interface ClassSubjectTeacher {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Conflict {
  type: "teacher_double_booking" | "room_clash" | "teacher_overload" | "subject_hours_exceeded"
  message: string
  severity: "warning" | "error"
  affectedEntries: string[]
}
