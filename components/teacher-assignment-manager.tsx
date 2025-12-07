"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, User, AlertTriangle, CheckCircle, Plus, Trash2, Search, BarChart3, Clock } from "lucide-react"
import { classSections, teachers, subjects } from "@/lib/timetable-data"
import { defaultClassSubjectTeachers } from "@/lib/teacher-assignment-data"
import type { ClassSubjectTeacher, TeacherAssignmentConflict, TeacherWorkload } from "@/types/teacher-assignments"
import type { GradeSubjectAllocation } from "@/types/timetable"

// Import Toast
import { Toaster, toast } from "react-hot-toast"

interface TeacherAssignmentManagerProps {
  allocations: GradeSubjectAllocation[]
  onAssignmentsChange: (assignments: ClassSubjectTeacher[]) => void
}

export function TeacherAssignmentManager({ allocations, onAssignmentsChange }: TeacherAssignmentManagerProps) {
  const [assignments, setAssignments] = useState<ClassSubjectTeacher[]>(defaultClassSubjectTeachers)
  const [conflicts, setConflicts] = useState<TeacherAssignmentConflict[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTeacher, setSelectedTeacher] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")

  const teacherWorkloads = useMemo((): TeacherWorkload[] => {
    return teachers.map((teacher) => {
      const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id && a.isActive)
      const subjectWorkloads = new Map<string, { count: number; hours: number }>()
      let totalWeeklyHours = 0

      teacherAssignments.forEach((assignment) => {
        const classSection = classSections.find((c) => c.id === assignment.classId)
        if (classSection) {
          const allocation = allocations.find(
            (a) => a.gradeId === classSection.gradeId && a.subjectId === assignment.subjectId,
          )
          if (allocation) {
            const current = subjectWorkloads.get(assignment.subjectId) || { count: 0, hours: 0 }
            subjectWorkloads.set(assignment.subjectId, {
              count: current.count + 1,
              hours: current.hours + allocation.weeklyHours,
            })
            totalWeeklyHours += allocation.weeklyHours
          }
        }
      })

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        totalClasses: teacherAssignments.length,
        totalWeeklyHours,
        weeklyHourLimit: teacher.weeklyHourLimit,
        utilizationPercentage: Math.round((totalWeeklyHours / teacher.weeklyHourLimit) * 100),
        subjects: Array.from(subjectWorkloads.entries()).map(([subjectId, data]) => ({
          subjectId,
          subjectName: subjects.find((s) => s.id === subjectId)?.name || "Unknown",
          classCount: data.count,
          estimatedWeeklyHours: data.hours,
        })),
      }
    })
  }, [assignments, allocations])

  const validateAssignments = useCallback(
    (currentAssignments: ClassSubjectTeacher[]): TeacherAssignmentConflict[] => {
      const newConflicts: TeacherAssignmentConflict[] = []

      currentAssignments.forEach((assignment) => {
        const teacher = teachers.find((t) => t.id === assignment.teacherId)
        if (teacher && !teacher.subjects.includes(assignment.subjectId)) {
          const subject = subjects.find((s) => s.id === assignment.subjectId)
          newConflicts.push({
            type: "teacher_subject_mismatch",
            message: `${teacher.name} is not qualified to teach ${subject?.name}`,
            severity: "error",
            affectedAssignments: [assignment.id],
            suggestions: [
              `Assign a qualified teacher for ${subject?.name}`,
              `Add ${subject?.name} to ${teacher.name}'s qualifications`,
            ],
          })
        }
      })

      teacherWorkloads.forEach((workload) => {
        if (workload.utilizationPercentage > 100) {
          newConflicts.push({
            type: "teacher_overcommitted",
            message: `${workload.teacherName} is overcommitted: ${workload.totalWeeklyHours}/${workload.weeklyHourLimit} hours (${workload.utilizationPercentage}%)`,
            severity: "warning",
            affectedAssignments: currentAssignments.filter((a) => a.teacherId === workload.teacherId).map((a) => a.id),
            suggestions: [
              "Redistribute some classes to other teachers",
              "Increase teacher's weekly hour limit",
              "Hire additional qualified teachers",
            ],
          })
        }
      })

      return newConflicts
    },
    [teacherWorkloads],
  )

  const addAssignment = () => {
    if (!selectedClass || !selectedSubject || !selectedTeacher) {
      toast.error("Please select class, subject, and teacher")
      return
    }

    const existingAssignment = assignments.find(
      (a) => a.classId === selectedClass && a.subjectId === selectedSubject && a.isActive,
    )

    if (existingAssignment) {
      const updatedAssignments = assignments.map((a) =>
        a.id === existingAssignment.id ? { ...a, teacherId: selectedTeacher, updatedAt: new Date().toISOString() } : a,
      )
      setAssignments(updatedAssignments)
      setConflicts(validateAssignments(updatedAssignments))
      onAssignmentsChange(updatedAssignments)
      toast.success("Assignment updated successfully")
    } else {
      const newAssignment: ClassSubjectTeacher = {
        id: Date.now().toString(),
        classId: selectedClass,
        subjectId: selectedSubject,
        teacherId: selectedTeacher,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedAssignments = [...assignments, newAssignment]
      setAssignments(updatedAssignments)
      setConflicts(validateAssignments(updatedAssignments))
      onAssignmentsChange(updatedAssignments)
      toast.success("Assignment added successfully")
    }

    setSelectedClass("")
    setSelectedSubject("")
    setSelectedTeacher("")
  }

  const removeAssignment = (assignmentId: string) => {
    const updatedAssignments = assignments.map((a) =>
      a.id === assignmentId ? { ...a, isActive: false, updatedAt: new Date().toISOString() } : a,
    )
    setAssignments(updatedAssignments)
    setConflicts(validateAssignments(updatedAssignments))
    onAssignmentsChange(updatedAssignments)
    toast.success("Assignment removed successfully")
  }

  const getAvailableSubjects = () => {
    if (!selectedClass) return []
    const classSection = classSections.find((c) => c.id === selectedClass)
    if (!classSection) return []
    const gradeSubjects = subjects.filter((subject) =>
      allocations.some((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id),
    )
    const alreadyAssignedSubjects = assignments
      .filter((a) => a.classId === selectedClass && a.isActive)
      .map((a) => a.subjectId)
    return gradeSubjects.filter((subject) => !alreadyAssignedSubjects.includes(subject.id))
  }

  const getQualifiedTeachers = () => {
    if (!selectedSubject) return []
    return teachers.filter((teacher) => teacher.subjects.includes(selectedSubject))
  }

  const filteredAssignments = assignments.filter((assignment) => {
    if (!assignment.isActive) return false
    const classSection = classSections.find((c) => c.id === assignment.classId)
    const subject = subjects.find((s) => s.id === assignment.subjectId)
    const teacher = teachers.find((t) => t.id === assignment.teacherId)
    const searchLower = searchTerm.toLowerCase()
    return (
      classSection?.name.toLowerCase().includes(searchLower) ||
      subject?.name.toLowerCase().includes(searchLower) ||
      teacher?.name.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Toast container */}
      <Toaster />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teacher Assignment Manager
            <Badge variant="outline">{assignments.filter((a) => a.isActive).length} Active Assignments</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant={conflicts.some((c) => c.severity === "error") ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {conflicts.filter((c) => c.severity === "error").length} errors,{" "}
                {conflicts.filter((c) => c.severity === "warning").length} warnings detected
              </div>
              {conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="text-sm">
                  • {conflict.message}
                </div>
              ))}
              {conflicts.length > 3 && (
                <div className="text-sm text-muted-foreground">+{conflicts.length - 3} more conflicts...</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="workload">Teacher Workload</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts & Issues</TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Add New Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Assign Teacher to Class Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((classSection) => (
                        <SelectItem key={classSection.id} value={classSection.id}>
                          {classSection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSubjects().map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Teacher</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={!selectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {getQualifiedTeachers().map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={addAssignment}
                    disabled={!selectedClass || !selectedSubject || !selectedTeacher}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => {
              const classSection = classSections.find((c) => c.id === assignment.classId)
              const subject = subjects.find((s) => s.id === assignment.subjectId)
              const teacher = teachers.find((t) => t.id === assignment.teacherId)
              const isQualified = teacher?.subjects.includes(assignment.subjectId)
              const hasConflict = conflicts.some((c) => c.affectedAssignments.includes(assignment.id))

              return (
                <Card key={assignment.id} className={hasConflict ? "border-destructive" : ""}>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span>{classSection?.name}</span>
                      <span>{subject?.name}</span>
                      <span>{teacher?.name}</span>
                      {!isQualified && <Badge variant="destructive" className="text-xs">Not Qualified</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAssignment(assignment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          {teacherWorkloads.map((workload) => (
            <Card key={workload.teacherId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{workload.teacherName}</span>
                  <Badge
                    variant={
                      workload.utilizationPercentage > 100
                        ? "destructive"
                        : workload.utilizationPercentage > 80
                          ? "default"
                          : "secondary"
                    }
                  >
                    {workload.utilizationPercentage}% Utilized
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <span>Classes: {workload.totalClasses}</span>
                  <span>Hours: {workload.totalWeeklyHours}/{workload.weeklyHourLimit}</span>
                  <span>Utilization: {workload.utilizationPercentage}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          {conflicts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3>No Conflicts Detected</h3>
              </CardContent>
            </Card>
          ) : (
            conflicts.map((conflict, index) => (
              <Alert key={index} variant={conflict.severity === "error" ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{conflict.message}</AlertDescription>
              </Alert>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
