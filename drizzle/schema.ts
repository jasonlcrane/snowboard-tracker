import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Badge-in tracking table
export const badgeIns = mysqlTable("badge_ins", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("season_id").notNull(),
  badgeInDate: date("badge_in_date").notNull(),
  badgeInTime: varchar("badge_in_time", { length: 8 }),
  passType: varchar("pass_type", { length: 64 }),
  isManual: int("is_manual").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BadgeIn = typeof badgeIns.$inferSelect;
export type InsertBadgeIn = typeof badgeIns.$inferInsert;
export type ManualBadgeIn = Omit<InsertBadgeIn, 'createdAt' | 'updatedAt'> & { isManual: 1 };

// Season tracking table
export const seasons = mysqlTable("seasons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  startDate: date("start_date").notNull(),
  estimatedEndDate: date("estimated_end_date"),
  actualEndDate: date("actual_end_date"),
  status: mysqlEnum("status", ["active", "completed", "upcoming"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;

// Weather forecast cache
export const weatherForecasts = mysqlTable("weather_forecasts", {
  id: int("id").autoincrement().primaryKey(),
  forecastDate: date("forecast_date").notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  condition: varchar("condition", { length: 64 }),
  snowProbability: decimal("snow_probability", { precision: 5, scale: 2 }),
  rawData: json("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WeatherForecast = typeof weatherForecasts.$inferSelect;
export type InsertWeatherForecast = typeof weatherForecasts.$inferInsert;

// Projection history for trend tracking
export const projections = mysqlTable("projections", {
  id: int("id").autoincrement().primaryKey(),
  seasonId: int("season_id").notNull(),
  projectionDate: date("projection_date").notNull(),
  conservativeTotal: int("conservative_total"),
  averageTotal: int("average_total"),
  optimisticTotal: int("optimistic_total"),
  currentTotal: int("current_total"),
  visitRate: decimal("visit_rate", { precision: 5, scale: 2 }),
  estimatedEndDate: date("estimated_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Projection = typeof projections.$inferSelect;
export type InsertProjection = typeof projections.$inferInsert;

// Admin credentials (encrypted)
export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  encryptedUsername: text("encrypted_username").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  accountType: varchar("account_type", { length: 64 }).default("three_rivers_parks").notNull(),
  isActive: int("is_active").default(1).notNull(),
  lastScrapedAt: timestamp("last_scraped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

// Scraping logs for audit trail
export const scrapingLogs = mysqlTable("scraping_logs", {
  id: int("id").autoincrement().primaryKey(),
  credentialId: int("credential_id").notNull(),
  status: mysqlEnum("status", ["success", "failed", "partial"]).notNull(),
  badgeInsFound: int("badge_ins_found").default(0),
  badgeInsAdded: int("badge_ins_added").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type InsertScrapingLog = typeof scrapingLogs.$inferInsert;