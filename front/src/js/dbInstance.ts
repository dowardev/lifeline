import { SQLite } from "./sqlite";
import { DB } from "./db";

let dbInstance: DB | null = null;

export function getDB(): DB {
  if (!dbInstance) {
    dbInstance = new DB({
      dbSystem: new SQLite({ dbName: "db_vite" }),
    });
  }
  return dbInstance;
}

export async function initDB(): Promise<void> {
  const db = getDB();
  await db.initDB();
}
