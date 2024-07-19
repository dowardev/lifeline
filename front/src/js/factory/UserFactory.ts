import { User } from "@/utils/interfaces";
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

  constructor(params: { localUserId: string; tokenServer: string }) {
    const { localUserId, tokenServer } = params;
    this.localUserId = localUserId;
    this.tokenServer = tokenServer;
  }

  public async create(): Promise<User> {
    let user: User = {};
    const localId = this.localUserId;
    const token = this.tokenServer;

    try {
      user = await this.getUserFromLocal({ id: localId });
    } catch (error) {
      throw error;
    }

    try {
      user = await this.getUserFromServer({ token });
    } catch (error: any) {
      if (error.message != "Unauthorized" && error.message != "No token found")
        throw error;
    }

    return user;
  }

  private async getUserFromServer(params: { token: string }): Promise<User> {
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

  private async getUserFromLocal(params: { id: string }): Promise<User> {
    const { id } = params;
    const query = `SELECT * FROM  users where id=${id}`;
    try {
      const result = (await this.dbc.getData({ query }))[0] as any;
      return result ?? {};
    } catch (error: any) {
      throw error;
    }
  }
}
