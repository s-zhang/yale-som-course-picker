"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Download, Calendar, List, Search } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Course {
  courseID: string
  courseNumber: string
  courseTitle: string
  courseDescription: string
  faculty1: string
  faculty2?: string
  daysTimes: string
  day: string
  startTime: string
  endTime: string
  room: string
  units: string
  courseCategory: string
  courseSession: string
  enrollmentLimit: string
  courseSessionStartDate: string
  courseSessionEndDate: string
  courseCategory2?: string
  courseCategory3?: string
  courseCategories: string[]
}

interface ScheduledCourse extends Course {
  color: string
}

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
]

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const DAY_MAP: { [key: string]: string } = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  R: "Thursday",
  F: "Friday",
}

const TIME_SLOTS = [
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
]

// Helper function to process course categories
const processCourseCategories = (course: any): Course => {
  const categories: string[] = []

  if (course.courseCategory) categories.push(course.courseCategory)
  if (course.courseCategory2) categories.push(course.courseCategory2)
  if (course.courseCategory3) categories.push(course.courseCategory3)

  return {
    ...course,
    courseCategories: categories,
  }
}

export default function CourseTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("list")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = React.useMemo(() => {
    const categorySet = new Set<string>()
    courses.forEach((course) => {
      course.courseCategories.forEach((category) => {
        if (category) categorySet.add(category)
      })
    })
    return Array.from(categorySet).sort()
  }, [courses])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
      const data = await response.json()
      const processedCourses = (data.courses || []).map(processCourseCategories)
      setCourses(processedCourses)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addToSchedule = (course: Course) => {
    if (scheduledCourses.find((c) => c.courseID === course.courseID)) {
      toast({
        title: "Course already added",
        description: "This course is already in your schedule.",
        variant: "destructive",
      })
      return
    }

    const color = COLORS[scheduledCourses.length % COLORS.length]
    const scheduledCourse: ScheduledCourse = { ...course, color }
    setScheduledCourses([...scheduledCourses, scheduledCourse])

    toast({
      title: "Course added",
      description: `${course.courseNumber} has been added to your schedule.`,
    })
  }

  const removeFromSchedule = (courseID: string) => {
    setScheduledCourses(scheduledCourses.filter((c) => c.courseID !== courseID))
    toast({
      title: "Course removed",
      description: "Course has been removed from your schedule.",
    })
  }

  const exportToICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Yale SOM//Course Schedule//EN\n"

    scheduledCourses.forEach((course) => {
      if (course.day && course.startTime && course.endTime) {
        const startDate = new Date(course.courseSessionStartDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"))
        const endDate = new Date(course.courseSessionEndDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"))

        icsContent += "BEGIN:VEVENT\n"
        icsContent += `SUMMARY:${course.courseNumber} - ${course.courseTitle}\n`
        icsContent += `DESCRIPTION:${course.courseDescription.replace(/\n/g, "\\n")}\n`
        icsContent += `LOCATION:${course.room}\n`
        icsContent += `DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`
        icsContent += `DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`
        icsContent += `UID:${course.courseID}@som.yale.edu\n`
        icsContent += "END:VEVENT\n"
      }
    })

    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: "text/calendar" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "yale-som-schedule.ics"
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Schedule exported",
      description: "Your schedule has been exported as an ICS file.",
    })
  }

  const filteredCourses = courses.filter(
    (course) =>
      (course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.faculty1.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedCategory === "all" || course.courseCategories.includes(selectedCategory)),
  )

  const getTimePosition = (time: string) => {
    const [timeStr, period] = time.split(" ")
    const [hours, minutes] = timeStr.split(":").map(Number)
    let hour24 = hours
    if (period === "PM" && hours !== 12) hour24 += 12
    if (period === "AM" && hours === 12) hour24 = 0

    const totalMinutes = hour24 * 60 + minutes
    const startMinutes = 8 * 60 // 8:00 AM
    return ((totalMinutes - startMinutes) / 30) * 40 // 40px per 30min slot
  }

  const getCourseDuration = (startTime: string, endTime: string) => {
    const start = getTimePosition(startTime)
    const end = getTimePosition(endTime)
    return end - start
  }

  const renderCourseCard = (course: Course | ScheduledCourse, isScheduled = false) => (
    <Card key={course.courseID} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {isScheduled && <div className={`w-4 h-4 rounded mt-1 ${(course as ScheduledCourse).color}`}></div>}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2 flex-wrap">
                <h3 className="font-semibold text-lg">{course.courseNumber}</h3>
                {course.courseCategories.map((category, index) => (
                  <Badge key={index} variant="outline">
                    {category}
                  </Badge>
                ))}
                <Badge variant="secondary">{course.units} units</Badge>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{course.courseTitle}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.courseDescription}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{course.faculty1}</span>
                {course.faculty2 && <span>• {course.faculty2}</span>}
                <span>• {course.daysTimes}</span>
                <span>• {course.room}</span>
                {!isScheduled && <span>• Limit: {course.enrollmentLimit}</span>}
              </div>
            </div>
          </div>
          {isScheduled ? (
            <Button onClick={() => removeFromSchedule(course.courseID)} variant="outline" size="sm" className="ml-4">
              Remove
            </Button>
          ) : (
            <Button
              onClick={() => addToSchedule(course)}
              size="sm"
              className="ml-4"
              disabled={scheduledCourses.some((c) => c.courseID === course.courseID)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">
              Course<span className="text-gray-900">Table</span>
            </h1>
            <Badge variant="secondary">Yale SOM Spring 2026</Badge>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Selected Courses Section - Top */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">My Schedule</h2>
              <Badge variant="secondary">{scheduledCourses.length} courses selected</Badge>
              <Badge variant="outline">
                {scheduledCourses.reduce((sum, course) => sum + Number.parseFloat(course.units), 0)} total units
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={exportToICS} variant="outline" size="sm" disabled={scheduledCourses.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export ICS
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="list" className="flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-4">
              {scheduledCourses.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <p>No courses selected yet. Add courses from the list below.</p>
                </Card>
              ) : (
                <div className="space-y-2">{scheduledCourses.map((course) => renderCourseCard(course, true))}</div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              {scheduledCourses.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <p>No courses selected yet. Add courses from the list below to see your schedule.</p>
                </Card>
              ) : (
                <div className="bg-white rounded-lg border">
                  <div className="grid grid-cols-6 border-b">
                    <div className="p-4 border-r bg-gray-50"></div>
                    {DAYS.map((day) => (
                      <div key={day} className="p-4 text-center font-medium border-r last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-6 relative" style={{ minHeight: "400px" }}>
                    <div className="border-r bg-gray-50">
                      {TIME_SLOTS.slice(0, 16).map((time) => (
                        <div key={time} className="h-10 border-b text-xs text-gray-500 px-2 py-1">
                          {time}
                        </div>
                      ))}
                    </div>

                    {DAYS.map((day) => (
                      <div key={day} className="border-r last:border-r-0 relative">
                        {TIME_SLOTS.slice(0, 16).map((time) => (
                          <div key={time} className="h-10 border-b border-gray-100"></div>
                        ))}

                        {scheduledCourses
                          .filter((course) => course.day && DAY_MAP[course.day] === day)
                          .map((course) => (
                            <div
                              key={course.courseID}
                              className={`absolute left-1 right-1 ${course.color} text-white text-xs p-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                              style={{
                                top: `${getTimePosition(course.startTime)}px`,
                                height: `${getCourseDuration(course.startTime, course.endTime)}px`,
                              }}
                              onClick={() => removeFromSchedule(course.courseID)}
                              title="Click to remove from schedule"
                            >
                              <div className="font-medium">{course.courseNumber}</div>
                              <div className="truncate">{course.courseTitle}</div>
                              <div className="text-xs opacity-90">{course.room}</div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Available Courses Section - Bottom */}
        <div className="border-t pt-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses, professors, or course codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading courses...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCourses.map((course) => renderCourseCard(course, false))}
              {filteredCourses.length === 0 && !loading && (
                <Card className="p-8 text-center text-gray-500">
                  <p>No courses found matching your search.</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
