import gql from "graphql-tag";

export const USER_PERMISSIONS = gql`
  fragment UserPermissions on UserAuthPayload {
    user {
      is_admin
    }
  }
`;

// user
export const USER_MENU = gql`
  fragment UserMenu on UserAuthPayload {
    user {
      user
      image_profile
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
export const USER_CALENDARS = gql`
  fragment Calendars on User {
    calendars {
      id
      name
      default
    }
  }
`;
export const USER_EVENTS = gql`
  fragment Events on EventsPayload {
    events {
      id
      title
      date_start
      date_end
      guests
      tags
      description
      time_zone
      repeat
    }
  }
`;
export const SYNC_EVENTS = gql`
  fragment SyncEvents on SyncEventsPayload {
    state
  }
`;
export const CREATE_EVENTS = gql`
  fragment CreateEvent on CreateEventPayload {
    id
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

export const USER_LOGOUT = gql`
  fragment UserLogout on UserLogoutPayload {
    state
  }
`;

export const USER_REGISTER = gql`
  fragment UserRegister on UserRegisterPayload {
    state
  }
`;
