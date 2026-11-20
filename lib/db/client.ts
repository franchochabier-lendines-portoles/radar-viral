import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createClient, type Client } from "@libsql/client";

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
  file TEXT,
  html TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

type DbState = { client: Client; ready: Promise<void> };

const globalForDb = globalThis as typeof globalThis & { radarDb?: DbState };

/**
 * Con TURSO_DATABASE_URL usa Turso (SQLite en la nube); sin ella, un archivo local
 * (RADAR_DB, por defecto data/radar.db). El resto de la app no nota la diferencia.
 */
const connect = (): DbState => {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  if (!remoteUrl) {
    const path = resolve(process.env.RADAR_DB ?? "data/radar.db");
    mkdirSync(dirname(path), { recursive: true });
  }
  const client = createClient(
    remoteUrl
      ? { url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN }
      : { url: `file:${resolve(process.env.RADAR_DB ?? "data/radar.db")}` },
  );
  const ready = client.executeMultiple(SCHEMA).then(async () => {
    // Columna añadida en 2.3: guarda el HTML del correo en la base (en la nube no hay disco)
    await client.execute("ALTER TABLE digests ADD COLUMN html TEXT").catch(() => undefined);
  });
  return { client, ready };
};

export const getDb = async (): Promise<Client> => {
  globalForDb.radarDb ??= connect();
  await globalForDb.radarDb.ready;
  return globalForDb.radarDb.client;
};
