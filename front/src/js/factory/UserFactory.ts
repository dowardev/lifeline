import { User, UserStore, Event, UserServer } from "@/utils/interfaces";
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
  private userId: number = 0;
  private userToken: string = "";
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

  constructor(params: { userId: number; source?: Source; userToken?: string }) {
    const { userId, source = "local", userToken } = params;
    this.user.id = userId;
    this.source = source;
    this.userToken = userToken != undefined ? userToken : "";
  }

  public async create(): Promise<User> {
    let localUser: User | undefined = undefined;
    let userServer: UserServer | undefined = undefined;

    // local
    if (this.source === "local" || this.source === "both")
      try {
        localUser = await this.getUserFromLocal();
      } catch (error) {
        throw error;
      }

    // server
    if (this.source === "server" || this.source === "both") {
      const userToken = this.userToken;
      if (userToken === "") throw new Error("No token found");

      try {
        const serverResponse = await this.getUserFromServer({
          token: userToken,
        });

        if (Object.keys(serverResponse).length > 0) {
          userServer = serverResponse;
        }
      } catch (error: any) {
        if (
          error.message != "Unauthorized" &&
          error.message != "No token found"
        )
          throw error;
      }
    }

    const result: User = {} as any;
    result.name = userServer!.name ?? localUser!.name;
    result.userName = userServer!.userName ?? localUser!.userName;
    result.isAdmin = userServer!.isAdmin ?? localUser!.isAdmin;
    result.rol = userServer!.rol ?? localUser!.rol;
    result.imageProfile = userServer!.imageProfile ?? localUser!.imageProfile;
    result.preferences = userServer!.preferences ?? localUser!.preferences;
    result.preferences = userServer!.preferences ?? localUser!.preferences;
    result.events = localUser!.events;
    return result;
  }

  private async getUserFromServer(params: {
    token: string;
  }): Promise<UserServer> {
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
          isAdmin: response.value.userAuth.user.is_admin,
          imageProfile: response.value.userAuth.user.image_profile,
          preferences: { theme: "light" },
          events: [],
        } as UserServer;
        return response as UserServer;
      }
      return {} as UserServer;
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
