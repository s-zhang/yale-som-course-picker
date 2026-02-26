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
    let semestersWithCourses = 0

    // Fetch courses from newest to oldest and stop after two non-empty semesters
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
          if (courses.length > 0) {
            allCourses.push(...courses)
            semestersWithCourses += 1

            if (semestersWithCourses >= 2) {
              break
            }
          }
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
