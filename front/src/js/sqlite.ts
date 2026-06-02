import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

export class SQLite {
  dbName = "";
  private static connectionCache = new Map<string, SQLiteConnection>();
  private initialized = false;

  constructor(params: { dbName: string }) {
    const { dbName } = params;
    this.dbName = dbName;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    const platform = Capacitor.getPlatform();
    const sqlite = this.getConnection();
    if (platform === "web") {
      const jeepSqliteEl = document.createElement("jeep-sqlite");
      document.body.appendChild(jeepSqliteEl);
      await customElements.whenDefined("jeep-sqlite");
      await sqlite.initWebStore();
    }
  }

  private getConnection(): SQLiteConnection {
    const cacheKey = Capacitor.getPlatform();
    let conn = SQLite.connectionCache.get(cacheKey);
    if (!conn) {
      conn = new SQLiteConnection(CapacitorSQLite);
      SQLite.connectionCache.set(cacheKey, conn);
    }
    return conn;
  }

  async dbConnection(): Promise<SQLiteDBConnection> {
    const sqlite = this.getConnection();
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_vite", false)).result;
    let db: SQLiteDBConnection;
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
    if (!(await db.isDBOpen()).result) {
      await db.open();
    }
    return db;
  }

  async createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await this.dbConnection();
      const respCT = await db.execute(query);
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

    try {
      const db = await this.dbConnection();
      const result = (await db.query(query, values)).values as any[];
      return { id: result[0].id };
    } catch (error) {
      throw error;
    }
  }

  async getData(params: { query: string }): Promise<any> {
    const { query } = params;

    try {
      const db = await this.dbConnection();
      return (await db.query(query)).values ?? [];
    } catch (error) {
      throw error;
    }
  }

  async updateData(params: { query: string; values: any[] }): Promise<void> {
    const { query, values } = params;

    try {
      const db = await this.dbConnection();
      await db.query(query, values);
    } catch (error) {
      throw error;
    }
  }

  async deleteData(params: { query: string }): Promise<void> {
    const { query } = params;

    try {
      const db = await this.dbConnection();
      await db.query(query);
    } catch (error) {
      throw error;
    }
  }
}
