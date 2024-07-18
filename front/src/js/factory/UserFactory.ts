import { User } from "@/utils/interfaces";
import { UserController } from "../userController";
import { ApiController } from "../apiController";
import { DB } from "../db";
import { SQLite } from "../sqlite";

export class UserLoggedFactory {
  // userController = new UserController();
  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });

  public async create(): Promise<User> {
    let user: User = {};

    try {
      user = await this.getUserLogged();
    } catch (error) {
      throw error;
    }

    try {
      user = await this.getUserLoggedFromServer();
    } catch (error: any) {
      if (error.message != "Unauthorized" && error.message != "No token found")
        throw error;
    }
    return user;
  }

  private async getUserLogged(): Promise<User> {
    try {
      const user = await this.getUserLoggedFromLocal();
      return user;
    } catch (error: any) {
      throw error(error);
    }
  }

  private async getUserLoggedFromServer(): Promise<User> {
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

  private async getUserLoggedFromLocal(): Promise<User> {
    const query = `SELECT * FROM  users_logged inner join users on users.id = users_logged.user_id inner join tokens on tokens.user_id = users.id`;
    try {
      const result = (await this.dbc.getData({ query }))[0] as any;
      return result ?? {};
    } catch (error: any) {
      throw error;
    }
  }
}
