// import {
//   ApolloClient,
//   createHttpLink,
//   InMemoryCache,
// } from "@apollo/client/core";

// const name = "token=";
// const cDecoded = decodeURIComponent(document.cookie);
// const cArr = cDecoded.split("; ");
// let token = "";
// cArr.forEach((val) => {
//   if (val.indexOf(name) === 0) token = val.substring(name.length);
// });

// let uri = "";
// const mode = process.env.NODE_ENV;
// if (mode == "development") {
//   uri = "http://127.0.0.1:8000/graphql";
// } else {
//   uri = "https://dowar-blog.dowar.xyz/graphql";
// }
// // uri = "https://dowar-blog.dowar.xyz/graphql";
// // uri = "https://prueba-blogb.dowar.xyz/graphql";

// const httpLink = createHttpLink({
//   uri,
//   headers: {
//     Authorization: token,
//   },
// });

// const cache = new InMemoryCache();

// const apolloClient = new ApolloClient({
//   link: httpLink,
//   cache,
// });

// import { createApolloProvider } from "@vue/apollo-option";
// const apolloProvider = createApolloProvider({
//   defaultClient: apolloClient,
// });
// export default apolloProvider;
import { ApolloClient, InMemoryCache } from "@apollo/client/core";

const cache = new InMemoryCache();

const name = "token=";
const cDecoded = decodeURIComponent(document.cookie);
const cArr = cDecoded.split("; ");
let token = "";
cArr.forEach((val) => {
  if (val.indexOf(name) === 0) token = val.substring(name.length);
});

const apolloClient = new ApolloClient({
  cache,
  uri: "http://127.0.0.1:8000/graphql",
  headers: {
    Authorization: token,
  },
});
export default apolloClient;
