import { DBService } from "@/services/dbService";

export class DBCOntroller {
  dbService: DBService;

  constructor(params: { dbService: DBService }) {
    const { dbService } = params;
    this.dbService = dbService;
  }

  async initDB(): Promise<void> {
    await this.dbService.init();
  }

  async createTable(params: { query: string }): Promise<void> {
    const { query } = params;
    await this.dbService.createTable({ query });
  }

  async insertData(params: {
    values: any[];
    fields: string[];
    tableName: string;
  }): Promise<Array<any>> {
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

    return await this.dbService.insertData({ values, query });
  }

  async getData(params: { query: string }): Promise<any> {
    const { query } = params;
    return await this.dbService.getData({ query });
  }

  async updateData(): Promise<any> {
    const query = "";
    return await this.dbService.updateData({ query });
  }

  async deleteData(): Promise<any> {
    const query = "";
    return await this.dbService.deleteData({ query });
  }
}
