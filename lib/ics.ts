export interface IcsCourse {
  courseID: string
  courseNumber: string
  courseTitle: string
  courseDescription: string
  room: string
  meetingDays: string[]
  startTime: string
  endTime: string
  courseSessionStartDate: string
  courseSessionEndDate: string
}

const DAY_TO_RRULE: Record<string, string> = {
  Sunday: 'SU',
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA'
}

function generateVTimezone(): string {
  return `BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:20070311T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:20071104T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
`
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const clean = dateStr.substring(0, 8)
  if (clean.length !== 8) return null
  const year = Number(clean.slice(0, 4))
  const month = Number(clean.slice(4, 6)) - 1
  const day = Number(clean.slice(6, 8))
  return new Date(Date.UTC(year, month, day))
}

function applyTime(date: Date, time: string): Date {
  const [timePart, period] = time.trim().split(' ')
  const [hourStr, minuteStr] = timePart.split(':')
  let hour = Number(hourStr)
  const minute = Number(minuteStr)
  if (/pm/i.test(period) && hour !== 12) hour += 12
  if (/am/i.test(period) && hour === 12) hour = 0
  
  // Set time as Eastern Time (will be interpreted as local time in Eastern timezone)
  const result = new Date(date)
  result.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  result.setHours(hour, minute, 0, 0)
  return result
}

function firstMeetingDate(start: Date, meetingDays: string[]): Date {
  const startDay = start.getUTCDay()
  let minOffset = 7
  for (const day of meetingDays) {
    const target = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(day)
    if (target === -1) continue
    let offset = (target - startDay + 7) % 7
    if (offset < minOffset) minOffset = offset
  }
  const result = new Date(start)
  result.setUTCDate(start.getUTCDate() + minOffset)
  return result
}

function formatDate(date: Date): string {
  // Format as YYYYMMDDTHHMMSS for use with TZID
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return `${year}${month}${day}T${hour}${minute}${second}`
}

export function generateICS(courses: IcsCourse[]): string {
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Yale SOM//Course Schedule//EN\n'
  ics += generateVTimezone()
  
  for (const course of courses) {
    if (!course.meetingDays.length || !course.startTime || !course.endTime) {
      continue
    }
    const startBase = parseDate(course.courseSessionStartDate)
    const endBase = parseDate(course.courseSessionEndDate)
    if (!startBase || !endBase) continue

    const firstDate = applyTime(firstMeetingDate(new Date(startBase), course.meetingDays), course.startTime)
    const endDate = applyTime(new Date(firstDate), course.endTime)
    const untilDate = applyTime(new Date(endBase), course.endTime)

    const byDays = course.meetingDays.map(d => DAY_TO_RRULE[d]).filter(Boolean).join(',')
    ics += 'BEGIN:VEVENT\n'
    ics += `SUMMARY:${course.courseNumber} - ${course.courseTitle}\n`
    ics += `DESCRIPTION:${course.courseDescription.replace(/\n/g, '\\n')}\n`
    ics += `LOCATION:${course.room}\n`
    ics += `DTSTART;TZID=America/New_York:${formatDate(firstDate)}\n`
    ics += `DTEND;TZID=America/New_York:${formatDate(endDate)}\n`
    ics += `RRULE:FREQ=WEEKLY;BYDAY=${byDays};UNTIL=${formatDate(untilDate)}\n`
    ics += `UID:${course.courseID}@som.yale.edu\n`
    ics += 'END:VEVENT\n'
  }
  ics += 'END:VCALENDAR'
  return ics
}
