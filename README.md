# Snowboard Badge Tracker

A modern web application for tracking snowboard hill visits, analyzing progress towards seasonal goals, and monitoring weather conditions across various resorts.

## 🚀 Overview

This application allows users to:
- **Track Visits:** Record "badge-ins" at various hills, supporting both automatic syncing and manual entries.
- **Season Projections:** Visualize progress towards a seasonal goal with conservative, average, and optimistic projections.
- **Weather Integration:** View historical and current weather data (temperature and snowfall) for visit days.
- **Hill Management:** Manage multiple hills (Buck Hill, Hyland Hills, Wild Mountain, etc.) and consolidate data into unified seasons.

## 🛠 Technical Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4 + Lucide Icons + Framer Motion
- **State/Data Fetching:** TanStack Query + tRPC Client
- **UI Components:** Radix UI primitives + Shadcn-style components

### Backend
- **Runtime:** Node.js (TSX for development)
- **Framework:** Express
- **API Layer:** tRPC (Type-safe remote procedure calls)
- **Database ORM:** Drizzle ORM (MySQL)

## 💻 Local Development

### Important Note for Developers/AI Agents
This application supports a **Mock Data Mode** to allow development without a local MySQL database. 

- **Mock Mode:** If no valid `DATABASE_URL` is found in your `.env` file, the server automatically switches to mock mode.
- **Data Generation:** Deterministic mock scans, projections, and weather data will be generated.
- **AI Agent Guidance:** If you are an AI assistant working on this repo, do not assume a local database is required for UI or logic testing unless explicitly told otherwise.

### Setup
1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
2.  **Environment Variables:**
    Copy `.env.example` to `.env`. For local-only dev, you can leave the `DATABASE_URL` as a placeholder.
3.  **Run Dev Server:**
    ```bash
    npm run dev
    ```

## 🏗 Project Structure

- `client/`: React application and assets.
- `server/`: Express/tRPC server logic.
  - `server/db.ts`: Handles the database connection logic and mock data fallbacks.
  - `server/utils.ts`: Business logic for season calculations and data processing.
- `drizzle/`: Database schema and migrations.
- `shared/`: Shared types and Zod schemas between client and server.

## 🌐 Production

In production, the app connects to a **MySQL database** hosted on Railway.

### Deployment
Push to the `main` branch on GitHub to trigger a production deployment:
```bash
git add -A && git commit -m "your message" && git push origin main
```

### Database
- Migrations: `npm run db:push`
- All environment variables (`DATABASE_URL`, Google OAuth credentials, `ENCRYPTION_KEY`) must be configured in the hosting environment.

### Season Logic
- Seasons are resolved by date — a season runs from July 1 to June 30.
- The season `start_date` in the DB represents the **first badge-in**, not July 1.
- The scraper filters out entries before the current season's start boundary.
