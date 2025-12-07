"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Plus, Minus, Save, RotateCcw, Calendar, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import type { TimeSlot } from "@/types/timetable"

interface PeriodConfigurationProps {
  onConfigurationChange?: (config: PeriodConfig) => void
}

interface PeriodConfig {
  periodDuration: number
  periodsPerDay: Record<string, number>
  dayStartTimes: Record<string, string>
  timeSlots: TimeSlot[]
}

interface DayConfig {
  day: string
  periods: number
  startTime: string
  enabled: boolean
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DEFAULT_START_TIME = "08:00"
const DEFAULT_PERIODS = 8
const DEFAULT_DURATION = 45

export function PeriodConfiguration({ onConfigurationChange }: PeriodConfigurationProps) {
  const [periodDuration, setPeriodDuration] = useState(DEFAULT_DURATION)
  const [customBreaks, setCustomBreaks] = useState<Record<string, { afterPeriod: number; duration: number; type: 'break' | 'lunch' }[]>>({
    Monday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
    Tuesday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
    Wednesday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
    Thursday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
    Friday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
    Saturday: [],
    Sunday: [],
  })
  
  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>([
    { day: "Monday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
    { day: "Tuesday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
    { day: "Wednesday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
    { day: "Thursday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
    { day: "Friday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
    { day: "Saturday", periods: 0, startTime: DEFAULT_START_TIME, enabled: false },
    { day: "Sunday", periods: 0, startTime: DEFAULT_START_TIME, enabled: false },
  ])

  const [previewTimeSlots, setPreviewTimeSlots] = useState<TimeSlot[]>([])

  // Generate time slots based on configuration
  const generateTimeSlots = useCallback(() => {
    const slots: TimeSlot[] = []
    let slotId = 1

    dayConfigs.forEach((dayConfig) => {
      if (!dayConfig.enabled || dayConfig.periods === 0) return

      const [startHour, startMinute] = dayConfig.startTime.split(':').map(Number)
      let currentMinutes = startHour * 60 + startMinute
      const dayBreaks = customBreaks[dayConfig.day] || []

      for (let period = 1; period <= dayConfig.periods; period++) {
        const startTime = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`
        const endMinutes = currentMinutes + periodDuration
        const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

        slots.push({
          id: slotId.toString(),
          day: dayConfig.day,
          period,
          startTime,
          endTime,
        })

        currentMinutes = endMinutes

        // Add custom breaks after this period
        const breaksAfterThisPeriod = dayBreaks.filter(b => b.afterPeriod === period)
        breaksAfterThisPeriod.forEach(breakItem => {
          currentMinutes += breakItem.duration
        })

        slotId++
      }
    })

    return slots
  }, [dayConfigs, periodDuration, customBreaks])

  // Update preview when configuration changes
  const updatePreview = useCallback(() => {
    const newSlots = generateTimeSlots()
    setPreviewTimeSlots(newSlots)
  }, [generateTimeSlots])

  // Update day configuration
  const updateDayConfig = (day: string, field: keyof DayConfig, value: any) => {
    setDayConfigs(prev => prev.map(config => 
      config.day === day ? { ...config, [field]: value } : config
    ))
  }

  // Adjust period duration
  const adjustPeriodDuration = (increment: number) => {
    const newDuration = Math.max(15, Math.min(120, periodDuration + increment))
    setPeriodDuration(newDuration)
  }

  // Add break to a specific day
  const addBreak = (day: string, afterPeriod: number, duration: number, type: 'break' | 'lunch') => {
    setCustomBreaks(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { afterPeriod, duration, type }].sort((a, b) => a.afterPeriod - b.afterPeriod)
    }))
  }

  // Remove break from a specific day
  const removeBreak = (day: string, index: number) => {
    setCustomBreaks(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }))
  }

  // Update break duration
  const updateBreakDuration = (day: string, index: number, duration: number) => {
    setCustomBreaks(prev => ({
      ...prev,
      [day]: prev[day].map((breakItem, i) => 
        i === index ? { ...breakItem, duration } : breakItem
      )
    }))
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setPeriodDuration(DEFAULT_DURATION)
    setCustomBreaks({
      Monday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
      Tuesday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
      Wednesday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
      Thursday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
      Friday: [{ afterPeriod: 4, duration: 60, type: 'lunch' }],
      Saturday: [],
      Sunday: [],
    })
    setDayConfigs([
      { day: "Monday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
      { day: "Tuesday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
      { day: "Wednesday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
      { day: "Thursday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
      { day: "Friday", periods: DEFAULT_PERIODS, startTime: DEFAULT_START_TIME, enabled: true },
      { day: "Saturday", periods: 0, startTime: DEFAULT_START_TIME, enabled: false },
      { day: "Sunday", periods: 0, startTime: DEFAULT_START_TIME, enabled: false },
    ])
  }

  // Save configuration
  const saveConfiguration = () => {
    const config: PeriodConfig = {
      periodDuration,
      periodsPerDay: dayConfigs.reduce((acc, day) => {
        acc[day.day] = day.periods
        return acc
      }, {} as Record<string, number>),
      dayStartTimes: dayConfigs.reduce((acc, day) => {
        acc[day.day] = day.startTime
        return acc
      }, {} as Record<string, string>),
      timeSlots: generateTimeSlots(),
    }

    onConfigurationChange?.(config)
    alert("Period configuration saved successfully!")
  }

  // Calculate total school hours per day
  const getTotalHoursPerDay = (dayConfig: DayConfig) => {
    if (!dayConfig.enabled || dayConfig.periods === 0) return "0:00"
    
    const totalPeriodMinutes = dayConfig.periods * periodDuration
    const dayBreaks = customBreaks[dayConfig.day] || []
    const totalBreakMinutes = dayBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0)
    const totalMinutes = totalPeriodMinutes + totalBreakMinutes
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  // Get end time for a day
  const getEndTimeForDay = (dayConfig: DayConfig) => {
    if (!dayConfig.enabled || dayConfig.periods === 0) return "--:--"
    
    const [startHour, startMinute] = dayConfig.startTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    
    const totalPeriodMinutes = dayConfig.periods * periodDuration
    const dayBreaks = customBreaks[dayConfig.day] || []
    const totalBreakMinutes = dayBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0)
    const totalMinutes = startMinutes + totalPeriodMinutes + totalBreakMinutes
    
    const endHour = Math.floor(totalMinutes / 60)
    const endMinute = totalMinutes % 60
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Period Configuration
            <Badge variant="outline">
              {dayConfigs.filter(d => d.enabled).length} Active Days
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Period Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">Period Duration</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustPeriodDuration(-15)}
                  disabled={periodDuration <= 15}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 min-w-[100px] justify-center">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{periodDuration} min</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustPeriodDuration(15)}
                  disabled={periodDuration >= 120}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Quick Break Templates</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const day = "Monday" // This would be dynamic based on selected day
                    const dayConfig = dayConfigs.find(d => d.day === day)
                    if (dayConfig && dayConfig.periods >= 2) {
                      addBreak(day, 2, 15, 'break')
                    }
                  }}
                >
                  15min Break
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const day = "Monday" // This would be dynamic based on selected day
                    const dayConfig = dayConfigs.find(d => d.day === day)
                    if (dayConfig && dayConfig.periods >= 4) {
                      addBreak(day, 4, 60, 'lunch')
                    }
                  }}
                >
                  60min Lunch
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Schedule Configuration</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Periods</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dayConfigs.map((dayConfig) => (
                <TableRow key={dayConfig.day} className={!dayConfig.enabled ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{dayConfig.day}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={dayConfig.enabled}
                      onChange={(e) => updateDayConfig(dayConfig.day, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateDayConfig(dayConfig.day, 'periods', Math.max(0, dayConfig.periods - 1))}
                        disabled={!dayConfig.enabled || dayConfig.periods <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="min-w-[30px] text-center">{dayConfig.periods}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateDayConfig(dayConfig.day, 'periods', Math.min(12, dayConfig.periods + 1))}
                        disabled={!dayConfig.enabled || dayConfig.periods >= 12}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={dayConfig.startTime}
                      onChange={(e) => updateDayConfig(dayConfig.day, 'startTime', e.target.value)}
                      disabled={!dayConfig.enabled}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{getEndTimeForDay(dayConfig)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{getTotalHoursPerDay(dayConfig)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dayConfig.enabled ? "default" : "secondary"} className="text-xs">
                      {dayConfig.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Break Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Break Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dayConfigs.filter(d => d.enabled).map((dayConfig) => (
              <div key={dayConfig.day} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{dayConfig.day}</h4>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const afterPeriod = parseInt(value)
                        addBreak(dayConfig.day, afterPeriod, 15, 'break')
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Add Break" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: dayConfig.periods - 1 }, (_, i) => i + 1).map((period) => (
                          <SelectItem key={period} value={period.toString()}>
                            After Period {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(value) => {
                        const afterPeriod = parseInt(value)
                        addBreak(dayConfig.day, afterPeriod, 60, 'lunch')
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Add Lunch" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: dayConfig.periods - 1 }, (_, i) => i + 1).map((period) => (
                          <SelectItem key={period} value={period.toString()}>
                            After Period {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(customBreaks[dayConfig.day] || []).map((breakItem, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={breakItem.type === 'lunch' ? 'default' : 'secondary'}>
                          {breakItem.type === 'lunch' ? 'Lunch' : 'Break'}
                        </Badge>
                        <span className="text-sm">After Period {breakItem.afterPeriod}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBreakDuration(dayConfig.day, index, Math.max(5, breakItem.duration - 5))}
                          disabled={breakItem.duration <= 5}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="min-w-[60px] text-center text-sm font-medium">
                          {breakItem.duration} min
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBreakDuration(dayConfig.day, index, Math.min(breakItem.type === 'lunch' ? 180 : 60, breakItem.duration + 5))}
                          disabled={breakItem.duration >= (breakItem.type === 'lunch' ? 180 : 60)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBreak(dayConfig.day, index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {(customBreaks[dayConfig.day] || []).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No breaks configured for {dayConfig.day}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Schedule Preview</span>
            <Button onClick={updatePreview} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Update Preview
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewTimeSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayConfigs.filter(d => d.enabled).map((dayConfig) => (
                <div key={dayConfig.day} className="space-y-2">
                  <h4 className="font-medium">{dayConfig.day}</h4>
                  <div className="space-y-1 text-sm">
                    {previewTimeSlots
                      .filter(slot => slot.day === dayConfig.day)
                      .map((slot) => (
                        <div key={slot.id} className="flex justify-between p-2 bg-muted rounded">
                          <span>Period {slot.period}</span>
                          <span className="font-mono">{slot.startTime} - {slot.endTime}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Click "Update Preview" to see the generated schedule
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button onClick={resetToDefaults} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={saveConfiguration}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              Configuration: {dayConfigs.filter(d => d.enabled).length} active days, 
              {periodDuration}min periods, 
              {Object.values(customBreaks).flat().length} custom breaks configured
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
