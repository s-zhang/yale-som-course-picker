# Multi-State Toggle Implementation

## Overview
This implementation replaces the simple Calendar/Table toggle with a multi-state toggle that supports session-specific calendar views.

## Features

### Toggle States
The toggle now supports the following states:
1. **Fall-1** - Calendar view showing Fall-1 and Fall courses
2. **Fall-2** - Calendar view showing Fall-2 and Fall courses
3. **Spring-1** - Calendar view showing Spring-1 and Spring courses
4. **Spring-2** - Calendar view showing Spring-2 and Spring courses
5. **All** - Table view showing all scheduled courses

### Session Mapping Logic
- Courses with session "Fall" appear in both Fall-1 and Fall-2 views
- Courses with session "Spring" appear in both Spring-1 and Spring-2 views
- Courses with session "Fall-1" appear only in Fall-1 view
- Courses with session "Fall-2" appear only in Fall-2 view
- Courses with session "Spring-1" appear only in Spring-1 view
- Courses with session "Spring-2" appear only in Spring-2 view

### UI Design
- Session toggles display a Calendar icon with the session name (e.g., "Fall-1")
- The "All" toggle displays a Table icon with the text "All"
- Only toggles for sessions present in scheduled courses are shown
- The "All" toggle is always visible

## Implementation Details

### State Management
- Replaced `activeTab` state with `viewMode` state
- `viewMode` can be: "Fall-1", "Fall-2", "Spring-1", "Spring-2", or "all"

### Key Functions

#### `availableSessions` (useMemo)
Computes which session toggles should be displayed based on scheduled courses:
```typescript
const availableSessions = React.useMemo(() => {
  const sessionSet = new Set<string>()
  scheduledCourses.forEach((course) => {
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
  return Array.from(sessionSet).sort()
}, [scheduledCourses])
```

#### `filteredScheduledCourses` (useMemo)
Filters courses based on the selected view mode:
```typescript
const filteredScheduledCourses = React.useMemo(() => {
  if (viewMode === "all") {
    return scheduledCourses
  }
  
  return scheduledCourses.filter((course) => {
    const session = course.courseSession
    if (!session) return false
    
    // Check if course matches the selected session
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
}, [scheduledCourses, viewMode])
```

### Component Changes
- Replaced `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` with `ToggleGroup` and `ToggleGroupItem`
- Updated rendering logic to use `filteredScheduledCourses` instead of `scheduledCourses`
- Updated `timeSlots` and `layoutByDay` calculations to use `filteredScheduledCourses`

## Testing
Tests have been added in `app/page.test.tsx` to verify:
1. Session mapping logic (Fall courses appear in both Fall-1 and Fall-2)
2. Session mapping logic (Spring courses appear in both Spring-1 and Spring-2)
3. Course filtering based on view mode

Run tests with:
```bash
npm test
```

## User Experience
1. When no courses are scheduled, only the "All" toggle is visible
2. When courses are added, the relevant session toggles appear dynamically
3. Clicking a session toggle shows the calendar view filtered to that session
4. Clicking "All" shows the table view with all scheduled courses
5. The calendar view automatically adjusts time slots based on filtered courses
