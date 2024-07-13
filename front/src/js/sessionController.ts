import {
  UserRegister,
  UserLogin,
  UserLoginResponse,
} from "../utils/interfaces";

import { errorBuilder } from "@/utils/errors";
import { USER_LOGIN, USER_LOGOUT, USER_REGISTER } from "@/utils/graphql";
import { ApiController } from "@/js/apiController";

export class SessionController {
  grapQLController = new ApiController();

  async userRegister(params: UserRegister): Promise<void> {
    const { name, email, user, password } = params;

    try {
      const query = this.grapQLController.graphqlMutationBuilder({
        name: USER_REGISTER,
        fragment: "UserRegister",
        mutationName: "register",
        inputName: "RegisterInput",
      });

      await this.grapQLController.executeGrapMutation({
        query,
        input: { name, email, user, password },
      });
    } catch (error: any) {
      if (error.message != "Unauthorized")
        throw errorBuilder({ message: error.message, typeError: "authError" });
      throw errorBuilder({ message: error.message });
    }
  }

  /**
   * Logs out a user on the server.
   * This method builds a GraphQL mutation for user logout and executes it.
   * If the server responds with an "Unauthorized" error, it is suppressed.
   * @throws Will throw an error if the logout fails for reasons other than "Unauthorized".
   */
  async logoutOnServer(): Promise<void> {
    try {
      const query = this.grapQLController.graphqlMutationBuilder({
        name: USER_LOGOUT,
        fragment: "UserLogout",
        mutationName: "userLogout",
      });

      await this.grapQLController.executeGrapMutation({
        query,
      });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }
}
