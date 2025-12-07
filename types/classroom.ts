export interface RoomType {
  id: string
  name: string
  description: string
  color: string
  defaultCapacity: number
  features: string[]
  createdAt: string
  updatedAt: string
}

export interface Classroom {
  id: string
  name: string
  code: string
  roomTypeId: string
  capacity: number
  floor: string
  building: string
  features: string[]
  equipment: string[]
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ClassroomConflict {
  type: "duplicate_name" | "duplicate_code" | "invalid_capacity" | "missing_room_type"
  message: string
  severity: "error" | "warning" | "info"
  affectedRooms: string[]
  suggestions?: string[]
}
