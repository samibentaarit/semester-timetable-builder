"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Users,
  User,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
  LayoutList,
  MapPin,
  Download,
  X,
} from "lucide-react"
import { classSections, teachers, subjects, rooms, timeSlots as initialTimeSlots } from "@/lib/timetable-data"
import type { TimetableEntry, Conflict, GradeSubjectAllocation, ClassSubjectTeacher, TimeSlot } from "@/types/timetable"
import { RoomAssignmentEngine } from "@/components/room-assignment-engine"
import type { RoomAssignment } from "@/types/room-assignment"
import jsPDF from "jspdf"
import { ScheduleBuilderModal } from "./schedule-builder-modal"

// Declare PERIODS and DAYS variables
const PERIODS = [1, 2, 3, 4, 5]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

interface TimetableGridProps {
  allocations: GradeSubjectAllocation[]
  assignments: ClassSubjectTeacher[]
  onPublish: (entries: TimetableEntry[]) => void
  onViewModeChange?: (mode: "class" | "teacher") => void
  onEntityChange?: (entityId: string) => void
  onLayoutChange?: (isVertical: boolean) => void
}

export function TimetableGrid({
  allocations,
  assignments,
  onPublish,
  onViewModeChange,
  onEntityChange,
  onLayoutChange,
}: TimetableGridProps) {
  const [viewMode, setViewMode] = useState<"class" | "teacher">("class")
  const [selectedEntity, setSelectedEntity] = useState<string>("")
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [isVerticalLayout, setIsVerticalLayout] = useState(true)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots)
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([])
  const [showScheduleBuilder, setShowScheduleBuilder] = useState(false)

  // Default period duration for calculations (can be updated from period config)
  const [periodDuration, setPeriodDuration] = useState(45)

  // Calculate subject scheduling progress
  const subjectProgress = useMemo(() => {
    if (!selectedEntity) return {}

    const progress: Record<string, { scheduled: number; total: number; percentage: number }> = {}

    // Get available subjects for the selected entity
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
      // Calculate total required hours for this subject
      let totalHours = 0
      if (viewMode === "class") {
        const classSection = classSections.find((c) => c.id === selectedEntity)
        if (classSection) {
          const allocation = allocations.find((a) => a.gradeId === classSection.gradeId && a.subjectId === subject.id)
          totalHours = allocation?.weeklyHours || 0
        }
      } else {
        // For teacher view, sum up all classes they teach this subject
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

      // Calculate scheduled hours
      const scheduledEntries = timetableEntries.filter((entry) => {
        if (viewMode === "class") {
          return entry.classId === selectedEntity && entry.subjectId === subject.id
        } else {
          return entry.teacherId === selectedEntity && entry.subjectId === subject.id
        }
      })

      const scheduledHours = scheduledEntries.length * (periodDuration / 60) // Convert minutes to hours

      progress[subject.id] = {
        scheduled: scheduledHours,
        total: totalHours,
        percentage: totalHours > 0 ? Math.round((scheduledHours / totalHours) * 100) : 0,
      }
    })

    return progress
  }, [selectedEntity, viewMode, allocations, assignments, timetableEntries, periodDuration])

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

  const validateConstraints = useCallback(
    (entries: TimetableEntry[]): Conflict[] => {
      const newConflicts: Conflict[] = []

      // Check teacher double booking
      const teacherSlots = new Map<string, Set<string>>()
      entries.forEach((entry) => {
        const key = `${entry.teacherId}-${entry.day}-${entry.period}`
        if (!teacherSlots.has(entry.teacherId)) {
          teacherSlots.set(entry.teacherId, new Set())
        }
        const slots = teacherSlots.get(entry.teacherId)!
        const slotKey = `${entry.day}-${entry.period}`
        if (slots.has(slotKey)) {
          newConflicts.push({
            type: "teacher_double_booking",
            message: `Teacher ${teachers.find((t) => t.id === entry.teacherId)?.name} is double-booked on ${entry.day} period ${entry.period}`,
            severity: "error",
            affectedEntries: [entry.id],
          })
        }
        slots.add(slotKey)
      })

      // Check teacher weekly hour limits
      const teacherHours = new Map<string, number>()
      entries.forEach((entry) => {
        const hours = periodDuration / 60 // Convert minutes to hours
        teacherHours.set(entry.teacherId, (teacherHours.get(entry.teacherId) || 0) + hours)
      })

      teacherHours.forEach((hours, teacherId) => {
        const teacher = teachers.find((t) => t.id === teacherId)
        if (teacher && hours > teacher.weeklyHourLimit) {
          newConflicts.push({
            type: "teacher_overload",
            message: `${teacher.name} exceeds weekly limit: ${hours.toFixed(1)}/${teacher.weeklyHourLimit} hours`,
            severity: "warning",
            affectedEntries: entries.filter((e) => e.teacherId === teacherId).map((e) => e.id),
          })
        }
      })

      // Check room conflicts
      const roomSlots = new Map<string, Set<string>>()
      entries.forEach((entry) => {
        if (entry.roomId) {
          const key = `${entry.roomId}-${entry.day}-${entry.period}`
          if (!roomSlots.has(entry.roomId)) {
            roomSlots.set(entry.roomId, new Set())
          }
          const slots = roomSlots.get(entry.roomId)!
          const slotKey = `${entry.day}-${entry.period}`
          if (slots.has(slotKey)) {
            newConflicts.push({
              type: "room_clash",
              message: `Room ${rooms.find((r) => r.id === entry.roomId)?.name} is double-booked on ${entry.day} period ${entry.period}`,
              severity: "error",
              affectedEntries: [entry.id],
            })
          }
          slots.add(slotKey)
        }
      })

      return newConflicts
    },
    [periodDuration],
  )

  const handleSlotClick = useCallback(
    (day: string, period: number) => {
      if (!selectedSubject || !selectedEntity) return

      // Check if subject is fully scheduled
      const progress = subjectProgress[selectedSubject]
      if (progress && progress.percentage >= 100) {
        alert("This subject is fully scheduled. No more periods can be added.")
        return
      }

      // Find the assigned teacher for this class-subject combination
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
        alert("No teacher assigned for this subject in this class. Please assign a teacher first.")
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

      const updatedEntries = [...timetableEntries, newEntry]
      setTimetableEntries(updatedEntries)
      setConflicts(validateConstraints(updatedEntries))
      setSelectedSubject(null)
    },
    [
      selectedSubject,
      selectedEntity,
      viewMode,
      timetableEntries,
      validateConstraints,
      assignments,
      timeSlots,
      subjectProgress,
    ],
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

  const removeEntry = (entryId: string) => {
    const updatedEntries = timetableEntries.filter((e) => e.id !== entryId)
    setTimetableEntries(updatedEntries)
    setConflicts(validateConstraints(updatedEntries))
  }

  const formatTime = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    if (minutes === 0) {
      return `${wholeHours}:00`
    }
    return `${wholeHours}:${minutes.toString().padStart(2, "0")}`
  }

  const exportToPDF = async () => {
    if (!selectedEntity) {
      alert("Please select a class or teacher first")
      return
    }

    try {
      const pdf = new jsPDF({
        orientation: isVerticalLayout ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pageWidth - 2 * margin

      // Add title
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      const title = `${viewMode === "class" ? getClassName(selectedEntity) : getTeacherName(selectedEntity)} Schedule`
      pdf.text(title, pageWidth / 2, margin + 8, { align: "center" })

      // Add date
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(80, 80, 80)
      const now = new Date()
      pdf.text(`Generated on ${now.toLocaleDateString()}`, pageWidth / 2, margin + 14, { align: "center" })

      let yPosition = margin + 20

      // Table settings
      const rowHeight = 14 // Increased row height to accommodate time info
      const cellPadding = 2
      const headerBgColor = [220, 220, 220]
      const borderColor = [180, 180, 180]
      const textColor = [0, 0, 0]

      // Create table data
      const tableData: string[][] = []
      const columnWidths: number[] = []

      if (isVerticalLayout) {
        // Vertical layout table
        const dayColWidth = 22
        const periodColWidth = (contentWidth - dayColWidth) / PERIODS.length
        columnWidths.push(dayColWidth, ...Array(PERIODS.length).fill(periodColWidth))

        const headerRow = [
          "Day",
          ...PERIODS.map((p) => {
            const timeSlot = timeSlots.find((ts) => ts.period === p)
            return `P${p}\n${timeSlot?.startTime || ""}-${timeSlot?.endTime || ""}`
          }),
        ]
        tableData.push(headerRow)

        // Data rows
        DAYS.forEach((day) => {
          const row = [day]
          PERIODS.forEach((period) => {
            const entry = getEntryForSlot(day, period)

            if (entry) {
              const subject = subjects.find((s) => s.id === entry.subjectId)
              const teacher = teachers.find((t) => t.id === entry.teacherId)
              const roomAssignment = roomAssignments.find((ra) => ra.timetableEntryId === entry.id)
              const room = roomAssignment ? rooms.find((r) => r.id === roomAssignment.roomId) : null

              row.push(`${subject?.name || "Unknown"}\n${teacher?.name || "Unknown"}${room ? `\n${room.name}` : ""}`)
            } else {
              row.push("")
            }
          })
          tableData.push(row)
        })
      } else {
        // Horizontal layout table
        const periodColWidth = 25 // Increased width to fit time info
        const dayColWidth = (contentWidth - periodColWidth) / DAYS.length
        columnWidths.push(periodColWidth, ...Array(DAYS.length).fill(dayColWidth))

        // Header row
        const headerRow = ["Period", ...DAYS]
        tableData.push(headerRow)

        // Data rows - already includes time info
        PERIODS.forEach((period) => {
          const timeSlot = timeSlots.find((ts) => ts.period === period)
          const row = [`P${period}\n${timeSlot?.startTime || ""}-${timeSlot?.endTime || ""}`]

          DAYS.forEach((day) => {
            const entry = getEntryForSlot(day, period)

            if (entry) {
              const subject = subjects.find((s) => s.id === entry.subjectId)
              const teacher = teachers.find((t) => t.id === entry.teacherId)
              const roomAssignment = roomAssignments.find((ra) => ra.timetableEntryId === entry.id)
              const room = roomAssignment ? rooms.find((r) => r.id === roomAssignment.roomId) : null

              row.push(`${subject?.name || "Unknown"}\n${teacher?.name || "Unknown"}${room ? `\n${room.name}` : ""}`)
            } else {
              row.push("")
            }
          })
          tableData.push(row)
        })
      }

      // Draw table manually for better control
      tableData.forEach((row, rowIndex) => {
        let xPosition = margin

        // Check if we need a new page
        if (yPosition + rowHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }

        row.forEach((cell, colIndex) => {
          const cellWidth = columnWidths[colIndex]
          const isHeader = rowIndex === 0
          const isFirstCol = colIndex === 0

          // Draw cell background
          if (isHeader) {
            pdf.setFillColor(...headerBgColor)
            pdf.rect(xPosition, yPosition, cellWidth, rowHeight, "F")
          } else if (colIndex > 0 && tableData[rowIndex][colIndex] !== "") {
            // Draw colored background for subject cells
            const entry = getEntryForSlot(
              isVerticalLayout ? tableData[rowIndex][0] : DAYS[colIndex - 1],
              isVerticalLayout ? Number(tableData[0][colIndex].split("\n")[0].replace("P", "")) : rowIndex,
            )

            if (entry) {
              const subjectColor = getSubjectColor(entry.subjectId)
              const rgbColor = hexToRgb(subjectColor)
              if (rgbColor) {
                pdf.setFillColor(...rgbColor)
                pdf.rect(xPosition, yPosition, cellWidth, rowHeight, "F")
              }
            }
          } else if (isFirstCol) {
            pdf.setFillColor(240, 240, 240)
            pdf.rect(xPosition, yPosition, cellWidth, rowHeight, "F")
          }

          // Draw cell border
          pdf.setDrawColor(...borderColor)
          pdf.rect(xPosition, yPosition, cellWidth, rowHeight)

          // Draw cell text
          pdf.setFontSize(8) // Slightly smaller font to fit time info
          pdf.setFont("helvetica", isHeader ? "bold" : "normal")
          pdf.setTextColor(
            ...(colIndex > 0 && tableData[rowIndex][colIndex] !== "" && !isHeader ? [255, 255, 255] : textColor),
          )

          const lines = cell.split("\n")
          const lineHeight = rowHeight / Math.max(lines.length + 0.5, 1)
          lines.forEach((line, lineIndex) => {
            pdf.text(line, xPosition + cellPadding, yPosition + cellPadding + 2 + lineIndex * lineHeight, {
              maxWidth: cellWidth - 2 * cellPadding,
            })
          })

          xPosition += cellWidth
        })

        yPosition += rowHeight
      })

      const fileName = `${viewMode === "class" ? getClassName(selectedEntity) : getTeacherName(selectedEntity)}_timetable.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("[v0] PDF Export Error:", error)
      alert("Error generating PDF. Please try again.")
    }
  }

  const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
      : null
  }

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

  // Update the viewMode setter
  const handleViewModeChange = (value: "class" | "teacher") => {
    setViewMode(value)
    onViewModeChange?.(value)
  }

  // Update the selectedEntity setter
  const handleEntityChange = (value: string) => {
    setSelectedEntity(value)
    onEntityChange?.(value)
  }

  // Update the layout setter
  const handleLayoutChange = (value: boolean) => {
    setIsVerticalLayout(value)
    onLayoutChange?.(value)
  }

  const handleAddEntry = useCallback(
    (newEntry: TimetableEntry) => {
      const updatedEntries = [...timetableEntries, newEntry]
      setTimetableEntries(updatedEntries)
      setConflicts(validateConstraints(updatedEntries))
    },
    [timetableEntries, validateConstraints],
  )

  const handleRemoveEntryFromModal = useCallback(
    (entryId: string) => {
      const updatedEntries = timetableEntries.filter((e) => e.id !== entryId)
      setTimetableEntries(updatedEntries)
      setConflicts(validateConstraints(updatedEntries))
    },
    [timetableEntries, validateConstraints],
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timetable Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">View Mode</label>
              <Select value={viewMode} onValueChange={handleViewModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Class View
                    </div>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Teacher View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">{viewMode === "class" ? "Select Class" : "Select Teacher"}</label>
              <Select value={selectedEntity} onValueChange={handleEntityChange}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${viewMode}`} />
                </SelectTrigger>
                <SelectContent>
                  {(viewMode === "class" ? classSections : teachers).map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Layout</Label>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  {isVerticalLayout ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  <span className="text-sm">{isVerticalLayout ? "Vertical" : "Horizontal"}</span>
                </div>
                <Switch checked={isVerticalLayout} onCheckedChange={handleLayoutChange} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowScheduleBuilder(true)}
              disabled={!selectedEntity}
              variant="default"
              className="min-w-[140px]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Builder
            </Button>
            <Button
              onClick={() => onPublish(timetableEntries)}
              disabled={conflicts.some((c) => c.severity === "error")}
              className="min-w-[120px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={!selectedEntity || timetableEntries.length === 0}
              variant="outline"
              className="min-w-[120px] ml-2 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant={conflicts.some((c) => c.severity === "error") ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm">
                  {conflict.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {selectedEntity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Subjects & Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedSubject && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        <strong>{getSubjectName(selectedSubject)}</strong> selected. Click empty slots below to
                        schedule.
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSubject(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSubjects.map((subject) => {
                  const progress = subjectProgress[subject.id] || { scheduled: 0, total: 0, percentage: 0 }
                  const isFullyScheduled = progress.percentage >= 100
                  const remainingHours = Math.max(0, progress.total - progress.scheduled)
                  const isSelected = selectedSubject === subject.id

                  return (
                    <div key={subject.id} className="space-y-2">
                      <Button
                        onClick={() => setSelectedSubject(isSelected ? null : subject.id)}
                        disabled={isFullyScheduled}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto py-3 px-3 ${
                          isFullyScheduled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        style={isSelected ? {} : { borderColor: subject.color }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm">{subject.name}</div>
                            <div className="text-xs opacity-70">
                              {formatTime(progress.scheduled)}/{formatTime(progress.total)}
                            </div>
                          </div>
                        </div>
                      </Button>
                      <div className="space-y-1">
                        <Progress value={progress.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.percentage}% scheduled</span>
                          <span>{formatTime(remainingHours)} remaining</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Grid */}
      {selectedEntity && (
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "class" ? getClassName(selectedEntity) : getTeacherName(selectedEntity)} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="timetable-grid" className="overflow-x-auto bg-white p-4 rounded-lg">
              {isVerticalLayout ? (
                // Vertical Layout
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium">Time</th>
                      {PERIODS.map((period) => (
                        <th key={period} className="border p-2 bg-muted font-medium min-w-[120px]">
                          Period {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="border p-2 bg-muted font-medium text-center">{day}</td>
                        {PERIODS.map((period) => {
                          const entry = getEntryForSlot(day, period)
                          const isValid = selectedSubject && isSlotValid(day, period)
                          const timeSlot = timeSlots.find((ts) => ts.day === day && ts.period === period)

                          return (
                            <td
                              key={`${day}-${period}`}
                              className={`border p-1 h-20 cursor-pointer transition-colors ${
                                isValid ? "bg-green-50 hover:bg-green-100 border-green-200" : "hover:bg-muted/50"
                              } ${selectedSubject && !isValid ? "opacity-50" : ""}`}
                              onClick={() => {
                                if (isValid) {
                                  handleSlotClick(day, period)
                                }
                              }}
                            >
                              <div className="text-xs text-muted-foreground mb-1">
                                {timeSlot?.startTime} - {timeSlot?.endTime}
                              </div>
                              {entry ? (
                                <div
                                  className="p-2 rounded text-white text-xs cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: getSubjectColor(entry.subjectId) }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeEntry(entry.id)
                                  }}
                                  title="Click to remove"
                                >
                                  <div className="font-medium">{getSubjectName(entry.subjectId)}</div>
                                  <div className="opacity-90">
                                    {viewMode === "class"
                                      ? getTeacherName(entry.teacherId)
                                      : getClassName(entry.classId)}
                                  </div>
                                  {(() => {
                                    const roomAssignment = roomAssignments.find(
                                      (ra) => ra.timetableEntryId === entry.id,
                                    )
                                    const roomName = roomAssignment
                                      ? rooms.find((r) => r.id === roomAssignment.roomId)?.name
                                      : null
                                    return roomName ? (
                                      <div className="opacity-75 text-xs mt-1 flex items-center gap-1">
                                        <MapPin className="h-2 w-2" />
                                        {roomName}
                                      </div>
                                    ) : (
                                      <div className="opacity-60 text-xs italic mt-1">No room assigned</div>
                                    )
                                  })()}
                                </div>
                              ) : (
                                <div className="h-full border-2 border-dashed border-muted-foreground/20 rounded flex items-center justify-center text-muted-foreground text-xs">
                                  {isValid ? "Click to add" : ""}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // Horizontal Layout (Original)
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium">Period</th>
                      {DAYS.map((day) => (
                        <th key={day} className="border p-2 bg-muted font-medium min-w-[150px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period}>
                        <td className="border p-2 bg-muted font-medium text-center">
                          <div>Period {period}</div>
                          <div className="text-xs text-muted-foreground">
                            {timeSlots.find((ts) => ts.period === period)?.startTime} -{" "}
                            {timeSlots.find((ts) => ts.period === period)?.endTime}
                          </div>
                        </td>
                        {DAYS.map((day) => {
                          const entry = getEntryForSlot(day, period)
                          const isValid = selectedSubject && isSlotValid(day, period)

                          return (
                            <td
                              key={`${day}-${period}`}
                              className={`border p-1 h-20 cursor-pointer transition-colors ${
                                isValid ? "bg-green-50 hover:bg-green-100 border-green-200" : "hover:bg-muted/50"
                              } ${selectedSubject && !isValid ? "opacity-50" : ""}`}
                              onClick={() => {
                                if (isValid) {
                                  handleSlotClick(day, period)
                                }
                              }}
                            >
                              {entry ? (
                                <div
                                  className="p-2 rounded text-white text-xs cursor-pointer hover:opacity-80 h-full flex flex-col justify-between"
                                  style={{ backgroundColor: getSubjectColor(entry.subjectId) }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeEntry(entry.id)
                                  }}
                                  title="Click to remove"
                                >
                                  <div>
                                    <div className="font-medium">{getSubjectName(entry.subjectId)}</div>
                                    <div className="opacity-90">
                                      {viewMode === "class"
                                        ? getTeacherName(entry.teacherId)
                                        : getClassName(entry.classId)}
                                    </div>
                                  </div>
                                  {(() => {
                                    const roomAssignment = roomAssignments.find(
                                      (ra) => ra.timetableEntryId === entry.id,
                                    )
                                    const roomName = roomAssignment
                                      ? rooms.find((r) => r.id === roomAssignment.roomId)?.name
                                      : null
                                    return roomName ? (
                                      <div className="opacity-75 text-xs flex items-center gap-1 mt-1">
                                        <MapPin className="h-2 w-2" />
                                        {roomName}
                                      </div>
                                    ) : (
                                      <div className="opacity-60 text-xs italic mt-1">No room</div>
                                    )
                                  })()}
                                </div>
                              ) : (
                                <div className="h-full border-2 border-dashed border-muted-foreground/20 rounded flex items-center justify-center text-muted-foreground text-xs">
                                  {isValid ? "Click to add" : ""}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Assignment Engine */}
      {selectedEntity && timetableEntries.length > 0 && (
        <RoomAssignmentEngine timetableEntries={timetableEntries} onRoomAssignmentsChange={setRoomAssignments} />
      )}

      <ScheduleBuilderModal
        open={showScheduleBuilder}
        onOpenChange={setShowScheduleBuilder}
        allocations={allocations}
        assignments={assignments}
        timetableEntries={timetableEntries}
        selectedEntity={selectedEntity}
        viewMode={viewMode}
        onAddEntry={handleAddEntry}
        onRemoveEntry={handleRemoveEntryFromModal}
        roomAssignments={roomAssignments}
      />
    </div>
  )
}
