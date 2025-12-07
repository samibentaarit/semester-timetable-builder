"use client"

import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, AlertTriangle } from 'lucide-react'
import type { TimetableEntry, GradeSubjectAllocation, ClassSubjectTeacher, TimeSlot } from "@/types/timetable"
import { subjects, teachers, classSections, timeSlots as initialTimeSlots, rooms } from "@/lib/timetable-data"

interface ScheduleBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allocations: GradeSubjectAllocation[]
  assignments: ClassSubjectTeacher[]
  timetableEntries: TimetableEntry[]
  selectedEntity: string
  viewMode: "class" | "teacher"
  onAddEntry: (entry: TimetableEntry) => void
  onRemoveEntry: (entryId: string) => void
  roomAssignments: any[]
}

const PERIODS = [1, 2, 3, 4, 5]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const PERIOD_DURATION = 45 // minutes

export function ScheduleBuilderModal({
  open,
  onOpenChange,
  allocations,
  assignments,
  timetableEntries,
  selectedEntity,
  viewMode,
  onAddEntry,
  onRemoveEntry,
  roomAssignments,
}: ScheduleBuilderModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(30) // percentage
  const [isDraggingDivider, setIsDraggingDivider] = useState(false)

  const timeSlots = initialTimeSlots

  // Calculate subject progress
  const subjectProgress = useMemo(() => {
    const progress: Record<string, { scheduled: number; total: number; percentage: number }> = {}

    const availableSubjects = selectedEntity
      ? viewMode === "class"
        ? subjects.filter((subject) => {
            const classSection = classSections.find((c) => c.id === selectedEntity)
            return (
              classSection && allocations.some((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id)
            )
          })
        : subjects.filter((subject) => {
            const teacher = teachers.find((t) => t.id === selectedEntity)
            return teacher && teacher.subjects.includes(subject.id)
          })
      : []

    availableSubjects.forEach((subject) => {
      let totalHours = 0
      if (viewMode === "class") {
        const classSection = classSections.find((c) => c.id === selectedEntity)
        if (classSection) {
          const allocation = allocations.find((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id)
          totalHours = allocation?.weeklyHours || 0
        }
      } else {
        const teacherAssignments = assignments.filter(
          (a) => a.teacherId === selectedEntity && a.subjectId === subject.id && a.isActive,
        )
        teacherAssignments.forEach((assignment) => {
          const classSection = classSections.find((c) => c.id === assignment.classId)
          if (classSection) {
            const allocation = allocations.find((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id)
            totalHours += allocation?.weeklyHours || 0
          }
        })
      }

      const scheduledEntries = timetableEntries.filter((entry) => {
        if (viewMode === "class") {
          return entry.classId === selectedEntity && entry.subjectId === subject.id
        } else {
          return entry.teacherId === selectedEntity && entry.subjectId === subject.id
        }
      })

      const scheduledHours = scheduledEntries.length * (PERIOD_DURATION / 60)

      progress[subject.id] = {
        scheduled: scheduledHours,
        total: totalHours,
        percentage: totalHours > 0 ? Math.round((scheduledHours / totalHours) * 100) : 0,
      }
    })

    return progress
  }, [selectedEntity, viewMode, allocations, assignments, timetableEntries])

  const availableSubjects = selectedEntity
    ? viewMode === "class"
      ? subjects.filter((subject) => {
          const classSection = classSections.find((c) => c.id === selectedEntity)
          return (
            classSection && allocations.some((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id)
          )
        })
      : subjects.filter((subject) => {
          const teacher = teachers.find((t) => t.id === selectedEntity)
          return teacher && teacher.subjects.includes(subject.id)
        })
    : []

  // Get valid slots for selected subject
  const validSlots = useMemo(() => {
    if (!selectedSubject) return []

    const valid: Array<{ day: string; period: number }> = []
    const progress = subjectProgress[selectedSubject]

    if (!progress || progress.percentage >= 100) return []

    // Check all slots
    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        // Check if slot is already occupied
        const isOccupied = timetableEntries.some((entry) => {
          if (viewMode === "class") {
            return entry.classId === selectedEntity && entry.day === day && entry.period === period
          } else {
            return entry.teacherId === selectedEntity && entry.day === day && entry.period === period
          }
        })

        if (!isOccupied) {
          valid.push({ day, period })
        }
      })
    })

    return valid
  }, [selectedSubject, viewMode, selectedEntity, timetableEntries, subjectProgress])

  const handleSlotClick = useCallback(
    (day: string, period: number) => {
      if (!selectedSubject || !selectedEntity) return

      // Find teacher for this subject
      let teacherId = ""
      if (viewMode === "class") {
        const assignment = assignments.find(
          (a) => a.classId === selectedEntity && a.subjectId === selectedSubject && a.isActive,
        )
        teacherId = assignment?.teacherId || ""
      } else {
        teacherId = selectedEntity
      }

      if (!teacherId) {
        alert("No teacher assigned for this subject. Please assign a teacher first.")
        return
      }

      const newEntry: TimetableEntry = {
        id: Date.now().toString(),
        classId: viewMode === "class" ? selectedEntity : "",
        teacherId: teacherId,
        subjectId: selectedSubject,
        timeSlotId: timeSlots.find((ts) => ts.day === day && ts.period === period)?.id || "",
        day,
        period,
      }

      onAddEntry(newEntry)
      // Clear selection after adding
      setSelectedSubject(null)
    },
    [selectedSubject, selectedEntity, viewMode, assignments, onAddEntry, timeSlots],
  )

  const getEntryForSlot = (day: string, period: number) => {
    return timetableEntries.find((entry) => {
      if (viewMode === "class") {
        return entry.classId === selectedEntity && entry.day === day && entry.period === period
      } else {
        return entry.teacherId === selectedEntity && entry.day === day && entry.period === period
      }
    })
  }

  const isSlotValid = (day: string, period: number) => {
    return validSlots.some((slot) => slot.day === day && slot.period === period)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingDivider) return
      e.preventDefault()

      const container = document.getElementById("schedule-builder-container")
      if (!container) return

      const newWidth = ((e.clientX - container.getBoundingClientRect().left) / container.offsetWidth) * 100
      if (newWidth > 20 && newWidth < 70) {
        setLeftPanelWidth(newWidth)
      }
    },
    [isDraggingDivider],
  )

  const handleMouseUp = () => {
    setIsDraggingDivider(false)
  }

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (minutes === 0) return `${wholeHours}:00`
    return `${wholeHours}:${minutes.toString().padStart(2, "0")}`
  }

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || "#gray"
  }

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown"
  }

  const getTeacherName = (teacherId: string) => {
    return teachers.find((t) => t.id === teacherId)?.name || "Unknown"
  }

  const getClassName = (classId: string) => {
    return classSections.find((c) => c.id === classId)?.name || "Unknown"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent 
  className="w-[90vw] h-[90vh] max-w-none p-0 overflow-hidden"
  // Optional: Force full width
  style={{ maxWidth: '90vw', width: '90vw' }}
>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Schedule Builder</DialogTitle>
          <DialogDescription>Click a subject, then click valid time slots to schedule</DialogDescription>
        </DialogHeader>

        <div
          id="schedule-builder-container"
          className="flex flex-1 overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Left Panel: Subjects List */}
          <div style={{ width: `${leftPanelWidth}%` }} className="border-r overflow-y-auto bg-muted/50">
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Available Subjects</h3>

              {availableSubjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No subjects available</p>
              ) : (
                <div className="space-y-2">
                  {availableSubjects.map((subject) => {
                    const progress = subjectProgress[subject.id] || { scheduled: 0, total: 0, percentage: 0 }
                    const isFullyScheduled = progress.percentage >= 100
                    const isSelected = selectedSubject === subject.id

                    return (
                      <div key={subject.id}>
                        <Button
                          onClick={() => setSelectedSubject(isSelected ? null : subject.id)}
                          disabled={isFullyScheduled}
                          variant={isSelected ? "default" : "outline"}
                          className="w-full justify-start text-left h-auto py-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: subject.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{subject.name}</div>
                              <div className="text-xs opacity-70">
                                {formatTime(progress.scheduled)}/{formatTime(progress.total)}
                              </div>
                            </div>
                          </div>
                        </Button>
                        <Progress value={progress.percentage} className="h-1 mt-1" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            onMouseDown={() => setIsDraggingDivider(true)}
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
          />

          {/* Right Panel: Timetable */}
          <div style={{ width: `${100 - leftPanelWidth}%` }} className="overflow-auto">
            <div className="p-4 space-y-4">
              

              {/* Timetable Grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium text-left">Time</th>
                      {PERIODS.map((period) => (
                        <th key={period} className="border p-2 bg-muted font-medium min-w-[100px]">
                          Period {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="border p-2 bg-muted font-medium text-center min-w-[80px]">{day}</td>
                        {PERIODS.map((period) => {
                          const entry = getEntryForSlot(day, period)
                          const isValid = selectedSubject && isSlotValid(day, period)
                          const timeSlot = timeSlots.find((ts) => ts.day === day && ts.period === period)

                          return (
                            <td
                              key={`${day}-${period}`}
                              className={`border p-1 h-16 cursor-pointer transition-colors ${
                                isValid
                                  ? "bg-green-50 hover:bg-green-100 border-green-200"
                                  : "hover:bg-muted/50"
                              } ${selectedSubject && !isValid ? "opacity-50" : ""}`}
                              onClick={() => {
                                if (isValid) {
                                  handleSlotClick(day, period)
                                }
                              }}
                            >
                              {entry ? (
                                <div
                                  className="p-2 rounded text-white text-xs h-full flex flex-col justify-between cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: getSubjectColor(entry.subjectId) }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onRemoveEntry(entry.id)
                                  }}
                                  title="Click to remove"
                                >
                                  <div>
                                    <div className="font-medium">{getSubjectName(entry.subjectId)}</div>
                                    <div className="opacity-90 text-xs">
                                      {viewMode === "class"
                                        ? getTeacherName(entry.teacherId)
                                        : getClassName(entry.classId)}
                                    </div>
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {timeSlot?.startTime} - {timeSlot?.endTime}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground h-full flex items-center justify-center">
                                  {timeSlot?.startTime}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
