"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Mail } from "lucide-react"
import type { TimetableEntry } from "@/types/timetable"
import { classSections, teachers, subjects } from "@/lib/timetable-data"

interface ExportOptionsProps {
  timetableEntries: TimetableEntry[]
  isPublished: boolean
}

export function ExportOptions({ timetableEntries, isPublished }: ExportOptionsProps) {
  const [exportType, setExportType] = useState<"pdf" | "ics">("pdf")
  const [exportScope, setExportScope] = useState<"all" | "class" | "teacher">("all")
  const [selectedEntity, setSelectedEntity] = useState<string>("")

  const generatePDF = () => {
    // In a real implementation, this would generate a PDF
    const content = generateTimetableContent()
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `timetable-${exportScope}-${selectedEntity || "all"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateICS = () => {
    const icsContent = generateICSContent()
    const blob = new Blob([icsContent], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `timetable-${exportScope}-${selectedEntity || "all"}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateTimetableContent = () => {
    let content = `TIMETABLE EXPORT\n${"=".repeat(50)}\n\n`

    const filteredEntries = timetableEntries.filter((entry) => {
      if (exportScope === "all") return true
      if (exportScope === "class") return entry.classId === selectedEntity
      if (exportScope === "teacher") return entry.teacherId === selectedEntity
      return true
    })

    const groupedByDay = filteredEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.day]) acc[entry.day] = []
        acc[entry.day].push(entry)
        return acc
      },
      {} as Record<string, TimetableEntry[]>,
    )

    Object.entries(groupedByDay).forEach(([day, entries]) => {
      content += `${day.toUpperCase()}\n${"-".repeat(day.length)}\n`
      entries
        .sort((a, b) => a.period - b.period)
        .forEach((entry) => {
          const subject = subjects.find((s) => s.id === entry.subjectId)
          const teacher = teachers.find((t) => t.id === entry.teacherId)
          const classSection = classSections.find((c) => c.id === entry.classId)

          content += `Period ${entry.period}: ${subject?.name} - ${teacher?.name} - ${classSection?.name}\n`
        })
      content += "\n"
    })

    return content
  }

  const generateICSContent = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//School Timetable//EN\n"

    const filteredEntries = timetableEntries.filter((entry) => {
      if (exportScope === "all") return true
      if (exportScope === "class") return entry.classId === selectedEntity
      if (exportScope === "teacher") return entry.teacherId === selectedEntity
      return true
    })

    filteredEntries.forEach((entry) => {
      const subject = subjects.find((s) => s.id === entry.subjectId)
      const teacher = teachers.find((t) => t.id === entry.teacherId)
      const classSection = classSections.find((c) => c.id === entry.classId)

      ics += "BEGIN:VEVENT\n"
      ics += `UID:${entry.id}@school.edu\n`
      ics += `SUMMARY:${subject?.name} - ${classSection?.name}\n`
      ics += `DESCRIPTION:Teacher: ${teacher?.name}\n`
      ics += `DTSTART:20240101T080000Z\n` // This would be calculated based on actual dates
      ics += `DTEND:20240101T084500Z\n`
      ics += "END:VEVENT\n"
    })

    ics += "END:VCALENDAR"
    return ics
  }

  const sendNotifications = () => {
    // In a real implementation, this would send email notifications
    alert("Notifications sent to all teachers!")
  }

  const getEntityOptions = () => {
    if (exportScope === "class") return classSections
    if (exportScope === "teacher") return teachers
    return []
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Notifications
          {isPublished && <Badge variant="default">Published</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Export Format</label>
            <Select value={exportType} onValueChange={(value: "pdf" | "ics") => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="ics">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    ICS Calendar
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Export Scope</label>
            <Select value={exportScope} onValueChange={(value: "all" | "class" | "teacher") => setExportScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                <SelectItem value="class">Specific Class</SelectItem>
                <SelectItem value="teacher">Specific Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportScope !== "all" && (
            <div>
              <label className="text-sm font-medium">Select {exportScope === "class" ? "Class" : "Teacher"}</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose ${exportScope}`} />
                </SelectTrigger>
                <SelectContent>
                  {getEntityOptions().map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={exportType === "pdf" ? generatePDF : generateICS}
            disabled={!isPublished || (exportScope !== "all" && !selectedEntity)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export {exportType.toUpperCase()}
          </Button>

          <Button variant="outline" onClick={sendNotifications} disabled={!isPublished}>
            <Mail className="h-4 w-4 mr-2" />
            Notify Teachers
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {!isPublished && "Publish the timetable first to enable exports and notifications."}
          {isPublished && `${timetableEntries.length} schedule entries ready for export.`}
        </div>
      </CardContent>
    </Card>
  )
}
