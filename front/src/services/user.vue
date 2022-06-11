<script lang="ts">
import { Storage } from "@ionic/storage";
const store = new Storage();
store.create();

import jsonLangSpanish from "../../public/assets/lang/lang-es.json";

import gql from "graphql-tag";
import apolloClient from "../Apollo";
const apollo = apolloClient;

import { GetUser } from "./interfaces.vue";

export default function () {
  async function setUserToken(token: string) {
    document.cookie = "token=" + token;
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

  async function getUserLogged(params: GetUser) {
    try {
      const response = await apollo.defaultClient.mutate({
        mutation: gql`
        query {
          getUserAuth {
            ${params.query}
          }
        }
      `,
      });

      return response.data.getUserAuth.user;
    } catch (e: any) {
      if (e.graphQLErrors) throw Error(e.graphQLErrors[0].debugMessage);
      throw Error(e.message);
    }
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
  return {
    setUserToken,
    getUserToken,
    getUserLogged,
    getUserLang,
    translate,
  };
}
</script>
