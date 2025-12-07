"use client"

import { PeriodConfiguration } from "@/components/period-configuration"

export default function PeriodsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 bg-white">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Period Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure period durations, break times, and daily schedules for your school
          </p>
        </div>

        <PeriodConfiguration />
      </div>
    </div>
  )
}
