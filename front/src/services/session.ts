import {
  UserRegister,
  UserLogin,
  UserLoginResponse,
} from "../utils/interfaces";

import { errorBuilder } from "@/utils/errors";
import { executeGrapMutation, graphqlMutationBuilder } from "./graphql";
import { USER_LOGIN, USER_LOGOUT, USER_REGISTER } from "@/utils/graphql";

export async function userRegister(params: UserRegister): Promise<void> {
  const { name, email, user, password } = params;

  try {
    const query = graphqlMutationBuilder({
      name: USER_REGISTER,
      fragment: "UserRegister",
      mutationName: "register",
      inputName: "RegisterInput",
    });

    await executeGrapMutation({
      query,
      input: { name, email, user, password },
    });
  } catch (error: any) {
    if (error.message != "Unauthorized")
      throw errorBuilder({ message: error.message, typeError: "authError" });
    throw errorBuilder({ message: error.message });
  }
}

export async function userLogin(params: UserLogin): Promise<UserLoginResponse> {
  const { user, password } = params;

  try {
    const query = graphqlMutationBuilder({
      name: USER_LOGIN,
      fragment: "UserLogin",
      mutationName: "login",
      inputName: "LoginInput",
    });

    let response = await executeGrapMutation({
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

export async function logout(): Promise<void> {
  try {
    const query = graphqlMutationBuilder({
      name: USER_LOGOUT,
      fragment: "UserLogout",
      mutationName: "userLogout",
    });

    await executeGrapMutation({
      query,
    });
  } catch (error: any) {
    if (error.message != "Unauthorized")
      throw errorBuilder({ message: error.message, typeError: "authError" });
    throw errorBuilder({ message: error.message });
  }
}
