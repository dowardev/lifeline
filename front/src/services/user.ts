import { Storage } from "@ionic/storage";
const store = new Storage();
store.create();

import jsonLangSpanish from "../../public/assets/lang/lang-es.json";

import apolloClient from "../Apollo";
import gql from "graphql-tag";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { provideApolloClient } from "@vue/apollo-composable";
provideApolloClient(apolloClient);

import {
  GetUserAuth,
  GetUserAuthResponse,
  SetUserToken,
  ResendEmailConfirmation,
} from "./interfaces";

export async function setUserToken(params: SetUserToken) {
  document.cookie = "token=" + params.token;
}

export function getUserToken() {
  const name = "token=";
  const cDecoded = decodeURIComponent(document.cookie);
  const cArr = cDecoded.split("; ");
  let token = "";
  cArr.forEach((val) => {
    if (val.indexOf(name) === 0) token = val.substring(name.length);
  });
  return token;
}

export async function getUser(
  params: GetUserAuth
): Promise<GetUserAuthResponse> {
  const { onError, onResult, result } = useQuery(
    gql`
      query userAuth {
        userAuth {
         ...${params.graphql.fragment}
        }
      }
      ${params.graphql.name}
    `,
    null,
    {
      fetchPolicy: "cache-first",
    }
  );

  return new Promise((resolve, reject) => {
    if (result.value && result.value.userAuth.user != undefined)
      resolve({
        id: result.value.userAuth.user.id,
        name: result.value.userAuth.user.name,
        user: result.value.userAuth.user.user,
      });
    else {
      onResult((response) =>
        resolve({
          id: response.data.userAuth.user.id,
          name: response.data.userAuth.user.name,
          user: response.data.userAuth.user.user,
        })
      );
    }

    onError((error) => {
      reject(error);
    });
  });
}

export function getUserLang() {
  return store.get("lang");
}

export async function translate() {
  const lang = await getUserLang().then((response) => {
    return response;
  });
  if (lang == "es" || lang == null) {
    return jsonLangSpanish as any;
  }
}

export async function resendEmailConfirmation(
  params: ResendEmailConfirmation
): Promise<void> {
  const { onError, onDone } = useMutation(
    gql`
      mutation resendEmailConfirmation($email: String!) {
        resendEmailConfirmation(input: { email: $email })
      }
    `,
    {
      variables: {
        email: params.email,
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
