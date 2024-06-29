import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import {
  provideApolloClient,
  useMutation,
  useQuery,
} from "@vue/apollo-composable";

// services
import { TokenService } from "./tokenService";

export class GrapQLService {
  uri = "";
  tokenService = new TokenService();

  // TODO:remove
  // constructor() {
  //   const mode = process.env.NODE_ENV;
  //   if (mode == "development") {
  //     this.uri = "http://localhost:8000/graphql";
  //   } else {
  //     this.uri = "https://lifeline-back.dowar.xyz/graphql";
  //   }
  //   // this.uri = "https://lifeline-back.dowar.xyz/graphql";
  // }

  async executeGrapQuery(params: {
    query: any;
    options: { refetch: boolean };
    uri: string;
    token: string;
    cache: InMemoryCache;
  }): Promise<any> {
    const { query, options, uri, token, cache } = params;

    try {
      const apolloClient = new ApolloClient({
        cache,
        uri: uri,
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

  async executeGrapMutation(params: {
    query: any;
    input?: any;
    cache: any;
    uri: string;
    token: string;
  }): Promise<any> {
    const { query, input, cache, token, uri } = params;

    const apolloClient = new ApolloClient({
      cache,
      uri,
      headers: {
        Authorization: token,
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
