<script lang="ts">
import axios from "axios";
import userService from "./user.vue";
import { UserRegister } from "./interfaces.vue";

import gql from "graphql-tag";
import apolloClient from "../Apollo";
const apollo = apolloClient;

export default function () {
  async function userRegister(params: UserRegister) {
    try {
      const response = await apollo.defaultClient.mutate({
        mutation: gql`
          mutation (
            $name: String!
            $user: String!
            $email: String!
            $password: String!
          ) {
            register(
              input: {
                name: $name
                user: $user
                email: $email
                password: $password
              }
            )
          }
        `,
        variables: {
          name: params.name,
          user: params.user,
          email: params.email,
          password: params.password,
        },
      });

      if (response.data) return response.data;
      throw new Error("Bad response");
    } catch (e: any) {
      if (e.graphQLErrors) throw new Error(e.graphQLErrors[0].debugMessage);
      throw new Error(e.message);
    }
  }

  function userLogin(email: string, password: string) {
    return axios.post(
      "http://localhost:8000/api/auth/login",
      { headers: { Accept: "application/json" } },
      {
        params: {
          email,
          password,
        },
      }
    );
  }
  async function logout() {
    // const token = await userService()
    //   .getUserToken()
    //   .then((response) => {
    //     return response;
    //   });
    // return axios.get("http://localhost:8000/api/auth/logout", {
    //   headers: {
    //     Accept: "application/json",
    //     Authorization: "Bearer " + token,
    //   },
    // });
  }
  return {
    userRegister,
    userLogin,
    logout,
  };
}
</script>
