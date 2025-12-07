"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit2, Trash2, Save, AlertTriangle, MapPin, Star } from "lucide-react"
import { subjects } from "@/lib/timetable-data"
import { defaultRoomTypes } from "@/lib/classroom-data"
import { defaultSubjectRoomTypes } from "@/lib/room-assignment-data"
import type { SubjectRoomType } from "@/types/room-assignment"
import type { RoomType } from "@/types/classroom"

interface SubjectRoomAssignmentProps {
  onAssignmentsChange?: (assignments: SubjectRoomType[]) => void
}

const PRIORITY_LABELS = {
  1: { label: "Preferred", color: "bg-green-500", description: "Best choice for this subject" },
  2: { label: "Acceptable", color: "bg-yellow-500", description: "Can be used if preferred not available" },
  3: { label: "Last Resort", color: "bg-red-500", description: "Only use if no other options" },
}

export function SubjectRoomAssignment({ onAssignmentsChange }: SubjectRoomAssignmentProps) {
  const [assignments, setAssignments] = useState<SubjectRoomType[]>(defaultSubjectRoomTypes)
  const [roomTypes] = useState<RoomType[]>(defaultRoomTypes)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<SubjectRoomType | null>(null)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<number>(1)
  const [isRequired, setIsRequired] = useState(false)

  // Get assignments for a specific subject
  const getSubjectAssignments = useCallback(
    (subjectId: string) => {
      return assignments.filter((a) => a.subjectId === subjectId).sort((a, b) => a.priority - b.priority)
    },
    [assignments],
  )

  // Check if subject has required room type
  const hasRequiredRoomType = useCallback(
    (subjectId: string) => {
      return assignments.some((a) => a.subjectId === subjectId && a.isRequired)
    },
    [assignments],
  )

  // Get unassigned room types for a subject
  const getAvailableRoomTypes = useCallback(
    (subjectId: string) => {
      const assignedRoomTypeIds = assignments.filter((a) => a.subjectId === subjectId).map((a) => a.roomTypeId)

      return roomTypes.filter((rt) => !assignedRoomTypeIds.includes(rt.id))
    },
    [assignments, roomTypes],
  )

  // Open assignment dialog
  const openAssignmentDialog = (assignment?: SubjectRoomType) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setSelectedSubject(assignment.subjectId)
      setSelectedRoomType(assignment.roomTypeId)
      setSelectedPriority(assignment.priority)
      setIsRequired(assignment.isRequired)
    } else {
      setEditingAssignment(null)
      setSelectedSubject("")
      setSelectedRoomType("")
      setSelectedPriority(1)
      setIsRequired(false)
    }
    setIsDialogOpen(true)
  }

  // Save assignment
  const saveAssignment = () => {
    if (!selectedSubject || !selectedRoomType) return

    // Check if this combination already exists (for new assignments)
    if (!editingAssignment) {
      const exists = assignments.some((a) => a.subjectId === selectedSubject && a.roomTypeId === selectedRoomType)
      if (exists) {
        alert("This subject-room type combination already exists!")
        return
      }
    }

    const updatedAssignments = editingAssignment
      ? assignments.map((a) =>
          a.id === editingAssignment.id
            ? {
                ...a,
                subjectId: selectedSubject,
                roomTypeId: selectedRoomType,
                priority: selectedPriority,
                isRequired,
                updatedAt: new Date().toISOString(),
              }
            : a,
        )
      : [
          ...assignments,
          {
            id: Date.now().toString(),
            subjectId: selectedSubject,
            roomTypeId: selectedRoomType,
            priority: selectedPriority,
            isRequired,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

    setAssignments(updatedAssignments)
    onAssignmentsChange?.(updatedAssignments)
    setIsDialogOpen(false)
  }

  // Delete assignment
  const deleteAssignment = (assignmentId: string) => {
    const updatedAssignments = assignments.filter((a) => a.id !== assignmentId)
    setAssignments(updatedAssignments)
    onAssignmentsChange?.(updatedAssignments)
  }

  // Get room type name
  const getRoomTypeName = (roomTypeId: string) => {
    return roomTypes.find((rt) => rt.id === roomTypeId)?.name || "Unknown"
  }

  // Get room type color
  const getRoomTypeColor = (roomTypeId: string) => {
    return roomTypes.find((rt) => rt.id === roomTypeId)?.color || "#gray"
  }

  // Get subject name
  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown"
  }

  // Group assignments by subject
  const assignmentsBySubject = useMemo(() => {
    const grouped = new Map<string, SubjectRoomType[]>()

    subjects.forEach((subject) => {
      const subjectAssignments = getSubjectAssignments(subject.id)
      if (subjectAssignments.length > 0) {
        grouped.set(subject.id, subjectAssignments)
      }
    })

    return grouped
  }, [getSubjectAssignments])

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Subject Room Type Assignment
              <Badge variant="outline">{assignments.length} Assignments</Badge>
            </div>
            <Button onClick={() => openAssignmentDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Assignment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">Total Subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{assignmentsBySubject.size}</div>
            <p className="text-xs text-muted-foreground">Subjects with Room Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{assignments.filter((a) => a.isRequired).length}</div>
            <p className="text-xs text-muted-foreground">Required Assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments by Subject */}
      <div className="space-y-4">
        {subjects.map((subject) => {
          const subjectAssignments = assignmentsBySubject.get(subject.id) || []
          const hasRequired = hasRequiredRoomType(subject.id)

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span>{subject.name}</span>
                    {hasRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Required Room
                      </Badge>
                    )}
                    {subjectAssignments.length === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        No Room Types
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubject(subject.id)
                      openAssignmentDialog()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room Type
                  </Button>
                </CardTitle>
              </CardHeader>
              {subjectAssignments.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    {subjectAssignments.map((assignment) => {
                      const roomType = roomTypes.find((rt) => rt.id === assignment.roomTypeId)
                      const priorityInfo = PRIORITY_LABELS[assignment.priority as keyof typeof PRIORITY_LABELS]

                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roomType?.color }} />
                              <span className="font-medium">{roomType?.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`} />
                              <span className="text-sm text-muted-foreground">{priorityInfo.label}</span>
                              {assignment.priority === 1 && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                            </div>

                            {assignment.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openAssignmentDialog(assignment)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAssignment(assignment.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Unassigned Subjects Alert */}
      {subjects.length - assignmentsBySubject.size > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {subjects.length - assignmentsBySubject.size} subject(s) don't have room type assignments. These subjects
            will use any available classroom during timetable creation.
          </AlertDescription>
        </Alert>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Room Type Assignment" : "Add Room Type Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject-select">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!!editingAssignment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
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

            <div>
              <Label htmlFor="roomtype-select">Room Type</Label>
              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedSubject ? getAvailableRoomTypes(selectedSubject) : roomTypes)
                    .concat(editingAssignment ? roomTypes.filter((rt) => rt.id === editingAssignment.roomTypeId) : [])
                    .filter((rt, index, arr) => arr.findIndex((r) => r.id === rt.id) === index)
                    .map((roomType) => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roomType.color }} />
                          {roomType.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority-select">Priority</Label>
              <Select value={selectedPriority.toString()} onValueChange={(value) => setSelectedPriority(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([priority, info]) => (
                    <SelectItem key={priority} value={priority}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${info.color}`} />
                        <span>{info.label}</span>
                        {priority === "1" && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {PRIORITY_LABELS[selectedPriority as keyof typeof PRIORITY_LABELS]?.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="required-switch">Required Room Type</Label>
                <p className="text-xs text-muted-foreground">Subject must use this room type</p>
              </div>
              <Switch id="required-switch" checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAssignment} disabled={!selectedSubject || !selectedRoomType}>
              <Save className="h-4 w-4 mr-2" />
              {editingAssignment ? "Update" : "Create"} Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
