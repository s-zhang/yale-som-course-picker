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
}

export function generateCourseStructuredData(course: CourseStructuredDataProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${course.courseNumber}: ${course.courseTitle}`,
    "description": course.courseDescription,
    "provider": {
      "@type": "Organization",
      "name": "Yale School of Management",
      "sameAs": "https://som.yale.edu"
    },
    ...(course.instructors && course.instructors.length > 0 && {
      "instructor": course.instructors.map(instructor => ({
        "@type": "Person",
        "name": instructor.name,
        ...(instructor.email && { "email": instructor.email })
      }))
    }),
    ...(course.courseSessionStartDate && course.courseSessionEndDate && {
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "onsite",
        "courseWorkload": course.courseSession,
        "startDate": course.courseSessionStartDate,
        "endDate": course.courseSessionEndDate,
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
    })
  }
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
