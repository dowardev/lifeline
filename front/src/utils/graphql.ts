import gql from "graphql-tag";

export const USER_PERMISSIONS = gql`
  fragment UserPermissions on UserAuthPayload {
    user {
      is_admin
    }
  }
`;
