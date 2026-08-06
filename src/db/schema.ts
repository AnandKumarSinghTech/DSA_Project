import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  game: text("game").notNull(), // 'nqueens', 'sudoku', 'hanoi', 'tictactoe'
  playerName: text("player_name").notNull().default("Anonymous"),
  difficulty: text("difficulty").notNull().default("medium"),
  movesCount: integer("moves_count").notNull().default(0),
  timeSeconds: integer("time_seconds").notNull().default(0),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  game: text("game").notNull(),
  status: text("status").notNull(), // 'in_progress', 'completed', 'gave_up'
  boardState: text("board_state").notNull(), // JSON
  movesHistory: text("moves_history"), // JSON
  timeSeconds: integer("time_seconds").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiHintLogs = pgTable("ai_hint_logs", {
  id: serial("id").primaryKey(),
  game: text("game").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  source: text("source").notNull().default("gemini"), // 'gemini' | 'dsa_fallback'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
