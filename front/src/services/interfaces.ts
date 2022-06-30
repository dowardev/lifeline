import { DocumentNode } from "graphql";

interface Graphql {
  name: DocumentNode;
  fragment: string;
  refetch?: boolean;
}

// user
export interface UserRegister {
  name: string;
  user: string;
  email: string;
  password: string;
}
export interface SetUserToken {
  token: string;
}
export interface ResendEmailConfirmation {
  email: string;
}
export interface UserLogin {
  user: string;
  password: string;
  query: string;
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
