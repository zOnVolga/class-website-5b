import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Ensure db directory exists
import { mkdirSync } from 'fs';
import { join } from 'path';

const dbDir = join(process.cwd(), 'db');
mkdirSync(dbDir, { recursive: true });

const sqlite = new Database(join(dbDir, 'custom.db'));
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export { schema };