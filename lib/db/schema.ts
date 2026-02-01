import {
  pgTable,
  text,
  timestamp,
  varchar,
  uuid,
  primaryKey,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users - synced from Clerk
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  languagePreference: varchar("language_preference", { length: 10 })
    .notNull()
    .default("en"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessionParticipants: many(sessionParticipants),
  messages: many(messages),
  languagePreferences: many(userLanguagePreferences),
}));

// User Language Preferences - multiple languages per user with priority
export const userLanguagePreferences = pgTable(
  "user_language_preferences",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    languageCode: varchar("language_code", { length: 10 }).notNull(),
    priority: integer("priority").notNull().default(0), // 0 = primary
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.languageCode] }),
    index("user_lang_pref_user_idx").on(table.userId),
  ]
);

export const userLanguagePreferencesRelations = relations(
  userLanguagePreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userLanguagePreferences.userId],
      references: [users.id],
    }),
  })
);

// Sessions - chat rooms with shareable codes
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 8 }).notNull().unique(), // 8-char shareable code
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at"), // null = never expires
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sessions_code_idx").on(table.code)]
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  creator: one(users, {
    fields: [sessions.creatorId],
    references: [users.id],
  }),
  participants: many(sessionParticipants),
  messages: many(messages),
}));

// Session Participants - who joined which session
export const sessionParticipants = pgTable(
  "session_participants",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.userId] })]
);

export const sessionParticipantsRelations = relations(
  sessionParticipants,
  ({ one }) => ({
    session: one(sessions, {
      fields: [sessionParticipants.sessionId],
      references: [sessions.id],
    }),
    user: one(users, {
      fields: [sessionParticipants.userId],
      references: [users.id],
    }),
  })
);

// Messages - persistent message storage
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    originalLanguage: varchar("original_language", { length: 10 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_session_idx").on(table.sessionId),
    index("messages_created_at_idx").on(table.createdAt),
  ]
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  translations: many(translations),
}));

// Translations - cache translations per message per language
export const translations = pgTable(
  "translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    targetLanguage: varchar("target_language", { length: 10 }).notNull(),
    translatedContent: text("translated_content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("translations_message_lang_idx").on(
      table.messageId,
      table.targetLanguage
    ),
  ]
);

export const translationsRelations = relations(translations, ({ one }) => ({
  message: one(messages, {
    fields: [translations.messageId],
    references: [messages.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type NewSessionParticipant = typeof sessionParticipants.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Translation = typeof translations.$inferSelect;
export type NewTranslation = typeof translations.$inferInsert;
export type UserLanguagePreference = typeof userLanguagePreferences.$inferSelect;
export type NewUserLanguagePreference = typeof userLanguagePreferences.$inferInsert;
