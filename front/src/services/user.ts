import { storage } from "@/main";
import apolloClient from "../Apollo";
import gql from "graphql-tag";
import { useMutation } from "@vue/apollo-composable";
import { provideApolloClient } from "@vue/apollo-composable";
provideApolloClient(apolloClient);

import {
  SetUserToken,
  ResendEmailConfirmation,
  Graphql,
  User,
} from "../utils/interfaces";
import { errorBuilder } from "@/utils/errors";
import { executeGrapQuery, graphqlQueryBuilder } from "./graphql";
import { USER_MENU } from "@/utils/graphql";
import { SQLiteDBConnection } from "@capacitor-community/sqlite";

export async function setUserToken(params: {
  db: SQLiteDBConnection;
  fields: any[];
  values: any[];
}): Promise<void> {
  const { db, fields, values } = params;
  try {
    let query = `
     INSERT INTO Tokens(
       ${fields.join(", ")}
     )
     
   `;
    query += `values (`;
    for (let index = 0; index < values.length; index++) {
      if (index < fields.length - 1) query += "?, ";
      else query += "? ";
    }
    query += `)`;
    await db.query(query, values);
  } catch (error: any) {
    throw new Error(error);
  }
}

export function getUserToken(): string {
  const name = "token=";
  const cDecoded = decodeURIComponent(document.cookie);
  const cArr = cDecoded.split("; ");
  let token = "";
  cArr.forEach((val) => {
    if (val.indexOf(name) === 0) token = val.substring(name.length);
  });
  return token;
}

export async function getUser(params: { refetch: boolean }): Promise<User> {
  const { refetch } = params;
  const graphql = { name: USER_MENU, fragment: "UserMenu" };

  try {
    const query = graphqlQueryBuilder({
      name: graphql.name,
      fragment: graphql.fragment,
      mutationName: "userAuth",
    });

    let response = await executeGrapQuery({
      query,
      options: { refetch },
    });
    if (!response.value.userAuth) return {} as User;
    response = {
      id: response.value.userAuth.user.id,
      name: response.value.userAuth.user.name,
      email: response.value.userAuth.user.email,
      user: response.value.userAuth.user.user,
      imageProfile: response.value.userAuth.user.image_profile,
      isAdmin: response.value.userAuth.user.is_admin,
    };
    return response;
  } catch (error: any) {
    if (error.message != "Unauthorized")
      throw errorBuilder({ message: error.message, typeError: "authError" });
    throw errorBuilder({ message: error.message });
  }
}

export function getUserLang(): Promise<any> {
  return storage.get("lang");
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
