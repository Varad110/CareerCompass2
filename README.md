# Campus Compass

A Next.js app for campus-level quizzes, recommendations, and user dashboards.

## Features

- Authentication (signup, login, logout, `me` route)
- Quiz engine with generation and evaluation endpoints
- Recommendation engines (adaptive, hybrid, predictive)
- Dashboard, profile, resources, and results pages
- Server-side utilities for DB, SSE, and auth

## Tech stack

- Next.js (app router)
- React
- Tailwind CSS
- MySQL (`mysql2`)
- TypeScript

## Repo layout

- `app/` — Next.js routes and UI pages
- `components/` — UI components and theme provider
- `lib/` — core libraries: auth, db, quiz-generation, recommendation engines
- `scripts/` — DB init and seed SQL
- `public/`, `styles/` — static assets and global styles

## Prerequisites

- Node.js 18+ (or the version compatible with Next.js used)
- MySQL server for development

## Setup (development)

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file (example `.env.local`) and set database credentials and any required secrets. Example variables:

- `DATABASE_URL` or connection settings for MySQL
- `JWT_SECRET` (if using JWTs)
- `OPENAI_API_KEY` (if using OpenAI integration)

3. Initialize the database (run the SQL scripts in `scripts/` or `DB_updates/`):

```bash
# run the SQL in your MySQL client, e.g.:
mysql -u user -p database_name < scripts/init-db.sql
mysql -u user -p database_name < scripts/seed-data.sql
```

4. Start the dev server:

```bash
npm run dev
```

## Available scripts

- `npm run dev` — runs Next.js in development mode
- `npm run build` — builds the production app
- `npm run start` — starts the production server
- `npm run lint` — runs ESLint

## Notes for contributors

- Follow the existing component patterns in `components/ui/`.
- Core logic lives under `lib/` — be careful when changing recommendation engines and quiz logic.
- If you change DB schema, add corresponding migration SQL in `DB_updates/` and update `scripts/` as needed.

## Where to look first

- `app/api/auth/*` — auth routes
- `lib/quiz-generation.ts`, `lib/quiz-engine.ts` — quiz logic
- `lib/recommendation-engine*.ts` — recommendation strategies

## License

This project is licensed under the MIT License — see `LICENSE`.

---
