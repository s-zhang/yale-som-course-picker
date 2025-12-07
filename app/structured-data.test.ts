/**
 * Test structured data generation
 */

import { describe, it, expect } from 'vitest'
import { 
  generateCoursesListStructuredData
} from '../lib/structured-data'

describe('Structured Data Generation', () => {
  const mockCourse = {
    courseNumber: 'MGT 123',
    courseTitle: 'Introduction to Management',
    courseDescription: 'This course covers the fundamentals of management.',
    instructors: [
      { name: 'John Doe', email: 'john.doe@yale.edu' }
    ],
    courseSession: 'Fall-1',
    courseSessionStartDate: '2024-09-01',
    courseSessionEndDate: '2024-10-31',
    daysTimes: 'MW 9:00 AM - 10:15 AM',
    room: 'Room 101',
    syllabusUrl: 'https://example.com/syllabus.pdf'
  }

  it('generates ItemList with at least one course', () => {
    const courses = [mockCourse]
    const result = generateCoursesListStructuredData(courses)
    
    expect(result.itemListElement.length).toBeGreaterThanOrEqual(1)
    expect(result.itemListElement[0].item['@type']).toBe('Course')
  })
})
