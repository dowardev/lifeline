import { DocumentNode } from "graphql";
import { DocumentElements, Theme, TypeDocumentElement } from "./types";

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
  id: string;
  name?: string;
  // calendar?: string;
  guests?: Array<{ email: string }>;
  reminders?: {
    start: Date;
    end: Date;
    notifications: string[];
    repeat: {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  };
  // tags?: Array<string>;
  timezone?: string;
  description: string;
  availability: string;
}
export interface NewEvent {
  name?: string;
  // calendar?: string;
  guests?: Array<{ email: string }>;
  reminders?: {
    start: string;
    end: string;
    notifications: string[];
    repeat: {
      frecuency: number;
      type: "unique" | "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  };
  // tags?: Array<string>;
  timezone: string;
  description: string;
  availability: string;
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

export interface ScheduleElement {
  id: string;
  idElement: string;
  title: string;
  message: string;
  date: string;
  type: string;
  reminder: boolean;
}

export interface Schedule {
  [year: number]: {
    [month: number]: {
      [day: number]: ScheduleElement[];
    };
  };
}

export interface System {
  theme: {
    selected: Theme;
  };
}

export interface EventDataReminder {
  start: string;
  end: string;
  frecuency: number;
  type: "daily" | "weekly" | "monthly" | "annually";
  daysWeek?: string[];
  reminders?: string[];
}

export interface Days {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface EventReminderRepeat {
  unique: string;
  daily: string;
  weekly: string;
  monthly: string;
  annually: string;
}

export interface EventReminderNotification {
  just: string;
  "5mb": string;
  "10mb": string;
  "15mb": string;
  "30mb": string;
  "1hb": string;
  "2hb": string;
  "1db": string;
  "2db": string;
  "1wb": string;
  "1mtb": string;
}

export interface Months {
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
}

export interface TaskReminderNotification {
  just: string;
  "5mb": string;
  "10mb": string;
  "15mb": string;
  "30mb": string;
  "1hb": string;
  "2hb": string;
  "1db": string;
  "2db": string;
  "1wb": string;
  "1mtb": string;
}

export interface TaskReminderRepeat {
  unique: string;
  daily: string;
  weekly: string;
  monthly: string;
  annually: string;
}

export interface Task {
  id: string;
  name: string;
  checked: boolean;
  guests?: Array<{ email: string }>;
  reminders?: {
    start: Date;
    end: Date;
    notifications: string[];
    repeat: {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  };
  timezone?: string;
  description?: string;
  subtasks?: Array<{ name: string; cheked: boolean }>;
}

export interface NewTask {
  name: string;
  checked: boolean;
  guests?: Array<{ email: string }>;
  reminders?: {
    start: Date | null;
    end: Date | null;
    notifications: string[];
    repeat: {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  };
  timezone?: string;
  description?: string;
  subtasks?: Array<{ name: string; cheked: boolean }>;
}
