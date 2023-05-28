import { NewList, NewNote, NewRichText, NewTodo } from "./interfaces";

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
