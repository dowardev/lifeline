// import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  ResendEmailConfirmation,
  SetUserToken,
  User,
  UserLogin,
  UserLoginResponse,
  UserRegister,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { SessionController } from "./sessionController";
import {
  GraphQLFragmentNameUser,
  GraphQLQueryNameUser,
  UserDBType,
  userGrapQLTypeData,
} from "@/utils/types";
import { SQLite } from "@/js/sqlite";
import { SystemController } from "./systemController";
import { ApiController } from "../js/apiController";
import { USER_LOGIN } from "@/utils/graphql";
import { DB } from "./db";
import gql from "graphql-tag";
import { useMutation } from "@vue/apollo-composable";
import { storage } from "@/main";
import { useUserStore } from "@/store/userStore";

export class UserController {
  // store
  // userStore = useUserStore();

  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  systemController = new SystemController();

  // refs = storeToRefs(this.userStore);

  // async loadUser(params: {
  //   queryName: GraphQLQueryNameUser;
  //   fragmentName: GraphQLFragmentNameUser;
  // }): Promise<void> {
  //   const { queryName, fragmentName } = params;
  //   let user = {} as User;
  //
  //   try {
  //     user = await this.getUserLogged2();
  //   } catch (error: any) {
  //     throw error;
  //   }
  //
  //   // try {
  //   //   user = await this.userService.getUser({
  //   //     refetch: true,
  //   //     queryName,
  //   //     fragmentName,
  //   //   });
  //   // } catch (error: any) {
  //   //   if (error.message != "Unauthorized" && error.message != "No token found")
  //   //     throw error;
  //   // }
  //
  //   this.updateUserProps({ user });
  // }

  updateUserProps(params: { user: User }): void {
    const { user } = params;
    this.userStore.updateUserProps({ user });
  }

  async logout(): Promise<void> {
    try {
      const sessionController = new SessionController();
      await sessionController.logoutOnServer();
      await this.systemController.deleteUserdata({
        userId: "1",
      });
    } catch (e: any) {
      throw e;
    }
  }

  updateUserTokenProp(token: string): void {
    this.userStore.updateTokenProp(token);
  }

  async userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const { user, password } = params;
    const apiController = new ApiController();

    try {
      const query = apiController.graphqlMutationBuilder({
        name: USER_LOGIN,
        fragment: "UserLogin",
        mutationName: "login",
        inputName: "LoginInput",
      });

      let response = await apiController.executeGrapMutatation({
        query,
        input: { user, password },
      });

      if (!response.login.auth) return {} as UserLoginResponse;
      response = {
        user: response.login.user,
        auth: {
          access_token: response.login.auth.access_token,
          token_type: response.login.auth.token_type,
        },
      };
      return response;
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }

  async storeUserToken(params: SetUserToken): Promise<void> {
    try {
      const { token, userId } = params;
      const values = ["auth_token", token, userId];
      const fields = ["name", "token", "user_id"];

      await this.dbc.insertData({
        values: values,
        fields,
        tableName: "Tokens",
      });

      // (
      //   await this.dbService.executeQuery({
      //     query: "SELECT * FROM Tokens",
      //     operationType: "select",
      //   })
      // ).values![0] as any;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async register(params: UserRegister): Promise<void> {
    const data = {
      name: params.name,
      email: params.email,
      user: params.user,
      password: params.password,
    };

    try {
      const sessionController = new SessionController();
      await sessionController.userRegister(data);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // async getAuthUserToken(): Promise<string | null> {
  //   try {
  //     return (await this.tokenService.getUserToken({ name: "auth_token" })) ?? null;
  //   } catch (error: any) {
  //     throw new Error(error);
  //   }
  // }

  // TODO:remove
  getUserLogged(): User {
    const userStore = useUserStore();
    const user = userStore.user;
    return user;
  }

  // async createTableUsers(): Promise<void> {
  //   const query = `CREATE TABLE IF NOT EXISTS users
  //   (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT,
  //     user_name TEXT,
  //     email TEXT,
  //     is_admin BOOLEAN,
  //     rol TEXT
  //     image_profile TEXT,
  //     id_sync TEXT
  //   );`;
  //   await this.dbc.createTable({ query });
  // }

  // async createTable(params: { query: any }): Promise<void> {
  //   try {
  //     const { query } = params;
  //     const db = await this.dbService.dbConnection();
  //     // await db.open();
  //     await this.dbc.createTable({ query, db });
  //     // await db.close();
  //   } catch (error: any) {
  //     throw new Error(error);
  //   }
  // }

  async upateUserOnDatabase(params: { user: User }): Promise<void> {
    await this.userService.updateLocalUser({ user: params.user });
  }

  async insertLocalUser(params: { user: User }): Promise<{ rowID: string }> {
    const { name, user: userName, email, token, idSync } = params.user;

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

      if (token != undefined) {
        values.push(token);
        fields.push("token");
      }

      if (idSync != undefined) {
        values.push(idSync);
        fields.push("id_sync");
      }

      const response = await this.dbc.insertData({
        values: values,
        tableName: "Users",
        fields,
      });

      // const queryss = `SELECT * FROM Users `;
      // const result = (
      //   await this.dbService.executeQuery({
      //     query: queryss,
      //     operationType: "select",
      //   })
      // ).values as any;
      return { rowID: response.id };
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async updateUserInDB(params: {
    dataType: userGrapQLTypeData;
  }): Promise<void> {
    const { dataType } = params;
    let queryName = "" as GraphQLQueryNameUser;
    let fragmentName = "" as GraphQLFragmentNameUser;

    if (dataType == "menu") {
      queryName = "USER_MENU";
      fragmentName = "UserMenu";
    }

    try {
      const userToken = await this.getAuthUserToken();
      if (userToken == null) throw new Error("Token not found");
      await this.loadUser({ queryName, fragmentName });
      const userLogged = this.getUserLogged();
      const user = await this.getLocalUser();
      userLogged.token = userToken;
      if (!user) await this.insertLocalUser({ user: userLogged });
      else await this.upateUserOnDatabase({ user: userLogged });
    } catch (error) {
      console.error(error);
    }
  }

  // TODO:update name
  async getUserLogged2(): Promise<User> {
    const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id inner join tokens on tokens.user_id = users.id`;
    try {
      const result = (await this.dbc.getData({ query }))[0] as any;
      return result ?? {};
    } catch (error: any) {
      throw error;
    }
  }

  async getUserLoggedFromServer(): Promise<User> {
    const queryName = "USER_LOGIN";
    const fragmentName = "UserLogin";
    const apiController = new ApiController();
    const queryDocument = apiController.getQuery({ name: queryName });

    try {
      //TODO: move to controller
      const query = apiController.graphqlQueryBuilder({
        name: queryDocument,
        fragment: fragmentName,
        mutationName: "userAuth",
      });

      let response = await apiController.executeGrapQuery({
        query,
        options: { refetch: true },
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
      throw error;
    }
  }

  // TODO:improve name
  async setUserToken(params: { token: string }): Promise<void> {
    const { token } = params;
    const fields = ["name", "token"];
    const values = ["user_auth", token];

    try {
      await this.dbc.insertData({ fields, values, tableName: "Tokens" });
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

      await this.dbc.updateData({
        query: query,
        values: values,
      });
      const queryss = `SELECT * FROM Users `;
      (await this.dbc.getData({ query: queryss }))[0] as any;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // TODO: remove
  async getLocalUser(): Promise<UserDBType> {
    const query = `SELECT * FROM Users inner join Tokens on user_id=1`;
    try {
      const result = (await this.dbc.getData({ query }))![0] as any;
      return result ?? null;
    } catch (error: any) {
      throw Error(error);
    }
  }

  async deleteUser(paramas: { userId: string }): Promise<void> {
    const { userId } = paramas;
    const query = `DELETE FROM Users WHERE id=${userId}`;
    await this.dbc.deleteData({ query });
  }

  async deleteUsers(): Promise<void> {
    const query = `DELETE FROM Users`;
    await this.dbc.deleteData({ query });
  }

  async getUserLoggerId(): Promise<{ id: string }> {
    // const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id inner join tokens on tokens.user_id = users.id`;
    // const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id where users_logged.status = 1`;
    const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id where users_logged.status = 1`;
    const user = (await this.dbc.getData({ query }))![0] as any;
    return { id: user.id };
  }
}
