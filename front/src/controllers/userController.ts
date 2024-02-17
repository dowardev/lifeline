import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  SetUserToken,
  User,
  UserLogin,
  UserLoginResponse,
  UserRegister,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { UserService } from "@/services/user";
import { SessionService } from "@/services/session";

export class UserController {
  userStore = useUserStore();
  refs = storeToRefs(this.userStore);
  userService = new UserService();
  sessionService = new SessionService();

  async loadUser(): Promise<void> {
    try {
      const user = await this.userService.getUser({
        refetch: true,
      });

      this.updateUserProps({ user });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }

  updateUserProps(params: { user: User }): void {
    this.userStore.updateUserProps(params.user);
  }

  async logout(): Promise<void> {
    try {
      await this.sessionService.logout();
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e: any) {
      throw new Error(e);
    }
  }

  updateUserLoggedProp(isLogged: boolean): void {
    this.userStore.updateUserLoggedProp(isLogged);
  }

  updateUserTokenProp(token: string): void {
    this.userStore.updateTokenProp(token);
  }

  async userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const { user, password } = params;

    try {
      return await this.sessionService.userLogin({ user, password });
    } catch (error: any) {
      throw errorBuilder({ message: error.message });
    }
  }

  async storeUserToken(params: SetUserToken): Promise<void> {
    try {
      const { token } = params;
      const serializedToken = JSON.stringify(token);
      document.cookie = `authToken=${serializedToken}; path=/;`;
      await this.userService.setUserToken({
        token,
      });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async register(params: UserRegister): Promise<void> {
    const data = {
      name: params.name,
      email: params.email,
      user: params.user,
      password: params.password,
    };

    try {
      await this.sessionService.userRegister(data);
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
