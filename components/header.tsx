import type React from "react"

export default function Header() {
  return (
    <header className="py-2 text-center text-sm text-muted-foreground">
      Made by{' '}
      <a
        href="https://www.linkedin.com/in/pingshan-zhang"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Pingshan Zhang, MBA
      </a>
      . Support me by{' '}
      <a
        href="https://github.com/s-zhang/yale-som-course-picker"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        starring this repo on GitHub
      </a>
      .
    </header>
  )
}
