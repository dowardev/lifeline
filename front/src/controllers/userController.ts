import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  SetUserToken,
  User,
  User2,
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
import { GraphQLFragmentNameUser, GraphQLQueryNameUser } from "@/utils/types";
import { DBService } from "@/services/dbService";

export class UserController {
  userStore = useUserStore();
  refs = storeToRefs(this.userStore);
  userService = new UserService();
  sessionService = new SessionService();
  private dbService = new DBService();

  async loadUser(params: {
    queryName: GraphQLQueryNameUser;
    fragmentName: GraphQLFragmentNameUser;
  }): Promise<void> {
    const { queryName, fragmentName } = params;
    try {
      const user = await this.userService.getUser({
        refetch: true,
        queryName,
        fragmentName,
      });

      this.updateUserProps({ user });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw new Error(error);
    }
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
      await storage.set("authToken", token);
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

  verifyUserLogged(): boolean {
    return this.userStore.isLogged;
  }

  async getUserToken(): Promise<string | null> {
    try {
      return this.userService.getUserToken() ?? null;
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
      token TEXT,
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

  async upateUserOnDatabase(params: { user: User2 }): Promise<void> {
    this.userService.updateLocalUser({ user: params.user });
  }
}
