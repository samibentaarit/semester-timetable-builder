"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle,
  MapPin,
  Users,
  Clock,
  Building,
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
} from "lucide-react"
import { classSections, subjects } from "@/lib/timetable-data"
import { defaultClassrooms } from "@/lib/classroom-data"
import { defaultSubjectRoomTypes } from "@/lib/room-assignment-data"
import type { TimetableEntry } from "@/types/timetable"
import type { Classroom } from "@/types/classroom"
import type {
  SubjectRoomType,
  RoomAssignment,
  RoomConflict,
  RoomUtilization,
  RoomSuggestion,
} from "@/types/room-assignment"

interface RoomAssignmentEngineProps {
  timetableEntries: TimetableEntry[]
  onRoomAssignmentsChange?: (assignments: RoomAssignment[]) => void
}

export function RoomAssignmentEngine({ timetableEntries, onRoomAssignmentsChange }: RoomAssignmentEngineProps) {
  const [classrooms] = useState<Classroom[]>(defaultClassrooms)
  const [subjectRoomTypes] = useState<SubjectRoomType[]>(defaultSubjectRoomTypes)
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([])
  const [conflicts, setConflicts] = useState<RoomConflict[]>([])
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<RoomConflict | null>(null)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null)
  const [manualRoomSelection, setManualRoomSelection] = useState("")

  // Generate room suggestions for a timetable entry
  const generateRoomSuggestions = useCallback(
    (entry: TimetableEntry): RoomSuggestion[] => {
      const subject = subjects.find((s) => s.id === entry.subjectId)
      const classSection = classSections.find((c) => c.id === entry.classId)

      if (!subject || !classSection) return []

      // Get preferred room types for this subject
      const subjectRoomPreferences = subjectRoomTypes
        .filter((srt) => srt.subjectId === entry.subjectId)
        .sort((a, b) => a.priority - b.priority)

      // Get all available classrooms for the time slot
      const occupiedRooms = roomAssignments
        .filter((ra) => {
          const assignedEntry = timetableEntries.find((te) => te.id === ra.timetableEntryId)
          return assignedEntry && assignedEntry.day === entry.day && assignedEntry.period === entry.period
        })
        .map((ra) => ra.roomId)

      const availableRooms = classrooms.filter((room) => room.isActive && !occupiedRooms.includes(room.id))

      // Score rooms based on suitability
      const suggestions: RoomSuggestion[] = availableRooms.map((room) => {
        let score = 0
        const reasons: string[] = []
        const warnings: string[] = []

        // Check room type preference
        const roomTypePreference = subjectRoomPreferences.find((srt) => srt.roomTypeId === room.roomTypeId)
        if (roomTypePreference) {
          const priorityScore = 4 - roomTypePreference.priority // Higher score for higher priority
          score += priorityScore * 30
          reasons.push(`${roomTypePreference.priority === 1 ? "Preferred" : "Suitable"} room type`)

          if (roomTypePreference.isRequired) {
            score += 20
            reasons.push("Required room type")
          }
        } else if (subjectRoomPreferences.length > 0) {
          score -= 20
          warnings.push("Not a preferred room type for this subject")
        }

        // Check capacity
        if (room.capacity >= classSection.studentCount) {
          const capacityRatio = classSection.studentCount / room.capacity
          if (capacityRatio > 0.8) {
            score += 15
            reasons.push("Good capacity utilization")
          } else if (capacityRatio > 0.5) {
            score += 10
            reasons.push("Adequate capacity")
          } else {
            score += 5
            warnings.push("Room may be too large")
          }
        } else {
          score -= 50
          warnings.push(`Insufficient capacity (${room.capacity} < ${classSection.studentCount})`)
        }

        // Check features match
        const requiredFeatures = ["Projector", "Whiteboard"] // Basic requirements
        const hasRequiredFeatures = requiredFeatures.every((feature) => room.features.includes(feature))
        if (hasRequiredFeatures) {
          score += 10
          reasons.push("Has required features")
        } else {
          warnings.push("Missing some required features")
        }

        return {
          roomId: room.id,
          roomName: room.name,
          suitabilityScore: Math.max(0, score),
          reasons,
          warnings,
        }
      })

      return suggestions.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    },
    [classrooms, subjectRoomTypes, roomAssignments, timetableEntries],
  )

  // Auto-assign rooms to all timetable entries
  const autoAssignRooms = useCallback(() => {
    const newAssignments: RoomAssignment[] = []
    const newConflicts: RoomConflict[] = []

    timetableEntries.forEach((entry) => {
      // Skip if already assigned
      if (roomAssignments.some((ra) => ra.timetableEntryId === entry.id)) return

      const suggestions = generateRoomSuggestions(entry)
      const bestSuggestion = suggestions[0]

      if (bestSuggestion && bestSuggestion.suitabilityScore > 0) {
        newAssignments.push({
          id: `auto-${entry.id}`,
          timetableEntryId: entry.id,
          roomId: bestSuggestion.roomId,
          isAutoAssigned: true,
          assignedAt: new Date().toISOString(),
          assignedBy: "system",
          conflictStatus: bestSuggestion.warnings.length > 0 ? "warning" : "none",
        })
      }
    })

    const updatedAssignments = [...roomAssignments, ...newAssignments]
    setRoomAssignments(updatedAssignments)
    onRoomAssignmentsChange?.(updatedAssignments)

    // Check for conflicts
    detectConflicts(updatedAssignments)
  }, [timetableEntries, roomAssignments, generateRoomSuggestions, onRoomAssignmentsChange])

  // Detect room conflicts
  const detectConflicts = useCallback(
    (assignments: RoomAssignment[]) => {
      const conflictMap = new Map<string, string[]>()

      assignments.forEach((assignment) => {
        const entry = timetableEntries.find((te) => te.id === assignment.timetableEntryId)
        if (!entry) return

        const key = `${assignment.roomId}-${entry.day}-${entry.period}`
        if (!conflictMap.has(key)) {
          conflictMap.set(key, [])
        }
        conflictMap.get(key)!.push(assignment.timetableEntryId)
      })

      const newConflicts: RoomConflict[] = []
      conflictMap.forEach((entryIds, key) => {
        if (entryIds.length > 1) {
          const [roomId, day, period] = key.split("-")
          const room = classrooms.find((r) => r.id === roomId)

          newConflicts.push({
            id: `conflict-${key}`,
            roomId,
            timeSlotId: `${day}-${period}`,
            conflictingEntries: entryIds,
            severity: "error",
            message: `${room?.name || "Room"} is double-booked on ${day} period ${period}`,
            suggestedResolutions: [
              {
                type: "move_to_room",
                description: "Move one class to an alternative room",
                impact: "low",
              },
              {
                type: "change_time",
                description: "Reschedule one of the classes",
                impact: "medium",
              },
            ],
          })
        }
      })

      setConflicts(newConflicts)
    },
    [timetableEntries, classrooms],
  )

  // Calculate room utilization
  const roomUtilization = useMemo((): RoomUtilization[] => {
    return classrooms.map((room) => {
      const roomAssignmentsForRoom = roomAssignments.filter((ra) => ra.roomId === room.id)
      const totalSlots = 5 * 8 // 5 days * 8 periods
      const occupiedSlots = roomAssignmentsForRoom.length
      const utilizationPercentage = Math.round((occupiedSlots / totalSlots) * 100)

      // Get assignments details
      const assignments = roomAssignmentsForRoom.map((ra) => {
        const entry = timetableEntries.find((te) => te.id === ra.timetableEntryId)
        const subject = subjects.find((s) => s.id === entry?.subjectId)
        const classSection = classSections.find((c) => c.id === entry?.classId)

        return {
          day: entry?.day || "",
          period: entry?.period || 0,
          subject: subject?.name || "",
          class: classSection?.name || "",
          teacher: "", // Would need teacher data
        }
      })

      // Calculate peak hours
      const hourCounts = new Map<string, number>()
      assignments.forEach((assignment) => {
        const key = `${assignment.day}-${assignment.period}`
        hourCounts.set(key, (hourCounts.get(key) || 0) + 1)
      })

      const peakHours = Array.from(hourCounts.entries())
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([time]) => time)

      return {
        roomId: room.id,
        roomName: room.name,
        roomType: room.roomTypeId, // Would need to resolve to name
        totalSlots,
        occupiedSlots,
        utilizationPercentage,
        peakHours,
        conflicts: conflicts.filter((c) => c.roomId === room.id).length,
        assignments,
      }
    })
  }, [classrooms, roomAssignments, timetableEntries, conflicts])

  // Open manual assignment dialog
  const openManualAssignment = (entry: TimetableEntry) => {
    setSelectedEntry(entry)
    setManualRoomSelection("")
    setIsAssignmentDialogOpen(true)
  }

  // Save manual room assignment
  const saveManualAssignment = () => {
    if (!selectedEntry || !manualRoomSelection) return

    // Check for conflicts
    const conflictingAssignment = roomAssignments.find((ra) => {
      const entry = timetableEntries.find((te) => te.id === ra.timetableEntryId)
      return (
        entry &&
        ra.roomId === manualRoomSelection &&
        entry.day === selectedEntry.day &&
        entry.period === selectedEntry.period
      )
    })

    if (conflictingAssignment) {
      alert("This room is already occupied at this time!")
      return
    }

    // Remove existing assignment if any
    const updatedAssignments = roomAssignments.filter((ra) => ra.timetableEntryId !== selectedEntry.id)

    // Add new assignment
    updatedAssignments.push({
      id: `manual-${selectedEntry.id}`,
      timetableEntryId: selectedEntry.id,
      roomId: manualRoomSelection,
      isAutoAssigned: false,
      assignedAt: new Date().toISOString(),
      assignedBy: "user",
      conflictStatus: "none",
    })

    setRoomAssignments(updatedAssignments)
    onRoomAssignmentsChange?.(updatedAssignments)
    detectConflicts(updatedAssignments)
    setIsAssignmentDialogOpen(false)
  }

  // Get room name
  const getRoomName = (roomId: string) => {
    return classrooms.find((r) => r.id === roomId)?.name || "Unknown Room"
  }

  // Get subject name
  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject"
  }

  // Get class name
  const getClassName = (classId: string) => {
    return classSections.find((c) => c.id === classId)?.name || "Unknown Class"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Room Assignment Engine
              <Badge variant="outline">{roomAssignments.length} Assignments</Badge>
              {conflicts.length > 0 && <Badge variant="destructive">{conflicts.length} Conflicts</Badge>}
            </div>
            <div className="flex gap-2">
              <Button onClick={autoAssignRooms} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-Assign Rooms
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">{conflicts.length} room conflicts detected</div>
              {conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="text-sm">
                  • {conflict.message}
                </div>
              ))}
              {conflicts.length > 3 && <div className="text-sm">+{conflicts.length - 3} more conflicts...</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Room Assignments</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="utilization">Room Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Assigned Room</TableHead>
                    <TableHead>Assignment Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timetableEntries.map((entry) => {
                    const assignment = roomAssignments.find((ra) => ra.timetableEntryId === entry.id)
                    const hasConflict = conflicts.some((c) => c.conflictingEntries.includes(entry.id))

                    return (
                      <TableRow key={entry.id} className={hasConflict ? "bg-destructive/5" : ""}>
                        <TableCell>{getClassName(entry.classId)}</TableCell>
                        <TableCell>{getSubjectName(entry.subjectId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {entry.day} P{entry.period}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{getRoomName(assignment.roomId)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment && (
                            <Badge variant={assignment.isAutoAssigned ? "secondary" : "default"}>
                              {assignment.isAutoAssigned ? "Auto" : "Manual"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasConflict ? (
                            <Badge variant="destructive">Conflict</Badge>
                          ) : assignment ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Assigned
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openManualAssignment(entry)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          {conflicts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Room Conflicts</h3>
                <p className="text-muted-foreground">All room assignments are conflict-free.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <Card key={conflict.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="font-medium">{conflict.message}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Affects {conflict.conflictingEntries.length} classes
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Suggested resolutions:</div>
                          {conflict.suggestedResolutions.map((resolution, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              • {resolution.description} (Impact: {resolution.impact})
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConflict(conflict)
                          setIsConflictDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <div className="grid gap-4">
            {roomUtilization.map((util) => (
              <Card key={util.roomId}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      <span>{util.roomName}</span>
                      <Badge
                        variant={
                          util.utilizationPercentage > 80
                            ? "destructive"
                            : util.utilizationPercentage > 60
                              ? "default"
                              : "secondary"
                        }
                      >
                        {util.utilizationPercentage}% Utilized
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {util.occupiedSlots}/{util.totalSlots} slots
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Utilization</span>
                      <span>{util.utilizationPercentage}%</span>
                    </div>
                    <Progress value={util.utilizationPercentage} className="h-2" />
                  </div>

                  {util.conflicts > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {util.conflicts} scheduling conflict{util.conflicts > 1 ? "s" : ""} detected
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-2">Peak Usage Times:</div>
                      {util.peakHours.length > 0 ? (
                        <div className="space-y-1">
                          {util.peakHours.map((time) => (
                            <div key={time} className="text-muted-foreground">
                              {time.replace("-", " Period ")}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No usage data</div>
                      )}
                    </div>

                    <div>
                      <div className="font-medium mb-2">Recent Assignments:</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {util.assignments.slice(0, 3).map((assignment, index) => (
                          <div key={index} className="text-muted-foreground">
                            {assignment.subject} - {assignment.class}
                          </div>
                        ))}
                        {util.assignments.length > 3 && (
                          <div className="text-muted-foreground">+{util.assignments.length - 3} more...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Manual Assignment Dialog */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Room Manually</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Class:</span> {getClassName(selectedEntry.classId)}
                  </div>
                  <div>
                    <span className="font-medium">Subject:</span> {getSubjectName(selectedEntry.subjectId)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedEntry.day} Period {selectedEntry.period}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Select Room</label>
                <Select value={manualRoomSelection} onValueChange={setManualRoomSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateRoomSuggestions(selectedEntry).map((suggestion) => {
                      const room = classrooms.find((r) => r.id === suggestion.roomId)
                      return (
                        <SelectItem key={suggestion.roomId} value={suggestion.roomId}>
                          <div className="flex items-center justify-between w-full">
                            <span>{suggestion.roomName}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Score: {suggestion.suitabilityScore}
                              </Badge>
                              {suggestion.warnings.length > 0 && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {manualRoomSelection && (
                <div className="space-y-2">
                  {(() => {
                    const suggestion = generateRoomSuggestions(selectedEntry).find(
                      (s) => s.roomId === manualRoomSelection,
                    )
                    return (
                      suggestion && (
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium mb-2">Room Suitability Analysis</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              <span>Suitability Score: {suggestion.suitabilityScore}/100</span>
                            </div>
                            {suggestion.reasons.length > 0 && (
                              <div>
                                <div className="font-medium text-green-600">Advantages:</div>
                                {suggestion.reasons.map((reason, index) => (
                                  <div key={index} className="text-green-600">
                                    • {reason}
                                  </div>
                                ))}
                              </div>
                            )}
                            {suggestion.warnings.length > 0 && (
                              <div>
                                <div className="font-medium text-yellow-600">Warnings:</div>
                                {suggestion.warnings.map((warning, index) => (
                                  <div key={index} className="text-yellow-600">
                                    • {warning}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveManualAssignment} disabled={!manualRoomSelection}>
              Assign Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
