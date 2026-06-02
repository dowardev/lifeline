// import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  ResendEmailConfirmation,
  SetUserToken,
  User,
  UserLogin,
  UserLoginResponse,
  UserRegister,
  Event,
  UserServer,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { SessionController } from "./sessionController";
import {
  GraphQLFragmentNameUser,
  GraphQLQueryNameUser,
  UserDBType,
  UserSource,
  userGrapQLTypeData,
} from "@/utils/types";
import { SystemController } from "./systemController";
import { TokenController } from "./tokenController";
import { ApiController } from "../js/apiController";
import { USER_LOGIN } from "@/utils/graphql";
import { getDB } from "./dbInstance";
import gql from "graphql-tag";
import { useMutation } from "@vue/apollo-composable";
import { storage } from "@/main";
import { useUserStore } from "@/store/userStore";
import { EventController } from "./eventController";
import lodash from "lodash";
import { UserFactory } from "./factory/UserFactory";
import { useEventsStore } from "@/store/eventsStore";
export class UserController {
  // store
  private userStore = useUserStore();
  private eventStore = useEventsStore();

  private dbc = getDB();
  private systemController = new SystemController();
  private tokenController = new TokenController();

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

  async getUserFromServer(params: { token: string }): Promise<UserServer> {
    const { token } = params;
    const queryName = "USER_BASIC";
    const fragmentName = "UserBasic";
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
        token,
      });

      if (response) {
        response = {
          name: response.value.userAuth.user.name,
          userName: response.value.userAuth.user.user_name,
          isAdmin: response.value.userAuth.user.is_admin,
          imageProfile: response.value.userAuth.user.image_profile,
          preferences: { theme: "light" },
          createdAt: new Date(response.value.userAuth.user.created_at),
          updatedAt: new Date(response.value.userAuth.user.updated_at),
        } as UserServer;
        return response as UserServer;
      }
      return {} as UserServer;
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
  // TODO: Add more props
  async updateLocalUser(params: { user: User }): Promise<void> {
    const { id, name, userName, email } = params.user;

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

      let query = `UPDATE Users SET  `;

      fields.forEach((field, index) => {
        query += `${field} = ?`;
        if (index < fields.length - 1) {
          query += ", ";
        }
      });

      query += ` WHERE id="${id}"`;

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

  async deleteUser(paramas: { userId: string }): Promise<void> {
    const { userId } = paramas;
    const query = `DELETE FROM Users WHERE id=${userId}`;
    await this.dbc.deleteData({ query });
  }

  async deleteUsers(): Promise<void> {
    const query = `DELETE FROM Users`;
    await this.dbc.deleteData({ query });
  }

  async syncUserLogged(): Promise<void> {
    const userId = this.userStore.user.id;
    // events
    // this.syncEvents({ userId });

    // data
    await this.syncUserData();
  }

  async syncEvents(params: { userId: number }): Promise<void> {
    const { userId } = params;

    try {
      if (userId == undefined) throw new Error("Incorrect user id");

      const eventController = new EventController();
      await eventController.pushUserLoggedEventsUpdated({ userId });
      await this.syncUserLoggedEventsFromServer({ userId });
      await eventController.deleteUserLoggedInativeEventOnServer();
    } catch (error: any) {
      throw error;
    }
  }

  private async syncUserLoggedEventsFromServer(params: {
    userId: number;
  }): Promise<void> {
    let serverEvents: Event[] = [];
    const { userId } = params;
    const eventController = new EventController();

    serverEvents =
      (await eventController.getUserLoggedEventsServer({ userId })) ?? [];
    const localEvents = await eventController.getUserStoredEvents({
      filterType: "none",
      userId,
    });
    const problems = await eventController.getConflictingLocalEvents({
      events: serverEvents,
      userId,
    });
    const eventsServerDeleted = localEvents.filter((event) => {
      if (event.idSync == null) return;
      const found = serverEvents.find(
        (element) => element.idSync == event.idSync,
      );
      if (!found) {
        return event;
      }
    });

    const toUpdate: Event[] = [];

    problems.forEach((event) => {
      const found = serverEvents.find(
        (element) => element.idSync == event.idSync,
      );
      if (found) {
        found.id = event.id;
        toUpdate.push(found);
      }
    });

    const newServerEvents = lodash.filter(serverEvents, (event) => {
      return !lodash.some(
        localEvents,
        (otherEvent) => event.idSync === otherEvent.idSync,
      );
    });

    const newLocalEvents = localEvents.filter((event) => event.idSync == null);

    // debugger;
    try {
      if (newLocalEvents.length > 0)
        for (let index = 0; index < newLocalEvents.length; index++) {
          const event = newLocalEvents[index];
          const { id } = await eventController.pushNewEvent({ event });
          event.idSync = id as number;
          event.syncStatus = true;
          await eventController.updateLocalEvent({ event });
        }
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    }

    try {
      if (newServerEvents.length > 0)
        for (let index = 0; index < newServerEvents.length; index++) {
          const event = newServerEvents[index];
          await eventController.saveLocalEvent({
            event,
          });
        }
    } catch (error: any) {
      if (
        error.message !=
        "Error: Query failed: SelectSQL: queryAll: UNIQUE constraint failed: EVENTS.idSync"
      ) {
        throw new Error(error);
      }
    }

    try {
      if (problems.length > 0)
        for (let index = 0; index < problems.length; index++) {
          const event = problems[index];
          await eventController.saveLocalEvent({ event });
          await eventController.storeEventsServer({ event });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (toUpdate.length > 0)
        for (let index = 0; index < toUpdate.length; index++) {
          const event = toUpdate[index];
          await eventController.updateLocalEvent({ event: event as any });
        }
    } catch (error: any) {
      throw new Error(error);
    }

    try {
      if (eventsServerDeleted.length > 0)
        for (let index = 0; index < eventsServerDeleted.length; index++) {
          const event = eventsServerDeleted[index];
          await eventController.deleteLocalEvent({ id: event.id as number });
        }
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // getters
  private async getUserLoggerId(): Promise<number | undefined> {
    const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id where users_logged.status = 1`;
    const user = (await this.dbc.getData({ query }))![0] as any;
    const id = user == undefined ? undefined : user.id;
    return id;
  }

  /**
   * This method retrieves the logged-in user's information from local storage and server.
   *
   * @returns {Promise<User>} A promise that resolves to the User object of the logged-in user.
   *
   * @throws {Error} If the user ID is not defined, an error is thrown.
   */
  async getUserLoggedStored(params: { sourceData: UserSource }): Promise<User> {
    const { sourceData } = params;
    const userId = await this.getUserLoggerId();

    if (userId == undefined) throw new Error("User id required");

    const userToken = await this.tokenController.getUserToken({
      name: "auth_token",
      userId: userId,
    });

    if (userId == undefined) throw new Error("User id required");

    const userFactory = new UserFactory({
      userId,
      source: sourceData,
      userToken,
    });

    const user = await userFactory.create();

    return user;
  }

  getUserFromStore(): User {
    const userStore = this.userStore.user;
    const eventsStore = this.eventStore.events;

    return {
      id: userStore.id,
      events: eventsStore,
      imageProfile: userStore.imageProfile,
      name: userStore.name,
      preferences: userStore.preferences,
      userName: userStore.userName,
    } as User;
  }

  async syncUserData(): Promise<void> {
    const localUser = await this.getUserLoggedStored({ sourceData: "local" });
    const serverUser = await this.getUserLoggedStored({ sourceData: "server" });
    const userId = await this.getUserLoggerId();

    if (localUser.updatedAt! > serverUser.updatedAt!) {
      //TODO: add method update on server
    }

    if (localUser.updatedAt! < serverUser.updatedAt!) {
      const user = Object.assign(serverUser);
      user.id = userId;
      await this.updateLocalUser({ user: serverUser! });
    }

    if (localUser.updatedAt! == serverUser.updatedAt!) {
      await this.updateLocalUser({ user: serverUser! });
      //TODO: add method update on server
    }
  }
}
