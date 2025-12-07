"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Save,
  AlertTriangle,
  Search,
  MapPin,
  Users,
  Home,
  Beaker,
  Monitor,
  Volume2,
  Palette,
  Dumbbell,
  BookOpen,
} from "lucide-react"
import { defaultRoomTypes, defaultClassrooms } from "@/lib/classroom-data"
import type { RoomType, Classroom, ClassroomConflict } from "@/types/classroom"
import { SubjectRoomAssignment } from "@/components/subject-room-assignment"

interface ClassroomManagementProps {
  onRoomTypesChange?: (roomTypes: RoomType[]) => void
  onClassroomsChange?: (classrooms: Classroom[]) => void
}

const ROOM_TYPE_ICONS = {
  "Standard Classroom": Home,
  "Science Laboratory": Beaker,
  "Computer Lab": Monitor,
  Amphitheatre: Volume2,
  "Art Studio": Palette,
  "Music Room": Volume2,
  Gymnasium: Dumbbell,
}

const COMMON_FEATURES = [
  "Whiteboard",
  "Projector",
  "Air Conditioning",
  "Natural Light",
  "Soundproofing",
  "Lab Benches",
  "Fume Hood",
  "Safety Equipment",
  "Gas Supply",
  "Water Supply",
  "Computers",
  "Network Access",
  "Audio System",
  "Microphones",
  "Stage",
  "Tiered Seating",
  "Storage",
  "Piano",
  "Art Supplies Storage",
  "Sports Equipment",
]

const COMMON_EQUIPMENT = [
  "Chairs",
  "Desks",
  "Teacher's Desk",
  "Whiteboard",
  "Projector Screen",
  "Lab Equipment",
  "Safety Gear",
  "Microscopes",
  "Computers",
  "Server",
  "Printer",
  "Sound System",
  "Lighting",
  "Podium",
  "Piano",
  "Easels",
]

export function ClassroomManagement({ onRoomTypesChange, onClassroomsChange }: ClassroomManagementProps) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(defaultRoomTypes)
  const [classrooms, setClassrooms] = useState<Classroom[]>(defaultClassrooms)
  const [conflicts, setConflicts] = useState<ClassroomConflict[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Room Type Dialog State
  const [isRoomTypeDialogOpen, setIsRoomTypeDialogOpen] = useState(false)
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null)
  const [roomTypeForm, setRoomTypeForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    defaultCapacity: 30,
    features: [] as string[],
  })

  // Classroom Dialog State
  const [isClassroomDialogOpen, setIsClassroomDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [classroomForm, setClassroomForm] = useState({
    name: "",
    code: "",
    roomTypeId: "",
    capacity: 30,
    floor: "",
    building: "",
    features: [] as string[],
    equipment: [] as string[],
    notes: "",
  })

  // Validate classrooms
  const validateClassrooms = useCallback(
    (currentClassrooms: Classroom[]): ClassroomConflict[] => {
      const newConflicts: ClassroomConflict[] = []

      // Check for duplicate names
      const nameMap = new Map<string, string[]>()
      currentClassrooms.forEach((classroom) => {
        const name = classroom.name.toLowerCase()
        if (!nameMap.has(name)) nameMap.set(name, [])
        nameMap.get(name)!.push(classroom.id)
      })

      nameMap.forEach((ids, name) => {
        if (ids.length > 1) {
          newConflicts.push({
            type: "duplicate_name",
            message: `Duplicate classroom name: "${name}"`,
            severity: "error",
            affectedRooms: ids,
            suggestions: ["Rename one of the classrooms", "Add building or floor prefix"],
          })
        }
      })

      // Check for duplicate codes
      const codeMap = new Map<string, string[]>()
      currentClassrooms.forEach((classroom) => {
        if (classroom.code) {
          const code = classroom.code.toLowerCase()
          if (!codeMap.has(code)) codeMap.set(code, [])
          codeMap.get(code)!.push(classroom.id)
        }
      })

      codeMap.forEach((ids, code) => {
        if (ids.length > 1) {
          newConflicts.push({
            type: "duplicate_code",
            message: `Duplicate classroom code: "${code}"`,
            severity: "error",
            affectedRooms: ids,
            suggestions: ["Use unique codes for each classroom", "Follow a consistent naming convention"],
          })
        }
      })

      // Check for missing room types
      currentClassrooms.forEach((classroom) => {
        const roomType = roomTypes.find((rt) => rt.id === classroom.roomTypeId)
        if (!roomType) {
          newConflicts.push({
            type: "missing_room_type",
            message: `Classroom "${classroom.name}" has invalid room type`,
            severity: "error",
            affectedRooms: [classroom.id],
            suggestions: ["Assign a valid room type", "Create the missing room type"],
          })
        }
      })

      return newConflicts
    },
    [roomTypes],
  )

  // Update conflicts when data changes
  useMemo(() => {
    const newConflicts = validateClassrooms(classrooms)
    setConflicts(newConflicts)
  }, [classrooms, validateClassrooms])

  // Filter classrooms based on search
  const filteredClassrooms = classrooms.filter((classroom) => {
    const searchLower = searchTerm.toLowerCase()
    const roomType = roomTypes.find((rt) => rt.id === classroom.roomTypeId)
    return (
      classroom.name.toLowerCase().includes(searchLower) ||
      classroom.code.toLowerCase().includes(searchLower) ||
      classroom.building.toLowerCase().includes(searchLower) ||
      classroom.floor.toLowerCase().includes(searchLower) ||
      roomType?.name.toLowerCase().includes(searchLower)
    )
  })

  // Room Type Management
  const openRoomTypeDialog = (roomType?: RoomType) => {
    if (roomType) {
      setEditingRoomType(roomType)
      setRoomTypeForm({
        name: roomType.name,
        description: roomType.description,
        color: roomType.color,
        defaultCapacity: roomType.defaultCapacity,
        features: [...roomType.features],
      })
    } else {
      setEditingRoomType(null)
      setRoomTypeForm({
        name: "",
        description: "",
        color: "#3b82f6",
        defaultCapacity: 30,
        features: [],
      })
    }
    setIsRoomTypeDialogOpen(true)
  }

  const saveRoomType = () => {
    if (!roomTypeForm.name) return

    const updatedRoomTypes = editingRoomType
      ? roomTypes.map((rt) =>
          rt.id === editingRoomType.id
            ? {
                ...rt,
                name: roomTypeForm.name,
                description: roomTypeForm.description,
                color: roomTypeForm.color,
                defaultCapacity: roomTypeForm.defaultCapacity,
                features: roomTypeForm.features,
                updatedAt: new Date().toISOString(),
              }
            : rt,
        )
      : [
          ...roomTypes,
          {
            id: Date.now().toString(),
            name: roomTypeForm.name,
            description: roomTypeForm.description,
            color: roomTypeForm.color,
            defaultCapacity: roomTypeForm.defaultCapacity,
            features: roomTypeForm.features,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

    setRoomTypes(updatedRoomTypes)
    onRoomTypesChange?.(updatedRoomTypes)
    setIsRoomTypeDialogOpen(false)
  }

  const deleteRoomType = (roomTypeId: string) => {
    // Check if any classrooms use this room type
    const classroomsUsingType = classrooms.filter((c) => c.roomTypeId === roomTypeId)
    if (classroomsUsingType.length > 0) {
      alert(`Cannot delete room type. ${classroomsUsingType.length} classroom(s) are using this type.`)
      return
    }

    const updatedRoomTypes = roomTypes.filter((rt) => rt.id !== roomTypeId)
    setRoomTypes(updatedRoomTypes)
    onRoomTypesChange?.(updatedRoomTypes)
  }

  // Classroom Management
  const openClassroomDialog = (classroom?: Classroom) => {
    if (classroom) {
      setEditingClassroom(classroom)
      setClassroomForm({
        name: classroom.name,
        code: classroom.code,
        roomTypeId: classroom.roomTypeId,
        capacity: classroom.capacity,
        floor: classroom.floor,
        building: classroom.building,
        features: [...classroom.features],
        equipment: [...classroom.equipment],
        notes: classroom.notes,
      })
    } else {
      setEditingClassroom(null)
      setClassroomForm({
        name: "",
        code: "",
        roomTypeId: "",
        capacity: 30,
        floor: "",
        building: "",
        features: [],
        equipment: [],
        notes: "",
      })
    }
    setIsClassroomDialogOpen(true)
  }

  const saveClassroom = () => {
    if (!classroomForm.name || !classroomForm.roomTypeId) return

    const updatedClassrooms = editingClassroom
      ? classrooms.map((c) =>
          c.id === editingClassroom.id
            ? {
                ...c,
                name: classroomForm.name,
                code: classroomForm.code,
                roomTypeId: classroomForm.roomTypeId,
                capacity: classroomForm.capacity,
                floor: classroomForm.floor,
                building: classroomForm.building,
                features: classroomForm.features,
                equipment: classroomForm.equipment,
                notes: classroomForm.notes,
                updatedAt: new Date().toISOString(),
              }
            : c,
        )
      : [
          ...classrooms,
          {
            id: Date.now().toString(),
            name: classroomForm.name,
            code: classroomForm.code,
            roomTypeId: classroomForm.roomTypeId,
            capacity: classroomForm.capacity,
            floor: classroomForm.floor,
            building: classroomForm.building,
            features: classroomForm.features,
            equipment: classroomForm.equipment,
            isActive: true,
            notes: classroomForm.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]

    setClassrooms(updatedClassrooms)
    onClassroomsChange?.(updatedClassrooms)
    setIsClassroomDialogOpen(false)
  }

  const deleteClassroom = (classroomId: string) => {
    const updatedClassrooms = classrooms.filter((c) => c.id !== classroomId)
    setClassrooms(updatedClassrooms)
    onClassroomsChange?.(updatedClassrooms)
  }

  const toggleClassroomStatus = (classroomId: string) => {
    const updatedClassrooms = classrooms.map((c) => (c.id === classroomId ? { ...c, isActive: !c.isActive } : c))
    setClassrooms(updatedClassrooms)
    onClassroomsChange?.(updatedClassrooms)
  }

  // Toggle feature/equipment selection
  const toggleFeature = (feature: string, isRoomType = false) => {
    if (isRoomType) {
      setRoomTypeForm((prev) => ({
        ...prev,
        features: prev.features.includes(feature)
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      }))
    } else {
      setClassroomForm((prev) => ({
        ...prev,
        features: prev.features.includes(feature)
          ? prev.features.filter((f) => f !== feature)
          : [...prev.features, feature],
      }))
    }
  }

  const toggleEquipment = (equipment: string) => {
    setClassroomForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter((e) => e !== equipment)
        : [...prev.equipment, equipment],
    }))
  }

  const getRoomTypeIcon = (roomTypeName: string) => {
    const IconComponent = ROOM_TYPE_ICONS[roomTypeName as keyof typeof ROOM_TYPE_ICONS] || Building
    return IconComponent
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Classroom Management
            <Badge variant="outline">{roomTypes.length} Room Types</Badge>
            <Badge variant="outline">{classrooms.length} Classrooms</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Alert variant={conflicts.some((c) => c.severity === "error") ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                {conflicts.filter((c) => c.severity === "error").length} errors,{" "}
                {conflicts.filter((c) => c.severity === "warning").length} warnings detected
              </div>
              {conflicts.slice(0, 3).map((conflict, index) => (
                <div key={index} className="text-sm">
                  • {conflict.message}
                </div>
              ))}
              {conflicts.length > 3 && (
                <div className="text-sm text-muted-foreground">+{conflicts.length - 3} more issues...</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="classrooms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
          <TabsTrigger value="room-types">Room Types</TabsTrigger>
          <TabsTrigger value="subject-room-types" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject Room Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classrooms" className="space-y-4">
          {/* Search and Add */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classrooms by name, code, building, or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button onClick={() => openClassroomDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Classroom
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Classrooms Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClassrooms.map((classroom) => {
                    const roomType = roomTypes.find((rt) => rt.id === classroom.roomTypeId)
                    const IconComponent = getRoomTypeIcon(roomType?.name || "")
                    const hasConflicts = conflicts.some((c) => c.affectedRooms.includes(classroom.id))

                    return (
                      <TableRow key={classroom.id} className={hasConflicts ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{classroom.name}</div>
                              <div className="text-sm text-muted-foreground">{classroom.code}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {roomType && (
                            <Badge variant="outline" style={{ borderColor: roomType.color }}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roomType.color }} />
                                {roomType.name}
                              </div>
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div>{classroom.building}</div>
                              <div className="text-muted-foreground">{classroom.floor}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{classroom.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {classroom.features.slice(0, 2).map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {classroom.features.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{classroom.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={classroom.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleClassroomStatus(classroom.id)}
                          >
                            {classroom.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openClassroomDialog(classroom)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteClassroom(classroom.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="room-types" className="space-y-4">
          {/* Add Room Type */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <Button onClick={() => openRoomTypeDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room Type
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Room Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomTypes.map((roomType) => {
              const IconComponent = getRoomTypeIcon(roomType.name)
              const classroomCount = classrooms.filter((c) => c.roomTypeId === roomType.id).length

              return (
                <Card key={roomType.id}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${roomType.color}20` }}>
                          <IconComponent className="h-5 w-5" style={{ color: roomType.color }} />
                        </div>
                        <div>
                          <div className="font-medium">{roomType.name}</div>
                          <div className="text-sm text-muted-foreground">{classroomCount} rooms</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openRoomTypeDialog(roomType)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRoomType(roomType.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={classroomCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{roomType.description}</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Default capacity: {roomType.defaultCapacity}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Features:</div>
                      <div className="flex flex-wrap gap-1">
                        {roomType.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="subject-room-types" className="space-y-4">
          <SubjectRoomAssignment />
        </TabsContent>
      </Tabs>

      {/* Room Type Dialog */}
      <Dialog open={isRoomTypeDialogOpen} onOpenChange={setIsRoomTypeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRoomType ? "Edit Room Type" : "Add New Room Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomtype-name">Name</Label>
                <Input
                  id="roomtype-name"
                  value={roomTypeForm.name}
                  onChange={(e) => setRoomTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Science Laboratory"
                />
              </div>
              <div>
                <Label htmlFor="roomtype-capacity">Default Capacity</Label>
                <Input
                  id="roomtype-capacity"
                  type="number"
                  min="1"
                  max="500"
                  value={roomTypeForm.defaultCapacity}
                  onChange={(e) => setRoomTypeForm((prev) => ({ ...prev, defaultCapacity: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="roomtype-description">Description</Label>
              <Textarea
                id="roomtype-description"
                value={roomTypeForm.description}
                onChange={(e) => setRoomTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this room type..."
              />
            </div>

            <div>
              <Label htmlFor="roomtype-color">Color</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="roomtype-color"
                  type="color"
                  value={roomTypeForm.color}
                  onChange={(e) => setRoomTypeForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10 rounded-md border border-input cursor-pointer"
                />
                <div
                  className="w-10 h-10 rounded-md border border-input"
                  style={{ backgroundColor: roomTypeForm.color }}
                />
                <span className="text-sm font-mono">{roomTypeForm.color}</span>
              </div>
            </div>

            <div>
              <Label>Features</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {COMMON_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`roomtype-feature-${feature}`}
                      checked={roomTypeForm.features.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature, true)}
                    />
                    <label htmlFor={`roomtype-feature-${feature}`} className="text-sm">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoomTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRoomType} disabled={!roomTypeForm.name}>
              <Save className="h-4 w-4 mr-2" />
              {editingRoomType ? "Update" : "Create"} Room Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classroom Dialog */}
      <Dialog open={isClassroomDialogOpen} onOpenChange={setIsClassroomDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingClassroom ? "Edit Classroom" : "Add New Classroom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="classroom-name">Name</Label>
                <Input
                  id="classroom-name"
                  value={classroomForm.name}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Room 101"
                />
              </div>
              <div>
                <Label htmlFor="classroom-code">Code</Label>
                <Input
                  id="classroom-code"
                  value={classroomForm.code}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., R101"
                />
              </div>
              <div>
                <Label htmlFor="classroom-capacity">Capacity</Label>
                <Input
                  id="classroom-capacity"
                  type="number"
                  min="1"
                  max="500"
                  value={classroomForm.capacity}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="classroom-roomtype">Room Type</Label>
                <Select
                  value={classroomForm.roomTypeId}
                  onValueChange={(value) => setClassroomForm((prev) => ({ ...prev, roomTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((roomType) => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roomType.color }} />
                          {roomType.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="classroom-building">Building</Label>
                <Input
                  id="classroom-building"
                  value={classroomForm.building}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, building: e.target.value }))}
                  placeholder="e.g., Main Building"
                />
              </div>
              <div>
                <Label htmlFor="classroom-floor">Floor</Label>
                <Input
                  id="classroom-floor"
                  value={classroomForm.floor}
                  onChange={(e) => setClassroomForm((prev) => ({ ...prev, floor: e.target.value }))}
                  placeholder="e.g., 1st Floor"
                />
              </div>
            </div>

            <div>
              <Label>Features</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                {COMMON_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={`classroom-feature-${feature}`}
                      checked={classroomForm.features.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <label htmlFor={`classroom-feature-${feature}`} className="text-sm">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Equipment</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                {COMMON_EQUIPMENT.map((equipment) => (
                  <div key={equipment} className="flex items-center space-x-2">
                    <Checkbox
                      id={`classroom-equipment-${equipment}`}
                      checked={classroomForm.equipment.includes(equipment)}
                      onCheckedChange={() => toggleEquipment(equipment)}
                    />
                    <label htmlFor={`classroom-equipment-${equipment}`} className="text-sm">
                      {equipment}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="classroom-notes">Notes</Label>
              <Textarea
                id="classroom-notes"
                value={classroomForm.notes}
                onChange={(e) => setClassroomForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this classroom..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassroomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveClassroom} disabled={!classroomForm.name || !classroomForm.roomTypeId}>
              <Save className="h-4 w-4 mr-2" />
              {editingClassroom ? "Update" : "Create"} Classroom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
