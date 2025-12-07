"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Edit2, Save, AlertTriangle, CheckCircle, Plus, Search, Mail, Clock } from "lucide-react"
import { teachers as initialTeachers, subjects } from "@/lib/timetable-data"
import type { Teacher } from "@/types/timetable"

interface TeacherSubjectConflict {
  type: "subject_overload" | "no_subjects" | "invalid_subject" | "workload_imbalance"
  message: string
  severity: "error" | "warning" | "info"
  teacherId: string
  suggestions?: string[]
}

interface TeacherSubjectManagerProps {
  onTeachersChange: (teachers: Teacher[]) => void
}

export function TeacherSubjectManager({ onTeachersChange }: TeacherSubjectManagerProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers)
  const [conflicts, setConflicts] = useState<TeacherSubjectConflict[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state for editing teacher
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subjects: [] as string[],
    weeklyHourLimit: 25,
  })

  // Validate teacher assignments and detect conflicts
  const validateTeacherAssignments = useCallback((currentTeachers: Teacher[]): TeacherSubjectConflict[] => {
    const newConflicts: TeacherSubjectConflict[] = []

    currentTeachers.forEach((teacher) => {
      // Check for teachers with no subjects
      if (teacher.subjects.length === 0) {
        newConflicts.push({
          type: "no_subjects",
          message: `${teacher.name} has no subjects assigned`,
          severity: "warning",
          teacherId: teacher.id,
          suggestions: ["Assign at least one subject to this teacher", "Consider removing inactive teachers"],
        })
      }

      // Check for invalid subject IDs
      const invalidSubjects = teacher.subjects.filter((subjectId) => !subjects.find((s) => s.id === subjectId))
      if (invalidSubjects.length > 0) {
        newConflicts.push({
          type: "invalid_subject",
          message: `${teacher.name} has invalid subject assignments: ${invalidSubjects.join(", ")}`,
          severity: "error",
          teacherId: teacher.id,
          suggestions: ["Remove invalid subject assignments", "Verify subject IDs are correct"],
        })
      }

      // Check for subject overload (too many subjects for effective teaching)
      if (teacher.subjects.length > 4) {
        newConflicts.push({
          type: "subject_overload",
          message: `${teacher.name} is assigned to ${teacher.subjects.length} subjects (recommended max: 4)`,
          severity: "warning",
          teacherId: teacher.id,
          suggestions: [
            "Consider redistributing some subjects to other teachers",
            "Hire additional specialized teachers",
          ],
        })
      }

      // Check for workload imbalance (very low weekly hour limit)
      if (teacher.weeklyHourLimit < 15) {
        newConflicts.push({
          type: "workload_imbalance",
          message: `${teacher.name} has a low weekly hour limit (${teacher.weeklyHourLimit}h)`,
          severity: "info",
          teacherId: teacher.id,
          suggestions: ["Consider increasing weekly hour limit", "Verify if this is a part-time position"],
        })
      }
    })

    // Check for subject coverage gaps
    const allAssignedSubjects = new Set(currentTeachers.flatMap((t) => t.subjects))
    const uncoveredSubjects = subjects.filter((subject) => !allAssignedSubjects.has(subject.id))

    if (uncoveredSubjects.length > 0) {
      newConflicts.push({
        type: "subject_overload",
        message: `No teachers assigned to: ${uncoveredSubjects.map((s) => s.name).join(", ")}`,
        severity: "error",
        teacherId: "system",
        suggestions: ["Assign qualified teachers to uncovered subjects", "Hire additional teachers for these subjects"],
      })
    }

    return newConflicts
  }, [])

  // Update conflicts when teachers change
  useMemo(() => {
    const newConflicts = validateTeacherAssignments(teachers)
    setConflicts(newConflicts)
  }, [teachers, validateTeacherAssignments])

  // Filter teachers based on search
  const filteredTeachers = teachers.filter((teacher) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      teacher.name.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      teacher.subjects.some((subjectId) => {
        const subject = subjects.find((s) => s.id === subjectId)
        return subject?.name.toLowerCase().includes(searchLower)
      })
    )
  })

  // Open edit dialog
  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      name: teacher.name,
      email: teacher.email,
      subjects: [...teacher.subjects],
      weeklyHourLimit: teacher.weeklyHourLimit,
    })
    setIsDialogOpen(true)
  }

  // Open new teacher dialog
  const openNewTeacherDialog = () => {
    setEditingTeacher(null)
    setFormData({
      name: "",
      email: "",
      subjects: [],
      weeklyHourLimit: 25,
    })
    setIsDialogOpen(true)
  }

  // Save teacher changes
  const saveTeacher = () => {
    if (!formData.name || !formData.email) return

    const updatedTeachers = editingTeacher
      ? teachers.map((teacher) =>
          teacher.id === editingTeacher.id
            ? {
                ...teacher,
                name: formData.name,
                email: formData.email,
                subjects: formData.subjects,
                weeklyHourLimit: formData.weeklyHourLimit,
              }
            : teacher,
        )
      : [
          ...teachers,
          {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            subjects: formData.subjects,
            weeklyHourLimit: formData.weeklyHourLimit,
            currentWeeklyHours: 0,
          },
        ]

    setTeachers(updatedTeachers)
    onTeachersChange(updatedTeachers)
    setIsDialogOpen(false)
  }

  // Toggle subject assignment
  const toggleSubject = (subjectId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      subjects: checked ? [...prev.subjects, subjectId] : prev.subjects.filter((id) => id !== subjectId),
    }))
  }

  // Delete teacher
  const deleteTeacher = (teacherId: string) => {
    const updatedTeachers = teachers.filter((t) => t.id !== teacherId)
    setTeachers(updatedTeachers)
    onTeachersChange(updatedTeachers)
  }

  // Get subject names for display
  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds
      .map((id) => subjects.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  // Get teacher conflicts
  const getTeacherConflicts = (teacherId: string) => {
    return conflicts.filter((c) => c.teacherId === teacherId)
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <Card className="leading-7">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Teacher Subject Management
              <Badge variant="outline">{teachers.length} Teachers</Badge>
            </div>
            <Button onClick={openNewTeacherDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Global Conflicts Alert */}
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
                <div className="text-sm text-muted-foreground">+{conflicts.length - 3} more issues...</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers by name, email, or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Weekly Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => {
                const teacherConflicts = getTeacherConflicts(teacher.id)
                const hasErrors = teacherConflicts.some((c) => c.severity === "error")
                const hasWarnings = teacherConflicts.some((c) => c.severity === "warning")

                return (
                  <TableRow key={teacher.id} className={hasErrors ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {teacher.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subjectId) => {
                            const subject = subjects.find((s) => s.id === subjectId)
                            return (
                              <Badge key={subjectId} variant="secondary" className="text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject?.color }} />
                                  {subject?.name}
                                </div>
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground">No subjects assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{teacher.weeklyHourLimit}h/week</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {hasErrors && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                        {hasWarnings && !hasErrors && (
                          <Badge variant="default" className="text-xs">
                            Warning
                          </Badge>
                        )}
                        {!hasErrors && !hasWarnings && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(teacher)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTeacher(teacher.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Teacher Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter teacher name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weeklyLimit">Weekly Hour Limit</Label>
              <Input
                id="weeklyLimit"
                type="number"
                min="1"
                max="40"
                value={formData.weeklyHourLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, weeklyHourLimit: Number.parseInt(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Subject Assignments</Label>
              <div className="grid grid-cols-2 gap-3 mt-2 max-h-60 overflow-y-auto">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={formData.subjects.includes(subject.id)}
                      onCheckedChange={(checked) => toggleSubject(subject.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`subject-${subject.id}`}
                      className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                      {subject.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveTeacher} disabled={!formData.name || !formData.email}>
                <Save className="h-4 w-4 mr-2" />
                {editingTeacher ? "Update Teacher" : "Add Teacher"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
