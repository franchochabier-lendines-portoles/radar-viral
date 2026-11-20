import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  payload TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  score INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stories_updated ON stories (updated_at);

CREATE TABLE IF NOT EXISTS snapshots (
  story_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  score INTEGER NOT NULL,
  coverage INTEGER NOT NULL,
  PRIMARY KEY (story_id, at)
);

CREATE TABLE IF NOT EXISTS trends (
  country TEXT NOT NULL,
  query TEXT NOT NULL,
  traffic INTEGER NOT NULL,
  at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS digests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sent_at INTEGER NOT NULL,
  recipients TEXT NOT NULL,
  mode TEXT NOT NULL,
  story_count INTEGER NOT NULL,
  file TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const globalForDb = globalThis as typeof globalThis & { radarDb?: Database.Database };

export const dbPath = (): string => resolve(process.env.RADAR_DB ?? "data/radar.db");

export const getDb = (): Database.Database => {
  if (globalForDb.radarDb) return globalForDb.radarDb;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  globalForDb.radarDb = db;
  return db;
};
