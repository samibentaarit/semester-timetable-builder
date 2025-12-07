export interface SubjectRoomType {
  id: string
  subjectId: string
  roomTypeId: string
  priority: number // 1 = preferred, 2 = acceptable, 3 = last resort
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface RoomAssignment {
  id: string
  timetableEntryId: string
  roomId: string
  isAutoAssigned: boolean
  assignedAt: string
  assignedBy: string // 'system' or user id
  conflictStatus: "none" | "warning" | "error"
  alternativeRooms?: string[]
}

export interface RoomConflict {
  id: string
  roomId: string
  timeSlotId: string
  conflictingEntries: string[]
  severity: "warning" | "error"
  message: string
  suggestedResolutions: RoomConflictResolution[]
}

export interface RoomConflictResolution {
  type: "move_to_room" | "swap_rooms" | "change_time" | "split_class"
  description: string
  roomId?: string
  alternativeTimeSlot?: string
  impact: "low" | "medium" | "high"
}

export interface RoomUtilization {
  roomId: string
  roomName: string
  roomType: string
  totalSlots: number
  occupiedSlots: number
  utilizationPercentage: number
  peakHours: string[]
  conflicts: number
  assignments: {
    day: string
    period: number
    subject: string
    class: string
    teacher: string
  }[]
}

export interface RoomSuggestion {
  roomId: string
  roomName: string
  suitabilityScore: number
  reasons: string[]
  warnings: string[]
  distance?: number // if location data available
}
