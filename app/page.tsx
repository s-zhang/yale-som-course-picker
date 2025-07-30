"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Download, Calendar, TableIcon, Search, ChevronDown, X, Minus } from "lucide-react"
import Spinner from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Instructor {
  name: string
  email: string
}

interface ProgramCohort {
  program: string
  cohort: string
  color: string
  name: string
}

interface Course {
  courseID: string
  courseNumber: string
  courseTitle: string
  courseDescription: string
  faculty1: string
  faculty2?: string
  faculty1Email: string
  faculty2Email?: string
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
  courseType: string
  cohort: string
  termCode: string
  courseCategories: string[]
  instructors: Instructor[]
  meetingDays: string[]
  programCohorts: ProgramCohort[]
  syllabusUrl?: string
  oldSyllabusUrl?: string
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
  Th: "Thursday",
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
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
]

// Helper function to parse meeting days from daysTimes field
const parseMeetingDays = (daysTimes: string): string[] => {
  if (!daysTimes) return []

  // Extract the days part (everything before the time)
  const timePattern = /\d{1,2}:\d{2}\s*(AM|PM)/i
  const timeMatch = daysTimes.match(timePattern)

  if (!timeMatch) return []

  const daysString = daysTimes.substring(0, timeMatch.index).trim()
  const meetingDays: string[] = []

  // Parse individual days, handling "Th" as a special case
  let i = 0
  while (i < daysString.length) {
    const char = daysString[i]

    if (char === "T" && i + 1 < daysString.length && daysString[i + 1] === "h") {
      // Handle "Th" for Thursday
      meetingDays.push("Thursday")
      i += 2
    } else if (DAY_MAP[char]) {
      // Handle single character days
      meetingDays.push(DAY_MAP[char])
      i += 1
    } else {
      // Skip spaces and other characters
      i += 1
    }
  }

  return meetingDays
}

// Helper function to process program cohorts from courseType
const processProgramCohorts = (courseType: string, cohort: string): ProgramCohort[] => {
  if (!courseType) return []

  const components = courseType.split("|").map((c) => c.trim().toLowerCase())
  const programCohorts: ProgramCohort[] = []

  components.forEach((component) => {
    if (component === "elective") {
      // Create elective program cohort
      programCohorts.push({
        program: "",
        cohort: "",
        color: "white",
        name: "Elective",
      })
    } else if (component === "core") {
      // Core: program = "MBA", color = lowercase cohort, name = pascal case cohort
      // Skip if cohort is null or undefined
      if (!cohort) {
        return
      }
      programCohorts.push({
        program: "MBA",
        cohort: cohort.toLowerCase(),
        color: cohort.toLowerCase(),
        name: cohort.charAt(0).toUpperCase() + cohort.slice(1).toLowerCase(),
      })
    } else if (component === "mam") {
      // MAM: program = "MAM", color = "orange", name = "Orange (MAM)"
      programCohorts.push({
        program: "MAM",
        cohort: "",
        color: "orange",
        name: "Orange (MAM)",
      })
    } else if (component.startsWith("mms")) {
      // MMS: program = uppercase(component with "mms " prefix removed), color = "purple", name = "Purple (programName)"
      const programName = component.replace(/^mms\s*/, "").toUpperCase()
      programCohorts.push({
        program: programName,
        cohort: "",
        color: "purple",
        name: `Purple (${programName})`,
      })
    } else {
      // Other components: normalize phd/emba, program = component, color = "white", name = component
      let normalizedComponent = component
      if (component === "phd") normalizedComponent = "PhD"
      if (component === "emba") normalizedComponent = "EMBA"

      programCohorts.push({
        program: normalizedComponent,
        cohort: "",
        color: "white",
        name: normalizedComponent,
      })
    }
  })

  return programCohorts
}

// Helper function to process course categories and instructors
const processCourseData = (course: any): Course => {
  const categories: string[] = []
  const instructors: Instructor[] = []

  // Process categories
  if (course.courseCategory) categories.push(course.courseCategory)
  if (course.courseCategory2) categories.push(course.courseCategory2)
  if (course.courseCategory3) categories.push(course.courseCategory3)

  // Process instructors
  if (course.faculty1 && course.faculty1Email) {
    instructors.push({
      name: course.faculty1,
      email: course.faculty1Email,
    })
  }
  if (course.faculty2 && course.faculty2Email) {
    instructors.push({
      name: course.faculty2,
      email: course.faculty2Email,
    })
  }

  // Parse meeting days from daysTimes
  const meetingDays = parseMeetingDays(course.daysTimes)

  // Process program cohorts
  const programCohorts = processProgramCohorts(course.courseType || "", course.cohort || "")

  return {
    ...course,
    termCode: course.termCode || "unknown",
    courseSession: course.courseSession?.trim() || course.courseSession,
    courseCategories: categories,
    instructors: instructors,
    meetingDays: meetingDays,
    programCohorts: programCohorts,
    syllabusUrl: course.syllabus, // Assuming API provides 'syllabus'
    oldSyllabusUrl: course.oldSyllabus, // Assuming API provides 'oldSyllabus'
  }
}

// Multi-select filter component
const MultiSelectFilter = ({
  options,
  selected,
  onSelectionChange,
  placeholder,
  label,
}: {
  options: string[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder: string
  label: string
}) => {
  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((item) => item !== option))
    } else {
      onSelectionChange([...selected, option])
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-48 justify-between text-left font-normal bg-transparent">
          <span className="truncate">
            {selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{label}</span>
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50">
              <Checkbox id={option} checked={selected.includes(option)} onCheckedChange={() => handleToggle(option)} />
              <label htmlFor={option} className="text-sm cursor-pointer flex-1 truncate">
                {option}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Searchable instructor filter component
const InstructorSearchFilter = ({
  options,
  selected,
  onSelectionChange,
  placeholder,
  label,
}: {
  options: string[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  placeholder: string
  label: string
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = options.filter((option) => option.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((item) => item !== option))
    } else {
      onSelectionChange([...selected, option])
    }
  }

  const clearAll = () => {
    onSelectionChange([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-48 justify-between text-left font-normal bg-transparent">
          <span className="truncate">
            {selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">{label}</span>
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 px-2 text-xs">
                Clear
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No instructors found</div>
          ) : (
            filteredOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50">
                <Checkbox
                  id={option}
                  checked={selected.includes(option)}
                  onCheckedChange={() => handleToggle(option)}
                />
                <label htmlFor={option} className="text-sm cursor-pointer flex-1 truncate">
                  {option}
                </label>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Helper function to get background color class for program cohort
const getProgramCohortBadgeClass = (color: string): string => {
  if (color.toLowerCase() === "white") {
    return "bg-white text-gray-800 border border-gray-300 hover:bg-white hover:text-gray-800"
  }

  const colorMap: { [key: string]: string } = {
    blue: "bg-blue-500 hover:bg-blue-500 text-white border-0",
    green: "bg-green-500 hover:bg-green-500 text-white border-0",
    red: "bg-red-500 hover:bg-red-500 text-white border-0",
    gold: "bg-yellow-500 hover:bg-yellow-500 text-white border-0",
    silver: "bg-gray-400 hover:bg-gray-400 text-white border-0",
    orange: "bg-orange-500 hover:bg-orange-500 text-white border-0",
    purple: "bg-purple-500 hover:bg-purple-500 text-white border-0",
  }
  return colorMap[color.toLowerCase()] || "bg-gray-500 hover:bg-gray-500 text-white border-0"
}

// Add this function before the CourseTable component
const getCurrentAndNextSemesters = (): string[] => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const month = now.getMonth() + 1 // getMonth() returns 0-11
  const day = now.getDate()

  let currentSemesterCode: string
  let semesters: string[] = []

  // Determine current semester based on date
  if ((month === 5 && day >= 16) || (month > 5 && month < 12) || (month === 12 && day <= 15)) {
    // May 16 - Dec 15: Current is Fall semester
    currentSemesterCode = `${currentYear}03`
    semesters = [
      currentSemesterCode,
      `${currentYear + 1}01`, // Next spring
      `${currentYear + 1}03`, // Next fall
    ]
  } else {
    // Dec 16 - May 15: Current is Spring semester
    currentSemesterCode = `${currentYear}01`
    semesters = [
      currentSemesterCode,
      `${currentYear}03`, // Next fall
      `${currentYear + 1}01`, // Next spring
    ]
  }

  return semesters
}

// Component to handle expandable text using the user-provided pattern
const ExpandableDescription = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Only apply the expandable logic if the text is long enough
  const isLongEnough = text && text.length > 200

  if (!isLongEnough) {
    return <p className="text-sm text-gray-600 mb-3">{text || ""}</p>
  }

  return (
    <div className="relative mb-3">
      <p
        className={`text-sm text-gray-600 leading-tight ${!isExpanded ? 'line-clamp-2 after:inline-block after:w-[5ch] after:content-[""]' : ""}`}
      >
        {text}
      </p>
      {!isExpanded ? (
        <a
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(true)
          }}
          href="#"
          className="absolute right-0 bottom-[0.135em] bg-card text-gray-600 text-sm leading-none underline pl-1 cursor-pointer"
          aria-expanded="false"
          aria-label="Show full description"
        >
          (more)
        </a>
      ) : (
        <a
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(false)
          }}
          href="#"
          className="text-gray-600 text-sm underline mt-1 cursor-pointer"
          aria-expanded="true"
          aria-label="Show less description"
        >
          (less)
        </a>
      )}
    </div>
  )
}

const ExpandableTableCell = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLongEnough = text && text.length > 100

  if (!isLongEnough) {
    return <p className="text-sm text-gray-600">{text || ""}</p>
  }

  return (
    <div className="w-64">
      <p className={`text-sm text-gray-600 ${!isExpanded ? "line-clamp-2" : ""}`}>{text}</p>
      <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600 text-sm underline mt-1">
        {isExpanded ? "(less)" : "(more)"}
      </button>
    </div>
  )
}

export default function CourseTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("table")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedProgramCohorts, setSelectedProgramCohorts] = useState<string[]>(["Elective"])
  // In the CourseTable component, add a new state to track expanded descriptions
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>()
    courses.forEach((course) => {
      course.courseCategories.forEach((category) => {
        if (category) categorySet.add(category)
      })
    })
    return Array.from(categorySet).sort()
  }, [courses])

  const sessions = React.useMemo(() => {
    const sessionSet = new Set<string>()
    courses.forEach((course) => {
      if (course.courseSession) sessionSet.add(course.courseSession)
    })
    return Array.from(sessionSet).sort()
  }, [courses])

  const instructors = React.useMemo(() => {
    const instructorSet = new Set<string>()
    courses.forEach((course) => {
      course.instructors.forEach((instructor) => {
        if (instructor.name) instructorSet.add(instructor.name)
      })
    })
    return Array.from(instructorSet).sort()
  }, [courses])

  const units = React.useMemo(() => {
    const unitSet = new Set<string>()
    courses.forEach((course) => {
      if (course.units) unitSet.add(course.units)
    })
    return Array.from(unitSet).sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b))
  }, [courses])

  const programCohortOptions = React.useMemo(() => {
    const programCohortSet = new Set<string>()
    courses.forEach((course) => {
      course.programCohorts.forEach((pc) => {
        if (pc.name) programCohortSet.add(pc.name)
      })
    })
    return Array.from(programCohortSet).sort()
  }, [courses])

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const semesterCodes = getCurrentAndNextSemesters()
      const response = await fetch(`/api/courses?semesters=${semesterCodes.join(",")}`)
      const data = await response.json()
      const processedCourses = (data.courses || []).map(processCourseData)

      // Remove duplicates based on courseID, keeping the most recent one
      const uniqueCourses = processedCourses.reduce((acc: Course[], current: Course) => {
        const existingIndex = acc.findIndex((course) => course.courseID === current.courseID)
        if (existingIndex === -1) {
          acc.push(current)
        } else {
          // Keep the course with the higher termCode (more recent semester)
          if (current.termCode > acc[existingIndex].termCode) {
            acc[existingIndex] = current
          }
        }
        return acc
      }, [])

      setCourses(uniqueCourses)
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
      return
    }

    const color = COLORS[scheduledCourses.length % COLORS.length]
    const scheduledCourse: ScheduledCourse = { ...course, color }
    setScheduledCourses([...scheduledCourses, scheduledCourse])
  }

  const removeFromSchedule = (courseID: string) => {
    setScheduledCourses(scheduledCourses.filter((c) => c.courseID !== courseID))
  }

  const exportToICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Yale SOM//Course Schedule//EN\n"

    scheduledCourses.forEach((course) => {
      if (course.meetingDays.length > 0 && course.startTime && course.endTime) {
        try {
          // Parse dates more carefully - handle format like "20250121 000000.000"
          let startDate: Date | null = null
          let endDate: Date | null = null

          if (course.courseSessionStartDate) {
            // Extract just the date part (first 8 characters) and format as YYYY-MM-DD
            const startDateStr = course.courseSessionStartDate.substring(0, 8)
            if (startDateStr.length === 8) {
              const year = startDateStr.substring(0, 4)
              const month = startDateStr.substring(4, 6)
              const day = startDateStr.substring(6, 8)
              startDate = new Date(`${year}-${month}-${day}`)
            }
          }

          if (course.courseSessionEndDate) {
            // Extract just the date part (first 8 characters) and format as YYYY-MM-DD
            const endDateStr = course.courseSessionEndDate.substring(0, 8)
            if (endDateStr.length === 8) {
              const year = endDateStr.substring(0, 4)
              const month = endDateStr.substring(4, 6)
              const day = endDateStr.substring(6, 8)
              endDate = new Date(`${year}-${month}-${day}`)
            }
          }

          // Only add event if we have valid dates
          if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            icsContent += "BEGIN:VEVENT\n"
            icsContent += `SUMMARY:${course.courseNumber} - ${course.courseTitle}\n`
            icsContent += `DESCRIPTION:${course.courseDescription.replace(/\n/g, "\\n")}\n`
            icsContent += `LOCATION:${course.room}\n`
            icsContent += `DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`
            icsContent += `DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z\n`
            icsContent += `UID:${course.courseID}@som.yale.edu\n`
            icsContent += "END:VEVENT\n"
          }
        } catch (error) {
          console.error(`Error processing course ${course.courseNumber}:`, error)
          // Continue with other courses even if one fails
        }
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
        course.instructors.some((instructor) => instructor.name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedCategories.length === 0 || course.courseCategories.some((cat) => selectedCategories.includes(cat))) &&
      (selectedSessions.length === 0 || selectedSessions.includes(course.courseSession)) &&
      (selectedInstructors.length === 0 ||
        course.instructors.some((instructor) => selectedInstructors.includes(instructor.name))) &&
      (selectedUnits.length === 0 || selectedUnits.includes(course.units)) &&
      (selectedProgramCohorts.length === 0 ||
        course.programCohorts.some((pc) => selectedProgramCohorts.includes(pc.name))),
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

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSessions([])
    setSelectedInstructors([])
    setSelectedUnits([])
    setSelectedProgramCohorts([])
    setSearchTerm("")
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSessions.length > 0 ||
    selectedInstructors.length > 0 ||
    selectedUnits.length > 0 ||
    selectedProgramCohorts.length > 0 ||
    searchTerm.length > 0

  const renderCourseCard = (course: Course) => {
    const details: React.ReactNode[] = []

    if (course.instructors && course.instructors.length > 0) {
      course.instructors.forEach((instructor) => {
        details.push(
          <a
            key={instructor.name}
            href={`mailto:${instructor.email}`}
            className="text-gray-500 hover:text-gray-700 underline"
            title={`Email ${instructor.name}`}
          >
            {instructor.name}
          </a>,
        )
      })
    }

    if (course.daysTimes) {
      details.push(<span key="daysTimes">{course.daysTimes}</span>)
    }

    if (course.room) {
      details.push(<span key="room">{course.room}</span>)
    }

    if (course.syllabusUrl) {
      details.push(
        <a
          key="syllabus"
          href={course.syllabusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Syllabus
        </a>,
      )
    }

    if (course.oldSyllabusUrl) {
      details.push(
        <a
          key="old-syllabus"
          href={course.oldSyllabusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 underline"
        >
          Syllabus (old)
        </a>,
      )
    }

    const isScheduled = scheduledCourses.some((c) => c.courseID === course.courseID)

    return (
      <Card key={`${course.courseID}-${course.termCode || "unknown"}`} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{course.courseNumber}</h3>
                  {course.courseCategories.map((category, index) => (
                    <Badge key={index} variant="outline">
                      {category}
                    </Badge>
                  ))}
                  <Badge variant="secondary">{course.units} units</Badge>
                  <Badge variant="outline">{course.courseSession}</Badge>
                  {course.programCohorts.map((pc, index) => (
                    <Badge key={index} className={getProgramCohortBadgeClass(pc.color)}>
                      {pc.name}
                    </Badge>
                  ))}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{course.courseTitle}</h4>
                <ExpandableDescription text={course.courseDescription} />
                <div className="flex items-center flex-wrap text-sm text-gray-500">
                  {details.map((detail, index) => (
                    <React.Fragment key={index}>
                      {detail}
                      {index < details.length - 1 && <span className="mx-2">•</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                if (isScheduled) {
                  removeFromSchedule(course.courseID)
                } else {
                  addToSchedule(course)
                }
              }}
              size="icon"
              className="ml-4 h-8 w-8 flex-shrink-0"
            >
              {isScheduled ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">
              Course<span className="text-gray-900">Table</span>
            </h1>
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
                <TabsTrigger value="table" className="flex items-center">
                  <TableIcon className="w-4 h-4 mr-2" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="table">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Instructor(s)</TableHead>
                      <TableHead>Meets</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Syllabus</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledCourses.length > 0 ? (
                      scheduledCourses.map((course) => (
                        <TableRow key={course.courseID}>
                          <TableCell>
                            <Button
                              onClick={() => removeFromSchedule(course.courseID)}
                              size="icon"
                              title="Remove course"
                              className={`${course.color} h-6 w-6 text-white hover:opacity-90 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell>{course.courseNumber}</TableCell>
                          <TableCell className="font-medium">{course.courseTitle}</TableCell>
                          <TableCell>{course.courseSession}</TableCell>
                          <TableCell>{course.courseCategories.join(", ")}</TableCell>
                          <TableCell>
                            {course.instructors.map((instructor) => (
                              <div key={instructor.email}>
                                <a
                                  href={`mailto:${instructor.email}`}
                                  className="text-gray-600 hover:underline"
                                  title={`Email ${instructor.name}`}
                                >
                                  {instructor.name}
                                </a>
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>{course.daysTimes}</TableCell>
                          <TableCell>{course.room}</TableCell>
                          <TableCell>{course.units}</TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {course.syllabusUrl && (
                                <a
                                  href={course.syllabusUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Syllabus
                                </a>
                              )}
                              {course.oldSyllabusUrl && (
                                <a
                                  href={course.oldSyllabusUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Old Syllabus
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ExpandableTableCell text={course.courseDescription} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          No courses selected yet. Add courses from the list below.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
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
                      {TIME_SLOTS.map((time) => (
                        <div key={time} className="h-10 border-b text-xs text-gray-500 px-2 py-1">
                          {time}
                        </div>
                      ))}
                    </div>

                    {DAYS.map((day) => (
                      <div key={day} className="border-r last:border-r-0 relative">
                        {TIME_SLOTS.map((time) => (
                          <div key={time} className="h-10 border-b border-gray-100"></div>
                        ))}

                        {scheduledCourses
                          .filter((course) => course.meetingDays.includes(day))
                          .map((course) => (
                            <div
                              key={`${course.courseID}-${day}`}
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
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <MultiSelectFilter
                  options={categories}
                  selected={selectedCategories}
                  onSelectionChange={setSelectedCategories}
                  placeholder="Categories"
                  label="Categories"
                />
                <MultiSelectFilter
                  options={sessions}
                  selected={selectedSessions}
                  onSelectionChange={setSelectedSessions}
                  placeholder="Sessions"
                  label="Sessions"
                />
                <InstructorSearchFilter
                  options={instructors}
                  selected={selectedInstructors}
                  onSelectionChange={setSelectedInstructors}
                  placeholder="Instructors"
                  label="Instructors"
                />
                <MultiSelectFilter
                  options={units}
                  selected={selectedUnits}
                  onSelectionChange={setSelectedUnits}
                  placeholder="Units"
                  label="Units"
                />
                <MultiSelectFilter
                  options={programCohortOptions}
                  selected={selectedProgramCohorts}
                  onSelectionChange={setSelectedProgramCohorts}
                  placeholder="Program/Cohort"
                  label="Program/Cohort"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500">
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              <div className="relative w-80">
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
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCourses.map((course) => renderCourseCard(course))}
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
