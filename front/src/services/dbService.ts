import { JeepSqlite } from "jeep-sqlite/dist/components/jeep-sqlite";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";

customElements.define("jeep-sqlite", JeepSqlite);
export async function dbConnection(): Promise<SQLiteDBConnection> {
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_vite", false)).result;
    let db = null;
    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("db_vite", false);
    } else {
      db = await sqlite.createConnection(
        "db_vite",
        false,
        "no-encryption",
        1,
        false
      );
    }
    return db;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function createTable(params: {
  query: any;
  db: SQLiteDBConnection;
}): Promise<void> {
  try {
    const { query, db } = params;
    const queryCreateTable = query;
    const respCT = await db.execute(queryCreateTable);
    if (
      respCT.changes &&
      respCT.changes.changes &&
      respCT.changes.changes < 0
    ) {
      throw new Error(`Error: execute failed`);
    }
  } catch (error: any) {
    throw new Error(error);
  }
}
