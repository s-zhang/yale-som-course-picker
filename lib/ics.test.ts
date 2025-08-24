import { describe, it, expect } from 'vitest'
import { generateICS, IcsCourse } from './ics'

describe('generateICS', () => {
  const baseCourse: IcsCourse = {
    courseID: '1',
    courseNumber: 'TEST 101',
    courseTitle: 'Testing Course',
    courseDescription: 'A course about testing.',
    room: 'Room 1',
    meetingDays: ['Wednesday'],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    courseSessionStartDate: '20260120 000000.000',
    courseSessionEndDate: '20260220 000000.000',
  }

  it('creates weekly event with correct day', () => {
    const ics = generateICS([baseCourse])
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE')
    // first Wednesday after Jan 20 2026 is Jan 21 2026
    expect(ics).toContain('DTSTART;TZID=America/New_York:20260121T100000')
  })

  it('handles multiple days', () => {
    const course: IcsCourse = {
      ...baseCourse,
      meetingDays: ['Tuesday', 'Thursday'],
      startTime: '2:00 PM',
      endTime: '3:30 PM',
    }
    const ics = generateICS([course])
    expect(ics).toContain('BYDAY=TU,TH')
  })

  it('includes timezone information', () => {
    const ics = generateICS([baseCourse])
    expect(ics).toContain('BEGIN:VTIMEZONE')
    expect(ics).toContain('TZID:America/New_York')
    expect(ics).toContain('DTSTART;TZID=America/New_York:')
    expect(ics).toContain('DTEND;TZID=America/New_York:')
    // Check that datetime values don't have UTC 'Z' suffix
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}Z/)
    expect(ics).not.toMatch(/DTEND:\d{8}T\d{6}Z/)
  })

  it('handles PM times correctly', () => {
    const course: IcsCourse = {
      ...baseCourse,
      startTime: '2:30 PM',
      endTime: '4:00 PM',
    }
    const ics = generateICS([course])
    expect(ics).toContain('DTSTART;TZID=America/New_York:20260121T143000') // 2:30 PM = 14:30
    expect(ics).toContain('DTEND;TZID=America/New_York:20260121T160000')   // 4:00 PM = 16:00
  })
})
