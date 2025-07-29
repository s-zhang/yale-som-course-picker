import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const semestersParam = searchParams.get("semesters")

    if (!semestersParam) {
      return NextResponse.json({ error: "Semester codes are required" }, { status: 400 })
    }

    const semesterCodes = semestersParam.split(",")
    const allCourses: any[] = []

    // Fetch courses from all semester codes
    for (const semesterCode of semesterCodes) {
      try {
        console.log(`Fetching courses for semester: ${semesterCode}`)
        const response = await fetch(`https://som.yale.edu/courses/session-items/${semesterCode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Add any required parameters for the API call
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const courses = data.data?.items || []
          console.log(`Found ${courses.length} courses for semester ${semesterCode}`)
          allCourses.push(...courses)
        } else {
          console.warn(`Failed to fetch courses for semester ${semesterCode}: ${response.status}`)
        }
      } catch (semesterError) {
        console.error(`Error fetching courses for semester ${semesterCode}:`, semesterError)
        // Continue with other semesters even if one fails
      }
    }

    console.log(`Total courses fetched: ${allCourses.length}`)
    return NextResponse.json({
      courses: allCourses,
    })
  } catch (error) {
    console.error("Error fetching courses:", error)

    // Return mock data for development
    const mockCourses = [
      {
        courseCategory: "Core",
        courseID: "21927",
        courseNumber: "MGT 408",
        courseTitle: "Introduction to Negotiation",
        courseSession: "spring-1",
        courseSessionStartDate: "20250121 000000.000",
        courseSessionEndDate: "20260212 000000.000",
        enrollmentLimit: "75",
        courseDescription:
          "The course objective is to learn a conceptual framework for analyzing and shaping negotiation processes and outcomes. Negotiation can be broken down into two basic activities: creating value and capturing value.",
        faculty1: "Nalebuff, Barry",
        faculty2: "Cain, Daylian",
        faculty1Email: "barry.nalebuff@yale.edu",
        faculty2Email: "daylian.cain@yale.edu",
        termCode: "202601",
        courseType: "core",
        units: "1.0",
        section: "01",
        cohort: "GOLD",
        daysTimes: "W 10:10 AM-12:10 PM",
        day: "W",
        startTime: "10:10 AM",
        endTime: "12:10 PM",
        room: "Room 101",
      },
      {
        courseCategory: "Finance",
        courseID: "22089",
        courseNumber: "MGT 945",
        courseTitle: "Macroprudential Policy",
        courseSession: "spring",
        courseSessionStartDate: "20260120 000000.000",
        courseSessionEndDate: "20260508 000000.000",
        enrollmentLimit: "48",
        courseDescription:
          "Advanced course covering macroprudential policy frameworks and their implementation in modern financial systems.",
        faculty1: "Metrick, Andrew",
        faculty1Email: "andrew.metrick@yale.edu",
        termCode: "202601",
        courseType: "elective",
        units: "4.0",
        section: "01",
        daysTimes: "T R 2:00 PM-3:30 PM",
        day: "T",
        startTime: "2:00 PM",
        endTime: "3:30 PM",
        room: "Room 205",
      },
      {
        courseCategory: "Marketing",
        courseID: "22090",
        courseNumber: "MGT 567",
        courseTitle: "Digital Marketing Strategy",
        courseSession: "spring",
        courseSessionStartDate: "20260120 000000.000",
        courseSessionEndDate: "20260508 000000.000",
        enrollmentLimit: "60",
        courseDescription:
          "Comprehensive overview of digital marketing strategies, including social media, content marketing, and analytics.",
        faculty1: "Johnson, Sarah",
        faculty1Email: "sarah.johnson@yale.edu",
        termCode: "202601",
        courseType: "elective",
        units: "3.0",
        section: "01",
        daysTimes: "M W 1:00 PM-2:30 PM",
        day: "M",
        startTime: "1:00 PM",
        endTime: "2:30 PM",
        room: "Room 150",
      },
      {
        courseCategory: "Operations",
        courseID: "22091",
        courseNumber: "MGT 123",
        courseTitle: "Supply Chain Management",
        courseSession: "fall",
        courseSessionStartDate: "20250825 000000.000",
        courseSessionEndDate: "20251215 000000.000",
        enrollmentLimit: "40",
        courseDescription:
          "Comprehensive study of supply chain management principles and practices in modern business environments.",
        faculty1: "Smith, John",
        faculty1Email: "john.smith@yale.edu",
        termCode: "202503",
        courseType: "core|mms gbs",
        units: "2.0",
        section: "01",
        cohort: "BLUE",
        daysTimes: "M W F 9:00 AM-10:00 AM",
        day: "M",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
        room: "Room 301",
      },
      {
        courseCategory: "Strategy",
        courseID: "22092",
        courseNumber: "MGT 456",
        courseTitle: "Strategic Management",
        courseSession: "fall",
        courseSessionStartDate: "20250825 000000.000",
        courseSessionEndDate: "20251215 000000.000",
        enrollmentLimit: "35",
        courseDescription:
          "Advanced course in strategic management covering competitive analysis, strategic planning, and implementation.",
        faculty1: "Brown, Lisa",
        faculty1Email: "lisa.brown@yale.edu",
        termCode: "202503",
        courseType: "mam",
        units: "3.0",
        section: "01",
        daysTimes: "T Th 11:00 AM-12:30 PM",
        day: "T",
        startTime: "11:00 AM",
        endTime: "12:30 PM",
        room: "Room 402",
      },
    ]

    return NextResponse.json({
      courses: mockCourses,
    })
  }
}
