import { DBService } from "@/services/dbService";

export class TokenService {
  dbService = new DBService();

  async getToken(params: { name: string; userId: string }): Promise<any> {
    const { name, userId } = params;
    const query = `SELECT token FROM Tokens WHERE user_id=${userId} AND name='${name}'`;
    const result = (await this.dbService.executeQuery({ query: query }))
      .values![0] as any;
    if (result) return result.token;
    else return null;
  }

  async setToken(params: {
    name: string;
    value: string;
    userId: string;
  }): Promise<void> {
    const { name, value, userId } = params;
    const values = [name, value, userId];
    const fields = ["name", "token", "user_id"];

    let query = `
        INSERT INTO Tokens(
       ${fields.join(", ")}
     )

   `;
    query += `values (`;
    for (let index = 0; index < values.length; index++) {
      if (index < fields.length - 1) query += "?, ";
      else query += "? ";
    }
    query += `)RETURNING "Id"`;
    await this.dbService.executeQuery({
      query: query,
      values: values,
    });

    (await this.dbService.executeQuery({ query: "SELECT * FROM Tokens" }))
      .values![0] as any;
  }
}
