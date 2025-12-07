import type { Subject, Grade, ClassSection, Teacher, Room, TimeSlot, GradeSubjectAllocation } from "@/types/timetable"
import type { ClassSubjectTeacher } from "@/types/teacher-assignments"

export const subjects: Subject[] = [
  { id: "1", name: "Mathematics", code: "MATH", color: "#3b82f6" },
  { id: "2", name: "English", code: "ENG", color: "#10b981" },
  { id: "3", name: "Science", code: "SCI", color: "#f59e0b" },
  { id: "4", name: "History", code: "HIST", color: "#8b5cf6" },
  { id: "5", name: "Physical Education", code: "PE", color: "#ef4444" },
  { id: "6", name: "Art", code: "ART", color: "#ec4899" },
  { id: "7", name: "Music", code: "MUS", color: "#06b6d4" },
  { id: "8", name: "Computer Science", code: "CS", color: "#84cc16" },
]

export const grades: Grade[] = [
  { id: "1", name: "Grade 1", level: 1 },
  { id: "2", name: "Grade 2", level: 2 },
  { id: "3", name: "Grade 3", level: 3 },
  { id: "4", name: "Grade 4", level: 4 },
  { id: "5", name: "Grade 5", level: 5 },
  { id: "6", name: "Grade 6", level: 6 },
  { id: "7", name: "Grade 7", level: 7 },
  { id: "8", name: "Grade 8", level: 8 },
  { id: "9", name: "Grade 9", level: 9 },
  { id: "10", name: "Grade 10", level: 10 },
  { id: "11", name: "Grade 11", level: 11 },
  { id: "12", name: "Grade 12", level: 12 },
]

export const classSections: ClassSection[] = [
  { id: "1", name: "Grade 9A", gradeId: "9", studentCount: 30 },
  { id: "2", name: "Grade 9B", gradeId: "9", studentCount: 28 },
  { id: "3", name: "Grade 10A", gradeId: "10", studentCount: 32 },
  { id: "4", name: "Grade 10B", gradeId: "10", studentCount: 29 },
  { id: "5", name: "Grade 11A", gradeId: "11", studentCount: 25 },
  { id: "6", name: "Grade 12A", gradeId: "12", studentCount: 27 },
]

export const teachers: Teacher[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@school.edu",
    subjects: ["1", "3"],
    weeklyHourLimit: 25,
    currentWeeklyHours: 0,
  },
  {
    id: "2",
    name: "Mr. David Chen",
    email: "david.chen@school.edu",
    subjects: ["2"],
    weeklyHourLimit: 30,
    currentWeeklyHours: 0,
  },
  {
    id: "3",
    name: "Ms. Emily Rodriguez",
    email: "emily.rodriguez@school.edu",
    subjects: ["4", "6"],
    weeklyHourLimit: 28,
    currentWeeklyHours: 0,
  },
  {
    id: "4",
    name: "Prof. Michael Brown",
    email: "michael.brown@school.edu",
    subjects: ["8"],
    weeklyHourLimit: 20,
    currentWeeklyHours: 0,
  },
  {
    id: "5",
    name: "Coach Lisa Wilson",
    email: "lisa.wilson@school.edu",
    subjects: ["5"],
    weeklyHourLimit: 35,
    currentWeeklyHours: 0,
  },
  {
    id: "6",
    name: "Mr. James Taylor",
    email: "james.taylor@school.edu",
    subjects: ["7"],
    weeklyHourLimit: 25,
    currentWeeklyHours: 0,
  },
]

export const rooms: Room[] = [
  { id: "1", name: "Room 101", capacity: 35, type: "classroom" },
  { id: "2", name: "Room 102", capacity: 35, type: "classroom" },
  { id: "3", name: "Science Lab A", capacity: 30, type: "laboratory" },
  { id: "4", name: "Computer Lab", capacity: 25, type: "computer_lab" },
  { id: "5", name: "Gymnasium", capacity: 100, type: "gym" },
  { id: "6", name: "Art Studio", capacity: 20, type: "studio" },
  { id: "7", name: "Music Room", capacity: 25, type: "music_room" },
]

export const timeSlots: TimeSlot[] = [
  { id: "1", day: "Monday", period: 1, startTime: "08:00", endTime: "08:45" },
  { id: "2", day: "Monday", period: 2, startTime: "08:50", endTime: "09:35" },
  { id: "3", day: "Monday", period: 3, startTime: "09:40", endTime: "10:25" },
  { id: "4", day: "Monday", period: 4, startTime: "10:45", endTime: "11:30" },
  { id: "5", day: "Monday", period: 5, startTime: "11:35", endTime: "12:20" },
  { id: "6", day: "Monday", period: 6, startTime: "13:20", endTime: "14:05" },
  { id: "7", day: "Monday", period: 7, startTime: "14:10", endTime: "14:55" },
  { id: "8", day: "Monday", period: 8, startTime: "15:00", endTime: "15:45" },
  // Repeat for other days
  { id: "9", day: "Tuesday", period: 1, startTime: "08:00", endTime: "08:45" },
  { id: "10", day: "Tuesday", period: 2, startTime: "08:50", endTime: "09:35" },
  { id: "11", day: "Tuesday", period: 3, startTime: "09:40", endTime: "10:25" },
  { id: "12", day: "Tuesday", period: 4, startTime: "10:45", endTime: "11:30" },
  { id: "13", day: "Tuesday", period: 5, startTime: "11:35", endTime: "12:20" },
  { id: "14", day: "Tuesday", period: 6, startTime: "13:20", endTime: "14:05" },
  { id: "15", day: "Tuesday", period: 7, startTime: "14:10", endTime: "14:55" },
  { id: "16", day: "Tuesday", period: 8, startTime: "15:00", endTime: "15:45" },
  // Continue for Wednesday, Thursday, Friday...
  { id: "17", day: "Wednesday", period: 1, startTime: "08:00", endTime: "08:45" },
  { id: "18", day: "Wednesday", period: 2, startTime: "08:50", endTime: "09:35" },
  { id: "19", day: "Wednesday", period: 3, startTime: "09:40", endTime: "10:25" },
  { id: "20", day: "Wednesday", period: 4, startTime: "10:45", endTime: "11:30" },
  { id: "21", day: "Wednesday", period: 5, startTime: "11:35", endTime: "12:20" },
  { id: "22", day: "Wednesday", period: 6, startTime: "13:20", endTime: "14:05" },
  { id: "23", day: "Wednesday", period: 7, startTime: "14:10", endTime: "14:55" },
  { id: "24", day: "Wednesday", period: 8, startTime: "15:00", endTime: "15:45" },
  { id: "25", day: "Thursday", period: 1, startTime: "08:00", endTime: "08:45" },
  { id: "26", day: "Thursday", period: 2, startTime: "08:50", endTime: "09:35" },
  { id: "27", day: "Thursday", period: 3, startTime: "09:40", endTime: "10:25" },
  { id: "28", day: "Thursday", period: 4, startTime: "10:45", endTime: "11:30" },
  { id: "29", day: "Thursday", period: 5, startTime: "11:35", endTime: "12:20" },
  { id: "30", day: "Thursday", period: 6, startTime: "13:20", endTime: "14:05" },
  { id: "31", day: "Thursday", period: 7, startTime: "14:10", endTime: "14:55" },
  { id: "32", day: "Thursday", period: 8, startTime: "15:00", endTime: "15:45" },
  { id: "33", day: "Friday", period: 1, startTime: "08:00", endTime: "08:45" },
  { id: "34", day: "Friday", period: 2, startTime: "08:50", endTime: "09:35" },
  { id: "35", day: "Friday", period: 3, startTime: "09:40", endTime: "10:25" },
  { id: "36", day: "Friday", period: 4, startTime: "10:45", endTime: "11:30" },
  { id: "37", day: "Friday", period: 5, startTime: "11:35", endTime: "12:20" },
  { id: "38", day: "Friday", period: 6, startTime: "13:20", endTime: "14:05" },
  { id: "39", day: "Friday", period: 7, startTime: "14:10", endTime: "14:55" },
  { id: "40", day: "Friday", period: 8, startTime: "15:00", endTime: "15:45" },
]

export const defaultGradeSubjectAllocations: GradeSubjectAllocation[] = [
  // Grade 9 allocations
  { id: "1", gradeId: "9", subjectId: "1", weeklyHours: 5, semesterWeeks: 18, totalHours: 90 },
  { id: "2", gradeId: "9", subjectId: "2", weeklyHours: 4, semesterWeeks: 18, totalHours: 72 },
  { id: "3", gradeId: "9", subjectId: "3", weeklyHours: 4, semesterWeeks: 18, totalHours: 72 },
  { id: "4", gradeId: "9", subjectId: "4", weeklyHours: 3, semesterWeeks: 18, totalHours: 54 },
  { id: "5", gradeId: "9", subjectId: "5", weeklyHours: 2, semesterWeeks: 18, totalHours: 36 },
  { id: "6", gradeId: "9", subjectId: "6", weeklyHours: 2, semesterWeeks: 18, totalHours: 36 },
  { id: "7", gradeId: "9", subjectId: "7", weeklyHours: 1, semesterWeeks: 18, totalHours: 18 },
  { id: "8", gradeId: "9", subjectId: "8", weeklyHours: 2, semesterWeeks: 18, totalHours: 36 },
  // Grade 10 allocations
  { id: "9", gradeId: "10", subjectId: "1", weeklyHours: 5, semesterWeeks: 18, totalHours: 90 },
  { id: "10", gradeId: "10", subjectId: "2", weeklyHours: 4, semesterWeeks: 18, totalHours: 72 },
  { id: "11", gradeId: "10", subjectId: "3", weeklyHours: 4, semesterWeeks: 18, totalHours: 72 },
  { id: "12", gradeId: "10", subjectId: "4", weeklyHours: 3, semesterWeeks: 18, totalHours: 54 },
  { id: "13", gradeId: "10", subjectId: "5", weeklyHours: 2, semesterWeeks: 18, totalHours: 36 },
  { id: "14", gradeId: "10", subjectId: "6", weeklyHours: 2, semesterWeeks: 18, totalHours: 36 },
  { id: "15", gradeId: "10", subjectId: "7", weeklyHours: 1, semesterWeeks: 18, totalHours: 18 },
  { id: "16", gradeId: "10", subjectId: "8", weeklyHours: 3, semesterWeeks: 18, totalHours: 54 },
]

export const defaultClassSubjectTeachers: ClassSubjectTeacher[] = [
  // Grade 9A assignments
  {
    id: "1",
    classId: "1", // Grade 9A
    subjectId: "1", // Mathematics
    teacherId: "1", // Dr. Sarah Johnson
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    classId: "1", // Grade 9A
    subjectId: "2", // English
    teacherId: "2", // Mr. David Chen
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    classId: "1", // Grade 9A
    subjectId: "3", // Science
    teacherId: "1", // Dr. Sarah Johnson
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    classId: "1", // Grade 9A
    subjectId: "4", // History
    teacherId: "3", // Ms. Emily Rodriguez
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    classId: "1", // Grade 9A
    subjectId: "5", // Physical Education
    teacherId: "5", // Coach Lisa Wilson
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Grade 9B assignments
  {
    id: "6",
    classId: "2", // Grade 9B
    subjectId: "1", // Mathematics
    teacherId: "1", // Dr. Sarah Johnson
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "7",
    classId: "2", // Grade 9B
    subjectId: "2", // English
    teacherId: "2", // Mr. David Chen
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "8",
    classId: "2", // Grade 9B
    subjectId: "8", // Computer Science
    teacherId: "4", // Prof. Michael Brown
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]
