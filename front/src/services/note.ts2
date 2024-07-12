import { NewNote, Note } from "../utils/interfaces";

import { storage } from "@/main";

export class NoteService {
  async getNotes(): Promise<Array<Note | null>> {
    return await storage.get("notes");
  }

  async saveNote(params: { note: Note }): Promise<{ id: string }> {
    const note = JSON.parse(JSON.stringify(params.note));
    const id = Date.now().toString();
    note.id = id;
    const notes = (await getNotes()) != null ? await getNotes() : [];

    notes?.push(note);

    // await store.set("documents", documents);
    return { id };
  }

  //  async  getMedicine(params: { id: string }): Promise<Document> {
  //   const id = params.id;
  //   const documents = await store.get("documents");
  //
  //   return documents.filter((element: Document) => {
  //     if (element.id == id) return element;
  //   })[0];
  // }
}
