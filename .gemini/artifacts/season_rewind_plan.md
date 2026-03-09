# Season Rewind — Implementation Plan

> A Spotify Wrapped–style, scrollable story experience that celebrates the season with fun stats, superlatives, and shareable cards.

---

## 🎯 Concept

When the season is winding down (or completed), the user can tap **"Season Rewind"** from the Dashboard or Header and get a full-screen, card-by-card animated recap of their season. Each card reveals a stat with motion, color, and personality — like Spotify Wrapped, but for snowboarding.

---

## 📐 Architecture Overview

### What Already Exists (we can leverage)
| Data Source | Where | What it gives us |
|---|---|---|
| `badge_ins` table | `drizzle/schema.ts` | Every hill day: date, time, hill name (`passType`), manual vs. scraped |
| `seasons` table | `drizzle/schema.ts` | Season boundaries, goal, status |
| `weather_cache` table | `drizzle/schema.ts` | Temp high/low, snowfall, conditions per date |
| `getSeasonStats` | `server/routers/badge.ts` | Total visits, visit rate, projections, goal progress |
| `getAllBadgeIns` | `server/routers/badge.ts` | Full badge-in list with joined weather data |
| `getWeeklyBreakdown` | `server/routers/badge.ts` | Weekly counts |
| `getDailyBreakdown` | `server/routers/badge.ts` | Daily counts |
| `getTemperatureAnalysis` | `server/routers/weather.ts` | Temp ranges, sweet spot |
| `getCumulativePace` | `server/routers/badge.ts` | Cumulative progress over time |

### What We Need to Build

| Layer | New | Notes |
|---|---|---|
| **Backend** | `rewind` tRPC router | Single procedure that aggregates all rewind stats for a given season |
| **Frontend** | `SeasonRewind.tsx` page | Full-screen animated card deck |
| **Frontend** | `RewindCard.tsx` components | Individual themed stat cards (10 total) |
| **Frontend** | Route `/rewind` or `/rewind/:seasonId` | New route in `App.tsx` |
| **Frontend** | Entry point button | Dashboard card + Header link (shown when season is active/completed) |

---

## 🃏 The Cards (Story Sequence)

Each card is a full-viewport slide with its own color palette, icon, animation, and stat.

### Card 1: **The Opener**
> "Your 2025/2026 Season Rewind"

- Season name, date range (first day → last day or today)
- Snowboarder silhouette animation
- Tap/scroll to begin

### Card 2: **Total Hill Days** 🎿
> "You hit the slopes **34 times** this season!"

- Data: `badge_ins.length` for the season
- Animation: Counter rolls up from 0
- Sub-stat: "That's **X days per week** on average"

### Card 3: **Home Mountain** 🏔️
> "Your favorite hill was **Hyland Hills** with 28 visits"

- Data: Group `badge_ins` by `passType` (hill name), find the max
- Pie/donut chart showing hill distribution
- If only one hill, reframe as "You're a loyal local — all **X** days at {hill}"

### Card 4: **Biggest Streak** 🔥
> "Your longest run: **4 weeks in a row**"

- Data: Compute from weekly breakdown — consecutive weeks with ≥1 visit
- Animation: Streak counter flame effect
- Sub-stat: "From {start_date} to {end_date}"

### Card 5: **Coldest Day Out** 🥶
> "Bravest ride: **-2°F** on January 18th"

- Data: Join `badge_ins` with `weather_cache`, find the lowest `tempLow` (or avg temp)
- Animation: Frost/ice crystal effect
- Sub-stat: "Only **X%** of your days were below 10°F"

### Card 6: **Best Powder Day** 🌨️
> "Best snow day: **6.2 inches** on February 3rd"

- Data: Join `badge_ins` with `weather_cache`, find the highest `snowfall`
- Animation: Falling snow particles
- Sub-stat: "Total snowfall on your hill days: **X inches**"

### Card 7: **Day of the Week** 📅
> "You ride hardest on **Saturdays**"

- Data: Group `badge_ins` by day of week
- Mini bar chart showing day-of-week distribution
- Sub-stat: "Sundays came in second with X visits"

### Card 8: **Goal Tracker** 📈
> "You crushed your goal of 50 — finishing with **52 days!**" or "You're at **34 of 50** — X days to go!"

- Data: `season.goal` vs `badge_ins.length`
- Progress ring animation fills to percentage
- Different treatment for met vs. in-progress

### Card 9: **Month-by-Month** 📊
> "Your busiest month was **January** with 12 days"

- Data: Group `badge_ins` by calendar month
- Horizontal bar chart, each month gets a row
- Animation: Bars slide in sequentially

### Card 10: **Season Summary** 🏆
> The big finale card

- Total days, favorite hill, temp sweet spot, coldest day survived
- A "Season Score" — fun composite metric (e.g., out of 100)
- **Share Button** — generates a shareable image (canvas-to-PNG) or screenshot-friendly layout
- "See you next season! ❄️"

---

## 🛠 Implementation Phases

### Phase 1: Backend — `getSeasonRewind` Procedure
**File:** `server/routers/rewind.ts` (new)

```
rewindRouter = router({
  getSeasonRewind: publicProcedure
    .input(z.object({ seasonId: z.number().optional() }))
    .query(async ({ input }) => { ... })
})
```

**Computes and returns:**
```typescript
interface SeasonRewindData {
  season: { name, startDate, endDate, goal, status }
  totalDays: number
  avgDaysPerWeek: number
  hillBreakdown: { hill: string, count: number }[]
  favoriteHill: { hill: string, count: number }
  longestStreak: { weeks: number, startDate: string, endDate: string }
  coldestDay: { date: string, tempLow: number, tempAvg: number } | null
  bestPowderDay: { date: string, snowfall: number } | null
  totalSnowfallOnHillDays: number
  dayOfWeekBreakdown: { day: string, count: number }[]
  favoriteDayOfWeek: { day: string, count: number }
  goalProgress: { goal: number, current: number, met: boolean, percentage: number }
  monthlyBreakdown: { month: string, count: number }[]
  busiestMonth: { month: string, count: number }
  tempSweetSpot: string
  seasonScore: number  // fun composite 0-100
  firstDay: string
  lastDay: string
}
```

**Key logic:**
- Reuse existing `getBadgeInsBySeason()` and `getWeatherRange()` from `db.ts`
- Streak calculation: sort dates, walk weeks, track consecutive
- Season score formula: `(totalDays / goal * 40) + (streakWeeks * 5) + (coldestSurvived * 5) + ...` — weighted fun metric

**Register in:** `server/index.ts` — add `rewind: rewindRouter` to the app router

### Phase 2: Frontend — Page & Routing

**New files:**
- `client/src/pages/SeasonRewind.tsx` — The main page controller
- `client/src/components/rewind/RewindCard.tsx` — Base card wrapper (handles animation, layout)
- `client/src/components/rewind/cards/` — Individual card components:
  - `OpenerCard.tsx`
  - `TotalDaysCard.tsx`
  - `HomeMountainCard.tsx`
  - `StreakCard.tsx`
  - `ColdestDayCard.tsx`
  - `PowderDayCard.tsx`
  - `DayOfWeekCard.tsx`
  - `GoalTrackerCard.tsx`
  - `MonthlyCard.tsx`
  - `SummaryCard.tsx`

**Route:** Add to `App.tsx`:
```tsx
<Route path="/rewind" component={() => (user ? <SeasonRewind /> : <LandingPage />)} />
<Route path="/rewind/:seasonId" component={() => (user ? <SeasonRewind /> : <LandingPage />)} />
```

### Phase 3: Frontend — Card Deck UX

**Navigation:**
- Full-screen vertical scroll snap (`scroll-snap-type: y mandatory`) 
- Each card fills the viewport (`100vh`)
- Progress dots on the side showing current position
- Swipe/scroll/click to advance
- Keyboard support: arrow keys, spacebar

**Animations (Framer Motion — already in deps):**
- Cards fade + slide in on scroll into view
- Stat numbers use `useSpring` for roll-up counters
- Charts animate on entry (bars grow, rings fill)
- Background color transitions between cards
- Subtle particle effects for snow/frost cards

**Color Palette per Card:**
| Card | Background Gradient | Accent |
|---|---|---|
| Opener | Deep navy → midnight blue | Gold |
| Total Days | Electric blue → indigo | White |
| Home Mountain | Forest green → emerald | Snow white |
| Streak | Orange → amber | Dark text |
| Coldest Day | Ice blue → steel gray | Frost white |
| Powder Day | White → light blue | Navy |
| Day of Week | Purple → violet | Lavender |
| Goal Tracker | Green → teal (met) / amber → orange (in progress) | White |
| Monthly | Coral → pink | White |
| Summary | Gold → deep amber → navy | White |

### Phase 4: Share Feature

**Approach:** Use `html2canvas` or the native `<canvas>` API to render the Summary Card as a downloadable PNG.

- "Share Your Season" button on the final card
- Renders a 1080×1920 image (phone wallpaper ratio) with key stats
- Uses `navigator.share()` on mobile if available, otherwise downloads
- Fallback: "Screenshot this!" prompt

### Phase 5: Entry Points

1. **Dashboard Card** — A new card in the dashboard grid:
   - "🎬 Your Season Rewind is ready!" (if season is completed/near-end)
   - "🎬 Preview your Season Rewind so far" (if mid-season)
   - Links to `/rewind`

2. **Header Link** — Add "Rewind" to the nav alongside History/Admin

---

## 📁 File Changes Summary

| Action | File | Description |
|---|---|---|
| **Create** | `server/routers/rewind.ts` | New tRPC router with `getSeasonRewind` |
| **Edit** | `server/index.ts` | Register `rewindRouter` |
| **Create** | `client/src/pages/SeasonRewind.tsx` | Main rewind page |
| **Create** | `client/src/components/rewind/RewindCard.tsx` | Base card component |
| **Create** | `client/src/components/rewind/cards/*.tsx` | 10 individual card components |
| **Create** | `client/src/components/rewind/RewindProgress.tsx` | Dot navigation sidebar |
| **Create** | `client/src/components/rewind/ShareButton.tsx` | Share/download handler |
| **Edit** | `client/src/App.tsx` | Add `/rewind` route |
| **Edit** | `client/src/components/Header.tsx` | Add Rewind nav link |
| **Edit** | `client/src/pages/Dashboard.tsx` | Add Rewind promo card |
| **Edit** | `client/src/index.css` | Rewind-specific styles (scroll snap, gradients, particles) |
| **Edit** | `todo.md` | Track Season Rewind feature |

---

## 🧮 Season Score Formula

A fun, non-scientific composite score out of 100:

```
Score = min(100,
  (totalDays / goal × 40)           // 40 pts max — did you hit your goal?
  + (streakWeeks × 3, max 15)       // 15 pts max — consistency
  + (uniqueHills × 5, max 15)       // 15 pts max — variety
  + (coldDayBonus, max 10)          // 10 pts — bravery (days below 10°F)
  + (powderDayBonus, max 10)        // 10 pts — chasing powder (days with 2+ inches)
  + (allMonthsActive × 10)          // 10 pts — were you active every month of the season?
)
```

---

## 🚀 Estimated Effort

| Phase | Estimate |
|---|---|
| Phase 1 — Backend router | ~1 session |
| Phase 2 — Page + routing | ~1 session |
| Phase 3 — Card animations & UX | ~2 sessions |
| Phase 4 — Share feature | ~1 session |
| Phase 5 — Entry points + polish | ~1 session |
| **Total** | **~6 sessions** |

---

## 💡 Future Enhancements
- **Year-over-year comparison** when multiple completed seasons exist
- **Animated snow particle background** using a lightweight canvas library
- **Sound effects** (optional toggle) — whoosh on card transitions
- **"Badges" system** — unlock achievements (e.g., "Sub-Zero Hero", "Powder Hound")
- **Social media–formatted export** (IG story, Twitter card dimensions)
