import { User, UserStore } from "@/utils/interfaces";
import { UserController } from "../userController";
import { ApiController } from "../apiController";
import { DB } from "../db";
import { SQLite } from "../sqlite";

export class UserFactory {
  // userController = new UserController();
  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  private localUserId = "";
  private tokenServer = "";
  private user: UserStore = {
    name: "",
    userName: "",
    isAdmin: false,
    rol: [],
    imageProfile: "",
    preferences: { theme: "light" },
  };

  constructor(params: { localUserId: string; tokenServer: string }) {
    const { localUserId, tokenServer } = params;
    this.localUserId = localUserId;
    this.tokenServer = tokenServer;
  }

  public async create(): Promise<UserStore> {
    const localId = this.localUserId;
    const token = this.tokenServer;

    try {
      this.user = await this.getUserFromLocal({ id: localId });
    } catch (error) {
      throw error;
    }

    try {
      const serverResponse = await this.getUserFromServer({ token });
      if (Object.keys(serverResponse).length > 0) this.user = serverResponse;
    } catch (error: any) {
      if (error.message != "Unauthorized" && error.message != "No token found")
        throw error;
    }

    return this.user;
  }

  private async getUserFromServer(params: {
    token: string;
  }): Promise<UserStore> {
    const { token } = params;
    const queryName = "USER_MENU";
    const fragmentName = "UserMenu";
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
          userName: response.value.userAuth.user.user,
          imageProfile: response.value.userAuth.user.image_profile,
          isAdmin: response.value.userAuth.user.is_admin,
          preferences: { theme: "light" },
        } as UserStore;
        return response as UserStore;
      }
      return {} as UserStore;
    } catch (error: any) {
      throw error;
    }
  }

  private async getUserFromLocal(params: { id: string }): Promise<UserStore> {
    const { id } = params;
    const query = `SELECT * FROM  users where id=${id}`;
    try {
      const result = (await this.dbc.getData({ query }))[0] as any;

      if (Object.keys(result).length === 0) throw new Error("no user found");

      return {
        name: result.name,
        userName: result.user,
        isAdmin: result.is_admin,
        rol: [],
        imageProfile: result.image_profile,
        preferences: { theme: "light" },
      } as UserStore;
    } catch (error: any) {
      throw error;
    }
  }
}
