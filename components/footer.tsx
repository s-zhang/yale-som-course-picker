import type React from "react"

export default function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      Made by{' '}
      <a
        href="https://www.linkedin.com/in/pingshan-zhang"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        <img
          src="https://img.shields.io/badge/-LinkedIn-blue?logo=linkedin&style=social"
          alt="LinkedIn"
          className="inline h-5"
        />
      </a>{' '}
      · Support me by starring this repo on GitHub{' '}
      <a
        href="https://github.com/s-zhang/yale-som-course-picker"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        <img
          src="https://img.shields.io/github/stars/s-zhang/yale-som-course-picker?style=social"
          alt="GitHub Stars"
          className="inline h-5"
        />
      </a>
    </footer>
  )
}
