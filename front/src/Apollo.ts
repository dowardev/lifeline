import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { main } from "@/services/dbService";
import { JeepSqlite } from "jeep-sqlite/dist/components/jeep-sqlite";

const cache = new InMemoryCache();

let uri = "";
const mode = process.env.NODE_ENV;
if (mode == "development") {
  // uri = "http://192.168.1.68:9001/graphql";
  uri = "http://127.0.0.1:8000/graphql";
} else {
  uri = "https://lifeline-back.dowar.xyz/graphql";
}
// uri = "http://192.168.1.68:9001/graphql";

const apolloClient = new ApolloClient({
  cache,
  uri,
  headers: {
    Authorization: getToken(),
  },
});
export default apolloClient;

function getToken(): string {
  const cookie = document.cookie;
  const authTokenCookie = cookie.match(/authToken=(.*?)(?=(;|$))/);
  if (authTokenCookie) {
    const token = JSON.parse(authTokenCookie[1]);
    return token;
  }
  return "";
}
