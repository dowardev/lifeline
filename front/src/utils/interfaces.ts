import { DocumentNode } from "graphql";
import { DocumentElements, TypeDocumentElement } from "./types";

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
export interface Event {
  title?: string;
  calendar?: string;
  timeStart?: string;
  timeEnd?: string;
  guests?: Array<string>;
  notes?: string;
  reminders?: Array<string>;
  repeats?: { name: string; frequency: string; data: {} };
  tags?: Array<string>;
  timeZone?: string;
}
export interface GetCalendars {
  graphql: Graphql;
}
export interface GetCalendarsResponse {
  id: string;
  name: string;
  default: boolean;
}

export interface GetEvents {
  date: string;
  graphql: Graphql;
}

//document
export interface Document {
  id: string;
  title: string;
  reminder?: { start: string; end: string } | null;
  elements?: [
    {
      type: "note" | "list" | "richtext" | "todo";
      data: {
        id?: string;
        content?: string;
        reminder?: {
          reminderStart: string;
          reminderEnd: string;
          notificationId?: string;
        };
        tags?: Array<string>;
      };
    }
  ];
  url: string;
}

export interface NewDocument {
  title: string;
  reminder?: { start: string; end: string } | null;
  elements?: [DocumentElements];
  url: string;
}

export interface DeleteDocument {
  documentId: string;
}

export interface RichText {
  id: string;
  content: string;
}

export interface List {
  id: string;
  elements: Array<{ position: number; content: string }>;
}

export interface Todo {
  id: string;
  elements: Array<{ position: number; content: string; checked: boolean }>;
}

export interface Note {
  id?: string;
  content?: string;
  reminder?: { reminderStart: string; reminderEnd: string };
  tags?: Array<string>;
}

export interface NewNote {
  content?: string;
  reminder?: { reminderStart: string; reminderEnd: string } | null;
  tags?: Array<string>;
  documentId: string;
  position: number;
}

export interface NewRichText {
  content: string;
  documentId: string;
  position: number;
}

export interface NewList {
  elements: Array<{ position: number; content: string }>;
  documentId: string;
  position: number;
}

export interface NewTodo {
  elements: Array<{ position: number; content: string; checked: boolean }>;
  documentId: string;
  position: number;
}
