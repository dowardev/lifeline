<script lang="ts">
import { UserRegister, UserLogin, UserLoginResponse } from "./interfaces.vue";

import gql from "graphql-tag";
import { useQuery, useMutation } from "@vue/apollo-composable";

export default function () {
  async function userRegister(params: UserRegister) {
    const { onError, onDone } = useMutation(
      gql`
        mutation resendEmailConfirmation(
          $name: String!
          $user: String!
          $email: String!
          $password: String!
        ) {
          resendEmailConfirmation(
            input: {
              name: $name
              user: $user
              email: $email
              password: $password
            }
          )
        }
      `,
      {
        variables: {
          name: params.name,
          user: params.user,
          email: params.email,
          password: params.password,
        },
      }
    );

    onError((error) => {
      throw new Error(error.message);
    });

    return new Promise((resolve) => {
      onDone((response) => {
        resolve(response.data);
      });
    });
  }

  async function userLogin(params: UserLogin): Promise<UserLoginResponse> {
    const {
      onError,
      onDone,
      mutate: login,
    } = useMutation(
      gql`
        mutation login($user: String!, $password: String!) {
          login(input: { user: $user, password: $password }) {
            ${params.query}
          }
        }
      `,
      {
        variables: {
          user: params.user,
          password: params.password,
        },
      }
    );
    login();

    return new Promise((resolve, reject) => {
      onDone((response) => {
        resolve({
          auth: { access_token: response.data.login.auth.access_token },
        });
      });

      onError((error) => {
        reject(error);
      });
    });
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
