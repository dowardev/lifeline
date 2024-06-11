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
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { USER_MENU } from "@/utils/graphql";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";
import { DBService } from "@/services/dbService";
import { GrapQLService } from "./graphql";
import { GraphQLFragmentNameUser, GraphQLQueryNameUser } from "@/utils/types";

export class UserService {
  dbService = new DBService();
  grapQLService = new GrapQLService();

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

  async getUserToken(): Promise<string> {
    try {
      return await storage.get("authToken");
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async getUser(params: {
    refetch: boolean;
    queryName: GraphQLQueryNameUser;
    fragmentName: GraphQLFragmentNameUser;
  }): Promise<User> {
    const { refetch, queryName, fragmentName } = params;
    const graphql = { name: queryName, fragment: fragmentName };
    const queryDocument = this.grapQLService.getQuery({ name: queryName });

    try {
      const query = this.grapQLService.graphqlQueryBuilder({
        name: queryDocument,
        fragment: graphql.fragment,
        mutationName: "userAuth",
      });

      let response = await this.grapQLService.executeGrapQuery({
        query,
        options: { refetch },
      });
      if (response) {
        response = {
          id: response.value.userAuth.user.id,
          name: response.value.userAuth.user.name,
          email: response.value.userAuth.user.email,
          user: response.value.userAuth.user.user,
          imageProfile: response.value.userAuth.user.image_profile,
          isAdmin: response.value.userAuth.user.is_admin,
        };
        return response;
      }
      return {} as User;
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
}
