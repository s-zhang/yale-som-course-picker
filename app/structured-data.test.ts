/**
 * Test structured data generation
 * This validates that the structured data is valid JSON and follows schema.org format
 */

import { describe, it, expect } from 'vitest'
import { 
  generateCourseStructuredData,
  generateCoursesListStructuredData,
  generateWebSiteStructuredData,
  generateOrganizationStructuredData 
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

  it('generates valid Course structured data', () => {
    const result = generateCourseStructuredData(mockCourse)
    
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Course')
    expect(result.name).toContain(mockCourse.courseNumber)
    expect(result.name).toContain(mockCourse.courseTitle)
    expect(result.description).toBe(mockCourse.courseDescription)
    expect(result.provider['@type']).toBe('EducationalOrganization')
    expect(result.provider.name).toBe('Yale School of Management')
  })

  it('includes hasCourseInstance when dates are provided', () => {
    const result = generateCourseStructuredData(mockCourse)
    
    expect(result.hasCourseInstance).toBeDefined()
    expect(result.hasCourseInstance['@type']).toBe('CourseInstance')
    expect(result.hasCourseInstance.courseMode).toBe('onsite')
    expect(result.hasCourseInstance.startDate).toBe('2024-09-01')
    expect(result.hasCourseInstance.endDate).toBe('2024-10-31')
    expect(result.hasCourseInstance.location).toBeDefined()
  })

  it('includes instructor information in course instance', () => {
    const result = generateCourseStructuredData(mockCourse)
    
    expect(result.hasCourseInstance.instructor).toBeDefined()
    expect(result.hasCourseInstance.instructor).toHaveLength(1)
    expect(result.hasCourseInstance.instructor[0]['@type']).toBe('Person')
    expect(result.hasCourseInstance.instructor[0].name).toBe('John Doe')
  })

  it('generates valid ItemList for courses', () => {
    const courses = [mockCourse, { ...mockCourse, courseNumber: 'MGT 124' }]
    const result = generateCoursesListStructuredData(courses)
    
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('ItemList')
    expect(result.itemListElement).toHaveLength(2)
    expect(result.itemListElement[0]['@type']).toBe('ListItem')
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[0].item['@type']).toBe('Course')
  })

  it('generates valid WebSite structured data', () => {
    const result = generateWebSiteStructuredData()
    
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('WebSite')
    expect(result.name).toBe('MySOMClasses')
    expect(result.url).toBe('https://mysomclasses.com')
    expect(result.potentialAction).toBeDefined()
    expect(result.potentialAction['@type']).toBe('SearchAction')
  })

  it('generates valid EducationalOrganization structured data', () => {
    const result = generateOrganizationStructuredData()
    
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('EducationalOrganization')
    expect(result.name).toBe('Yale School of Management')
    expect(result.url).toBe('https://som.yale.edu')
    expect(result.address).toBeDefined()
    expect(result.address['@type']).toBe('PostalAddress')
    expect(result.sameAs).toBeDefined()
    expect(Array.isArray(result.sameAs)).toBe(true)
  })

  it('handles courses without dates gracefully', () => {
    const courseWithoutDates = {
      ...mockCourse,
      courseSessionStartDate: '',
      courseSessionEndDate: ''
    }
    const result = generateCourseStructuredData(courseWithoutDates)
    
    expect(result['@type']).toBe('Course')
    expect(result.hasCourseInstance).toBeUndefined()
  })

  it('handles courses without syllabus URL', () => {
    const courseWithoutSyllabus = {
      ...mockCourse,
      syllabusUrl: undefined
    }
    const result = generateCourseStructuredData(courseWithoutSyllabus)
    
    expect(result.syllabusSections).toBeUndefined()
  })

  it('includes syllabus when URL is provided', () => {
    const result = generateCourseStructuredData(mockCourse)
    
    expect(result.syllabusSections).toBeDefined()
    expect(result.syllabusSections[0]['@type']).toBe('Syllabus')
    expect(result.syllabusSections[0].url).toBe(mockCourse.syllabusUrl)
  })

  it('limits course list to 20 items', () => {
    const manyCourses = Array(30).fill(mockCourse).map((course, i) => ({
      ...course,
      courseNumber: `MGT ${i + 100}`
    }))
    const result = generateCoursesListStructuredData(manyCourses)
    
    expect(result.itemListElement).toHaveLength(20)
  })
})
