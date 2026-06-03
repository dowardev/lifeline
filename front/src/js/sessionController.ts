import {
  UserRegister,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { ApiController } from "@/js/apiController";

export class SessionController {
  apiController = new ApiController();

  async userRegister(params: UserRegister): Promise<void> {
    const { name, email, user, password } = params;

    try {
      await this.apiController.executeMutation({
        url: "/auth/signup",
        data: { name, email, user, password },
      });
    } catch (error: any) {
      throw errorBuilder({ message: error.message, typeError: "authError" });
    }
  }

  async logoutOnServer(): Promise<void> {
    try {
      await this.apiController.executeMutation({
        url: "/auth/logout",
      });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }
}
