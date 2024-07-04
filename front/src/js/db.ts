import { SQLite } from "@/js/sqlite";

export class DB {
  dbSystem: SQLite;

  constructor(params: { dbSystem: SQLite }) {
    const { dbSystem } = params;
    this.dbSystem = dbSystem;
  }

  async initDB(): Promise<void> {
    await this.dbSystem.init();
  }

  async createTable(params: { query: string }): Promise<void> {
    const { query } = params;
    await this.dbSystem.createTable({ query });
  }

  async insertData(params: {
    values: any[];
    fields: string[];
    tableName: string;
  }): Promise<{ id: string }> {
    const { values, fields, tableName } = params;
    let query = `
        INSERT INTO ${tableName}(
       ${fields.join(", ")}
     )
   `;
    query += `values (`;
    for (let index = 0; index < values.length; index++) {
      if (index < fields.length - 1) query += "?, ";
      else query += "? ";
    }
    query += `)RETURNING "Id"`;

    return { id: (await this.dbSystem.insertData({ values, query })).id };
  }

  async getData(params: { query: string }): Promise<Array<any>> {
    const { query } = params;
    return await this.dbSystem.getData({ query });
  }

  async updateData(params: { query: string; values: any[] }): Promise<any> {
    const { query, values } = params;
    return await this.dbSystem.updateData({ query, values });
  }

  async deleteData(params: { query: string }): Promise<any> {
    const { query } = params;
    return await this.dbSystem.deleteData({ query });
  }
}
