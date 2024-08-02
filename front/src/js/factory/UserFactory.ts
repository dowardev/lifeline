import { User, UserStore, Event } from "@/utils/interfaces";
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
  private user: User = {
    id: "",
    idSync: "",
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

  public async create(): Promise<User> {
    const localId = this.localUserId;
    const token = this.tokenServer;

    try {
      this.user = await this.getUserFromLocal({ id: localId });
    } catch (error) {
      throw error;
    }

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

  private async getUserFromLocal(params: { id: string }): Promise<User> {
    const { id } = params;
    let user: User = {} as any;

    try {
      const queryUser = `SELECT * FROM  users where id=${id}`;
      const result = (await this.dbc.getData({ query: queryUser }))[0] as any;
      if (Object.keys(result).length === 0) throw new Error("no user found");

      user = {
        id,
        name: result.name,
        userName: result.user_name,
        isAdmin: result.is_admin,
        rol: [],
        imageProfile: result.image_profile,
        preferences: { theme: "light" },
        events: await this.getUserEventsFromLocal({ id }),
      } as User;
    } catch (error: any) {
      throw error;
    }

    return user;
  }

  private async getUserEventsFromLocal(params: {
    id: string;
  }): Promise<Array<Event>> {
    const { id } = params;
    let events: Array<Event> = [];

    try {
      // console.log(
      //   "reminders",
      //   await this.dbc.getData({ query: "SELECT * FROM reminders" }),
      // );
      const queryUser = `SELECT * FROM  events inner join reminders on events.id=reminders.event_id  where user_id=${id}`;
      const result = (await this.dbc.getData({ query: queryUser })) as any;
      // console.log("events", result);
      if (result != undefined && Object.keys(result).length > 0)
        events = result.map((event: any) => {
          return {
            id: event.id,
            idSync: event.id_sync,
            name: event.name,
            guests: event.guests,
            timezone: event.timezone,
            description: event.description,
            availability: event.availability,
            syncStatus: event.sync_status,
            status: event.status,
            reminders: {
              start: event.start,
              end: event.end,
              notifications: event.notifications,
              repeat: {
                frecuency: event.frecuency,
                type: event.type,
                daysWeek: event.days_week,
              },
            },
          };
        });
    } catch (error: any) {
      throw error;
    }
    return events;
  }
}
