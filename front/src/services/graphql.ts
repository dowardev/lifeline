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

export class GrapQLService {
  uri = "";
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

    const cache = new InMemoryCache();
    const apolloClient = new ApolloClient({
      cache,
      uri: this.uri,
      headers: {
        Authorization: await storage.get("authToken"),
      },
    });
    const { refetch, result } = provideApolloClient(apolloClient)(() =>
      useQuery(query, null, {
        fetchPolicy: "cache-first",
      })
    );
    if (options.refetch) await refetch();
    return result;
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
}
