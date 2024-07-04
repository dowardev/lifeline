import { DB } from "@/js/db";
import { SQLite } from "@/js/sqlite";

export class TokenService {
  dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  private tableName = "Tokens";

  async getUserToken(params: { name: string; userId: string }): Promise<any> {
    const { name, userId } = params;
    const query = `SELECT token FROM ${this.tableName} WHERE user_id=${userId} AND name='${name}'`;
    const result = await this.dbc.getData({
      query,
    });
    if (result) return result[0].token;
    else return null;
  }

  // TODO: move to controller
  async setUserToken(params: {
    name: string;
    value: string;
    userId: string;
  }): Promise<void> {
    const { name, value, userId } = params;
    const values = [name, value, userId];
    const fields = ["name", "token", "user_id"];

    await this.dbc.insertData({
      fields,
      values,
      tableName: "Tokens",
    });

    (
      await this.dbc.getData({ query: "SELECT * FROM ${this.tableName}" })
    )[0] as any;
  }

  async removeUserToken(params: {
    name: string;
    userId: string;
  }): Promise<void> {
    const { name, userId } = params;
    const query = `DELETE FROM ${this.tableName} WHERE name='${name}' AND user_id=${userId}`;
    await this.dbc.deleteData({ query: query });
  }

  async removeAllTokens(): Promise<void> {
    const query = `DELETE FROM ${this.tableName}`;
    await this.dbc.deleteData({
      query: query,
    });
  }
}
