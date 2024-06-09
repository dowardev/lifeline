import { defineStore } from "pinia";
import { User } from "../utils/interfaces";
import userAvatar from "@/assets/otros/user.png";
import { ref } from "vue";

interface UserState {
  user: User;
  token: string;
  isLogged: boolean;
}

export const useUserStore = defineStore("user", () => {
  const user = ref({} as User);
  const token = "";
  const islogged = ref(false);

  function imageProfile() {
    const imageProfile = user.value.imageProfile;
    if (imageProfile) return "data:image/png;base64," + imageProfile;
    return userAvatar;
  }

  function updateUserProps(props: User) {
    const userProps = user;
    const merge = {
      ...userProps,
      ...props,
    };
    user.value = merge;
  }

  function updateUserLoggedProp(isLogged: boolean) {
    isLogged = isLogged;
  }

  function updateTokenProp(token: string) {
    token = token;
  }

  function logout() {
    user.value = {};
    islogged.value = false;
  }

  return {
    user,
    token,
    islogged,
    imageProfile,
    updateUserProps,
    updateUserLoggedProp,
    updateTokenProp,
    logout,
  };
});
