import type React from "react";

export default function Footer() {
  return (
    <footer className="py-4 text-center text-sm text-muted-foreground space-y-1 sm:space-y-0">
      <span className="block sm:inline">
        Made by{" "}
        <a
          href="https://www.linkedin.com/in/pingshan-zhang"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Pingshan Zhang, MBA '26
        </a>
        .
      </span>{" "}
      <span className="block sm:inline">
        Support me by{" "}
        <a
          href="https://github.com/s-zhang/yale-som-course-picker"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          starring this repo on GitHub
        </a>{" "}
        :)
      </span>
    </footer>
  );
}
