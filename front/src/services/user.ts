import { storage } from "@/main";
import apolloClient from "../Apollo";
import gql from "graphql-tag";
import { useMutation } from "@vue/apollo-composable";
// import { provideApolloClient } from "@vue/apollo-composable";
// provideApolloClient(apolloClient);

import {
  SetUserToken,
  ResendEmailConfirmation,
  Graphql,
  User,
  UserDBLocal,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { USER_MENU } from "@/utils/graphql";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { DBService } from "@/services/dbService";
import { GrapQLService } from "./graphql";
import {
  GraphQLFragmentNameUser,
  GraphQLQueryNameUser,
  UserDBType,
} from "@/utils/types";
import { SystemService } from "./system";

export class UserService {
  // services
  dbService = new DBService();
  grapQLService = new GrapQLService();
  systemService = new SystemService();

  async setUserToken(params: { token: string }): Promise<void> {
    const { token } = params;
    const fields = ["name", "token"];
    const values = ["user_auth", token];
    const db = await this.dbService.dbConnection();
    if ((await db.isDBOpen()).result == false) await db.open();

    try {
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
      query += `)`;
      await db.run(query, values);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  getUserLang(): Promise<any> {
    return storage.get("lang");
  }

  async resendEmailConfirmation(
    params: ResendEmailConfirmation,
  ): Promise<void> {
    const { onError, onDone } = useMutation(
      gql`
        mutation resendEmailConfirmation($email: String!) {
          resendEmailConfirmation(input: { email: $email })
        }
      `,
      {
        variables: {
          email: params.email,
        },
      },
    );

    onError((error) => {
      throw new Error(error.message);
    });

    return new Promise((resolve) => {
      onDone((response) => {
        resolve(response.data);
      });
    });
  }

  // TODO: create new interface for user database
  async updateLocalUser(params: { user: User }): Promise<void> {
    const { name, user: userName, email, idSync } = params.user;

    try {
      const values = [];
      const fields = [];

      if (name != undefined) {
        values.push(name);
        fields.push("name");
      }

      if (userName != undefined) {
        values.push(userName);
        fields.push("user_name");
      }

      if (email != undefined) {
        values.push(email);
        fields.push("email");
      }

      // if (!imageProfile) {
      //   values.push(imageProfile);
      //   fields.push("image_profile");
      // }

      if (idSync != undefined) {
        values.push(idSync);
        fields.push("id_sync");
      }

      let query = `UPDATE Users SET  `;

      fields.forEach((field, index) => {
        query += `${field} = ?`;
        if (index < fields.length - 1) {
          query += ", ";
        }
      });

      query += ` WHERE id="0"`;

      await this.dbService.executeQuery({
        query: query,
        values: values,
      });
      const queryss = `SELECT * FROM Users `;
      (await this.dbService.executeQuery({ query: queryss })).values![0] as any;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // TODO: remove
  async getLocalUser(): Promise<UserDBType> {
    const query = `SELECT * FROM Users inner join Tokens on user_id=1`;
    try {
      const result = (await this.dbService.executeQuery({ query }))
        .values![0] as any;
      return result ?? null;
    } catch (error: any) {
      throw Error(error);
    }
  }

  async deleteUser(paramas: { userId: string }): Promise<void> {
    const { userId } = paramas;
    const query = `DELETE FROM Users WHERE id=${userId}`;
    await this.dbService.executeQuery({ query });
  }

  async deleteUsers(): Promise<void> {
    const query = `DELETE FROM Users`;
    await this.dbService.executeQuery({ query, operationType: "delete" });
  }
}
