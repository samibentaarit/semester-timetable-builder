"use client"

import { ClassroomManagement } from "@/components/classroom-management"

export default function ClassroomsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 bg-white">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Classroom Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage room types and individual classrooms with their features and equipment
          </p>
        </div>

        <ClassroomManagement />
      </div>
    </div>
  )
}
