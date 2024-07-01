import { DocumentNode, InMemoryCache, gql } from "@apollo/client/core";
import { UserController } from "./userController";
import { TokenService } from "@/services/tokenService";
import { GrapQLService } from "@/services/graphql";

// queries
import { USER_MENU } from "@/utils/graphql";

export class ApiController {
  uri = "";

  // controllers
  userController = new UserController();

  // services
  tokenService = new TokenService();
  graphqlService = new GrapQLService();

  constructor() {
    const mode = process.env.NODE_ENV;
    if (mode == "development") {
      this.uri = "http://localhost:8000/graphql";
    } else {
      this.uri = "https://lifeline-back.dowar.xyz/graphql";
    }
    // this.uri = "https://lifeline-back.dowar.xyz/graphql";
  }

  async executeGrapQuery(params: {
    query: any;
    options: { refetch: boolean };
  }): Promise<any> {
    const { query, options } = params;
    const cache = new InMemoryCache();
    const user = await this.userController.getUserLogged2();
    const token = await this.tokenService.getToken({
      name: "auth_token",
      userId: user.id!,
    });
    if (!token) throw new Error("No token found");

    return await this.graphqlService.executeGrapQuery({
      query,
      options,
      uri: this.uri,
      token,
      cache,
    });
  }

  async executeGrapMutatation(params: {
    query: any;
    input?: any;
  }): Promise<any> {
    const { query, input } = params;
    const cache = new InMemoryCache();

    try {
      const user = await this.userController.getUserLogged2();
      let token = "";

      if (Object.keys(user).length > 0) {
        token = await this.tokenService.getToken({
          name: "auth_token",
          userId: user.id!,
        });
        if (!token) throw new Error("No token found");
      }

      return await this.graphqlService.executeGrapMutation({
        query,
        input,
        cache,
        token,
        uri: this.uri,
      });
    } catch (error) {
      throw error;
    }
  }

  getQuery(params: { name: string }): DocumentNode {
    const { name } = params;

    if (name == "USER_MENU") return USER_MENU;
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
