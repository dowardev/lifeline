import { JeepSqlite } from "jeep-sqlite/dist/components/jeep-sqlite";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

export class SQLite {
  dbName = "";

  constructor(params: { dbName: string }) {
    const { dbName } = params;
    this.dbName = dbName;
  }

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
        false,
      );
    }
    // try {
    //   if (!(await db.isDBOpen())) {
    //     await db.open();
    //   }
    // } catch (error) {
    //   console.error("Failed to open the database:", error);
    // }
    return db;
  }

  async createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await this.dbConnection();
      await db.open();
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
      throw error;
    }
  }

  async insertData(params: {
    values: any[];
    query: string;
  }): Promise<{ id: string }> {
    const { values, query } = params;
    let db = null as any;

    try {
      db = await this.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
    } catch (error) {
      throw error;
    }

    try {
      const result = (await db.query(query, values)).values;
      await db.query("Select * from Users");
      return { id: result[0].id };
    } catch (error) {
      throw error;
    }
  }

  async getData(params: { query: string }): Promise<any> {
    const { query } = params;
    let db = null as any;

    try {
      db = await this.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
    } catch (error) {
      throw error;
    }

    try {
      return (await db.query(query)).values ?? [];
    } catch (error) {
      throw error;
    }
  }

  async updateData(params: { query: string; values: any[] }): Promise<void> {
    const { query, values } = params;
    let db = null as any;

    try {
      db = await this.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
    } catch (error) {
      throw error;
    }

    try {
      await db.query(query, values);
    } catch (error) {
      throw error;
    }
  }

  async deleteData(params: { query: string }): Promise<void> {
    const { query } = params;
    let db = null as any;

    try {
      db = await this.dbConnection();
      if ((await db.isDBOpen()).result == false) await db.open();
    } catch (error) {
      throw error;
    }

    try {
      await db.query(query);
    } catch (error) {
      throw error;
    }
  }
}
