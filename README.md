# SOM Course Picker

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/personal-18b67004/v0-yale-som-course-picker)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/AX0giZiARrv)

Yale SOM Course Picker is a scheduling tool for browsing and organizing courses offered at the Yale School of Management. It is built with Next.js and React and includes an interactive calendar view for planning your semester.

## Features

- Fetch course information from the SOM course API
- Filter by semester and program
- Add courses to a personal schedule view
- Track usage anonymously via Vercel Web Analytics

## Getting Started

Install dependencies and start the development server:

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

To create a production build:

\`\`\`bash
pnpm build
\`\`\`

## Deployment

The repository contains GitHub Actions workflows that deploy to Vercel. Adjust `vercel.json` or the workflow files if you fork this project.

## License

Released under the [MIT License](LICENSE).
