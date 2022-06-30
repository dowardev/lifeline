import gql from "graphql-tag";

// user
export const USER_MENU = gql`
  fragment UserMenu on UserAuthPayload {
    user {
      user
    }
  }
`;

export const USER_NAME = gql`
  fragment UserName on UserAuthPayload {
    user {
      name
    }
  }
`;
