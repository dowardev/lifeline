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

// events
export const CALENDARS = gql`
  fragment Calendars on CalendarsPayload {
    calendars {
      id
      name
    }
  }
`;

// auth
export const USER_LOGIN = gql`
  fragment UserLogin on LoginPayload {
    auth {
      access_token
    }
  }
`;
