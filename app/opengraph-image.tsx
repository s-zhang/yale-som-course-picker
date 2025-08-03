import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ef4444",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const parseTimeToMinutes = (time: string): number => {
  const [timeStr, period] = time.split(" ");
  const [hoursStr, minutesStr] = timeStr.split(":");
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const parseMeetingDays = (daysTimes: string): string[] => {
  if (!daysTimes) return [];
  const timePattern = /\d{1,2}:\d{2}\s*(AM|PM)/i;
  const timeMatch = daysTimes.match(timePattern);
  if (!timeMatch) return [];
  const daysString = daysTimes.substring(0, timeMatch.index).trim();
  const meetingDays: string[] = [];
  let i = 0;
  while (i < daysString.length) {
    const char = daysString[i];
    if (char === "T" && i + 1 < daysString.length && daysString[i + 1] === "h") {
      meetingDays.push("Thursday");
      i += 2;
    } else {
      const map: Record<string, string> = { M: "Monday", T: "Tuesday", W: "Wednesday", F: "Friday" };
      const day = map[char];
      if (day) {
        meetingDays.push(day);
        i += 1;
      } else {
        i += 1;
      }
    }
  }
  return meetingDays;
};

const getCurrentAndNextSemesters = (): string[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if ((month === 5 && day >= 16) || (month > 5 && month < 12) || (month === 12 && day <= 15)) {
    return [
      `${currentYear}03`,
      `${currentYear + 1}01`,
      `${currentYear + 1}03`,
    ];
  }
  return [
    `${currentYear}01`,
    `${currentYear}03`,
    `${currentYear + 1}01`,
  ];
};

export default async function Image(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const scheduledParam = searchParams.get("scheduled");
  if (!scheduledParam) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
          <img src="https://som.yale.edu/themes/custom/som/images/favicons/favicon.ico" width={128} height={128} />
        </div>
      ),
      { width: size.width, height: size.height }
    );
  }
  const ids = scheduledParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
          <img src="https://som.yale.edu/themes/custom/som/images/favicons/favicon.ico" width={128} height={128} />
        </div>
      ),
      { width: size.width, height: size.height }
    );
  }

  const semesters = getCurrentAndNextSemesters();
  const courseRes = await fetch(`${origin}/api/courses?semesters=${semesters.join(",")}`);
  const data = await courseRes.json();
  const allCourses = Array.isArray(data.courses) ? data.courses : [];

  const scheduledCourses: any[] = [];
  let colorIndex = 0;
  for (const id of ids) {
    const course = allCourses.find((c: any) => c.courseID === id);
    if (course) {
      scheduledCourses.push({
        ...course,
        meetingDays: parseMeetingDays(course.daysTimes),
        color: COLORS[colorIndex % COLORS.length],
      });
      colorIndex++;
    }
  }

  const calendarHeight = 480;
  const startMinutes = parseTimeToMinutes("8:00 AM");
  const totalMinutes = 12 * 60; // 8am-8pm
  const pxPerMinute = calendarHeight / totalMinutes;
  const dayWidth = size.width / DAYS.length;

  return new ImageResponse(
    (
      <div style={{ width: size.width, height: size.height, background: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: "1", position: "relative" }}>
          {DAYS.map((day, index) => (
            <div key={day} style={{ position: "absolute", top: 0, left: index * dayWidth, width: dayWidth, height: calendarHeight, borderLeft: "1px solid #e5e7eb" }} />
          ))}
          {scheduledCourses.map((course) =>
            course.meetingDays.map((day: string) => {
              const dayIndex = DAYS.indexOf(day);
              if (dayIndex === -1) return null;
              const top = (parseTimeToMinutes(course.startTime) - startMinutes) * pxPerMinute;
              const height = (parseTimeToMinutes(course.endTime) - parseTimeToMinutes(course.startTime)) * pxPerMinute;
              return (
                <div
                  key={`${course.courseID}-${day}`}
                  style={{
                    position: "absolute",
                    left: dayIndex * dayWidth + 4,
                    top,
                    width: dayWidth - 8,
                    height,
                    background: course.color,
                    color: "white",
                    fontSize: 24,
                    padding: 8,
                    boxSizing: "border-box",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                  }}
                >
                  {course.courseTitle}
                </div>
              );
            })
          )}
        </div>
      </div>
    ),
    { width: size.width, height: size.height }
  );
}
