import { defineStore } from "pinia";
import { User } from "../utils/interfaces";
import userAvatar from "@/assets/otros/user.png";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = ref({} as User);
  const token = "";
  const isLogged = ref(false);

  function imageProfile() {
    const imageProfile = user.value.imageProfile;
    if (imageProfile) return "data:image/png;base64," + imageProfile;
    return userAvatar;
  }

  function updateUserProps(params: { user: User }): void {
    const { user: userData } = params;
    user.value = userData;
  }

  function updateUserLoggedProp(params: { isLogged: boolean }): void {
    const { isLogged: isUserLogged } = params;
    isLogged.value = isUserLogged;
  }

  function updateTokenProp(token: string) {
    token = token;
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
