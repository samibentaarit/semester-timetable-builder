"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Edit2 } from "lucide-react"
import { subjects, grades, defaultGradeSubjectAllocations } from "@/lib/timetable-data"
import type { GradeSubjectAllocation } from "@/types/timetable"

interface SubjectSetupProps {
  onSave: (allocations: GradeSubjectAllocation[]) => void
}

export function SubjectSetup({ onSave }: SubjectSetupProps) {
  const [allocations, setAllocations] = useState<GradeSubjectAllocation[]>(defaultGradeSubjectAllocations)
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [editingAllocation, setEditingAllocation] = useState<string | null>(null)
  const [selectedSubjectForAdd, setSelectedSubjectForAdd] = useState<string>("")

  const handleAllocationChange = (id: string, field: keyof GradeSubjectAllocation, value: number) => {
    setAllocations((prev) =>
      prev.map((allocation) => {
        if (allocation.id === id) {
          const updated = { ...allocation, [field]: value }
          if (field === "weeklyHours" || field === "semesterWeeks") {
            updated.totalHours = updated.weeklyHours * updated.semesterWeeks
          }
          return updated
        }
        return allocation
      }),
    )
  }

  const addNewAllocation = () => {
    if (selectedGrade === "all" || !selectedSubjectForAdd) return

    // Check if this subject is already allocated for this grade
    const existingAllocation = allocations.find(
      (a) => a.gradeId === selectedGrade && a.subjectId === selectedSubjectForAdd,
    )

    if (existingAllocation) {
      alert("This subject is already allocated for this grade.")
      return
    }

    const newAllocation: GradeSubjectAllocation = {
      id: Date.now().toString(),
      gradeId: selectedGrade,
      subjectId: selectedSubjectForAdd,
      weeklyHours: 1,
      semesterWeeks: 18,
      totalHours: 18,
    }

    setAllocations((prev) => [...prev, newAllocation])
    setEditingAllocation(newAllocation.id)
    setSelectedSubjectForAdd("") // Reset the selection
  }

  const filteredAllocations =
    selectedGrade !== "all" ? allocations.filter((a) => a.gradeId === selectedGrade) : allocations

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject"
  }

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || "#gray"
  }

  const getGradeName = (gradeId: string) => {
    return grades.find((g) => g.id === gradeId)?.name || "Unknown Grade"
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Subject & Hour Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="grade-select">Filter by Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grade to filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="subject-select">Select Subject</Label>
              <Select
                value={selectedSubjectForAdd}
                onValueChange={setSelectedSubjectForAdd}
                disabled={selectedGrade === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addNewAllocation} disabled={selectedGrade === "all" || !selectedSubjectForAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
            <Button onClick={() => onSave(allocations)} variant="default">
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="w-[120px]">Weekly Hours</TableHead>
                <TableHead className="w-[120px]">Semester Weeks</TableHead>
                <TableHead className="w-[120px]">Total Hours</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAllocations.map((allocation) => {
                const subject = subjects.find((s) => s.id === allocation.subjectId)
                const isEditing = editingAllocation === allocation.id

                return (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject?.color }} />
                        <span className="font-medium">{getSubjectName(allocation.subjectId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getGradeName(allocation.gradeId)}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={allocation.weeklyHours}
                        onChange={(e) =>
                          handleAllocationChange(allocation.id, "weeklyHours", Number.parseInt(e.target.value))
                        }
                        disabled={!isEditing}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={allocation.semesterWeeks}
                        onChange={(e) =>
                          handleAllocationChange(allocation.id, "semesterWeeks", Number.parseInt(e.target.value))
                        }
                        disabled={!isEditing}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="px-3 py-2 bg-muted rounded-md text-center font-medium">
                        {allocation.totalHours}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={allocation.weeklyHours > 0 ? "default" : "secondary"} className="text-xs">
                        {allocation.weeklyHours > 0 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAllocation(isEditing ? null : allocation.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
