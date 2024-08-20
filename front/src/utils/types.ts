import { NewList, NewNote, NewRichText, NewTodo, User } from "./interfaces";

export type TypeDocumentElement = "note" | "richtext" | "list" | "todo";

export type OptionsNoteRightMenu = "add" | "remove" | "reminders";

export type DocumentElements = {
  type: TypeDocumentElement;
  documentId: string;
  data: ElementData | undefined;
};

export type ElementData = NewNote | NewRichText | NewList | NewTodo;

export type OptionsMainMenuDocument =
  | "save"
  | "order"
  | "reminder"
  | "share"
  | "none";

export type Theme = "light" | "nord" | "gruvbox" | "cherry";

export type ViewMode = "list" | "kanban";

export type ViewCalendar =
  | undefined
  | "diary"
  | "day"
  | "week"
  | "month"
  | "year";

export type RepeatType = "daily" | "weekly" | "monthly" | "annually";

export type CalendarDataStatus = "loading" | "success" | "error";

export type GraphQLQueryNameUser =
  | "USER_PERMISSIONS"
  | "USER_BASIC"
  | "USER_NAME"
  | "USER_CALENDARS"
  | "USER_EVENTS";

export type GraphQLFragmentNameUser = "UserMenu";

export type userGrapQLTypeData = "menu";

export type UserDBType = Pick<
  User,
  "name" | "user" | "email" | "token" | "idSync"
>;

export type UserSource = "local" | "server" | "both";
