import {
  UserRegister,
  UserLogin,
  UserLoginResponse,
} from "../utils/interfaces";

import { errorBuilder } from "@/utils/errors";
import { USER_LOGIN, USER_LOGOUT, USER_REGISTER } from "@/utils/graphql";
import { GrapQLService } from "./graphql";

export class SessionService {
  grapQLService = new GrapQLService();

  async userRegister(params: UserRegister): Promise<void> {
    const { name, email, user, password } = params;

    try {
      const query = this.grapQLService.graphqlMutationBuilder({
        name: USER_REGISTER,
        fragment: "UserRegister",
        mutationName: "register",
        inputName: "RegisterInput",
      });

      await this.grapQLService.executeGrapMutation({
        query,
        input: { name, email, user, password },
      });
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  async userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const { user, password } = params;

    try {
      const query = this.grapQLService.graphqlMutationBuilder({
        name: USER_LOGIN,
        fragment: "UserLogin",
        mutationName: "login",
        inputName: "LoginInput",
      });

      let response = await this.grapQLService.executeGrapMutation({
        query,
        input: { user, password },
      });

      if (!response.login.auth) return {} as UserLoginResponse;
      response = {
        user: response.login.user,
        auth: {
          access_token: response.login.auth.access_token,
          token_type: response.login.auth.token_type,
        },
      };
      return response;
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  async logout(): Promise<void> {
    try {
      const query = this.grapQLService.graphqlMutationBuilder({
        name: USER_LOGOUT,
        fragment: "UserLogout",
        mutationName: "userLogout",
      });

      await this.grapQLService.executeGrapMutation({
        query,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }
}
