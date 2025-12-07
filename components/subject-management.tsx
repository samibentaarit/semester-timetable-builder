"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Edit2, Trash2, Save, AlertTriangle, CheckCircle } from "lucide-react"
import { subjects as initialSubjects } from "@/lib/timetable-data"
import type { Subject } from "@/types/timetable"

interface SubjectManagementProps {
  onSubjectsChange?: (subjects: Subject[]) => void
}

interface ValidationError {
  field: string
  message: string
}

export function SubjectManagement({ onSubjectsChange }: SubjectManagementProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  // Form state for new subject
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    color: "#3b82f6",
  })

  // Form state for editing subject
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    color: "#3b82f6",
  })

  // Validate subject data
  const validateSubject = (name: string, code: string, excludeId?: string): ValidationError[] => {
    const errors: ValidationError[] = []

    // Check required fields
    if (!name.trim()) {
      errors.push({ field: "name", message: "Subject name is required" })
    }

    if (!code.trim()) {
      errors.push({ field: "code", message: "Subject code is required" })
    }

    // Check for duplicates
    const existingSubjects = subjects.filter((s) => s.id !== excludeId)

    if (name.trim() && existingSubjects.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) {
      errors.push({ field: "name", message: "A subject with this name already exists" })
    }

    if (code.trim() && existingSubjects.some((s) => s.code.toLowerCase() === code.trim().toLowerCase())) {
      errors.push({ field: "code", message: "A subject with this code already exists" })
    }

    // Validate code format (letters and numbers only, 2-6 characters)
    if (code.trim() && !/^[A-Za-z0-9]{2,6}$/.test(code.trim())) {
      errors.push({ field: "code", message: "Code must be 2-6 characters (letters and numbers only)" })
    }

    return errors
  }

  // Add new subject
  const addSubject = () => {
    const errors = validateSubject(newSubject.name, newSubject.code)
    setValidationErrors(errors)

    if (errors.length === 0) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.name.trim(),
        code: newSubject.code.trim().toUpperCase(),
        color: newSubject.color,
      }

      const updatedSubjects = [...subjects, subject]
      setSubjects(updatedSubjects)
      onSubjectsChange?.(updatedSubjects)

      // Reset form
      setNewSubject({ name: "", code: "", color: "#3b82f6" })
      setValidationErrors([])
    }
  }

  // Open edit dialog
  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject)
    setEditForm({
      name: subject.name,
      code: subject.code,
      color: subject.color,
    })
    setValidationErrors([])
    setIsEditDialogOpen(true)
  }

  // Save edited subject
  const saveEditedSubject = () => {
    if (!editingSubject) return

    const errors = validateSubject(editForm.name, editForm.code, editingSubject.id)
    setValidationErrors(errors)

    if (errors.length === 0) {
      const updatedSubjects = subjects.map((subject) =>
        subject.id === editingSubject.id
          ? {
              ...subject,
              name: editForm.name.trim(),
              code: editForm.code.trim().toUpperCase(),
              color: editForm.color,
            }
          : subject,
      )

      setSubjects(updatedSubjects)
      onSubjectsChange?.(updatedSubjects)
      setIsEditDialogOpen(false)
      setEditingSubject(null)
      setValidationErrors([])
    }
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (subject: Subject) => {
    setSubjectToDelete(subject)
    setIsDeleteDialogOpen(true)
  }

  // Delete subject
  const deleteSubject = () => {
    if (!subjectToDelete) return

    const updatedSubjects = subjects.filter((s) => s.id !== subjectToDelete.id)
    setSubjects(updatedSubjects)
    onSubjectsChange?.(updatedSubjects)
    setIsDeleteDialogOpen(false)
    setSubjectToDelete(null)
  }

  // Get validation error for field
  const getFieldError = (field: string) => {
    return validationErrors.find((error) => error.field === field)?.message
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addSubject()
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="tracking-tighter leading-7">
        <CardHeader className="pb-0 my-0 mx-0 border-0">
          <CardTitle className="flex gap-2 my-0 px-3.5 py-0 items-center flex-row">
            <BookOpen className="h-5 w-5" />
            Subject Management
            <Badge variant="outline">{subjects.length} Subjects</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">
                  • {error.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Subject Form */}
      <Card className="leading-7">
        <CardHeader className="leading-3 pb-0">
          <CardTitle className="text-lg">Add New Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                placeholder="e.g., Mathematics"
                value={newSubject.name}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, name: e.target.value }))}
                onKeyPress={handleKeyPress}
                className={getFieldError("name") ? "border-destructive" : ""}
              />
            </div>
            <div>
              <Label htmlFor="subject-code">Subject Code</Label>
              <Input
                id="subject-code"
                placeholder="e.g., MATH"
                value={newSubject.code}
                onChange={(e) => setNewSubject((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className={getFieldError("code") ? "border-destructive" : ""}
              />
            </div>
            <div>
              <Label htmlFor="subject-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="subject-color"
                  type="color"
                  value={newSubject.color}
                  onChange={(e) => setNewSubject((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-md border border-input"
                  style={{ backgroundColor: newSubject.color }}
                />
              </div>
            </div>
            <div>
              <Label>Preview</Label>
              <div className="h-10 flex items-center">
                <Badge variant="outline" style={{ borderColor: newSubject.color }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: newSubject.color }} />
                    {newSubject.name || "Subject Name"} ({newSubject.code || "CODE"})
                  </div>
                </Badge>
              </div>
            </div>
            <div>
              <Button onClick={addSubject} className="w-full" disabled={!newSubject.name || !newSubject.code}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Table */}
      <Card className="leading-7">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Existing Subjects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {subject.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md border" style={{ backgroundColor: subject.color }} />
                      <span className="text-sm font-mono">{subject.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: subject.color }}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                        {subject.name}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(subject)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(subject)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No subjects found. Add your first subject using the form above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className={getFieldError("name") ? "border-destructive" : ""}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input
                id="edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={6}
                className={getFieldError("code") ? "border-destructive" : ""}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="edit-color"
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input cursor-pointer"
                />
                <div className="w-10 h-10 rounded-md border border-input" style={{ backgroundColor: editForm.color }} />
              </div>
            </div>
            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <Badge variant="outline" style={{ borderColor: editForm.color }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editForm.color }} />
                    {editForm.name} ({editForm.code})
                  </div>
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedSubject} disabled={!editForm.name || !editForm.code}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to delete the subject "{subjectToDelete?.name}" ({subjectToDelete?.code})? This
                action cannot be undone and may affect existing timetables.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Subject to delete:</span>
              <Badge variant="outline" style={{ borderColor: subjectToDelete?.color }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subjectToDelete?.color }} />
                  {subjectToDelete?.name} ({subjectToDelete?.code})
                </div>
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSubject}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Message */}
      {subjects.length > 0 && validationErrors.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} configured successfully
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
