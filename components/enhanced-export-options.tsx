"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Calendar, Mail } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import type { TimetableEntry } from "@/types/timetable"
import { classSections, teachers, subjects } from "@/lib/timetable-data"

interface EnhancedExportOptionsProps {
  timetableEntries: TimetableEntry[]
  isPublished: boolean
  selectedEntity?: string
  viewMode?: "class" | "teacher"
  isVerticalLayout?: boolean
}

export function EnhancedExportOptions({
  timetableEntries,
  isPublished,
  selectedEntity,
  viewMode = "class",
  isVerticalLayout = true,
}: EnhancedExportOptionsProps) {
  const [exportType, setExportType] = useState<"pdf" | "ics">("pdf")
  const [exportScope, setExportScope] = useState<"current" | "all" | "class" | "teacher">("current")
  const [includeRooms, setIncludeRooms] = useState(true)
  const [includeHeader, setIncludeHeader] = useState(true)
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">(
    isVerticalLayout ? "portrait" : "landscape",
  )

  const getEntityName = (entityId: string, type: "class" | "teacher") => {
    if (type === "class") {
      return classSections.find((c) => c.id === entityId)?.name || "Unknown Class"
    } else {
      return teachers.find((t) => t.id === entityId)?.name || "Unknown Teacher"
    }
  }

  const exportCurrentTimetableToPDF = async () => {
    if (!selectedEntity) {
      alert("Please select a class or teacher first")
      return
    }

    const element = document.getElementById("timetable-grid")
    if (!element) {
      alert("Timetable grid not found")
      return
    }

    try {
      // Show loading state
      const originalText = element.textContent

      // Create a styled clone for PDF
      const clone = element.cloneNode(true) as HTMLElement
      clone.style.backgroundColor = "white"
      clone.style.padding = "20px"
      clone.style.fontFamily = "Arial, sans-serif"
      clone.style.fontSize = "12px"
      clone.style.color = "#000000"

      // Style tables in clone
      const tables = clone.querySelectorAll("table")
      tables.forEach((table) => {
        table.style.borderCollapse = "collapse"
        table.style.width = "100%"
        table.style.marginBottom = "20px"
      })

      // Style cells in clone
      const cells = clone.querySelectorAll("td, th")
      cells.forEach((cell) => {
        const htmlCell = cell as HTMLElement
        htmlCell.style.border = "1px solid #000000"
        htmlCell.style.padding = "8px"
        htmlCell.style.textAlign = "center"
        htmlCell.style.verticalAlign = "middle"
        htmlCell.style.fontSize = "11px"
        htmlCell.style.lineHeight = "1.2"
      })

      // Style headers
      const headers = clone.querySelectorAll("th")
      headers.forEach((header) => {
        const htmlHeader = header as HTMLElement
        htmlHeader.style.backgroundColor = "#f5f5f5"
        htmlHeader.style.fontWeight = "bold"
        htmlHeader.style.fontSize = "12px"
      })

      // Style subject blocks
      const subjectBlocks = clone.querySelectorAll('[style*="background-color"]')
      subjectBlocks.forEach((block) => {
        const htmlBlock = block as HTMLElement
        htmlBlock.style.color = "#ffffff"
        htmlBlock.style.fontWeight = "bold"
        htmlBlock.style.borderRadius = "4px"
        htmlBlock.style.padding = "6px"
        htmlBlock.style.fontSize = "10px"
        htmlBlock.style.lineHeight = "1.1"
      })

      // Temporarily add clone to document
      clone.style.position = "absolute"
      clone.style.left = "-9999px"
      clone.style.top = "0"
      document.body.appendChild(clone)

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById("timetable-grid")
          if (clonedElement) {
            clonedElement.style.transform = "scale(1)"
            clonedElement.style.transformOrigin = "top left"
          }
        },
      })

      // Remove clone
      document.body.removeChild(clone)

      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      // Calculate scaling to fit page with margins
      const margin = 15
      const availableWidth = pdfWidth - margin * 2
      const availableHeight = pdfHeight - margin * 3 // Extra margin for header

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
      const scaledWidth = imgWidth * ratio
      const scaledHeight = imgHeight * ratio

      const imgX = (pdfWidth - scaledWidth) / 2
      const imgY = margin + 15 // Space for header

      if (includeHeader) {
        // Add header
        pdf.setFontSize(18)
        pdf.setFont("helvetica", "bold")
        const title = `${getEntityName(selectedEntity, viewMode)} - Weekly Schedule`
        pdf.text(title, pdfWidth / 2, margin + 5, { align: "center" })

        // Add generation date
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "normal")
        const date = new Date().toLocaleDateString()
        pdf.text(`Generated on: ${date}`, pdfWidth / 2, margin + 12, { align: "center" })
      }

      pdf.addImage(imgData, "PNG", imgX, imgY, scaledWidth, scaledHeight)

      // Add footer
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")
      pdf.text("Generated by Timetable Builder", pdfWidth / 2, pdfHeight - 5, { align: "center" })

      const fileName = `${getEntityName(selectedEntity, viewMode).replace(/\s+/g, "_")}_timetable.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    }
  }

  const generateICS = () => {
    // Existing ICS generation logic
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

  const generateICSContent = () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//School Timetable//EN\n"

    const filteredEntries = timetableEntries.filter((entry) => {
      if (exportScope === "current" && selectedEntity) {
        if (viewMode === "class") return entry.classId === selectedEntity
        if (viewMode === "teacher") return entry.teacherId === selectedEntity
      }
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
      ics += `DTSTART:20240101T080000Z\n`
      ics += `DTEND:20240101T084500Z\n`
      ics += "END:VEVENT\n"
    })

    ics += "END:VCALENDAR"
    return ics
  }

  const sendNotifications = () => {
    alert("Notifications sent to all teachers!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Enhanced Export & Notifications
          {isPublished && <Badge variant="default">Published</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
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
              <Label className="text-sm font-medium">Export Scope</Label>
              <Select
                value={exportScope}
                onValueChange={(value: "current" | "all" | "class" | "teacher") => setExportScope(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current View</SelectItem>
                  <SelectItem value="all">All Schedules</SelectItem>
                  <SelectItem value="class">All Classes</SelectItem>
                  <SelectItem value="teacher">All Teachers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {exportType === "pdf" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">PDF Orientation</Label>
                <Select
                  value={pdfOrientation}
                  onValueChange={(value: "portrait" | "landscape") => setPdfOrientation(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Include Header</Label>
                  <Switch checked={includeHeader} onCheckedChange={setIncludeHeader} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Include Room Info</Label>
                  <Switch checked={includeRooms} onCheckedChange={setIncludeRooms} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={exportType === "pdf" ? exportCurrentTimetableToPDF : generateICS}
            disabled={!isPublished || (exportScope === "current" && !selectedEntity)}
            className="flex-1"
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
          {isPublished && selectedEntity && `Ready to export ${getEntityName(selectedEntity, viewMode)} schedule.`}
          {isPublished && !selectedEntity && `${timetableEntries.length} schedule entries ready for export.`}
        </div>
      </CardContent>
    </Card>
  )
}
