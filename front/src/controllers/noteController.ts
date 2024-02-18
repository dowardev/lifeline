/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NewNote } from "../utils/interfaces";
import { saveNote as saveNoteService } from "../services/note";
import { useNoteStore } from "../store/noteStore";

export class NoteController {
  noteStore = useNoteStore();

  async addNote(params: { note: NewNote }) {
    const note = JSON.parse(JSON.stringify(params.note));
    const { id } = await saveNoteService({ note });

    note.id = id;
    this.noteStore.addNote({ note });
  }
}
