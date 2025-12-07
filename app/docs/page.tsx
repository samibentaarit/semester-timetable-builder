"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database, Server, Shield, Code, Lightbulb } from "lucide-react"

interface ModuleDoc {
  id: string
  name: string
  description: string
  entities: Entity[]
  endpoints: Endpoint[]
  permissions: Permission[]
  backendNotes: string[]
  advancedFeatures: string[]
}

interface Entity {
  name: string
  attributes: { name: string; type: string; required: boolean; description: string }[]
  relationships: { entity: string; type: string; description: string }[]
}

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  description: string
  requestBody?: string
  response: string
}

interface Permission {
  role: string
  actions: string[]
}

const modules: ModuleDoc[] = [
  {
    id: "subjects",
    name: "Subject Management",
    description:
      "Manages academic subjects offered by the institution. Subjects are the core teaching units that are allocated to grades and assigned to teachers.",
    entities: [
      {
        name: "Subject",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Full name of the subject (e.g., Mathematics)" },
          { name: "code", type: "string", required: true, description: "Short code (e.g., MATH)" },
          { name: "color", type: "string", required: true, description: "Hex color for UI display (e.g., #3B82F6)" },
        ],
        relationships: [
          {
            entity: "GradeSubjectAllocation",
            type: "One-to-Many",
            description: "A subject can be allocated to multiple grades",
          },
          { entity: "Teacher", type: "Many-to-Many", description: "A subject can be taught by multiple teachers" },
          { entity: "SubjectRoomType", type: "One-to-Many", description: "A subject can have preferred room types" },
        ],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/subjects", description: "List all subjects", response: "Subject[]" },
      { method: "GET", path: "/api/subjects/:id", description: "Get subject by ID", response: "Subject" },
      {
        method: "POST",
        path: "/api/subjects",
        description: "Create new subject",
        requestBody: "{ name, code, color }",
        response: "Subject",
      },
      {
        method: "PUT",
        path: "/api/subjects/:id",
        description: "Update subject",
        requestBody: "{ name?, code?, color? }",
        response: "Subject",
      },
      { method: "DELETE", path: "/api/subjects/:id", description: "Delete subject", response: "{ success: boolean }" },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update"] },
      { role: "Teacher", actions: ["read"] },
    ],
    backendNotes: [
      "Subject codes must be unique across the institution",
      "Deleting a subject should cascade to remove allocations and assignments",
      "Color validation: must be valid hex format",
      "Consider soft delete to preserve historical data",
    ],
    advancedFeatures: [
      "Subject categories/departments grouping",
      "Subject prerequisites tracking",
      "Subject credit hours for higher education",
      "Subject syllabus attachment",
    ],
  },
  {
    id: "grades",
    name: "Grade & Class Management",
    description:
      "Manages academic grades (year levels) and class sections. Each grade contains multiple class sections, and each section has students assigned to it.",
    entities: [
      {
        name: "Grade",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Display name (e.g., Grade 10)" },
          { name: "level", type: "integer", required: true, description: "Numeric level for sorting (e.g., 10)" },
        ],
        relationships: [
          { entity: "ClassSection", type: "One-to-Many", description: "A grade contains multiple class sections" },
          { entity: "GradeSubjectAllocation", type: "One-to-Many", description: "A grade has subject allocations" },
        ],
      },
      {
        name: "ClassSection",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Section name (e.g., 10A, 10B)" },
          { name: "gradeId", type: "UUID", required: true, description: "Reference to parent grade" },
          { name: "studentCount", type: "integer", required: true, description: "Number of students in section" },
        ],
        relationships: [
          { entity: "Grade", type: "Many-to-One", description: "Belongs to a grade" },
          { entity: "ClassSubjectTeacher", type: "One-to-Many", description: "Has teacher assignments" },
          { entity: "TimetableEntry", type: "One-to-Many", description: "Has timetable entries" },
        ],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/grades", description: "List all grades with sections", response: "Grade[]" },
      {
        method: "GET",
        path: "/api/grades/:id",
        description: "Get grade with sections",
        response: "Grade & { sections: ClassSection[] }",
      },
      {
        method: "POST",
        path: "/api/grades",
        description: "Create new grade",
        requestBody: "{ name, level }",
        response: "Grade",
      },
      {
        method: "POST",
        path: "/api/grades/:id/sections",
        description: "Add section to grade",
        requestBody: "{ name, studentCount }",
        response: "ClassSection",
      },
      {
        method: "PUT",
        path: "/api/sections/:id",
        description: "Update section",
        requestBody: "{ name?, studentCount? }",
        response: "ClassSection",
      },
      { method: "DELETE", path: "/api/sections/:id", description: "Delete section", response: "{ success: boolean }" },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update"] },
      { role: "Teacher", actions: ["read"] },
    ],
    backendNotes: [
      "Grade levels must be unique",
      "Section names must be unique within a grade",
      "Student count affects room capacity validation",
      "Consider academic year association for multi-year support",
    ],
    advancedFeatures: [
      "Student roster management per section",
      "Section capacity limits",
      "Grade promotion workflows",
      "Multi-stream support (Science, Arts, Commerce)",
    ],
  },
  {
    id: "allocations",
    name: "Subject Allocation",
    description:
      "Defines how many hours per week each subject should be taught for each grade. This is the curriculum planning layer that determines weekly teaching requirements.",
    entities: [
      {
        name: "GradeSubjectAllocation",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "gradeId", type: "UUID", required: true, description: "Reference to grade" },
          { name: "subjectId", type: "UUID", required: true, description: "Reference to subject" },
          { name: "weeklyHours", type: "integer", required: true, description: "Hours per week (e.g., 5)" },
          { name: "semesterWeeks", type: "integer", required: true, description: "Weeks in semester (e.g., 18)" },
          { name: "totalHours", type: "integer", required: true, description: "Computed: weeklyHours × semesterWeeks" },
        ],
        relationships: [
          { entity: "Grade", type: "Many-to-One", description: "Belongs to a grade" },
          { entity: "Subject", type: "Many-to-One", description: "References a subject" },
        ],
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/allocations",
        description: "List all allocations",
        response: "GradeSubjectAllocation[]",
      },
      {
        method: "GET",
        path: "/api/allocations?gradeId=:id",
        description: "Get allocations for grade",
        response: "GradeSubjectAllocation[]",
      },
      {
        method: "POST",
        path: "/api/allocations",
        description: "Create allocation",
        requestBody: "{ gradeId, subjectId, weeklyHours, semesterWeeks }",
        response: "GradeSubjectAllocation",
      },
      {
        method: "PUT",
        path: "/api/allocations/:id",
        description: "Update allocation",
        requestBody: "{ weeklyHours?, semesterWeeks? }",
        response: "GradeSubjectAllocation",
      },
      {
        method: "DELETE",
        path: "/api/allocations/:id",
        description: "Delete allocation",
        response: "{ success: boolean }",
      },
      {
        method: "POST",
        path: "/api/allocations/bulk",
        description: "Bulk create/update allocations",
        requestBody: "GradeSubjectAllocation[]",
        response: "GradeSubjectAllocation[]",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update", "delete"] },
      { role: "Teacher", actions: ["read"] },
    ],
    backendNotes: [
      "Unique constraint on (gradeId, subjectId) combination",
      "totalHours should be computed on backend, not trusted from client",
      "Validate weeklyHours against available periods per day × days per week",
      "Changes affect timetable validation - may create conflicts",
    ],
    advancedFeatures: [
      "Academic year versioning for allocation history",
      "Template allocations that can be copied across years",
      "Minimum/maximum hours constraints",
      "Double period requirements flag",
    ],
  },
  {
    id: "teachers",
    name: "Teacher Management",
    description:
      "Manages teachers and their subject qualifications. Each teacher has a list of subjects they can teach and a weekly hour limit.",
    entities: [
      {
        name: "Teacher",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Full name" },
          { name: "email", type: "string", required: true, description: "Email address" },
          { name: "subjects", type: "UUID[]", required: true, description: "Array of subject IDs teacher can teach" },
          { name: "weeklyHourLimit", type: "integer", required: true, description: "Maximum teaching hours per week" },
          {
            name: "currentWeeklyHours",
            type: "integer",
            required: false,
            description: "Computed: current assigned hours",
          },
        ],
        relationships: [
          { entity: "Subject", type: "Many-to-Many", description: "Can teach multiple subjects" },
          { entity: "ClassSubjectTeacher", type: "One-to-Many", description: "Has class assignments" },
          { entity: "TimetableEntry", type: "One-to-Many", description: "Appears in timetable entries" },
        ],
      },
      {
        name: "TeacherWorkload",
        attributes: [
          { name: "teacherId", type: "UUID", required: true, description: "Reference to teacher" },
          { name: "teacherName", type: "string", required: true, description: "Teacher name (denormalized)" },
          { name: "totalClasses", type: "integer", required: true, description: "Number of classes assigned" },
          { name: "totalWeeklyHours", type: "integer", required: true, description: "Sum of weekly hours" },
          { name: "weeklyHourLimit", type: "integer", required: true, description: "Maximum allowed hours" },
          {
            name: "utilizationPercentage",
            type: "float",
            required: true,
            description: "Computed: (totalWeeklyHours / weeklyHourLimit) × 100",
          },
        ],
        relationships: [{ entity: "Teacher", type: "One-to-One", description: "Computed view of teacher data" }],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/teachers", description: "List all teachers", response: "Teacher[]" },
      { method: "GET", path: "/api/teachers/:id", description: "Get teacher by ID", response: "Teacher" },
      {
        method: "POST",
        path: "/api/teachers",
        description: "Create teacher",
        requestBody: "{ name, email, subjects, weeklyHourLimit }",
        response: "Teacher",
      },
      {
        method: "PUT",
        path: "/api/teachers/:id",
        description: "Update teacher",
        requestBody: "{ name?, email?, subjects?, weeklyHourLimit? }",
        response: "Teacher",
      },
      { method: "DELETE", path: "/api/teachers/:id", description: "Delete teacher", response: "{ success: boolean }" },
      {
        method: "GET",
        path: "/api/teachers/:id/workload",
        description: "Get teacher workload",
        response: "TeacherWorkload",
      },
      {
        method: "GET",
        path: "/api/teachers/workloads",
        description: "Get all workloads",
        response: "TeacherWorkload[]",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update"] },
      { role: "Teacher", actions: ["read (own data)"] },
    ],
    backendNotes: [
      "Email must be unique",
      "Validate subjects array contains valid subject IDs",
      "currentWeeklyHours is computed from assignments, not stored",
      "Deleting teacher should fail if they have active assignments",
    ],
    advancedFeatures: [
      "Teacher availability preferences (preferred time slots)",
      "Leave/absence management",
      "Subject specialization levels (primary, secondary)",
      "Teacher categories (full-time, part-time, substitute)",
    ],
  },
  {
    id: "assignments",
    name: "Class-Subject-Teacher Assignment",
    description:
      "Links teachers to specific classes for specific subjects. This determines which teacher teaches which subject to which class section.",
    entities: [
      {
        name: "ClassSubjectTeacher",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "classId", type: "UUID", required: true, description: "Reference to class section" },
          { name: "subjectId", type: "UUID", required: true, description: "Reference to subject" },
          { name: "teacherId", type: "UUID", required: true, description: "Reference to teacher" },
          { name: "isActive", type: "boolean", required: true, description: "Whether assignment is active" },
          { name: "createdAt", type: "datetime", required: true, description: "Creation timestamp" },
          { name: "updatedAt", type: "datetime", required: true, description: "Last update timestamp" },
        ],
        relationships: [
          { entity: "ClassSection", type: "Many-to-One", description: "Assigned to a class" },
          { entity: "Subject", type: "Many-to-One", description: "For a subject" },
          { entity: "Teacher", type: "Many-to-One", description: "Taught by a teacher" },
        ],
      },
      {
        name: "TeacherAssignmentConflict",
        attributes: [
          {
            name: "type",
            type: "enum",
            required: true,
            description:
              "Conflict type: teacher_subject_mismatch | teacher_overcommitted | class_subject_duplicate | teacher_unavailable",
          },
          { name: "message", type: "string", required: true, description: "Human-readable conflict description" },
          { name: "severity", type: "enum", required: true, description: "error | warning | info" },
          {
            name: "affectedAssignments",
            type: "UUID[]",
            required: true,
            description: "IDs of conflicting assignments",
          },
          { name: "suggestions", type: "string[]", required: false, description: "Suggested resolutions" },
        ],
        relationships: [],
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/assignments",
        description: "List all assignments",
        response: "ClassSubjectTeacher[]",
      },
      {
        method: "GET",
        path: "/api/assignments?classId=:id",
        description: "Get assignments for class",
        response: "ClassSubjectTeacher[]",
      },
      {
        method: "GET",
        path: "/api/assignments?teacherId=:id",
        description: "Get assignments for teacher",
        response: "ClassSubjectTeacher[]",
      },
      {
        method: "POST",
        path: "/api/assignments",
        description: "Create assignment",
        requestBody: "{ classId, subjectId, teacherId }",
        response: "ClassSubjectTeacher",
      },
      {
        method: "PUT",
        path: "/api/assignments/:id",
        description: "Update assignment",
        requestBody: "{ teacherId?, isActive? }",
        response: "ClassSubjectTeacher",
      },
      {
        method: "DELETE",
        path: "/api/assignments/:id",
        description: "Delete assignment",
        response: "{ success: boolean }",
      },
      {
        method: "GET",
        path: "/api/assignments/conflicts",
        description: "Get all conflicts",
        response: "TeacherAssignmentConflict[]",
      },
      {
        method: "POST",
        path: "/api/assignments/validate",
        description: "Validate assignments",
        requestBody: "ClassSubjectTeacher[]",
        response: "{ valid: boolean, conflicts: TeacherAssignmentConflict[] }",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update", "delete"] },
      { role: "Teacher", actions: ["read (own assignments)"] },
    ],
    backendNotes: [
      "Unique constraint on (classId, subjectId) - one teacher per subject per class",
      "Validate teacher can teach the subject (subjects array contains subjectId)",
      "Validate subject is allocated to the class's grade",
      "Check teacher workload doesn't exceed weeklyHourLimit",
      "Soft delete recommended - set isActive=false instead of hard delete",
    ],
    advancedFeatures: [
      "Co-teaching support (multiple teachers for one subject-class)",
      "Substitute teacher assignment",
      "Assignment history tracking",
      "Bulk assignment import/export",
    ],
  },
  {
    id: "rooms",
    name: "Room & Classroom Management",
    description:
      "Manages physical classrooms and their properties. Rooms are categorized by type and have capacity constraints.",
    entities: [
      {
        name: "RoomType",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Type name (e.g., Computer Lab)" },
          { name: "description", type: "string", required: true, description: "Type description" },
          { name: "color", type: "string", required: true, description: "Hex color for UI" },
          { name: "defaultCapacity", type: "integer", required: true, description: "Default capacity for this type" },
          { name: "features", type: "string[]", required: true, description: "Standard features for this type" },
          { name: "createdAt", type: "datetime", required: true, description: "Creation timestamp" },
          { name: "updatedAt", type: "datetime", required: true, description: "Last update timestamp" },
        ],
        relationships: [
          { entity: "Classroom", type: "One-to-Many", description: "Has multiple rooms of this type" },
          { entity: "SubjectRoomType", type: "One-to-Many", description: "Subjects may prefer this type" },
        ],
      },
      {
        name: "Classroom",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "name", type: "string", required: true, description: "Room name (e.g., Room 101)" },
          { name: "code", type: "string", required: true, description: "Short code (e.g., R101)" },
          { name: "roomTypeId", type: "UUID", required: true, description: "Reference to room type" },
          { name: "capacity", type: "integer", required: true, description: "Maximum students" },
          { name: "floor", type: "string", required: true, description: "Floor location" },
          { name: "building", type: "string", required: true, description: "Building name" },
          { name: "features", type: "string[]", required: true, description: "Available features" },
          { name: "equipment", type: "string[]", required: true, description: "Available equipment" },
          { name: "isActive", type: "boolean", required: true, description: "Whether room is available" },
          { name: "notes", type: "string", required: false, description: "Additional notes" },
          { name: "createdAt", type: "datetime", required: true, description: "Creation timestamp" },
          { name: "updatedAt", type: "datetime", required: true, description: "Last update timestamp" },
        ],
        relationships: [
          { entity: "RoomType", type: "Many-to-One", description: "Has a room type" },
          { entity: "TimetableEntry", type: "One-to-Many", description: "Used in timetable entries" },
          { entity: "RoomAssignment", type: "One-to-Many", description: "Has room assignments" },
        ],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/room-types", description: "List all room types", response: "RoomType[]" },
      {
        method: "POST",
        path: "/api/room-types",
        description: "Create room type",
        requestBody: "{ name, description, color, defaultCapacity, features }",
        response: "RoomType",
      },
      {
        method: "PUT",
        path: "/api/room-types/:id",
        description: "Update room type",
        requestBody: "{ name?, description?, color?, defaultCapacity?, features? }",
        response: "RoomType",
      },
      {
        method: "DELETE",
        path: "/api/room-types/:id",
        description: "Delete room type",
        response: "{ success: boolean }",
      },
      { method: "GET", path: "/api/classrooms", description: "List all classrooms", response: "Classroom[]" },
      { method: "GET", path: "/api/classrooms/:id", description: "Get classroom by ID", response: "Classroom" },
      {
        method: "POST",
        path: "/api/classrooms",
        description: "Create classroom",
        requestBody: "{ name, code, roomTypeId, capacity, floor, building, features, equipment }",
        response: "Classroom",
      },
      {
        method: "PUT",
        path: "/api/classrooms/:id",
        description: "Update classroom",
        requestBody: "Partial<Classroom>",
        response: "Classroom",
      },
      {
        method: "DELETE",
        path: "/api/classrooms/:id",
        description: "Delete classroom",
        response: "{ success: boolean }",
      },
      {
        method: "GET",
        path: "/api/classrooms/:id/availability",
        description: "Get room availability",
        response: "{ day: string, period: number, available: boolean }[]",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Facility Manager", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["read"] },
      { role: "Teacher", actions: ["read"] },
    ],
    backendNotes: [
      "Room codes must be unique",
      "Cannot delete room type if classrooms exist with that type",
      "Validate capacity is positive integer",
      "Consider maintenance scheduling that marks rooms unavailable",
    ],
    advancedFeatures: [
      "Room booking system for non-class events",
      "Maintenance scheduling",
      "Resource/equipment inventory per room",
      "Room distance matrix for optimization",
    ],
  },
  {
    id: "subject-room-types",
    name: "Subject-Room Type Mapping",
    description:
      "Defines which room types are suitable for teaching each subject, with priority levels. Used by the room assignment engine.",
    entities: [
      {
        name: "SubjectRoomType",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "subjectId", type: "UUID", required: true, description: "Reference to subject" },
          { name: "roomTypeId", type: "UUID", required: true, description: "Reference to room type" },
          {
            name: "priority",
            type: "integer",
            required: true,
            description: "1=preferred, 2=acceptable, 3=last resort",
          },
          {
            name: "isRequired",
            type: "boolean",
            required: true,
            description: "If true, subject MUST use this room type",
          },
          { name: "createdAt", type: "datetime", required: true, description: "Creation timestamp" },
          { name: "updatedAt", type: "datetime", required: true, description: "Last update timestamp" },
        ],
        relationships: [
          { entity: "Subject", type: "Many-to-One", description: "For a subject" },
          { entity: "RoomType", type: "Many-to-One", description: "Prefers a room type" },
        ],
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/subject-room-types",
        description: "List all mappings",
        response: "SubjectRoomType[]",
      },
      {
        method: "GET",
        path: "/api/subject-room-types?subjectId=:id",
        description: "Get room types for subject",
        response: "SubjectRoomType[]",
      },
      {
        method: "POST",
        path: "/api/subject-room-types",
        description: "Create mapping",
        requestBody: "{ subjectId, roomTypeId, priority, isRequired }",
        response: "SubjectRoomType",
      },
      {
        method: "PUT",
        path: "/api/subject-room-types/:id",
        description: "Update mapping",
        requestBody: "{ priority?, isRequired? }",
        response: "SubjectRoomType",
      },
      {
        method: "DELETE",
        path: "/api/subject-room-types/:id",
        description: "Delete mapping",
        response: "{ success: boolean }",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update", "delete"] },
      { role: "Facility Manager", actions: ["read", "update"] },
    ],
    backendNotes: [
      "Unique constraint on (subjectId, roomTypeId)",
      "Priority values should be 1, 2, or 3",
      "If isRequired=true, timetable validation should fail without matching room",
      "Used by room assignment engine for automatic room allocation",
    ],
    advancedFeatures: [
      "Equipment requirements per subject",
      "Minimum capacity requirements",
      "Location preferences (specific building/floor)",
    ],
  },
  {
    id: "timeslots",
    name: "Time Slots & Periods",
    description:
      "Defines the daily schedule structure - periods, their times, and breaks. This is the temporal framework for the timetable.",
    entities: [
      {
        name: "TimeSlot",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "day", type: "string", required: true, description: "Day of week (Monday-Friday)" },
          { name: "period", type: "integer", required: true, description: "Period number (1, 2, 3...)" },
          { name: "startTime", type: "string", required: true, description: "Start time (HH:MM format)" },
          { name: "endTime", type: "string", required: true, description: "End time (HH:MM format)" },
        ],
        relationships: [{ entity: "TimetableEntry", type: "One-to-Many", description: "Used in timetable entries" }],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/timeslots", description: "List all time slots", response: "TimeSlot[]" },
      { method: "GET", path: "/api/timeslots?day=:day", description: "Get slots for a day", response: "TimeSlot[]" },
      {
        method: "POST",
        path: "/api/timeslots",
        description: "Create time slot",
        requestBody: "{ day, period, startTime, endTime }",
        response: "TimeSlot",
      },
      {
        method: "PUT",
        path: "/api/timeslots/:id",
        description: "Update time slot",
        requestBody: "{ startTime?, endTime? }",
        response: "TimeSlot",
      },
      {
        method: "DELETE",
        path: "/api/timeslots/:id",
        description: "Delete time slot",
        response: "{ success: boolean }",
      },
      {
        method: "POST",
        path: "/api/timeslots/generate",
        description: "Generate slots for week",
        requestBody: "{ periodsPerDay, startTime, periodDuration, breakAfter, breakDuration }",
        response: "TimeSlot[]",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete"] },
      { role: "Academic Coordinator", actions: ["read", "update"] },
      { role: "Teacher", actions: ["read"] },
    ],
    backendNotes: [
      "Unique constraint on (day, period)",
      "Validate time format and startTime < endTime",
      "Changes affect all timetable entries - notify users",
      "Consider institution-wide vs class-specific schedules",
    ],
    advancedFeatures: [
      "Break periods as special slot type",
      "Different schedules per day",
      "Double period support",
      "Assembly/homeroom periods",
    ],
  },
  {
    id: "timetable",
    name: "Timetable Entries",
    description:
      "The core scheduling data - which teacher teaches which subject to which class in which room at which time.",
    entities: [
      {
        name: "TimetableEntry",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "classId", type: "UUID", required: true, description: "Reference to class section" },
          { name: "teacherId", type: "UUID", required: true, description: "Reference to teacher" },
          { name: "subjectId", type: "UUID", required: true, description: "Reference to subject" },
          {
            name: "roomId",
            type: "UUID",
            required: false,
            description: "Reference to classroom (can be auto-assigned)",
          },
          { name: "timeSlotId", type: "UUID", required: true, description: "Reference to time slot" },
          { name: "day", type: "string", required: true, description: "Day of week (denormalized from time slot)" },
          {
            name: "period",
            type: "integer",
            required: true,
            description: "Period number (denormalized from time slot)",
          },
        ],
        relationships: [
          { entity: "ClassSection", type: "Many-to-One", description: "For a class" },
          { entity: "Teacher", type: "Many-to-One", description: "Taught by teacher" },
          { entity: "Subject", type: "Many-to-One", description: "For a subject" },
          { entity: "Classroom", type: "Many-to-One", description: "In a room" },
          { entity: "TimeSlot", type: "Many-to-One", description: "At a time" },
        ],
      },
      {
        name: "Conflict",
        attributes: [
          {
            name: "type",
            type: "enum",
            required: true,
            description: "teacher_double_booking | room_clash | teacher_overload | subject_hours_exceeded",
          },
          { name: "message", type: "string", required: true, description: "Human-readable description" },
          { name: "severity", type: "enum", required: true, description: "warning | error" },
          { name: "affectedEntries", type: "UUID[]", required: true, description: "IDs of conflicting entries" },
        ],
        relationships: [],
      },
    ],
    endpoints: [
      { method: "GET", path: "/api/timetable", description: "Get full timetable", response: "TimetableEntry[]" },
      {
        method: "GET",
        path: "/api/timetable?classId=:id",
        description: "Get class timetable",
        response: "TimetableEntry[]",
      },
      {
        method: "GET",
        path: "/api/timetable?teacherId=:id",
        description: "Get teacher timetable",
        response: "TimetableEntry[]",
      },
      {
        method: "GET",
        path: "/api/timetable?roomId=:id",
        description: "Get room timetable",
        response: "TimetableEntry[]",
      },
      {
        method: "POST",
        path: "/api/timetable",
        description: "Create entry",
        requestBody: "{ classId, teacherId, subjectId, timeSlotId, roomId? }",
        response: "TimetableEntry",
      },
      {
        method: "PUT",
        path: "/api/timetable/:id",
        description: "Update entry",
        requestBody: "{ teacherId?, subjectId?, roomId?, timeSlotId? }",
        response: "TimetableEntry",
      },
      { method: "DELETE", path: "/api/timetable/:id", description: "Delete entry", response: "{ success: boolean }" },
      { method: "GET", path: "/api/timetable/conflicts", description: "Get all conflicts", response: "Conflict[]" },
      {
        method: "POST",
        path: "/api/timetable/validate",
        description: "Validate timetable",
        requestBody: "TimetableEntry[]",
        response: "{ valid: boolean, conflicts: Conflict[] }",
      },
      {
        method: "POST",
        path: "/api/timetable/publish",
        description: "Publish timetable",
        response: "{ success: boolean, publishedAt: datetime }",
      },
      {
        method: "POST",
        path: "/api/timetable/auto-assign-rooms",
        description: "Auto-assign rooms",
        response: "{ assigned: number, failed: number, entries: TimetableEntry[] }",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete", "publish"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update", "delete"] },
      { role: "Teacher", actions: ["read (own entries)"] },
      { role: "Student", actions: ["read (own class)"] },
    ],
    backendNotes: [
      "Unique constraint on (classId, day, period) - one class, one slot",
      "Validate teacher is assigned to this class-subject combo",
      "Validate subject is allocated to this grade",
      "Check teacher availability - no double booking",
      "Check room availability - no double booking",
      "Track scheduled hours vs allocated hours per subject",
      "Publishing should create a snapshot/version",
    ],
    advancedFeatures: [
      "Timetable versioning and history",
      "Draft/published states",
      "Conflict auto-resolution suggestions",
      "Copy timetable to new semester",
      "Export to various formats (PDF, ICS, Excel)",
    ],
  },
  {
    id: "room-assignment",
    name: "Room Assignment Engine",
    description:
      "Automatic and manual room assignment system. Uses subject-room type preferences and availability to optimize room allocation.",
    entities: [
      {
        name: "RoomAssignment",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "timetableEntryId", type: "UUID", required: true, description: "Reference to timetable entry" },
          { name: "roomId", type: "UUID", required: true, description: "Reference to assigned room" },
          { name: "isAutoAssigned", type: "boolean", required: true, description: "Whether system assigned" },
          { name: "assignedAt", type: "datetime", required: true, description: "Assignment timestamp" },
          { name: "assignedBy", type: "string", required: true, description: "'system' or user ID" },
          { name: "conflictStatus", type: "enum", required: true, description: "none | warning | error" },
          { name: "alternativeRooms", type: "UUID[]", required: false, description: "Suggested alternatives" },
        ],
        relationships: [
          { entity: "TimetableEntry", type: "One-to-One", description: "For a timetable entry" },
          { entity: "Classroom", type: "Many-to-One", description: "Uses a room" },
        ],
      },
      {
        name: "RoomUtilization",
        attributes: [
          { name: "roomId", type: "UUID", required: true, description: "Reference to room" },
          { name: "roomName", type: "string", required: true, description: "Room name (denormalized)" },
          { name: "roomType", type: "string", required: true, description: "Room type name" },
          { name: "totalSlots", type: "integer", required: true, description: "Total available slots" },
          { name: "occupiedSlots", type: "integer", required: true, description: "Slots in use" },
          { name: "utilizationPercentage", type: "float", required: true, description: "Occupancy rate" },
          { name: "peakHours", type: "string[]", required: true, description: "Busiest time slots" },
          { name: "conflicts", type: "integer", required: true, description: "Number of conflicts" },
        ],
        relationships: [{ entity: "Classroom", type: "One-to-One", description: "For a room" }],
      },
      {
        name: "RoomSuggestion",
        attributes: [
          { name: "roomId", type: "UUID", required: true, description: "Suggested room ID" },
          { name: "roomName", type: "string", required: true, description: "Room name" },
          { name: "suitabilityScore", type: "float", required: true, description: "0-100 score" },
          { name: "reasons", type: "string[]", required: true, description: "Why this room is suitable" },
          { name: "warnings", type: "string[]", required: true, description: "Potential issues" },
          { name: "distance", type: "integer", required: false, description: "Distance from previous class" },
        ],
        relationships: [],
      },
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/room-assignments",
        description: "List all assignments",
        response: "RoomAssignment[]",
      },
      {
        method: "POST",
        path: "/api/room-assignments/auto",
        description: "Auto-assign all rooms",
        response: "{ success: number, failed: number, assignments: RoomAssignment[] }",
      },
      {
        method: "POST",
        path: "/api/room-assignments/:entryId",
        description: "Assign room to entry",
        requestBody: "{ roomId }",
        response: "RoomAssignment",
      },
      {
        method: "GET",
        path: "/api/room-assignments/suggestions/:entryId",
        description: "Get room suggestions",
        response: "RoomSuggestion[]",
      },
      {
        method: "GET",
        path: "/api/rooms/utilization",
        description: "Get utilization stats",
        response: "RoomUtilization[]",
      },
      {
        method: "GET",
        path: "/api/rooms/:id/utilization",
        description: "Get room utilization",
        response: "RoomUtilization",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["create", "read", "update", "delete", "auto-assign"] },
      { role: "Academic Coordinator", actions: ["create", "read", "update", "auto-assign"] },
      { role: "Facility Manager", actions: ["read", "update"] },
    ],
    backendNotes: [
      "Auto-assignment algorithm: 1) Filter by room type preference, 2) Filter by availability, 3) Filter by capacity, 4) Sort by utilization (prefer less used), 5) Assign",
      "Suitability score factors: room type match (40%), capacity fit (30%), utilization (20%), location (10%)",
      "Track assignment history for analytics",
      "Batch processing for performance on large timetables",
    ],
    advancedFeatures: [
      "ML-based assignment optimization",
      "Teacher location preference learning",
      "Room swap optimization to minimize teacher walking distance",
      "Integration with facility booking system",
    ],
  },
  {
    id: "export",
    name: "Export & Publishing",
    description: "Handles timetable export to various formats (PDF, ICS calendar) and publishing workflow.",
    entities: [
      {
        name: "ExportRequest",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "format", type: "enum", required: true, description: "pdf | ics | excel" },
          { name: "scope", type: "enum", required: true, description: "all | class | teacher | room" },
          { name: "scopeId", type: "UUID", required: false, description: "ID if scope is specific entity" },
          { name: "options", type: "JSON", required: false, description: "Format-specific options" },
          { name: "status", type: "enum", required: true, description: "pending | processing | completed | failed" },
          { name: "fileUrl", type: "string", required: false, description: "Download URL when complete" },
          { name: "requestedBy", type: "UUID", required: true, description: "User who requested" },
          { name: "requestedAt", type: "datetime", required: true, description: "Request timestamp" },
          { name: "completedAt", type: "datetime", required: false, description: "Completion timestamp" },
        ],
        relationships: [],
      },
      {
        name: "PublishEvent",
        attributes: [
          { name: "id", type: "UUID", required: true, description: "Unique identifier" },
          { name: "version", type: "integer", required: true, description: "Timetable version number" },
          { name: "publishedBy", type: "UUID", required: true, description: "User who published" },
          { name: "publishedAt", type: "datetime", required: true, description: "Publish timestamp" },
          { name: "snapshotData", type: "JSON", required: true, description: "Full timetable snapshot" },
          { name: "notes", type: "string", required: false, description: "Publish notes/changelog" },
        ],
        relationships: [],
      },
    ],
    endpoints: [
      {
        method: "POST",
        path: "/api/export/pdf",
        description: "Export to PDF",
        requestBody: "{ scope, scopeId?, orientation, includeHeader, includeRooms }",
        response: "{ fileUrl: string }",
      },
      {
        method: "POST",
        path: "/api/export/ics",
        description: "Export to ICS",
        requestBody: "{ scope, scopeId?, semesterStart, semesterEnd }",
        response: "{ fileUrl: string }",
      },
      { method: "GET", path: "/api/export/:id", description: "Get export status", response: "ExportRequest" },
      {
        method: "POST",
        path: "/api/timetable/publish",
        description: "Publish timetable",
        requestBody: "{ notes? }",
        response: "PublishEvent",
      },
      {
        method: "GET",
        path: "/api/timetable/versions",
        description: "Get publish history",
        response: "PublishEvent[]",
      },
      {
        method: "GET",
        path: "/api/timetable/versions/:version",
        description: "Get specific version",
        response: "PublishEvent",
      },
      {
        method: "POST",
        path: "/api/timetable/revert/:version",
        description: "Revert to version",
        response: "{ success: boolean }",
      },
    ],
    permissions: [
      { role: "Admin", actions: ["export", "publish", "revert"] },
      { role: "Academic Coordinator", actions: ["export", "publish"] },
      { role: "Teacher", actions: ["export (own)"] },
      { role: "Student", actions: ["export (own class)"] },
    ],
    backendNotes: [
      "PDF generation should be async for large timetables",
      "ICS export should respect semester start/end dates for recurring events",
      "Publish creates immutable snapshot for audit trail",
      "Consider notification system for publish events",
      "File storage: use cloud storage (S3/GCS) with signed URLs",
    ],
    advancedFeatures: [
      "Email distribution of published timetables",
      "Change detection between versions",
      "Scheduled auto-publish",
      "Push notifications for timetable changes",
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800 border-blue-200",
  POST: "bg-green-100 text-green-800 border-green-200",
  PUT: "bg-amber-100 text-amber-800 border-amber-200",
  PATCH: "bg-orange-100 text-orange-800 border-orange-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
}

export default function DocumentationPage() {
  const [selectedModule, setSelectedModule] = useState<string>(modules[0].id)

  const currentModule = modules.find((m) => m.id === selectedModule)

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Technical documentation for backend developers - Data models, API endpoints, and implementation notes
          </p>
        </div>

        <div className="flex gap-6">
          {/* Module List Sidebar */}
          <div className="w-64 shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Modules</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="space-y-1 p-2">
                    {modules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => setSelectedModule(module.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedModule === module.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {module.name}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Module Content */}
          <div className="flex-1 min-w-0">
            {currentModule && (
              <div className="space-y-6">
                {/* Module Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{currentModule.name}</CardTitle>
                    <CardDescription className="text-base">{currentModule.description}</CardDescription>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="data-model" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="data-model" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Data Model
                    </TabsTrigger>
                    <TabsTrigger value="endpoints" className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      API Endpoints
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permissions
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Backend Notes
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Advanced
                    </TabsTrigger>
                  </TabsList>

                  {/* Data Model Tab */}
                  <TabsContent value="data-model" className="space-y-4">
                    {currentModule.entities.map((entity) => (
                      <Card key={entity.name}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-mono">{entity.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Attributes */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Attributes</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-40">Name</TableHead>
                                  <TableHead className="w-32">Type</TableHead>
                                  <TableHead className="w-24">Required</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entity.attributes.map((attr) => (
                                  <TableRow key={attr.name}>
                                    <TableCell className="font-mono text-sm">{attr.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {attr.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {attr.required ? (
                                        <Badge className="bg-red-100 text-red-800 border-red-200">Yes</Badge>
                                      ) : (
                                        <Badge variant="secondary">No</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{attr.description}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Relationships */}
                          {entity.relationships.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Relationships</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-40">Entity</TableHead>
                                    <TableHead className="w-32">Type</TableHead>
                                    <TableHead>Description</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {entity.relationships.map((rel, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-mono text-sm">{rel.entity}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline">{rel.type}</Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{rel.description}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* API Endpoints Tab */}
                  <TabsContent value="endpoints">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">API Endpoints</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Method</TableHead>
                              <TableHead className="w-72">Path</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-48">Request Body</TableHead>
                              <TableHead className="w-48">Response</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentModule.endpoints.map((endpoint, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Badge className={methodColors[endpoint.method]}>{endpoint.method}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                                <TableCell className="text-sm">{endpoint.description}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {endpoint.requestBody || "-"}
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {endpoint.response}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Permissions Tab */}
                  <TabsContent value="permissions">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Role Permissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-48">Role</TableHead>
                              <TableHead>Allowed Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentModule.permissions.map((perm, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{perm.role}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {perm.actions.map((action) => (
                                      <Badge key={action} variant="secondary">
                                        {action}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Backend Notes Tab */}
                  <TabsContent value="notes">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Implementation Notes</CardTitle>
                        <CardDescription>Important considerations for backend developers</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {currentModule.backendNotes.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-sm">{note}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Advanced Features Tab */}
                  <TabsContent value="advanced">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Advanced Features</CardTitle>
                        <CardDescription>Optional enhancements for future development</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {currentModule.advancedFeatures.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
