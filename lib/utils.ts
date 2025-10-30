import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""
}

/**
 * Determines the target view mode when adding a course to the schedule
 * @param courseSession - The session of the course being added (e.g., "Spring-1", "Fall", etc.)
 * @param currentViewMode - The current view mode ("all", "Spring-1", "Spring-2", "Fall-1", "Fall-2")
 * @returns The target view mode to switch to
 */
export function getTargetViewMode(courseSession: string, currentViewMode: string): string {
  const VALID_SESSIONS = ["Spring", "Spring-1", "Spring-2", "Fall", "Fall-1", "Fall-2"]
  const SPECIFIC_SESSIONS = ["Spring-1", "Spring-2", "Fall-1", "Fall-2"]
  
  // If course session is not Spring/Fall/1/2, switch to "all"
  if (!courseSession || !VALID_SESSIONS.includes(courseSession)) {
    return "all"
  }

  // For specific session courses (e.g., Spring-1), always switch to that view
  if (SPECIFIC_SESSIONS.includes(courseSession)) {
    return courseSession
  }

  // For generic "Spring" or "Fall" courses
  if (courseSession === "Spring") {
    // If already on a Spring view, stay there
    if (currentViewMode === "Spring-1" || currentViewMode === "Spring-2") {
      return currentViewMode
    }
    // Otherwise, default to Spring-1
    return "Spring-1"
  }

  if (courseSession === "Fall") {
    // If already on a Fall view, stay there
    if (currentViewMode === "Fall-1" || currentViewMode === "Fall-2") {
      return currentViewMode
    }
    // Otherwise, default to Fall-1
    return "Fall-1"
  }

  // Default: stay at current view
  return currentViewMode
}
