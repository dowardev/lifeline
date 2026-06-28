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

export type Theme = "light" | "dark" | "catppuccin-latte-maroon" | "catppuccin-macchiato-maroon";

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

export type UserDBType = Pick<
  User,
  "name" | "userName" | "email" | "idSync"
>;

export type UserSource = "local" | "server" | "both";
