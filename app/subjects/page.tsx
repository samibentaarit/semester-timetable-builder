"use client"

import { SubjectManagement } from "@/components/subject-management"

export default function SubjectsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 bg-white">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your school's subjects with names, codes, and visual identifiers
          </p>
        </div>

        <SubjectManagement />
      </div>
    </div>
  )
}
