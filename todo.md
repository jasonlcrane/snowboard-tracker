# Carter Badge Tracker - Project TODO

## Local Development (Chromebook/Docker)
- **Dev Mode**: The app now supports a "headless" dev mode. If MySQL is not running locally, the app will automatically fall back to mock data.
- **Auth Bypass**: In `NODE_ENV=development`, you will be automatically logged in as a mock admin user.
- **Running**: Just run `npm run dev` and visit `http://localhost:3000`.

## Core Features

### Phase 1: Database & Schema
- [x] Define badge-in data model (date, time, user, season)
- [x] Create season tracking table (start date, end date, status)
- [x] Create weather forecast cache table
- [x] Create projection history table for trend tracking
- [x] Create admin credentials table (encrypted storage)
- [x] Create scraping logs table for audit trail
- [x] Run database migrations

### Phase 2: Backend - Scraping & Weather
- [x] Implement Three Rivers Parks account scraper (placeholder)
- [x] Add credential encryption/decryption utilities
- [x] Implement weather API integration (OpenWeather or similar)
- [x] Build projection calculation engine (Conservative/Average/Optimistic)
- [x] Create tRPC procedures for data fetching
- [x] Add error handling and retry logic for scraping
- [x] Implement scraping logs and audit trail

### Phase 3: Frontend - Dashboard
- [x] Design dark theme color palette and typography
- [x] Build main dashboard layout with sidebar
- [x] Implement season statistics card (total visits, rate, days remaining)
- [x] Create weekly badge-ins bar chart (Recharts)
- [x] Create daily timeline visualization
- [x] Create cumulative progress tracker
- [x] Add projection scenarios display (Conservative/Average/Optimistic)
- [x] Implement real-time data refresh

### Phase 4: Admin Panel
- [x] Build credentials management page
- [x] Implement secure credential input and storage
- [x] Create scraping logs viewer
- [x] Add manual scrape trigger button
- [ ] Build season management interface
- [x] Add user authentication/authorization checks

### Phase 5: Advanced Features
- [ ] Implement scheduled job for daily updates
- [ ] Add PDF export functionality for charts
- [ ] Add image export for individual charts
- [ ] Implement mobile-responsive design
- [ ] Add dark theme toggle (if needed)
- [ ] Create historical trend analysis view
- [ ] Add multiple season comparison

### Phase 6: Testing & Deployment
- [ ] Write vitest tests for projection calculations
- [ ] Write vitest tests for scraping logic
- [ ] Test mobile responsiveness
- [ ] Performance optimization
- [ ] Create checkpoint before final deployment
- [ ] Deploy to production

## Bug Fixes & Improvements
(To be added as discovered)


## New Features - Manual Badge-In Entries

- [x] Add isManual flag to badge_ins table
- [x] Create tRPC procedure for adding manual badge-ins
- [x] Build manual entry form UI (date, time, notes)
- [x] Add manual entries to dashboard statistics
- [x] Create manual entries management view
- [x] Add ability to edit/delete manual entries
- [x] Write tests for manual entry logic


## Scraper Implementation

- [x] Install Puppeteer dependency
- [x] Create scraper service with login logic
- [x] Implement badge-in history extraction
- [x] Add credential decryption for scraper use
- [x] Integrate scraper with manual trigger
- [x] Add error handling and logging
- [x] Write tests for scraper (mocked)
- [ ] Test scraper with real account (manual testing)


## Season Rewind (Spotify Wrapped–Style Recap)

> Full plan: `.gemini/artifacts/season_rewind_plan.md`

### Phase 1: Backend
- [x] Create `server/routers/rewind.ts` with `getSeasonRewind` procedure
- [x] Aggregate stats: total days, hill breakdown, streaks, weather superlatives, goal progress, monthly breakdown, season score
- [x] Register `rewindRouter` in `server/index.ts`

### Phase 2: Page & Routing
- [x] Create `SeasonRewind.tsx` page
- [x] Add `/rewind` and `/rewind/:seasonId` routes in `App.tsx`

### Phase 3: Card Deck UX (10 Cards)
- [x] Opener card (season name, date range)
- [x] Total Hill Days card (counter animation)
- [x] Home Mountain card (hill breakdown donut)
- [x] Biggest Streak card (consecutive weeks)
- [x] Coldest Day card (weather data)
- [x] Best Powder Day card (snowfall data)
- [x] Day of Week card (distribution chart)
- [x] Goal Tracker card (progress ring)
- [x] Month-by-Month card (horizontal bars)
- [x] Season Summary card (composite score + finale)
- [x] Full-screen scroll-snap navigation + progress dots
- [x] Framer Motion animations per card

### Phase 4: Share Feature
- [x] Canvas-to-PNG export of summary card
- [x] Native share API or download fallback

### Phase 5: Entry Points & Polish
- [x] Dashboard promo card linking to `/rewind`
- [x] Header nav link for Rewind

### Future: Season Rewind Enhancements
- [ ] Public shareable link (`/rewind/share/:token`) — anyone can view a read-only rewind without logging in
- [ ] Burn site URL into the share image for brand awareness
- [ ] Per-card image export — share individual stat cards as separate IG Story slides
- [ ] Animated video export (Canvas + MediaRecorder + ffmpeg.wasm → MP4 for IG Reels)
- [ ] Season selector — `/rewind/:seasonId` for viewing past seasons
- [ ] Year-over-year comparison once 2+ seasons exist
- [ ] Achievement badges ("Sub-Zero Hero", "Powder Hound", etc.)
