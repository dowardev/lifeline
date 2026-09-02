// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import { DocumentElements, Theme, RepeatType } from "./types";

export type ReminderOffsetType =
  | "at_time"
  | "5m"
  | "10m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "1d"
  | "2d"
  | "1w"
  | "1mo";


// user
export interface User {
  id: number;
  idSync?: number | string;
  name?: string;
  userName?: string;
  email?: string;
  isAdmin?: boolean;
  rol?: Array<any>;
  imageProfile?: string;
  theme?: string;
  events?: Array<Event>;
  preferences?: {
    theme: Theme;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStore {
  id: number;
  idSync: string;
  name: string;
  userName: string;
  isAdmin?: boolean;
  rol?: Array<any>;
  imageProfile?: string;
  preferences: {
    theme: Theme;
  };
}

export interface UserServer {
  name?: string;
  userName?: string;
  isAdmin?: boolean;
  rol?: Array<any>;
  imageProfile?: string;
  preferences?: {
    theme: Theme;
  };
  events?: Array<Event>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRegister {
  name: string;
  user: string;
  email: string;
  password: string;
}
export interface SetUserToken {
  token: string;
  userId: string;
}
export interface UserLogin {
  user: string;
  password: string;
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

// end system

// events
export interface Event {
  id?: number;
  userId: number;
  name?: string;
  // calendar?: string;
  guests?: Array<{ email: string }>;
  reminders: {
    start: Date;
    end: Date;
    notifications?: ReminderOffsetType[];
    repeat?: {
      frecuency: number;
      type: RepeatType;
      daysWeek?: string[];
    };
    idReminders: number[];
  };
  // tags?: Array<string>;
  timezone?: string;
  description: string;
  availability: string;
  idSync: number | null;
  syncStatus: boolean;
  status: "active" | "inactive";
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
export interface TimeZoneOption {
  name: string;
  label: string;
}

export interface TimeZoneGroup {
  header: string;
  zones: string[];
}

export interface GetCalendarsResponse {
  id: string;
  name: string;
  default: boolean;
}

export interface GetEvents {
  date: string;
}

export interface CalendarViewDates {
  diary: Date;
  day: Date;
  week: Date;
  month: Date;
  year: Date;
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
    },
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

export interface System {
  theme: {
    selected: Theme;
  };
  wakaTime: {
    wakaTimeApiKey: string;
    today: {
      time: string;
    };
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
    notifications: ReminderOffsetType[];
    idReminders: number[];
    repeat: {
      frecuency: number;
      type: "daily" | "weekly" | "monthly" | "annually";
      daysWeek?: string[];
    };
  };
  timezone?: string;
  description?: string;
  subtasks?: Array<{ name: string; cheked: boolean }>;
  kanban?: {
    columnName: "pending" | "progress" | "finalized";
    position: number;
  };
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
  kanban: {
    columnName: "pending" | "progress" | "finalized";
    position: number;
  };
}
