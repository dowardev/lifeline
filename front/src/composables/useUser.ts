import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import {
  SetUserToken,
  User,
  UserLogin,
  UserLoginResponse,
  UserRegister,
} from "../utils/interfaces";
import { getUser, setUserToken } from "../services/user";
import {
  userLogin as userLoginService,
  userRegister,
} from "@/services/session";
import { errorBuilder } from "@/utils/errors";
import { logout as userLogout } from "../services/session";

export const useUser = () => {
  const userStore = useUserStore();
  const { user, imageProfile, token, isLogged } = storeToRefs(userStore);

  async function loadUser(): Promise<void> {
    try {
      const user = await getUser({
        refetch: true,
      });

      updateUserProps({ user });
    } catch (error: any) {
      if (error.message != "Unauthorized") throw error;
    }
  }

  function updateUserProps(params: { user: User }): void {
    userStore.updateUserProps(params.user);
  }

  async function logout(): Promise<void> {
    try {
      await userLogout();
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e: any) {
      throw new Error(e);
    }
  }

  function updateUserLoggedProp(isLogged: boolean): void {
    userStore.updateUserLoggedProp(isLogged);
  }

  function updateUserTokenProp(token: string): void {
    userStore.updateTokenProp(token);
  }

  async function userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const { user, password } = params;

    try {
      return await userLoginService({ user, password });
    } catch (error: any) {
      throw errorBuilder({ message: error.message });
    }
  }

  function storeUserToken(params: SetUserToken): void {
    const { token } = params;
    try {
      setUserToken({ token });
    } catch (error: any) {
      throw new Error(error);
    }
  }

  async function register(params: UserRegister): Promise<void> {
    const data = {
      name: params.name,
      email: params.email,
      user: params.user,
      password: params.password,
    };

    try {
      await userRegister(data);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  return {
    // functions
    loadUser,
    updateUserProps,
    updateUserLoggedProp,
    updateUserToken: updateUserTokenProp,
    userLogin,
    storeUserToken,
    register,

    logout,

    // props
    user,
    token,
    isLogged,

    // computed
    imageProfile,
  };
};
