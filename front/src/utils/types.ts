import { NewList, NewNote, NewRichText, NewTodo } from "./interfaces";

export type TypeDocumentElement = "note" | "richtext" | "list" | "todo";

export type OptionsNoteRightMenu = "add" | "remove";

export type DocumentElements = {
  type: TypeDocumentElement;
  documentId: string;
  data: ElementData;
};

export type ElementData = NewNote | NewRichText | NewList | NewTodo;
