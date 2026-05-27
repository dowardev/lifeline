import {
  ApolloClient,
  DocumentNode,
  InMemoryCache,
  gql,
} from "@apollo/client/core";
import { UserController } from "../js/userController";
import { TokenController } from "@/js/tokenController";

// queries
import { USER_BASIC, DELETE_EVENT, USER_EVENTS } from "@/utils/graphql";
import {
  provideApolloClient,
  useMutation,
  useQuery,
} from "@vue/apollo-composable";

type QueyNames = "USER_MENU" | "DELETE_EVENT" | "USER_EVENTS";

export class ApiController {
  grapQLUri = "";

  // controllers
  // userController = new UserController();

  constructor() {
    const mode = process.env.NODE_ENV;
    if (mode == "development") {
      this.grapQLUri = "http://localhost:8000/graphql";
    } else {
      this.grapQLUri = "https://lifeline-back.dowar.xyz/graphql";
    }
    // this.grapQLUri = "https://lifeline-back.dowar.xyz/graphql";
  }

  async executeGrapQuery(params: {
    query: any;
    options: { refetch: boolean };
    token: string;
  }): Promise<any> {
    const { query, options, token } = params;
    const cache = new InMemoryCache();
    // const userController = new UserController();
    // const user = await userController.getUserLogged2();
    // const tokenController = new TokenController();
    // const token = await tokenController.getUserToken({
    //   name: "auth_token",
    //   userId: user.id!,
    // });
    // if (!token) throw new Error("No token found");

    try {
      const apolloClient = new ApolloClient({
        cache,
        uri: this.grapQLUri,
        headers: {
          Authorization: token,
        },
      });
      const { refetch, result } = provideApolloClient(apolloClient)(() =>
        useQuery(query, null, {
          fetchPolicy: "cache-first",
        }),
      );
      if (options.refetch) await refetch();
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  async executeGrapMutatation(params: {
    query: any;
    input?: any;
  }): Promise<any> {
    const { query, input } = params;
    const cache = new InMemoryCache();
    const userController = new UserController();

    try {
      const user = await userController.getUserLogged2();
      const tokenController = new TokenController();
      let token = "";

      if (Object.keys(user).length > 0) {
        token = await tokenController.getUserToken({
          name: "auth_token",
          userId: user.id!,
        });
        if (!token) throw new Error("No token found");
      }

      const apolloClient = new ApolloClient({
        cache,
        uri: this.grapQLUri,
        headers: {
          Authorization: token,
        },
      });

      const {
        mutate,
        onDone,
        onError,
      } = provideApolloClient(apolloClient)(() => useMutation(query));

      if (!input) mutate();
      if (input) mutate({ input });

      return new Promise((resolve, reject) => {
        onDone((response) => {
          resolve(response.data);
        });

        onError((error) => reject(error));
      });
    } catch (error) {
      throw error;
    }
  }

  getQuery(params: { name: QueyNames }): DocumentNode {
    const { name } = params;

    if (name == "USER_BASIC") return USER_BASIC;
    if (name == "DELETE_EVENT") return DELETE_EVENT;
    if (name == "USER_EVENTS") return USER_EVENTS;
    throw new Error("Query not found");
  }

  graphqlQueryBuilder(params: {
    name: DocumentNode;
    fragment: string;
    mutationName: string;
  }): DocumentNode {
    const { name, fragment, mutationName } = params;

    const query = gql`
        query ${mutationName}{
          ${mutationName}{
           ...${fragment}
          }
        }
        ${name}
      `;

    return query;
  }

  graphqlMutationBuilder(params: {
    name: DocumentNode;
    fragment: string;
    mutationName: string;
    inputName?: string;
  }): DocumentNode {
    const { name, fragment, mutationName, inputName } = params;
    let query = "" as any;

    if (inputName)
      query = gql`
        mutation ${mutationName}($input:${inputName}){
          ${mutationName}(input: $input){
           ...${fragment}
          }
        }
        ${name}
      `;

    if (!inputName)
      query = gql`
        mutation ${mutationName}{
          ${mutationName}{
           ...${fragment}
          }
        }
        ${name}
      `;

    return query;
  }
}
