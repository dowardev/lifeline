import { DocumentNode } from "graphql";

interface Graphql {
  name: DocumentNode;
  fragment: string;
  refetch?: boolean;
}

// user
export interface User {
  id?: string;
  name?: string;
  user?: string;
  password?: string;
  email?: string;
  is_admin?: boolean;
  rol?: Array<any>;
  is_email_verified?: boolean;
  is_user_disabled?: boolean;
  image_profile: string;
}
export interface UserRegister {
  name: User["name"];
  user: User["user"];
  email: User["email"];
  password: User["password"];
}
export interface SetUserToken {
  token: string;
}
export interface ResendEmailConfirmation {
  email: string;
}
export interface UserLogin {
  user: User["user"];
  password: User["password"];
  graphql: Graphql;
}
export interface GetUserAuth {
  graphql: Graphql;
}
export interface GetUserAuthResponse {
  id: string;
  name: string;
  user: string;
}

export interface UserLoginResponse {
  user?: User;
  auth: {
    access_token?: string;
    token_type?: string;
  };
}

// system
export interface SystemMessage {
  message: string;
  color?: string;
}

// events
export interface GetCalendars {
  graphql: Graphql;
}
export interface GetCalendarsResponse {
  id: string;
  name: string;
}
export interface CreateEvent {
  title?: string;
  calendar?: string;
  dateTime?: string;
  guests?: string;
  notes?: string;
  reminders?: string;
  repeats?: string;
  tags?: string;
  timeZone?: string;
}
