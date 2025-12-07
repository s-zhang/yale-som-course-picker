# SEO Implementation

This document describes the SEO optimizations implemented for MySOMClasses.

## Features Implemented

### 1. Robots.txt
- Location: `/public/robots.txt`
- Allows all search engines to crawl the site
- References the sitemap location

### 2. Sitemap
- Location: `/app/sitemap.ts`
- Dynamically generated sitemap using Next.js 15 native support
- Updates automatically with the site

### 3. Enhanced Metadata
- **OpenGraph**: Full OpenGraph support for social media sharing
- **Twitter Cards**: Twitter card meta tags for better Twitter previews
- **Keywords**: Relevant keywords for search engines
- **Canonical URLs**: Proper canonical URL configuration
- **Robots directives**: Optimized robot directives for Google

### 4. Structured Data (JSON-LD)

Following [Google's Course Structured Data guidelines](https://developers.google.com/search/docs/appearance/structured-data/course), we implement:

#### Course Structured Data
Each course includes:
- `@type: "Course"` - Course type definition
- `name` - Course number and title
- `description` - Course description
- `provider` - Yale School of Management as EducationalOrganization
- `hasCourseInstance` - Course instance details including:
  - `courseMode: "onsite"` - On-site course delivery
  - `startDate` and `endDate` - ISO 8601 formatted dates
  - `instructor` - Array of instructors (Person type)
  - `location` - Yale SOM location with full address
  - `courseSchedule` - Weekly schedule information
- `syllabusSections` - Links to course syllabi when available

#### ItemList Structured Data
- Lists up to 20 courses for better search indexing
- Each course is a ListItem with proper position

#### WebSite Structured Data
- Defines the website with SearchAction
- Enables Google search box on search results

#### EducationalOrganization Structured Data
- Defines Yale School of Management
- Includes social media profiles (sameAs)
- Full contact and location information

## Testing Structured Data

### Automated Tests
Run the test suite to validate structured data generation:
```bash
pnpm test structured-data.test.ts
```

### Google Rich Results Test
Test your structured data using Google's tools:
1. Visit: https://search.google.com/test/rich-results
2. Enter the URL: https://mysomclasses.com
3. Review the results for any warnings or errors

### Schema.org Validator
Validate against schema.org:
1. Visit: https://validator.schema.org/
2. Paste the JSON-LD from the page source
3. Check for validation errors

## Best Practices Followed

1. **Required Properties**: All required properties per Google's guidelines are included
2. **Date Format**: ISO 8601 date format (YYYY-MM-DD) for all dates
3. **Provider Type**: Using `EducationalOrganization` instead of generic `Organization`
4. **Instructor Information**: Including instructor details in CourseInstance
5. **Location Data**: Full postal address for better local SEO
6. **Multiple Structured Data Types**: Using WebSite, Organization, and Course types together
7. **Unique IDs**: Each JSON-LD script has a unique ID to prevent conflicts

## Monitoring and Maintenance

### Google Search Console
After deployment, monitor the site in Google Search Console:
1. Check for structured data errors
2. Monitor rich results performance
3. Review search analytics for course-related queries

### Regular Updates
- Keep structured data synchronized with course information
- Update organization details if Yale SOM changes contact information
- Monitor Google's structured data guidelines for updates

## References

- [Google Course Structured Data](https://developers.google.com/search/docs/appearance/structured-data/course)
- [Schema.org Course](https://schema.org/Course)
- [Schema.org CourseInstance](https://schema.org/CourseInstance)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
