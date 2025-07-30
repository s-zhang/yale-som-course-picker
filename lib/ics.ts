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
  date.setUTCHours(hour, minute, 0, 0)
  return date
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
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function generateICS(courses: IcsCourse[]): string {
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Yale SOM//Course Schedule//EN\n'
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
    ics += `DTSTART:${formatDate(firstDate)}\n`
    ics += `DTEND:${formatDate(endDate)}\n`
    ics += `RRULE:FREQ=WEEKLY;BYDAY=${byDays};UNTIL=${formatDate(untilDate)}\n`
    ics += `UID:${course.courseID}@som.yale.edu\n`
    ics += 'END:VEVENT\n'
  }
  ics += 'END:VCALENDAR'
  return ics
}
