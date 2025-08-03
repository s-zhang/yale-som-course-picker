import { describe, it, expect } from 'vitest'
import { facultyUrlFromName } from './faculty'

describe('facultyUrlFromName', () => {
  it('converts "Ghosh, Asha" to profile URL', () => {
    expect(facultyUrlFromName('Ghosh, Asha')).toBe(
      'https://som.yale.edu/faculty-research/faculty-directory/asha-ghosh'
    )
  })

  it('handles initials and punctuation', () => {
    expect(facultyUrlFromName('Wasserstein, A.J.')).toBe(
      'https://som.yale.edu/faculty-research/faculty-directory/aj-wasserstein'
    )
  })

  it('returns # for malformed names', () => {
    expect(facultyUrlFromName('SingleName')).toBe('#')
  })
})
