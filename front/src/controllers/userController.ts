import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  SetUserToken,
  User,
  UserDBLocal,
  UserLocalDatabaseInterface,
  UserLogin,
  UserLoginResponse,
  UserRegister,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { UserService } from "@/services/user";
import { SessionService } from "@/services/session";
import { CapacitorCookies } from "@capacitor/core";
import { storage } from "@/main";
import {
  GraphQLFragmentNameUser,
  GraphQLQueryNameUser,
  UserDBType,
  userGrapQLTypeData,
} from "@/utils/types";
import { DBService } from "@/services/dbService";
import { SystemController } from "./systemController";
import { TokenService } from "@/services/tokenService";
import { SystemService } from "@/services/system";

export class UserController {
  private dbService = new DBService();
  userStore = useUserStore();
  refs = storeToRefs(this.userStore);
  userService = new UserService();
  sessionService = new SessionService();
  systemController = new SystemController();
  tokenService = new TokenService();
  systemService = new SystemService();

  async loadUser(params: {
    queryName: GraphQLQueryNameUser;
    fragmentName: GraphQLFragmentNameUser;
  }): Promise<void> {
    const { queryName, fragmentName } = params;
    let user = {} as User;

    try {
      user = await this.userService.getLocalUser();
    } catch (error: any) {
      throw error;
    }

    try {
      user = await this.userService.getUser({
        refetch: true,
        queryName,
        fragmentName,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }

    this.updateUserProps({ user });
  }

  updateUserProps(params: { user: User }): void {
    const { user } = params;
    this.userStore.updateUserProps({ user });
  }

  async logout(): Promise<void> {
    try {
      this.updateUserLoggedProp({ isLogged: false });
      await storage.remove("authToken");
      await this.sessionService.logout();
    } catch (e: any) {
      throw new Error(e);
    }
  }

  updateUserLoggedProp(params: { isLogged: boolean }): void {
    const { isLogged } = params;
    this.userStore.updateUserLoggedProp({ isLogged });
  }

  updateUserTokenProp(token: string): void {
    this.userStore.updateTokenProp(token);
  }

  async userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const { user, password } = params;

    try {
      return await this.sessionService.userLogin({ user, password });
    } catch (error: any) {
      throw errorBuilder({ message: error.message });
    }
  }

  async storeUserToken(params: SetUserToken): Promise<void> {
    try {
      const { token } = params;
      await this.tokenService.setToken({
        name: "auth_token",
        value: token,
        userId: "1",
      });
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
      await this.sessionService.userRegister(data);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // TODO: remove
  verifyUserLogged(): boolean {
    return this.userStore.isLogged;
  }

  async getAuthUserToken(): Promise<string | null> {
    try {
      return (await this.tokenService.getToken({ name: "auth_token" })) ?? null;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  getUserLogged(): User {
    return this.userStore.user;
  }

  async createTableUsers(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS Users
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
    await this.createTable({ query });
  }

  async createTable(params: { query: any }): Promise<void> {
    try {
      const { query } = params;
      const db = await this.dbService.dbConnection();
      // await db.open();
      await this.dbService.createTable({ query, db });
      // await db.close();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async upateUserOnDatabase(params: { user: User }): Promise<void> {
    await this.userService.updateLocalUser({ user: params.user });
  }

  // TODO: remove
  async getLocalUser(): Promise<User> {
    return await this.userService.getLocalUser();
  }

  async insertLocalUser(params: { user: User }): Promise<void> {
    await this.userService.insertLocalUser({ user: params.user });
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
}
