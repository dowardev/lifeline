import { JeepSqlite } from "jeep-sqlite/dist/components/jeep-sqlite";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

export class DBService {
  async init(): Promise<void> {
    const platform = Capacitor.getPlatform();
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    if (platform === "web") {
      const jeepSqliteEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepSqliteEl);
      await customElements.whenDefined("jeep-sqlite");
      await sqlite.initWebStore();
    }
  }

  async dbConnection(): Promise<SQLiteDBConnection> {
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
  }

  async createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await this.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
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
}
