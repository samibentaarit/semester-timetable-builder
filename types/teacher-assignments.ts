export interface ClassSubjectTeacher {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TeacherAssignmentConflict {
  type: "teacher_subject_mismatch" | "teacher_overcommitted" | "class_subject_duplicate" | "teacher_unavailable"
  message: string
  severity: "error" | "warning" | "info"
  affectedAssignments: string[]
  suggestions?: string[]
}

export interface TeacherWorkload {
  teacherId: string
  teacherName: string
  totalClasses: number
  totalWeeklyHours: number
  weeklyHourLimit: number
  utilizationPercentage: number
  subjects: {
    subjectId: string
    subjectName: string
    classCount: number
    estimatedWeeklyHours: number
  }[]
}
