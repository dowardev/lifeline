import { storage } from "@/main";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { CapacitorCookies } from "@capacitor/core";
import {
  provideApolloClient,
  useMutation,
  useQuery,
} from "@vue/apollo-composable";
import { DocumentNode } from "graphql";
import gql from "graphql-tag";

// queries
import { USER_MENU } from "@/utils/graphql";
import { TokenService } from "./tokenService";

export class GrapQLService {
  uri = "";
  tokenService = new TokenService();

  constructor() {
    const mode = process.env.NODE_ENV;
    if (mode == "development") {
      this.uri = "http://localhost:8000/graphql";
    } else {
      this.uri = "https://lifeline-back.dowar.xyz/graphql";
    }
    // this.uri = "https://lifeline-back.dowar.xyz/graphql";
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

  async executeGrapQuery(params: {
    query: any;
    options: { refetch: boolean };
  }): Promise<any> {
    const { query, options } = params;

    try {
      const cache = new InMemoryCache();
      const token = await this.tokenService.getToken({ name: "auth_token" });
      if (!token) throw new Error("No token found");

      const apolloClient = new ApolloClient({
        cache,
        uri: this.uri,
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
      throw new Error(error);
    }
  }

  async executeGrapMutation(params: { query: any; input?: any }): Promise<any> {
    const { query, input } = params;

    const cache = new InMemoryCache();
    const apolloClient = new ApolloClient({
      cache,
      uri: this.uri,
      headers: {
        Authorization: await storage.get("authToken"),
      },
    });

    const {
      mutate: mutate,
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
  }

  getQuery(params: { name: string }): DocumentNode {
    const { name } = params;

    if (name == "USER_MENU") return USER_MENU;
    throw new Error("Query not found");
  }
}
