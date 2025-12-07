import type { ClassSubjectTeacher } from "@/types/teacher-assignments"

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
