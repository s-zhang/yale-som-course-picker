/**
 * Generate Course structured data for Google Search
 * Following: https://developers.google.com/search/docs/appearance/structured-data/course
 */

interface CourseStructuredDataProps {
  courseNumber: string
  courseTitle: string
  courseDescription: string
  instructors: Array<{ name: string; email: string }>
  courseSession: string
  courseSessionStartDate: string
  courseSessionEndDate: string
  daysTimes?: string
  room?: string
  syllabusUrl?: string
}

export function generateCourseStructuredData(course: CourseStructuredDataProps) {
  // Format dates to ISO 8601 format if available
  const formatDate = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined
    try {
      // If already in ISO format, return as is
      if (dateStr.includes('T') || dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr.split('T')[0] // Return just date part
      }
      // Try to parse and format
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch (e) {
      // If parsing fails, return undefined
    }
    return undefined
  }

  const startDate = formatDate(course.courseSessionStartDate)
  const endDate = formatDate(course.courseSessionEndDate)

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${course.courseNumber}: ${course.courseTitle}`,
    "description": course.courseDescription || "Course offered at Yale School of Management",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Yale School of Management",
      "sameAs": "https://som.yale.edu",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "165 Whitney Avenue",
        "addressLocality": "New Haven",
        "addressRegion": "CT",
        "postalCode": "06511",
        "addressCountry": "US"
      }
    }
  }

  // Add course instance if we have date information
  if (startDate && endDate) {
    structuredData.hasCourseInstance = {
      "@type": "CourseInstance",
      "courseMode": "onsite",
      "startDate": startDate,
      "endDate": endDate,
      "location": {
        "@type": "Place",
        "name": "Yale School of Management",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "165 Whitney Avenue",
          "addressLocality": "New Haven",
          "addressRegion": "CT",
          "postalCode": "06511",
          "addressCountry": "US"
        }
      }
    }

    // Add instructor information to the course instance
    if (course.instructors && course.instructors.length > 0) {
      structuredData.hasCourseInstance.instructor = course.instructors.map(instructor => ({
        "@type": "Person",
        "name": instructor.name
      }))
    }

    // Add course schedule/workload if available
    if (course.courseSession) {
      structuredData.hasCourseInstance.courseWorkload = course.courseSession
    }

    // Add meeting times if available
    if (course.daysTimes) {
      structuredData.hasCourseInstance.courseSchedule = {
        "@type": "Schedule",
        "repeatFrequency": "Weekly",
        "scheduleTimezone": "America/New_York"
      }
    }
  }

  // Add syllabus URL if available
  if (course.syllabusUrl) {
    structuredData.syllabusSections = [
      {
        "@type": "Syllabus",
        "url": course.syllabusUrl
      }
    ]
  }

  return structuredData
}

export function generateCoursesListStructuredData(courses: CourseStructuredDataProps[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": courses.slice(0, 20).map((course, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": generateCourseStructuredData(course)
    }))
  }
}

// Generate organization structured data for the main page
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Yale School of Management",
    "url": "https://som.yale.edu",
    "logo": "https://som.yale.edu/themes/custom/som/images/favicons/favicon.ico",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "165 Whitney Avenue",
      "addressLocality": "New Haven",
      "addressRegion": "CT",
      "postalCode": "06511",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://www.facebook.com/YaleSOM",
      "https://twitter.com/yalesom",
      "https://www.linkedin.com/school/yale-school-of-management",
      "https://www.instagram.com/yalesom"
    ]
  }
}

// Generate WebSite structured data
export function generateWebSiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MySOMClasses",
    "url": "https://mysomclasses.com",
    "description": "Browse, filter, and schedule courses at Yale School of Management",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://mysomclasses.com/?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
}

// Generate BreadcrumbList structured data
export function generateBreadcrumbStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://mysomclasses.com"
      }
    ]
  }
}
