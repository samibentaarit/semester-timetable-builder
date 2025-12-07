"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Calendar, Download, CheckCircle, Users, UserCheck } from "lucide-react"
import { SubjectSetup } from "@/components/subject-setup"
import { TimetableGrid } from "@/components/timetable-grid"
//import { ExportOptions } from "@/components/export-options"
import { EnhancedExportOptions } from "@/components/enhanced-export-options"

import { TeacherAssignmentManager } from "@/components/teacher-assignment-manager"
import { TeacherSubjectManager } from "@/components/teacher-subject-manager"
import type { GradeSubjectAllocation, TimetableEntry, ClassSubjectTeacher, Teacher } from "@/types/timetable"
import {
  defaultGradeSubjectAllocations,
  defaultClassSubjectTeachers,
  teachers as initialTeachers,
} from "@/lib/timetable-data"

export default function TimetableBuilder() {
  const [allocations, setAllocations] = useState<GradeSubjectAllocation[]>(defaultGradeSubjectAllocations)
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [assignments, setAssignments] = useState<ClassSubjectTeacher[]>(defaultClassSubjectTeachers)
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers)

  const handleSaveAllocations = (newAllocations: GradeSubjectAllocation[]) => {
    setAllocations(newAllocations)
  }

  const handlePublishTimetable = (entries: TimetableEntry[]) => {
    setTimetableEntries(entries)
    setIsPublished(true)
  }

  const handleAssignmentsChange = (newAssignments: ClassSubjectTeacher[]) => {
    setAssignments(newAssignments)
  }

  const handleTeachersChange = (newTeachers: Teacher[]) => {
    setTeachers(newTeachers)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 bg-white">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Semester Timetable Builder</h1>
              <p className="text-muted-foreground mt-2">Create and manage weekly schedules for classes and teachers</p>
            </div>
            <div className="flex items-center gap-2">
              {isPublished && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Published
                </Badge>
              )}
              <Badge variant="outline">{timetableEntries.length} Schedule Entries</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="setup" className="space-y-1 shadow-xs py-0 my-0 mx-0 px-0 border-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Subject Setup
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Teacher Subjects
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Class Assignments
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timetable Builder
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export & Publish
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <SubjectSetup onSave={handleSaveAllocations} />
          </TabsContent>

          <TabsContent value="teachers">
            <TeacherSubjectManager onTeachersChange={handleTeachersChange} />
          </TabsContent>

          <TabsContent value="assignments">
            <TeacherAssignmentManager allocations={allocations} onAssignmentsChange={handleAssignmentsChange} />
          </TabsContent>

          <TabsContent value="timetable">
            <TimetableGrid allocations={allocations} assignments={assignments} onPublish={handlePublishTimetable} />
          </TabsContent>

          <TabsContent value="export">
            <EnhancedExportOptions timetableEntries={timetableEntries} isPublished={isPublished} />
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Teachers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{allocations.length}</div>
              <p className="text-xs text-muted-foreground">Subject Allocations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{assignments.filter((a) => a.isActive).length}</div>
              <p className="text-xs text-muted-foreground">Class Assignments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{timetableEntries.length}</div>
              <p className="text-xs text-muted-foreground">Schedule Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{isPublished ? "Active" : "Draft"}</div>
              <p className="text-xs text-muted-foreground">Timetable Status</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
