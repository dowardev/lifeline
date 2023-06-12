import { useUserStore } from "../store/userStore";
import { storeToRefs } from "pinia";
import { Graphql, User } from "../utils/interfaces";
import { getUser } from "../services/user";
import { logout as userLogout } from "../services/session";

export const useUser = () => {
  const userStore = useUserStore();
  const { user, imageProfile, token, isLogged } = storeToRefs(userStore);

  async function loadUser(params: { graphql: Graphql }): Promise<void> {
    try {
      const user = await getUser({
        name: params.graphql.name,
        fragment: params.graphql.fragment,
        refetch: params.graphql.refetch,
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
      userStore.logout();
      updateUserLoggedProp(false);
      updateUserTokenProp("");
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } catch (e: any) {
      console.error(e);
    }
  }

  function updateUserLoggedProp(isLogged: boolean): void {
    userStore.updateUserLoggedProp(isLogged);
  }

  function updateUserTokenProp(token: string): void {
    userStore.updateTokenProp(token);
  }

  return {
    // functions
    loadUser,
    updateUserProps,
    updateUserLoggedProp,
    updateUserToken: updateUserTokenProp,

    logout,

    // props
    user,
    token,
    isLogged,

    // computed
    imageProfile,
  };
};
