import type { SubjectRoomType } from "@/types/room-assignment"

export const defaultSubjectRoomTypes: SubjectRoomType[] = [
  // Mathematics - Standard Classroom preferred
  {
    id: "1",
    subjectId: "1", // Mathematics
    roomTypeId: "1", // Standard Classroom
    priority: 1,
    isRequired: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Science - Laboratory required
  {
    id: "2",
    subjectId: "3", // Science
    roomTypeId: "2", // Science Laboratory
    priority: 1,
    isRequired: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Computer Science - Computer Lab required
  {
    id: "3",
    subjectId: "8", // Computer Science
    roomTypeId: "3", // Computer Lab
    priority: 1,
    isRequired: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Physical Education - Gymnasium required
  {
    id: "4",
    subjectId: "5", // Physical Education
    roomTypeId: "7", // Gymnasium
    priority: 1,
    isRequired: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Art - Art Studio preferred
  {
    id: "5",
    subjectId: "6", // Art
    roomTypeId: "5", // Art Studio
    priority: 1,
    isRequired: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Music - Music Room preferred
  {
    id: "6",
    subjectId: "7", // Music
    roomTypeId: "6", // Music Room
    priority: 1,
    isRequired: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
]
