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
    // Return an empty array on failure instead of sample data
    return NextResponse.json(
      { courses: [], error: "Failed to fetch courses" },
      { status: 500 }
    )
  }
}
