import { describe, it, expect } from 'vitest'

describe('Multi-state toggle logic', () => {
  it('should map Fall courses to Fall-1 and Fall-2 sessions', () => {
    const courses = [
      { courseSession: 'Fall' },
      { courseSession: 'Fall-1' },
      { courseSession: 'Fall-2' },
    ]
    
    const sessionSet = new Set<string>()
    courses.forEach((course) => {
      const session = course.courseSession
      if (!session) return
      
      // Map sessions to specific periods
      if (session === "Fall" || session === "Fall-1") {
        sessionSet.add("Fall-1")
      }
      if (session === "Fall" || session === "Fall-2") {
        sessionSet.add("Fall-2")
      }
      if (session === "Spring" || session === "Spring-1") {
        sessionSet.add("Spring-1")
      }
      if (session === "Spring" || session === "Spring-2") {
        sessionSet.add("Spring-2")
      }
    })
    
    const availableSessions = Array.from(sessionSet).sort()
    expect(availableSessions).toEqual(['Fall-1', 'Fall-2'])
  })

  it('should map Spring courses to Spring-1 and Spring-2 sessions', () => {
    const courses = [
      { courseSession: 'Spring' },
      { courseSession: 'Spring-1' },
      { courseSession: 'Spring-2' },
    ]
    
    const sessionSet = new Set<string>()
    courses.forEach((course) => {
      const session = course.courseSession
      if (!session) return
      
      if (session === "Fall" || session === "Fall-1") {
        sessionSet.add("Fall-1")
      }
      if (session === "Fall" || session === "Fall-2") {
        sessionSet.add("Fall-2")
      }
      if (session === "Spring" || session === "Spring-1") {
        sessionSet.add("Spring-1")
      }
      if (session === "Spring" || session === "Spring-2") {
        sessionSet.add("Spring-2")
      }
    })
    
    const availableSessions = Array.from(sessionSet).sort()
    expect(availableSessions).toEqual(['Spring-1', 'Spring-2'])
  })

  it('should filter courses based on view mode', () => {
    const scheduledCourses = [
      { courseID: '1', courseSession: 'Fall' },
      { courseID: '2', courseSession: 'Fall-1' },
      { courseID: '3', courseSession: 'Fall-2' },
      { courseID: '4', courseSession: 'Spring' },
      { courseID: '5', courseSession: 'Spring-1' },
    ]
    
    const filterCoursesByViewMode = (courses: any[], viewMode: string) => {
      if (viewMode === "all") {
        return courses
      }
      
      return courses.filter((course) => {
        const session = course.courseSession
        if (!session) return false
        
        if (viewMode === "Fall-1" && (session === "Fall" || session === "Fall-1")) {
          return true
        }
        if (viewMode === "Fall-2" && (session === "Fall" || session === "Fall-2")) {
          return true
        }
        if (viewMode === "Spring-1" && (session === "Spring" || session === "Spring-1")) {
          return true
        }
        if (viewMode === "Spring-2" && (session === "Spring" || session === "Spring-2")) {
          return true
        }
        return false
      })
    }
    
    // Test Fall-1 view
    const fall1Courses = filterCoursesByViewMode(scheduledCourses, 'Fall-1')
    expect(fall1Courses.map(c => c.courseID)).toEqual(['1', '2'])
    
    // Test Fall-2 view
    const fall2Courses = filterCoursesByViewMode(scheduledCourses, 'Fall-2')
    expect(fall2Courses.map(c => c.courseID)).toEqual(['1', '3'])
    
    // Test Spring-1 view
    const spring1Courses = filterCoursesByViewMode(scheduledCourses, 'Spring-1')
    expect(spring1Courses.map(c => c.courseID)).toEqual(['4', '5'])
    
    // Test All view
    const allCourses = filterCoursesByViewMode(scheduledCourses, 'all')
    expect(allCourses.length).toBe(5)
  })
})
