"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Download, Calendar, TableIcon, Search, ChevronDown, X, Minus, Share2 } from "lucide-react"
import Spinner from "@/components/ui/spinner"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { generateICS } from "@/lib/ics"
import { capitalize } from "@/lib/utils"

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
const DAYS_SHORT = ["M", "T", "W", "Th", "F"]
const DAY_MAP: { [key: string]: string } = {
  M: "Monday",
  T: "Tuesday",
  W: "Wednesday",
  Th: "Thursday",
  F: "Friday",
}

const DEFAULT_TIME_SLOTS = [
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

const TIME_SLOT_HEIGHT = 40 // px per 30 minute slot

const parseTimeToMinutes = (time: string): number => {
  const [timeStr, period] = time.split(" ")
  const [hoursStr, minutesStr] = timeStr.split(":")
  let hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

const formatMinutesToTime = (minutes: number): string => {
  const hrs24 = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hrs24 >= 12 ? "PM" : "AM"
  let hrs12 = hrs24 % 12
  if (hrs12 === 0) hrs12 = 12
  return `${hrs12}:${mins.toString().padStart(2, "0")} ${period}`
}

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
    courseSession: course.courseSession
      ? capitalize(course.courseSession.trim())
      : course.courseSession,
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
        <Button
          variant="outline"
          className="w-full sm:w-36 justify-between text-left font-normal bg-transparent"
        >
          <span className="truncate">
            {selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
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
        <Button
          variant="outline"
          className="w-full sm:w-36 justify-between text-left font-normal bg-transparent"
        >
          <span className="truncate">
            {selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} selected`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
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

// Add this function before the SOMCourse component
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
      <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-600 text-sm underline mt-1">
        {isExpanded ? "(less)" : "(more)"}
      </button>
    </div>
  )
}

export default function SOMCourse() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialScheduledIds, setInitialScheduledIds] = useState<string[] | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("table")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([])
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedProgramCohorts, setSelectedProgramCohorts] = useState<string[]>([])
  // In the SOMCourse component, add a new state to track expanded descriptions
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

  // Initialize state from query parameters
  useEffect(() => {
    const hasParams = searchParams.toString().length > 0
    const cats = searchParams.get("categories")
    if (cats) setSelectedCategories(cats.split(",").filter(Boolean))
    const sess = searchParams.get("sessions")
    if (sess) setSelectedSessions(sess.split(",").filter(Boolean).map(capitalize))
    const instr = searchParams.get("instructors")
    if (instr) setSelectedInstructors(instr.split(",").filter(Boolean))
    const unitsParam = searchParams.get("units")
    if (unitsParam) setSelectedUnits(unitsParam.split(",").filter(Boolean))
    const pc = searchParams.get("programs")
    if (pc) setSelectedProgramCohorts(pc.split(",").filter(Boolean))
    if (!hasParams) {
      setSelectedProgramCohorts(["Elective"])
    }
    const search = searchParams.get("search")
    if (search) setSearchTerm(search)
    const sched = searchParams.get("scheduled")
    setInitialScheduledIds(sched ? sched.split(",").filter(Boolean) : [])
  }, [])

  useEffect(() => {
    if (initialScheduledIds === null) return
    fetchCourses()
  }, [initialScheduledIds])

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
      if (initialScheduledIds && initialScheduledIds.length > 0 && scheduledCourses.length === 0) {
        const selected: ScheduledCourse[] = []
        initialScheduledIds.forEach((id, idx) => {
          const course = uniqueCourses.find((c) => c.courseID === id)
          if (course) {
            selected.push({ ...course, color: COLORS[idx % COLORS.length] })
          }
        })
        if (selected.length > 0) {
          setScheduledCourses(selected)
        }
      }
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

    const usedColors = new Set(scheduledCourses.map((c) => c.color))
    const color =
      COLORS.find((c) => !usedColors.has(c)) ??
      COLORS[scheduledCourses.length % COLORS.length]

    const scheduledCourse: ScheduledCourse = { ...course, color }
    setScheduledCourses([...scheduledCourses, scheduledCourse])
  }

  const removeFromSchedule = (courseID: string) => {
    setScheduledCourses(scheduledCourses.filter((c) => c.courseID !== courseID))
  }

  const exportToICS = () => {
    const icsContent = generateICS(scheduledCourses)

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

  const shareSchedule = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: "URL Copied", description: "Share this link with others." })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive",
      })
    }
  }

  const lowerSearch = searchTerm.toLowerCase()

  const filteredCourses = courses.filter(
    (course) =>
      ((course.courseTitle || "").toLowerCase().includes(lowerSearch) ||
        (course.courseNumber || "").toLowerCase().includes(lowerSearch) ||
        (course.courseDescription || "").toLowerCase().includes(lowerSearch) ||
        (course.courseCategories || []).some((cat) => (cat || "").toLowerCase().includes(lowerSearch)) ||
        (course.instructors || []).some((instructor) => (instructor.name || "").toLowerCase().includes(lowerSearch))) &&
      (selectedCategories.length === 0 || (course.courseCategories || []).some((cat) => selectedCategories.includes(cat))) &&
      (selectedSessions.length === 0 || selectedSessions.includes(course.courseSession)) &&
      (selectedInstructors.length === 0 ||
        (course.instructors || []).some((instructor) => selectedInstructors.includes(instructor.name))) &&
      (selectedUnits.length === 0 || selectedUnits.includes(course.units)) &&
      (selectedProgramCohorts.length === 0 ||
        (course.programCohorts || []).some((pc) => selectedProgramCohorts.includes(pc.name))),
  )

  const timeSlots = React.useMemo(() => {
    if (scheduledCourses.length === 0) return DEFAULT_TIME_SLOTS
    const mins = scheduledCourses.flatMap((c) => [
      parseTimeToMinutes(c.startTime),
      parseTimeToMinutes(c.endTime),
    ])
    let min = Math.min(...mins)
    let max = Math.max(...mins)
    min = Math.floor((min - 60) / 30) * 30
    max = Math.ceil((max + 60) / 30) * 30
    const slots: string[] = []
    for (let t = min; t <= max; t += 30) {
      slots.push(formatMinutesToTime(t))
    }
    return slots
  }, [scheduledCourses])

  const maxTimeLabel = React.useMemo(
    () => timeSlots.reduce((max, t) => (t.length > max.length ? t : max), ""),
    [timeSlots],
  )

  const scheduleStartMinutes = React.useMemo(
    () => parseTimeToMinutes(timeSlots[0] ?? "8:00 AM"),
    [timeSlots]
  )

  const getTimePosition = (time: string) => {
    const totalMinutes = parseTimeToMinutes(time)
    return ((totalMinutes - scheduleStartMinutes) / 30) * TIME_SLOT_HEIGHT
  }

  const getCourseDuration = (startTime: string, endTime: string) => {
    const start = parseTimeToMinutes(startTime)
    const end = parseTimeToMinutes(endTime)
    return ((end - start) / 30) * TIME_SLOT_HEIGHT
  }

  const computeCourseLayout = (courses: ScheduledCourse[]) => {
    const result: Record<string, { index: number; total: number }> = {}
    const sorted = [...courses].sort(
      (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    )
    let group: ScheduledCourse[] = []
    let groupEnd = 0
    const finalize = () => {
      if (group.length === 0) return
      const columns: number[] = []
      group.forEach((course) => {
        const start = parseTimeToMinutes(course.startTime)
        const end = parseTimeToMinutes(course.endTime)
        let col = 0
        while (col < columns.length && start < columns[col]) {
          col++
        }
        if (col === columns.length) columns.push(0)
        columns[col] = end
        result[course.courseID] = { index: col, total: 0 }
      })
      const total = columns.length
      group.forEach((c) => {
        result[c.courseID].total = total
      })
      group = []
    }
    for (const course of sorted) {
      const start = parseTimeToMinutes(course.startTime)
      const end = parseTimeToMinutes(course.endTime)
      if (group.length === 0 || start < groupEnd) {
        groupEnd = Math.max(groupEnd, end)
        group.push(course)
      } else {
        finalize()
        group.push(course)
        groupEnd = end
      }
    }
    finalize()
    return result
  }

  const layoutByDay = React.useMemo(() => {
    const dayLayouts: Record<string, Record<string, { index: number; total: number }>> = {}
    DAYS.forEach((d) => {
      dayLayouts[d] = computeCourseLayout(
        scheduledCourses.filter((c) => c.meetingDays.includes(d))
      )
    })
    return dayLayouts
  }, [scheduledCourses])

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

  // Update query parameters when filters or schedule change
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedCategories.length)
      params.set("categories", selectedCategories.join(","))
    if (selectedSessions.length)
      params.set("sessions", selectedSessions.join(","))
    if (selectedInstructors.length)
      params.set("instructors", selectedInstructors.join(","))
    if (selectedUnits.length) params.set("units", selectedUnits.join(","))
    if (selectedProgramCohorts.length)
      params.set("programs", selectedProgramCohorts.join(","))
    if (searchTerm) params.set("search", searchTerm)
    if (scheduledCourses.length)
      params.set(
        "scheduled",
        scheduledCourses.map((c) => c.courseID).join(",")
      )
    const query = params.toString()
    router.replace(query ? `?${query}` : "?", { scroll: false })
  }, [
    selectedCategories,
    selectedSessions,
    selectedInstructors,
    selectedUnits,
    selectedProgramCohorts,
    searchTerm,
    scheduledCourses,
  ])

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

    if (course.daysTimes && course.daysTimes.trim()) {
      details.push(<span key="daysTimes">{course.daysTimes}</span>)
    }

    if (course.room && course.room.trim()) {
      details.push(<span key="room">{course.room}</span>)
    }

    if (course.syllabusUrl && course.syllabusUrl.trim()) {
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

    if (course.oldSyllabusUrl && course.oldSyllabusUrl.trim()) {
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
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-[#000f9f]">SOM</span>Course
          </h1>
          <div className="flex items-center space-x-2">
            <Button onClick={exportToICS} variant="outline" size="sm" disabled={scheduledCourses.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export ICS
            </Button>
            <Button onClick={shareSchedule} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Selected Courses Section - Top */}
        <div className="mb-8">
          <div className="flex items-center mb-4 space-x-4">
            <Badge variant="secondary">{scheduledCourses.length} courses selected</Badge>
            <Badge variant="outline">
              {scheduledCourses.reduce((sum, course) => sum + Number.parseFloat(course.units), 0)} total units
            </Badge>
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
                      <TableHead>Instructor</TableHead>
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
                            <div>
                              {course.syllabusUrl || course.oldSyllabusUrl ? (
                                <span>
                                  {course.syllabusUrl && (
                                    <a
                                      href={course.syllabusUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      link
                                    </a>
                                  )}
                                  {course.syllabusUrl && course.oldSyllabusUrl &&
                                    ', '}
                                  {course.oldSyllabusUrl && (
                                    <a
                                      href={course.oldSyllabusUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      old
                                    </a>
                                  )}
                                </span>
                              ) : null}
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
                  <div
                    className="grid grid-cols-6 border-b"
                    style={{ gridTemplateColumns: 'max-content repeat(5, 1fr)' }}
                  >
                    <div className="border-r bg-gray-50 px-2 py-1 text-xs whitespace-nowrap">
                      <span className="invisible">{maxTimeLabel}</span>
                    </div>
                    {DAYS.map((day, i) => (
                      <div
                        key={day}
                        className="p-4 text-center font-medium border-r last:border-r-0"
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{DAYS_SHORT[i]}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="grid grid-cols-6 relative"
                    style={{
                      height: `${timeSlots.length * TIME_SLOT_HEIGHT}px`,
                      gridTemplateColumns: 'max-content repeat(5, 1fr)'
                    }}
                  >
                    <div className="border-r bg-gray-50">
                      {timeSlots.map((time) => (
                        <div key={time} className="h-10 border-b text-xs text-gray-500 px-2 py-1 whitespace-nowrap">
                          {time}
                        </div>
                      ))}
                    </div>

                    {DAYS.map((day) => (
                      <div key={day} className="border-r last:border-r-0 relative">
                        {timeSlots.map((time) => (
                          <div key={time} className="h-10 border-b border-gray-100"></div>
                        ))}

                        {scheduledCourses
                          .filter((course) => course.meetingDays.includes(day))
                          .map((course) => (
                            <div
                              key={`${course.courseID}-${day}`}
                              className={`absolute ${course.color} text-white text-xs p-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                              style={{
                                top: `${getTimePosition(course.startTime)}px`,
                                height: `${getCourseDuration(course.startTime, course.endTime)}px`,
                                width: `calc(100% / ${layoutByDay[day][course.courseID]?.total || 1})`,
                                left: `calc(${layoutByDay[day][course.courseID]?.index || 0} * 100% / ${layoutByDay[day][course.courseID]?.total || 1})`,
                              }}
                              onClick={() => removeFromSchedule(course.courseID)}
                              title="Click to remove from schedule"
                            >
                              <div className="font-medium">{course.courseNumber}</div>
                              <div className="truncate">{course.courseTitle}</div>
                              {course.courseSession && (
                                <div className="text-xs opacity-90">
                                  {course.courseSession}
                                </div>
                              )}
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
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2 flex-1">
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
              <div className="relative w-full sm:w-80 ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search courses, professors, categories, or descriptions..."
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
