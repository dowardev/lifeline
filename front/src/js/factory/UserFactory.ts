import { User, UserStore, Event } from "@/utils/interfaces";
import { UserController } from "../userController";
import { ApiController } from "../apiController";
import { DB } from "../db";
import { SQLite } from "../sqlite";
import { EventController } from "../eventController";

type Operation = "noLogged" | "logged";
type Source = "local" | "server" | "both";

export class UserFactory {
  private eventController = new EventController();
  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  private source: Source = "local";
  private user: User = {
    id: 0,
    idSync: 0,
    name: "",
    userName: "",
    isAdmin: false,
    rol: [],
    imageProfile: "",
    preferences: { theme: "light" },
    events: [],
  };

  constructor(params: { userId: number; source?: Source }) {
    const { userId, source = "local" } = params;
    this.user.id = userId;
    this.source = source;
  }

  public async create(): Promise<User> {
    if (this.source === "local" || this.source === "both")
      try {
        this.user = await this.getUserFromLocal();
      } catch (error) {
        throw error;
      }

    // if (this.source === "server"||this.source === "both")
    // try {
    //   const serverResponse = await this.getUserFromServer({ token });
    //   if (Object.keys(serverResponse).length > 0) this.user = serverResponse;
    // } catch (error: any) {
    //   if (error.message != "Unauthorized" && error.message != "No token found")
    //     throw error;
    // }

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

  private async getUserFromLocal(): Promise<User> {
    let user: User = {} as any;

    try {
      const queryUser = `SELECT * FROM  users where id=${this.user.id}`;
      const result = (await this.dbc.getData({ query: queryUser }))[0] as any;
      if (Object.keys(result).length === 0) throw new Error("no user found");

      user = {
        id: this.user.id,
        name: result.name,
        userName: result.user_name,
        isAdmin: result.is_admin,
        rol: [],
        imageProfile: result.image_profile,
        preferences: { theme: "light" },
        events: await this.getEventsFromLocal(),
      } as User;
    } catch (error: any) {
      throw error;
    }

    return user;
  }

  private async getEventsFromLocal(): Promise<Event[]> {
    let events: Array<Event> = [];

    try {
      events = await this.eventController.getUserStoredEvents({
        userId: this.user.id,
      });
      this.user.events = events;
    } catch (error: any) {
      throw error;
    }
    return events;
  }
}
