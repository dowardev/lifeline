import { UserRegister, UserLogin, UserLoginResponse } from "./interfaces";

import gql from "graphql-tag";
import { useMutation } from "@vue/apollo-composable";

export async function userRegister(params: UserRegister) {
  const {
    mutate: register,
    onDone,
    onError,
  } = useMutation(
    gql`
      mutation register(
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
    {
      variables: {
        name: params.name,
        user: params.user,
        email: params.email,
        password: params.password,
      },
    }
  );
  register();

  return new Promise((resolve, reject) => {
    onDone((response) => {
      resolve(response.data);
    });

    onError((error) => reject(error));
  });
}

export async function userLogin(params: UserLogin): Promise<UserLoginResponse> {
  const {
    mutate: login,
    onDone,
    onError,
  } = useMutation(
    gql`
        mutation UserLogin($user: String!, $password: String!) {
          login(input: { user: $user, password: $password }) {
            ...${params.graphql.fragment}
          }
        }
        ${params.graphql.name}
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
        user: response.data.login.user,
        auth: {
          access_token: response.data.login.auth.access_token,
          token_type: response.data.login.auth.token_type,
        },
      });
    });

    onError((error) => reject(error));
  });
}

export async function logout() {
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
