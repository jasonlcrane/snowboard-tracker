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
