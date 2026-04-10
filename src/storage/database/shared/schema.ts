import { sql } from "drizzle-orm";
import { pgTable, varchar, timestamp, boolean, serial, index } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 系统表，必须保留
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户档案表
export const profiles = pgTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().unique(),
    real_name: varchar("real_name", { length: 100 }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_user_id_idx").on(table.user_id),
  ]
);

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertProfileSchema = createCoercedInsertSchema(profiles).pick({ real_name: true });
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

// 暗恋表
export const crushes = pgTable(
  "crushes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    crush_name: varchar("crush_name", { length: 100 }).notNull(),
    birth_date: timestamp("birth_date", { withTimezone: true }),
    birth_place: varchar("birth_place", { length: 100 }),
    current_location: varchar("current_location", { length: 100 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("crushes_user_id_idx").on(table.user_id),
    index("crushes_crush_name_idx").on(table.crush_name),
  ]
);

export const insertCrushSchema = createCoercedInsertSchema(crushes).pick({
  crush_name: true,
  birth_date: true,
  birth_place: true,
  current_location: true,
});
export type Crush = typeof crushes.$inferSelect;
export type InsertCrush = z.infer<typeof insertCrushSchema>;

// 匹配表
export const matches = pgTable(
  "matches",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user1_id: varchar("user1_id", { length: 36 }).notNull(),
    user2_id: varchar("user2_id", { length: 36 }).notNull(),
    matched_at: timestamp("matched_at", { withTimezone: true }).defaultNow().notNull(),
    is_notified: boolean("is_notified").default(false).notNull(),
  },
  (table) => [
    index("matches_user1_id_idx").on(table.user1_id),
    index("matches_user2_id_idx").on(table.user2_id),
  ]
);

export type Match = typeof matches.$inferSelect;
