import { defineStore } from "pinia";
import { UserStore } from "../utils/interfaces";
import userAvatar from "@/assets/otros/user.png";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = ref({} as UserStore);
  const token = ref("");
  const isLogged = ref(false);

  // watch(user, async (newVal: User2, oldVal: User2) => {
  //   if (newVal !== oldVal) {
  //     const definedValues = Object.fromEntries(
  //       Object.entries(newVal).filter(([key, value]) => value !== undefined),
  //     );
  //     await userController.upateUserOnDatabase({ user: definedValues });
  //   }
  // });

  function imageProfile() {
    const imageProfile = user.value.imageProfile;
    if (imageProfile) return "data:image/png;base64," + imageProfile;
    return userAvatar;
  }

  function updateUserProps(params: { user: UserStore }): void {
    const { user: userData } = params;
    user.value = userData;
  }

  function updateUserLoggedProp(params: { isLogged: boolean }): void {
    const { isLogged: isUserLogged } = params;
    isLogged.value = isUserLogged;
  }

  function updateTokenProp(params: { token: string }) {
    token.value = params.token;
  }

  function logout() {
    user.value = {};
    isLogged.value = false;
  }

  return {
    user,
    token,
    isLogged,
    imageProfile,
    updateUserProps,
    updateUserLoggedProp,
    updateTokenProp,
    logout,
  };
});
