import { User, UserStore, Event, UserServer } from "@/utils/interfaces";
import { UserController } from "../userController";
import { ApiController } from "../apiController";
import { DB } from "../db";
import { SQLite } from "../sqlite";
import { EventController } from "../eventController";
import { UserSource } from "../../utils/types";

export class UserFactory {
  private eventController = new EventController();
  private userController = new UserController();
  private dbc = new DB({
    dbSystem: new SQLite({ dbName: "db_vite" }),
  });
  private source: UserSource = "local";
  private userToken = "";
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

  constructor(params: {
    userId: number;
    source?: UserSource;
    userToken?: string;
  }) {
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
    if (this.source == "local") {
      result.name = localUser!.name;
      result.userName = localUser!.userName;
      result.isAdmin = localUser!.isAdmin;
      result.rol = localUser!.rol;
      result.imageProfile = localUser!.imageProfile;
      result.preferences = localUser!.preferences;
      result.events = localUser!.events;
      result.updatedAt = localUser!.updatedAt;
    }
    if (this.source == "server") {
      result.name = userServer!.name;
      result.userName = userServer!.userName;
      result.isAdmin = userServer!.isAdmin;
      result.rol = userServer!.rol;
      result.imageProfile = userServer!.imageProfile;
      result.preferences = userServer!.preferences;
      result.events = userServer?.events;
      result.updatedAt = userServer!.updatedAt;
    }
    if (this.source == "both") {
      result.name = userServer!.name ?? localUser!.name;
      result.userName = userServer!.userName ?? localUser!.userName;
      result.isAdmin = userServer!.isAdmin ?? localUser!.isAdmin;
      result.rol = userServer!.rol ?? localUser!.rol;
      result.imageProfile = userServer!.imageProfile ?? localUser!.imageProfile;
      result.preferences = userServer!.preferences ?? localUser!.preferences;
      result.events = userServer?.events ?? localUser!.events;
      result.updatedAt = localUser!.updatedAt;
    }
    return result;
  }

  private async getUserFromServer(params: {
    token: string;
  }): Promise<UserServer> {
    const { token } = params;

    try {
      const response = await this.userController.getUserFromServer({
        token: token,
      });
      response.events = await this.getEventsFromServer({ token });
      return Object.keys(response).length > 0 ? response : ({} as UserServer);
    } catch (error: any) {
      throw error;
    }
  }

  private async getUserFromLocal(): Promise<User> {
    let user: User = {} as any;

    try {
      //TODO: move to controller
      const queryUser = `SELECT * FROM  users where id=${this.user.id}`;
      const result = (await this.dbc.getData({ query: queryUser }))[0] as any;
      if (Object.keys(result).length === 0) throw new Error("no user found");

      user = {
        id: this.user.id,
        name: result.name ?? undefined,
        userName: result.user_name ?? undefined,
        isAdmin: result.is_admin ?? undefined,
        rol: [],
        imageProfile: result.image_profile ?? undefined,
        preferences: { theme: "light" },
        events: await this.getEventsFromLocal(),
        syncStatus: result.syncstatus ?? true,
        createdAt: new Date(result.created_at) ?? undefined,
        updatedAt: new Date(result.updated_at) ?? undefined,
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

  private async getEventsFromServer(params: {
    token: string;
  }): Promise<Event[]> {
    const { token } = params;
    const queryName = "USER_EVENTS";
    const fragmentName = "Events";
    const apiController = new ApiController();
    const queryDocument = apiController.getQuery({ name: queryName });

    try {
      const query = apiController.graphqlQueryBuilder({
        name: queryDocument,
        fragment: fragmentName,
        mutationName: "events",
      });

      const response = await apiController.executeGrapQuery({
        query,
        options: { refetch: true },
        token,
      });

      if (response) {
        return response.value.events.events;
      }
      return [];
    } catch (error: any) {
      throw error;
    }
  }
}
