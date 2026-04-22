import * as lancedb from "@lancedb/lancedb";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../../data/lancedb");
export const TABLE_NAME = "evnmart_clothing";

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------
let _db: lancedb.Connection | null = null;

export async function getDb(): Promise<lancedb.Connection> {
  if (!_db) {
    _db = await lancedb.connect(DB_PATH);
    // console.log(`Connected to LanceDB at "${DB_PATH}"`);
  }
  return _db;
}

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------
let _table: lancedb.Table | null = null;

export async function getTable(): Promise<lancedb.Table> {
  if (_table) return _table;

  const db = await getDb();
  try {
    _table = await db.openTable(TABLE_NAME);
    // console.log(`Opened table "${TABLE_NAME}"`);
    return _table;
  } catch (err) {
    throw new Error(
      `LanceDB: Table "${TABLE_NAME}" not found. ` +
        `Run "npm run ingest" to populate the database.\n${String(err)}`,
    );
  }
}

// ---------------------------------------------------------------------------
//  Drops and recreates the table with the given initial data.
//  Used by the ingest script for clean, idempotent loads.
// ---------------------------------------------------------------------------
export async function resetTable(
  initialData: Record<string, unknown>[],
): Promise<lancedb.Table> {
  _table = null; // clear cache
  const db = await getDb();

  // Drop existing table if present
  try {
    await db.dropTable(TABLE_NAME);
    // console.log(`  🗑  Dropped existing table "${TABLE_NAME}"`);
  } catch {
    // console.log(`Table "${TABLE_NAME}" not found`);
  }

  _table = await db.createTable(TABLE_NAME, initialData);
  // console.log(
  //   ` Created table "${TABLE_NAME}" with ${initialData.length} rows`,
  // );
  return _table;
}

// Adds more rows to an existing table (batch append).
export async function addToTable(
  table: lancedb.Table,
  data: Record<string, unknown>[]
): Promise<void> {
  await table.add(data);
  // console.log(`Added ${data.length} rows to table "${TABLE_NAME}"`);
}
