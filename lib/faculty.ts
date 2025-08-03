export function facultyUrlFromName(name: string) {
  const [last, first] = name.split(',').map((part) => part.trim())
  if (!first || !last) return '#'
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/['’]/g, '')
      .replace(/\s+/g, '-')
  return `https://som.yale.edu/faculty-research/faculty-directory/${slugify(first)}-${slugify(last)}`
}
