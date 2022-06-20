<script lang="ts">
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
} from "./interfaces.vue";

export default function () {
  async function setUserToken(params: SetUserToken) {
    document.cookie = "token=" + params.token;
  }

  function getUserToken() {
    const name = "token=";
    const cDecoded = decodeURIComponent(document.cookie);
    const cArr = cDecoded.split("; ");
    let token = "";
    cArr.forEach((val) => {
      if (val.indexOf(name) === 0) token = val.substring(name.length);
    });
    return token;
  }

  async function getUserLogged(
    params: GetUserAuth
  ): Promise<GetUserAuthResponse> {
    const { onError, onResult } = useQuery(gql`
      query getUsers {
        getUserAuth {
          ${params.query}
        }
      }
    `);

    return new Promise((resolve, reject) => {
      onResult((response) => {
        resolve({
          id: response.data.getUserAuth.user.id,
          name: response.data.getUserAuth.user.name,
          user: response.data.getUserAuth.user.user,
        });
      });

      onError((error) => {
        reject(error);
      });
    });
  }

  function getUserLang() {
    return store.get("lang");
  }

  async function translate() {
    const lang = await getUserLang().then((response) => {
      return response;
    });
    if (lang == "es" || lang == null) {
      return jsonLangSpanish as any;
    }
  }

  async function resendEmailConfirmation(
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

  return {
    setUserToken,
    getUserToken,
    getUserLogged,
    getUserLang,
    translate,
    resendEmailConfirmation,
  };
}
</script>
