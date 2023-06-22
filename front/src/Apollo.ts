import { ApolloClient, InMemoryCache } from "@apollo/client/core";

const cache = new InMemoryCache();

const name = "token=";
const cDecoded = decodeURIComponent(document.cookie);
const cArr = cDecoded.split("; ");
let token = "";
cArr.forEach((val) => {
  if (val.indexOf(name) === 0) token = val.substring(name.length);
});

let uri = "";
const mode = process.env.NODE_ENV;
if (mode == "development") {
  uri = "http://127.0.0.0:9001/graphql";
} else {
  uri = "https://lifeline-back.dowar.xyz/graphql";
}

const apolloClient = new ApolloClient({
  cache,
  uri,
  headers: {
    Authorization: token,
  },
});
export default apolloClient;
