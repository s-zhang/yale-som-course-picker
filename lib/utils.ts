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
  // If course session is not Spring/Fall/1/2, switch to "all"
  if (!courseSession || !["Spring", "Spring-1", "Spring-2", "Fall", "Fall-1", "Fall-2"].includes(courseSession)) {
    return "all"
  }

  // If user last selected "all" table view, and course is a specific session, switch to that session
  // Otherwise stay at "all"
  if (currentViewMode === "all") {
    // For specific sessions, switch to that calendar view
    if (["Spring-1", "Spring-2", "Fall-1", "Fall-2"].includes(courseSession)) {
      return courseSession
    }
    // For generic "Spring" or "Fall", default to -1 version
    if (courseSession === "Spring") {
      return "Spring-1"
    }
    if (courseSession === "Fall") {
      return "Fall-1"
    }
  }

  // For specific session courses (e.g., Spring-1), switch to that view
  if (courseSession === "Spring-1" || courseSession === "Spring-2" || 
      courseSession === "Fall-1" || courseSession === "Fall-2") {
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
