/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NewNote, Note } from "../utils/interfaces";
// import { saveNote as saveNoteService } from "../services/note";
import { useNoteStore } from "../store/noteStore";
import { storage } from "@/main";

export class NoteController {
  noteStore = useNoteStore();

  async addNote(params: { note: NewNote }): Promise<void> {
    const note = JSON.parse(JSON.stringify(params.note));
    const id = Date.now().toString();
    note.id = id;
    const notes = (await this.getNotes()) != null ? await this.getNotes() : [];

    notes?.push(note);

    note.id = id;
    this.noteStore.addNote({ note });
  }

  async getNotes(): Promise<Array<Note | null>> {
    return await storage.get("notes");
  }
}
