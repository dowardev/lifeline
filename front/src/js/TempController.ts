import { SQLite } from "@/js/sqlite";
import { DB } from "./db";

export class TempController {
  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });

  async createTableUsers(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS users
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      user_name TEXT,
      email TEXT,
      is_admin BOOLEAN,
      rol TEXT
      image_profile TEXT,
      id_sync TEXT
    );`;
    await this.dbc.createTable({ query });
  }

  async createTableUsersLogged(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS users_logged
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      status INTEGER
    );`;
    await this.dbc.createTable({ query });
  }

  async createTableTokens(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Tokens
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      token TEXT,
      user_id INTEGER REFERENCES Users(id)
    );`;
    await this.dbc.createTable({ query });
  }

  async createTableEvents(): Promise<void> {
    // const query = `CREATE TABLE IF NOT EXISTS Events
    // (
    //   id INTEGER PRIMARY KEY AUTOINCREMENT,
    //   name TEXT,
    //   guests TEXT,
    //   timezone TEXT,
    //   description TEXT,
    //   availability TEXT,
    //   idSync INT,
    //   syncStatus BOOLEAN,
    //   status TEXT
    // );`;
    const query = `CREATE TABLE IF NOT EXISTS Events
    (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idSync INT,
      name TEXT,
      guests TEXT,
      timezone TEXT,
      description TEXT,
      availability TEXT,
      syncStatus BOOLEAN,
      status TEXT,
      UNIQUE(idSync)
    );`;
    await this.dbc.createTable({ query });
  }

  async createTableReminders(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES EVENTS(id),
      start TEXT,
      end TEXT,
      notifications TEXT NULL,
      repeat Boolean NULL,
      frecuency INT NULL,
      type TEXT NULL,
      daysWeek TEXT NULL,
      id_reminders TEXT NULL
    );`;
    await this.dbc.createTable({ query });
  }

  async testQuery(): Promise<void> {
    const result = await this.dbc.getData({
      query: "SELECT name FROM sqlite_master WHERE type='table';",
    });
    console.log(result);
  }
}
