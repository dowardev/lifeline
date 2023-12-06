import { ApolloClient, InMemoryCache } from "@apollo/client/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";

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
    Authorization: await getToken(),
  },
});
export default apolloClient;

async function getToken(): Promise<string> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const platform = Capacitor.getPlatform();
  if (platform === "web") {
    const jeepSqliteEl = document.createElement("jeep-sqlite");
    document.body.appendChild(jeepSqliteEl);
    await customElements.whenDefined("jeep-sqlite");
    await sqlite.initWebStore();
  }
  let db = null;
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection("db_vite", false)).result;

    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection("db_vite", false);
    } else {
      db = await sqlite.createConnection(
        "db_vite",
        false,
        "no-encryption",
        1,
        false
      );
    }
  } catch (error: any) {
    throw new Error(error);
  }
  try {
    await db.open();
    try {
      const tables: any = await db.query(
        "SELECT * FROM Tokens where name='user_auth'"
      );
      await db.close();
      return tables.values[0].token as string;
    } catch (error: any) {
      return "";
    }
  } catch (error: any) {
    throw new Error(error);
  }
}
